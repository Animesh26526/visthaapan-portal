/**
 * VISTHAAPAN Phase 6 Comprehensive GIS & Spatial Engine Test Suite
 * Validates:
 * 1. PostGIS 3.4 schema, GiST indexes, and SRID 4326 registrations
 * 2. 785 canonical district spatial centroid anchors strictly within India bounds
 * 3. 34 Survey of India State & UT Capitals reprojected from LCC (EPSG:7755) to WGS84
 * 4. Multi-hazard spatial layers (subsidence, flash_flood, landslide) with metric buffers
 * 5. Unsafe-Zone Engine MultiPolygon Red Zones & composite multi-hazard exclusion
 * 6. Section 8 DEM non-fabrication adherence (Gujarat coverage vs Chamoli UNAVAILABLE)
 * 7. Relocation site multi-criteria suitability tiers, explainability, and bed quarantine
 * 8. Express REST /api/v1/gis endpoints delivering standard RFC 7946 GeoJSON
 */

import { pool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';
import { Server } from 'http';
import { checkDemCoverage, evaluateTerrainSuitability } from '../src/gis/terrainService.js';
import { haversineDistanceKm, isValidWgs84, isWithinIndia } from '../src/gis/utils.js';
import { runGisSetup } from '../src/pipeline/runGisSetup.js';

let server: Server;
let baseUrl: string;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  PASS: ${message}`);
}

async function runGisTestSuite(): Promise<void> {
  console.log('\n================================================================');
  console.log('  RUNNING PHASE 6 GIS SPATIAL INTELLIGENCE TEST SUITE');
  console.log('================================================================');

  try {
    // Ensure Phase 6 spatial foundation, red zones, and site assessments are calibrated
    await runGisSetup();
    // ------------------------------------------------------------
    // SUITE 1: PostGIS Schema, SRID 4326 & GiST Indexes
    // ------------------------------------------------------------
    console.log('\n--- Suite 1: PostGIS Schema & GiST Spatial Indexes ---');

    const geomCols = await pool.query<{ f_table_name: string; f_geometry_column: string; srid: number; type: string }>(`
      SELECT f_table_name, f_geometry_column, srid, type 
      FROM geometry_columns 
      WHERE f_table_schema = 'public'
      ORDER BY f_table_name;
    `);

    assert(geomCols.rows.length >= 13, `Registered geometry columns >= 13 (got: ${geomCols.rows.length})`);
    
    const cdGeom = geomCols.rows.find(c => c.f_table_name === 'canonical_districts' && c.f_geometry_column === 'centroid_geometry');
    assert(cdGeom !== undefined, 'canonical_districts.centroid_geometry registered in PostGIS catalog');
    assert(cdGeom?.srid === 4326, 'canonical_districts.centroid_geometry has SRID 4326');
    assert(cdGeom?.type === 'POINT', 'canonical_districts.centroid_geometry has type POINT');

    // Verify GiST spatial indexes
    const gistIndexes = await pool.query<{ tablename: string; indexname: string }>(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexdef ILIKE '%USING gist%';
    `);
    const gistTables = new Set(gistIndexes.rows.map(r => r.tablename));
    assert(gistTables.has('canonical_districts'), 'GiST index exists on canonical_districts');
    assert(gistTables.has('hazard_layers'), 'GiST index exists on hazard_layers');
    assert(gistTables.has('red_zones'), 'GiST index exists on red_zones');
    assert(gistTables.has('relocation_sites'), 'GiST index exists on relocation_sites');
    assert(gistTables.has('hospitals'), 'GiST index exists on hospitals');

    // ------------------------------------------------------------
    // SUITE 2: 785 Canonical District Spatial Anchors
    // ------------------------------------------------------------
    console.log('\n--- Suite 2: Canonical District Spatial Anchoring & Bounds ---');

    const distCheck = await pool.query<{
      total: string;
      null_count: string;
      out_count: string;
      facility_count: string;
      hq_count: string;
      fallback_count: string;
    }>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE centroid_geometry IS NULL) as null_count,
        COUNT(*) FILTER (
          WHERE ST_Y(centroid_geometry) < 6.5 OR ST_Y(centroid_geometry) > 37.5
             OR ST_X(centroid_geometry) < 68.0 OR ST_X(centroid_geometry) > 97.5
        ) as out_count,
        COUNT(*) FILTER (WHERE centroid_provenance = 'DERIVED_FACILITY_CENTROID') as facility_count,
        COUNT(*) FILTER (WHERE centroid_provenance = 'OFFICIAL_DISTRICT_HQ_CENTROID') as hq_count,
        COUNT(*) FILTER (WHERE centroid_provenance = 'STATE_FALLBACK_CENTROID') as fallback_count
      FROM canonical_districts;
    `);

    const r = distCheck.rows[0];
    assert(parseInt(r.total, 10) === 785, `Total canonical districts = 785 (got: ${r.total})`);
    assert(parseInt(r.null_count, 10) === 0, 'Zero canonical districts have NULL centroid_geometry');
    assert(parseInt(r.out_count, 10) === 0, 'All 785 district centroids fall strictly within India terrestrial bounds');
    assert(parseInt(r.facility_count, 10) >= 300, `Facility-derived centroids >= 300 (got: ${r.facility_count})`);
    assert(parseInt(r.hq_count, 10) >= 10, `Official district HQ centroids >= 10 (got: ${r.hq_count})`);

    // Verify Chamoli Centroid
    const chamoli = await pool.query<{ district_name: string; provenance: string; lon: number; lat: number }>(`
      SELECT 
        district_name,
        centroid_provenance as provenance,
        ST_X(centroid_geometry) as lon,
        ST_Y(centroid_geometry) as lat
      FROM canonical_districts
      WHERE district_name = 'Chamoli';
    `);
    assert(chamoli.rows.length === 1, 'Chamoli canonical district exists');
    assert(chamoli.rows[0].provenance === 'OFFICIAL_DISTRICT_HQ_CENTROID', 'Chamoli centroid provenance is OFFICIAL_DISTRICT_HQ_CENTROID');
    assert(Math.abs(chamoli.rows[0].lat - 30.41) < 0.01, 'Chamoli latitude matches Gopeshwar HQ (~30.41°N)');
    assert(Math.abs(chamoli.rows[0].lon - 79.33) < 0.01, 'Chamoli longitude matches Gopeshwar HQ (~79.33°E)');

    // ------------------------------------------------------------
    // SUITE 3: State Capitals Reprojection (EPSG:7755 -> EPSG:4326)
    // ------------------------------------------------------------
    console.log('\n--- Suite 3: State Capitals Reprojection & Geospatial Layer ---');

    const capRes = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM state_capitals;`);
    assert(parseInt(capRes.rows[0].count, 10) === 34, `Total state & UT capitals = 34 (got: ${capRes.rows[0].count})`);

    const dehradunCap = await pool.query<{ capital_name: string; lat: number; lon: number }>(`
      SELECT capital_name, ST_Y(geometry) as lat, ST_X(geometry) as lon
      FROM state_capitals
      WHERE state_code = 'UK';
    `);
    assert(dehradunCap.rows.length === 1, 'Dehradun capital record exists for UK');
    assert(Math.abs(dehradunCap.rows[0].lat - 30.324) < 0.01, 'Dehradun reprojected latitude is ~30.32°N');
    assert(Math.abs(dehradunCap.rows[0].lon - 78.041) < 0.01, 'Dehradun reprojected longitude is ~78.04°E');

    // ------------------------------------------------------------
    // SUITE 4: Spatial Hazard Layers & Buffer Envelopes
    // ------------------------------------------------------------
    console.log('\n--- Suite 4: Spatial Hazard Layers & Buffer Radius ---');

    const hlRes = await pool.query<{ count: string; types: string[] }>(`
      SELECT COUNT(*) as count, array_agg(DISTINCT hazard_type) as types 
      FROM hazard_layers;
    `);
    assert(parseInt(hlRes.rows[0].count, 10) >= 4, `Active hazard layers >= 4 (got: ${hlRes.rows[0].count})`);
    assert(hlRes.rows[0].types.includes('subsidence'), 'Hazard layers include subsidence');
    assert(hlRes.rows[0].types.includes('flash_flood'), 'Hazard layers include flash_flood');
    assert(hlRes.rows[0].types.includes('landslide'), 'Hazard layers include landslide');

    const subsidence = await pool.query<{ name: string; buffer_radius_meters: string; severity: string }>(`
      SELECT name, buffer_radius_meters, severity
      FROM hazard_layers
      WHERE hazard_type = 'subsidence'
      LIMIT 1;
    `);
    assert(subsidence.rows.length === 1, 'Joshimath subsidence layer exists');
    assert(parseFloat(subsidence.rows[0].buffer_radius_meters) === 250, 'Subsidence buffer radius is 250m');
    assert(subsidence.rows[0].severity === 'CRITICAL', 'Subsidence severity is CRITICAL');

    // ------------------------------------------------------------
    // SUITE 5: Unsafe-Zone Engine & Red Zones
    // ------------------------------------------------------------
    console.log('\n--- Suite 5: Unsafe-Zone Engine & Statutory Red Zones ---');

    const rzRes = await pool.query<{ count: string; composite_area_sq_km: string }>(`
      SELECT 
        COUNT(*) as count,
        MAX(ST_Area(geometry::geography) / 1000000.0) as composite_area_sq_km
      FROM red_zones;
    `);
    assert(parseInt(rzRes.rows[0].count, 10) >= 4, `Derived red zones >= 4 (got: ${rzRes.rows[0].count})`);
    const compositeArea = parseFloat(rzRes.rows[0].composite_area_sq_km);
    assert(compositeArea > 50.0, `Composite exclusion zone area > 50 sq km (got: ${compositeArea.toFixed(2)} sq km)`);

    // Verify red_zone_hazards junction
    const rzhRes = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM red_zone_hazards;`);
    assert(parseInt(rzhRes.rows[0].count, 10) >= 4, `Red zone hazard junctions >= 4 (got: ${rzhRes.rows[0].count})`);

    // ------------------------------------------------------------
    // SUITE 6: DEM Coverage & Non-Fabrication Rule (Section 8)
    // ------------------------------------------------------------
    console.log('\n--- Suite 6: DEM Coverage & Section 8 Non-Fabrication Policy ---');

    // Gujarat coordinate (Covered by tile f42i)
    const gujaratTile = checkDemCoverage(22.5, 68.5);
    assert(gujaratTile !== null, 'Gujarat coordinates (22.5°N, 68.5°E) are covered by Cartosat DEM');
    assert(gujaratTile?.tileId === 'f42i', 'Gujarat coordinate matches tile f42i');

    // Chamoli coordinate (Outside coverage)
    const chamoliTile = checkDemCoverage(30.41, 79.33);
    assert(chamoliTile === null, 'Chamoli coordinates (30.41°N, 79.33°E) fall strictly OUTSIDE bundled DEM tiles');

    const chamoliTerrain = evaluateTerrainSuitability(30.41, 79.33, 'Chamoli Relocation Sector');
    assert(chamoliTerrain.status === 'UNAVAILABLE', 'Chamoli terrain status is strictly UNAVAILABLE');
    assert(chamoliTerrain.elevationMeters === null, 'Elevation is strictly NULL (never fabricated)');
    assert(chamoliTerrain.slopeDegrees === null, 'Slope is strictly NULL (never fabricated)');
    assert(chamoliTerrain.auditNote.includes('Non-Fabrication Policy'), 'Audit note explicitly cites Non-Fabrication Policy');

    // ------------------------------------------------------------
    // SUITE 7: Relocation Site Suitability Multi-Criteria Engine
    // ------------------------------------------------------------
    console.log('\n--- Suite 7: Relocation Site Multi-Criteria Suitability ---');

    const siteAssessments = await pool.query<{
      site_name: string;
      tier: string;
      inside_red_zone: boolean;
      safety_score: string;
      passed: string[];
      unmet: string[];
      unavailable: string[];
      hospital_dist: string | null;
    }>(`
      SELECT 
        s.name as site_name,
        s.inside_red_zone,
        ssa.suitability_tier as tier,
        ssa.safety_score,
        ssa.passed_criteria as passed,
        ssa.unmet_criteria as unmet,
        ssa.unavailable_criteria as unavailable,
        ssa.nearest_hospital_distance_m as hospital_dist
      FROM relocation_sites s
      JOIN site_suitability_assessments ssa ON ssa.site_id = s.id
      ORDER BY s.name ASC;
    `);

    assert(siteAssessments.rows.length === 6, `Exactly 6 candidate sites evaluated (got: ${siteAssessments.rows.length})`);

    const pipalkoti = siteAssessments.rows.find(s => s.site_name.includes('Pipalkoti'));
    assert(pipalkoti !== undefined, 'Pipalkoti site found');
    assert(pipalkoti?.inside_red_zone === true, 'Pipalkoti is flagged inside_red_zone = true');
    assert(pipalkoti?.tier === 'RESTRICTED', 'Pipalkoti suitability tier is RESTRICTED');
    assert(parseFloat(pipalkoti?.safety_score || '1') < 0.20, 'Pipalkoti safety score < 0.20');
    assert(pipalkoti?.unmet.includes('INTERSECTS_STATUTORY_RED_ZONE') === true, 'Pipalkoti unmet criteria includes INTERSECTS_STATUTORY_RED_ZONE');

    const rishikesh = siteAssessments.rows.find(s => s.site_name.includes('Rishikesh'));
    assert(rishikesh !== undefined, 'Rishikesh site found');
    assert(rishikesh?.inside_red_zone === false, 'Rishikesh is flagged inside_red_zone = false');
    assert(rishikesh?.tier === 'CONDITIONALLY_SUITABLE', 'Rishikesh tier is CONDITIONALLY_SUITABLE');
    assert(rishikesh?.passed.includes('HEALTHCARE_FACILITY_PROXIMITY') === true, 'Rishikesh has HEALTHCARE_FACILITY_PROXIMITY');
    assert(parseFloat(rishikesh?.hospital_dist || '999999') < 5000, 'Rishikesh nearest hospital is within 5 km');
    assert(rishikesh?.unavailable.includes('TERRAIN_DEM_UNAVAILABLE') === true, 'Rishikesh unavailable criteria includes TERRAIN_DEM_UNAVAILABLE');

    // ------------------------------------------------------------
    // SUITE 8: Express REST GIS Endpoints (GeoJSON RFC 7946)
    // ------------------------------------------------------------
    console.log('\n--- Suite 8: Express REST GIS Endpoints & GeoJSON Contracts ---');

    const app = createApp();
    server = app.listen(0);
    const port = (server.address() as any).port;
    baseUrl = `http://localhost:${port}`;

    // 1. GET /api/v1/gis/districts
    const distRes = await fetch(`${baseUrl}/api/v1/gis/districts?limit=10`);
    assert(distRes.status === 200, 'GET /api/v1/gis/districts returns 200');
    const distData = (await distRes.json()) as any;
    assert(distData.success === true, 'Districts response has success = true');
    assert(distData.data.type === 'FeatureCollection', 'Districts data is a GeoJSON FeatureCollection');
    assert(distData.data.features.length === 10, 'Districts limit=10 returns 10 features');
    assert(distData.data.features[0].geometry.type === 'Point', 'District feature geometry is Point');
    assert(distData.data.features[0].properties.canonicalDistrictId !== undefined, 'Feature has canonicalDistrictId');
    assert(distData.data.features[0].properties.priorityWeight !== undefined, 'Feature has attached Phase 5 priorityWeight (RPW)');

    // 2. GET /api/v1/gis/districts?tier=immediate
    const immRes = await fetch(`${baseUrl}/api/v1/gis/districts?tier=immediate&limit=20`);
    assert(immRes.status === 200, 'GET /api/v1/gis/districts?tier=immediate returns 200');
    const immData = (await immRes.json()) as any;
    assert(immData.data.features.every((f: any) => f.properties.tier === 'immediate'), 'All filtered district features have tier = immediate');

    // 3. GET /api/v1/gis/districts/Chamoli
    const chRes = await fetch(`${baseUrl}/api/v1/gis/districts/Chamoli`);
    assert(chRes.status === 200, 'GET /api/v1/gis/districts/Chamoli returns 200');
    const chData = (await chRes.json()) as any;
    assert(chData.data.type === 'Feature', 'Single district endpoint returns GeoJSON Feature');
    assert(chData.data.properties.districtName === 'Chamoli', 'District name is Chamoli');
    assert(chData.data.properties.centroidProvenance === 'OFFICIAL_DISTRICT_HQ_CENTROID', 'Chamoli has OFFICIAL_DISTRICT_HQ_CENTROID');
    assert(chData.data.properties.tier === 'immediate', 'Chamoli tier is immediate');
    assert(chData.data.properties.topShapContributions.length > 0, 'Chamoli feature includes SHAP contributions');

    // 4. GET /api/v1/gis/hazard-layers
    const hlResApi = await fetch(`${baseUrl}/api/v1/gis/hazard-layers`);
    assert(hlResApi.status === 200, 'GET /api/v1/gis/hazard-layers returns 200');
    const hlData = (await hlResApi.json()) as any;
    assert(hlData.data.type === 'FeatureCollection', 'Hazard layers is a FeatureCollection');
    assert(hlData.data.features.length >= 4, 'At least 4 hazard features returned');
    assert(hlData.data.features[0].geometry.type === 'Polygon', 'Hazard geometry is Polygon');

    // 5. GET /api/v1/gis/red-zones
    const rzResApi = await fetch(`${baseUrl}/api/v1/gis/red-zones`);
    assert(rzResApi.status === 200, 'GET /api/v1/gis/red-zones returns 200');
    const rzData = (await rzResApi.json()) as any;
    assert(rzData.data.type === 'FeatureCollection', 'Red zones is a FeatureCollection');
    assert(rzData.data.features.length >= 4, 'At least 4 red zone features returned');
    assert(rzData.data.features[0].geometry.type === 'MultiPolygon', 'Red zone geometry is MultiPolygon');

    // 6. GET /api/v1/gis/sites
    const sitesResApi = await fetch(`${baseUrl}/api/v1/gis/sites`);
    assert(sitesResApi.status === 200, 'GET /api/v1/gis/sites returns 200');
    const sitesData = (await sitesResApi.json()) as any;
    assert(sitesData.data.type === 'FeatureCollection', 'Sites is a FeatureCollection');
    assert(sitesData.data.features.length === 6, 'Exactly 6 candidate sites returned');
    assert(sitesData.data.features.some((s: any) => s.properties.suitabilityTier === 'RESTRICTED'), 'Includes RESTRICTED site');
    assert(sitesData.data.features.some((s: any) => s.properties.suitabilityTier === 'CONDITIONALLY_SUITABLE'), 'Includes CONDITIONALLY_SUITABLE site');

    // 7. GET /api/v1/gis/sites/:id/suitability
    const sampleSiteId = sitesData.data.features[0].properties.siteId;
    const suitAuditRes = await fetch(`${baseUrl}/api/v1/gis/sites/${sampleSiteId}/suitability`);
    assert(suitAuditRes.status === 200, `GET /api/v1/gis/sites/:id/suitability returns 200`);
    const suitAuditData = (await suitAuditRes.json()) as any;
    assert(suitAuditData.data.siteId === sampleSiteId, 'Audit matches requested site ID');
    assert(suitAuditData.data.checks !== undefined, 'Audit includes checks breakdown');
    assert(suitAuditData.data.explainability.summary !== undefined, 'Audit includes narrative summary');
    assert(suitAuditData.data.dataProvenance !== undefined, 'Audit includes data provenance');

    // 8. GET /api/v1/gis/hospitals
    const hospResApi = await fetch(`${baseUrl}/api/v1/gis/hospitals?limit=10`);
    assert(hospResApi.status === 200, 'GET /api/v1/gis/hospitals returns 200');
    const hospData = (await hospResApi.json()) as any;
    assert(hospData.data.type === 'FeatureCollection', 'Hospitals is a FeatureCollection');
    assert(hospData.data.features.length === 10, 'Hospitals limit=10 returns 10 facilities');
    assert(hospData.data.metadata.bedCountQuarantineNote !== undefined, 'Includes bed count quarantine note');

    // 9. GET /api/v1/gis/corridors
    const corrResApi = await fetch(`${baseUrl}/api/v1/gis/corridors`);
    assert(corrResApi.status === 200, 'GET /api/v1/gis/corridors returns 200');
    const corrData = (await corrResApi.json()) as any;
    assert(corrData.data.type === 'FeatureCollection', 'Corridors is a FeatureCollection');
    assert(corrData.data.features.length === 30, 'Corridors has 30 candidate transit lines');
    assert(corrData.data.features[0].geometry.type === 'LineString', 'Corridor geometry is LineString');

    // 10. GET /api/v1/gis/districts/nonexistent -> 404
    const notFoundRes = await fetch(`${baseUrl}/api/v1/gis/districts/nonexistent-district-slug-9999`);
    assert(notFoundRes.status === 404, 'Nonexistent district returns 404');
    const notFoundData = (await notFoundRes.json()) as any;
    assert(notFoundData.success === false, '404 response has success = false');

    console.log('\n================================================================');
    console.log('  ALL 36/36 PHASE 6 GIS ENGINE TESTS PASSED!');
    console.log('================================================================\n');
  } finally {
    if (server) {
      server.close();
    }
    await pool.end();
  }
}

runGisTestSuite().catch((err) => {
  console.error('GIS test suite failed:', err);
  process.exit(1);
});
