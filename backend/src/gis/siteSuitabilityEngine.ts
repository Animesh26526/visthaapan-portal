/**
 * VISTHAAPAN Phase 6 Relocation Site Suitability Engine (6D)
 * Multi-criteria spatial evaluator evaluating candidate relocation sites against:
 * 1. Statutory Red Zone hazard exclusions (ST_Intersects)
 * 2. Healthcare accessibility (geodesic distance to nearest geocoded facility, emergency flags)
 * 3. Road transit feasibility (corridor access, blockage status)
 * 4. Terrain suitability (Cartosat DEM coverage audit)
 *
 * EXPLAINABILITY CONTRACT:
 * Returns explicit passed_criteria, unmet_criteria, unavailable_criteria,
 * and structured narrative explanations.
 * Meaning of SUITABLE: "spatially suitable for consideration under available data",
 * NOT operational deployment readiness.
 */

import { Pool, PoolClient } from 'pg';
import { pool, getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { evaluateTerrainSuitability } from './terrainService.js';
import type { SiteSuitabilityAudit, SuitabilityTier, GeoJsonFeatureCollection } from '../types/gis.js';

export interface EvaluationSummary {
  totalSitesEvaluated: number;
  suitableCount: number;
  conditionallySuitableCount: number;
  restrictedCount: number;
  insufficientDataCount: number;
  durationMs: number;
}

/**
 * Runs the deterministic multi-criteria suitability assessment on all candidate relocation sites.
 * Persists results into site_suitability_assessments and updates relocation_sites.inside_red_zone.
 */
export async function evaluateAllSiteSuitability(): Promise<EvaluationSummary> {
  const startTime = Date.now();
  logger.info('Starting relocation site multi-criteria suitability engine...');

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN;');

    // 1. Fetch all candidate relocation sites with capacities
    const { rows: sites } = await client.query<{
      id: string;
      name: string;
      type: string;
      latitude: string;
      longitude: string;
      effective_capacity: string | null;
      bottleneck: string | null;
      district: string | null;
      state: string | null;
    }>(`
      SELECT 
        s.id,
        s.name,
        s.type,
        s.latitude,
        s.longitude,
        sc.effective_capacity,
        sc.bottleneck,
        r.district,
        r.state
      FROM relocation_sites s
      LEFT JOIN site_capacities sc ON sc.site_id = s.id
      LEFT JOIN regions r ON r.id = s.region_id
      ORDER BY s.name ASC;
    `);

    // Clean up existing assessments for evaluated sites to ensure strict 1:1 idempotency
    await client.query(`
      DELETE FROM site_suitability_assessments 
      WHERE site_id IN (SELECT id FROM relocation_sites);
    `);

    let suitableCount = 0;
    let conditionallySuitableCount = 0;
    let restrictedCount = 0;
    let insufficientDataCount = 0;

    for (const site of sites) {
      const lat = parseFloat(site.latitude);
      const lon = parseFloat(site.longitude);

      // Check 1: Hard Hazard / Red Zone Intersection
      const redZoneQuery = `
        SELECT rz.id, rz.name, rz.exclusion_type, rz.reason
        FROM red_zones rz
        WHERE ST_Intersects(
          rz.geometry,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        );
      `;
      const { rows: intersectingRedZones } = await client.query<{
        id: string;
        name: string;
        exclusion_type: string;
        reason: string;
      }>(redZoneQuery, [lon, lat]);

      const isInsideRedZone = intersectingRedZones.length > 0;

      // Update relocation_sites flag
      await client.query(`
        UPDATE relocation_sites
        SET inside_red_zone = $1, updated_at = NOW()
        WHERE id = $2;
      `, [isInsideRedZone, site.id]);

      // Check 2: Nearest Geocoded Healthcare Facility Proximity
      const hospitalQuery = `
        SELECT 
          h.id,
          h.hospital_name,
          h.has_emergency_services,
          h.has_ambulance,
          ROUND(ST_Distance(h.geometry::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)::numeric, 2) AS distance_meters
        FROM hospitals h
        WHERE h.has_valid_coordinates = TRUE 
          AND h.geometry IS NOT NULL
          AND h.latitude >= 6.5 AND h.latitude <= 37.5
          AND h.longitude >= 68.0 AND h.longitude <= 97.5
        ORDER BY h.geometry <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
        LIMIT 1;
      `;
      const { rows: nearestHospitals } = await client.query<{
        id: string;
        hospital_name: string;
        has_emergency_services: boolean;
        has_ambulance: boolean;
        distance_meters: string;
      }>(hospitalQuery, [lon, lat]);

      const nearestHospital = nearestHospitals[0] || null;
      const hospitalDistMeters = nearestHospital ? parseFloat(nearestHospital.distance_meters) : null;
      const hospitalDistKm = hospitalDistMeters !== null ? Math.round((hospitalDistMeters / 1000.0) * 10) / 10 : null;

      // Check 3: Candidate Route & Transit Feasibility
      const routeQuery = `
        SELECT 
          distance_km,
          travel_time_minutes,
          road_accessibility,
          safety_constraint_satisfied,
          blocked
        FROM candidate_routes
        WHERE site_id = $1
        ORDER BY distance_km ASC
        LIMIT 1;
      `;
      const { rows: routes } = await client.query<{
        distance_km: string;
        travel_time_minutes: string;
        road_accessibility: string;
        safety_constraint_satisfied: boolean;
        blocked: boolean;
      }>(routeQuery, [site.id]);

      const nearestRoute = routes[0] || null;
      const isRouteFeasible = nearestRoute ? (!nearestRoute.blocked && nearestRoute.safety_constraint_satisfied) : true;

      // Check 4: Terrain / DEM Coverage Evaluation (Section 8)
      const terrain = evaluateTerrainSuitability(lat, lon, site.name);

      // Criteria lists
      const passedCriteria: string[] = [];
      const unmetCriteria: string[] = [];
      const unavailableCriteria: string[] = [];

      // Evaluation criteria logic
      if (!isInsideRedZone) {
        passedCriteria.push('OUTSIDE_RED_ZONE_HAZARD_ENVELOPE');
      } else {
        unmetCriteria.push('INTERSECTS_STATUTORY_RED_ZONE');
      }

      if (hospitalDistMeters !== null && hospitalDistMeters <= 35000) {
        passedCriteria.push('HEALTHCARE_FACILITY_PROXIMITY');
      } else if (hospitalDistMeters !== null) {
        unmetCriteria.push('HEALTHCARE_FACILITY_REMOTE');
      } else {
        unavailableCriteria.push('HEALTHCARE_GEOCODING_UNAVAILABLE');
      }

      if (isRouteFeasible) {
        passedCriteria.push('ROAD_TRANSIT_FEASIBLE');
      } else {
        unmetCriteria.push('ROAD_CORRIDOR_BLOCKED');
      }

      if (terrain.status === 'AVAILABLE') {
        passedCriteria.push('TERRAIN_SLOPE_SUITABLE');
      } else {
        unavailableCriteria.push('TERRAIN_DEM_UNAVAILABLE');
      }

      // Tier Classification
      let tier: SuitabilityTier = 'INSUFFICIENT_DATA';
      let safetyScore = 0.5;
      let suitabilityScore = 0.5;

      if (isInsideRedZone) {
        tier = 'RESTRICTED';
        safetyScore = 0.15;
        suitabilityScore = 0.20;
        restrictedCount++;
      } else if (terrain.status === 'UNAVAILABLE') {
        // Safe from red zones and accessible, but pending local DEM terrain confirmation
        tier = 'CONDITIONALLY_SUITABLE';
        safetyScore = 0.92;
        suitabilityScore = isRouteFeasible ? 0.88 : 0.72;
        conditionallySuitableCount++;
      } else if (terrain.status === 'AVAILABLE' && isRouteFeasible) {
        tier = 'SUITABLE';
        safetyScore = 0.98;
        suitabilityScore = 0.95;
        suitableCount++;
      } else {
        tier = 'CONDITIONALLY_SUITABLE';
        safetyScore = 0.85;
        suitabilityScore = 0.80;
        conditionallySuitableCount++;
      }

      // Explainability Summary
      const summaryText = isInsideRedZone
        ? `RESTRICTED: Site intersects model-derived Red Zone (${intersectingRedZones.map(z => z.name).join(', ')}). Permanent relocation prohibited under DM Act 2005 model planning criteria (SIMULATED).`
        : `CONDITIONALLY SUITABLE: Site is verified outside all mapped model Red Zones. Road transit access is ${isRouteFeasible ? 'open' : 'compromised'} (estimated corridor). Nearest hospital is ${hospitalDistKm} km away (${nearestHospital?.hospital_name || 'unassigned'}). Terrain evaluation is UNAVAILABLE pending regional DEM tiles.`;

      const explainabilitySummary = {
        summary: summaryText,
        evaluationTier: tier,
        redZoneExclusion: isInsideRedZone ? 'FAIL' : 'PASS',
        healthcareAccess: hospitalDistKm !== null ? `${hospitalDistKm} km` : 'UNMAPPED',
        nearestHospitalName: nearestHospital?.hospital_name || null,
        hasEmergencyServices: nearestHospital?.has_emergency_services || false,
        hasAmbulance: nearestHospital?.has_ambulance || false,
        roadStatus: nearestRoute?.blocked ? 'BLOCKED' : 'OPEN',
        terrainStatus: terrain.status,
        terrainNote: terrain.auditNote,
        assessedAt: new Date().toISOString(),
      };

      // Upsert into site_suitability_assessments
      await client.query(`
        INSERT INTO site_suitability_assessments (
          site_id, safety_score, accessibility_score, infrastructure_score,
          healthcare_score, suitability_score, confidence, assessment_method,
          suitability_tier, passed_criteria, unmet_criteria, unavailable_criteria,
          explainability_summary, nearest_hospital_distance_m, nearest_hospital_id,
          nearest_road_distance_m, terrain_status
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17
        )
        ON CONFLICT (id) DO UPDATE SET
          safety_score = EXCLUDED.safety_score,
          suitability_score = EXCLUDED.suitability_score,
          suitability_tier = EXCLUDED.suitability_tier,
          passed_criteria = EXCLUDED.passed_criteria,
          unmet_criteria = EXCLUDED.unmet_criteria,
          unavailable_criteria = EXCLUDED.unavailable_criteria,
          explainability_summary = EXCLUDED.explainability_summary,
          nearest_hospital_distance_m = EXCLUDED.nearest_hospital_distance_m,
          nearest_hospital_id = EXCLUDED.nearest_hospital_id,
          terrain_status = EXCLUDED.terrain_status;
      `, [
        site.id,
        safetyScore,
        isRouteFeasible ? 0.90 : 0.40,
        0.85,
        hospitalDistKm && hospitalDistKm <= 20 ? 0.90 : 0.70,
        suitabilityScore,
        0.95,
        'GIS_MULTI_CRITERIA_SPATIAL_EVALUATION',
        tier,
        passedCriteria,
        unmetCriteria,
        unavailableCriteria,
        JSON.stringify(explainabilitySummary),
        hospitalDistMeters,
        nearestHospital?.id || null,
        nearestRoute?.distance_km ? parseFloat(nearestRoute.distance_km) * 1000 : null,
        terrain.status,
      ]);
    }

    await client.query('COMMIT;');
    const durationMs = Date.now() - startTime;

    logger.info(
      {
        totalSites: sites.length,
        suitableCount,
        conditionallySuitableCount,
        restrictedCount,
        durationMs,
      },
      'Relocation site suitability evaluation complete.'
    );

    return {
      totalSitesEvaluated: sites.length,
      suitableCount,
      conditionallySuitableCount,
      restrictedCount,
      insufficientDataCount,
      durationMs,
    };
  } catch (err: any) {
    await client.query('ROLLBACK;');
    logger.error({ err }, 'Site suitability evaluation failed.');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieves candidate relocation sites as an RFC 7946 GeoJSON FeatureCollection with suitability details.
 */
export async function getRelocationSitesGeoJson(): Promise<GeoJsonFeatureCollection> {
  const query = `
    SELECT 
      s.id,
      s.name,
      s.type,
      s.inside_red_zone,
      s.latitude,
      s.longitude,
      sc.effective_capacity,
      sc.available_capacity,
      sc.bottleneck,
      ssa.suitability_tier,
      ssa.safety_score,
      ssa.suitability_score,
      ssa.passed_criteria,
      ssa.unmet_criteria,
      ssa.unavailable_criteria,
      ssa.explainability_summary,
      ssa.nearest_hospital_distance_m,
      h.hospital_name as nearest_hospital_name,
      h.has_emergency_services,
      h.has_ambulance,
      ST_AsGeoJSON(s.geometry)::json as geojson_geom
    FROM relocation_sites s
    LEFT JOIN site_capacities sc ON sc.site_id = s.id
    LEFT JOIN site_suitability_assessments ssa ON ssa.site_id = s.id
    LEFT JOIN hospitals h ON h.id = ssa.nearest_hospital_id
    ORDER BY s.name ASC;
  `;

  const { rows } = await pool.query(query);

  const features = rows.map((r) => ({
    type: 'Feature' as const,
    id: r.id,
    geometry: r.geojson_geom,
    properties: {
      siteId: r.id,
      name: r.name,
      type: r.type,
      insideRedZone: r.inside_red_zone,
      coordinates: {
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
      },
      effectiveCapacity: r.effective_capacity ? parseInt(r.effective_capacity, 10) : 0,
      availableCapacity: r.available_capacity ? parseInt(r.available_capacity, 10) : 0,
      bottleneck: r.bottleneck || 'none',
      suitabilityTier: r.suitability_tier || 'INSUFFICIENT_DATA',
      safetyScore: r.safety_score ? parseFloat(r.safety_score) : 0.5,
      suitabilityScore: r.suitability_score ? parseFloat(r.suitability_score) : 0.5,
      passedCriteria: r.passed_criteria || [],
      unmetCriteria: r.unmet_criteria || [],
      unavailableCriteria: r.unavailable_criteria || [],
      explainability: r.explainability_summary || {},
      nearestHospital: {
        name: r.nearest_hospital_name || null,
        distanceKm: r.nearest_hospital_distance_m ? Math.round((parseFloat(r.nearest_hospital_distance_m) / 1000.0) * 10) / 10 : null,
        hasEmergencyServices: r.has_emergency_services || false,
        hasAmbulance: r.has_ambulance || false,
      },
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      count: features.length,
      source: 'PostGIS relocation_sites + site_suitability_assessments (SIMULATED BENCHMARK)',
      datasetClassification: 'SIMULATED_BENCHMARK_FACILITIES',
      siteProvenanceNotice: 'Candidate relocation sites and capacities are synthetic planning fixtures from the Chamoli demonstration benchmark, not gazetted disaster relief camps.',
    },
  };
}

/**
 * Retrieves the comprehensive suitability audit for a specific candidate site by ID.
 */
export async function getSiteSuitabilityAuditById(siteId: string): Promise<SiteSuitabilityAudit | null> {
  const query = `
    SELECT 
      s.id,
      s.name,
      s.latitude,
      s.longitude,
      r.district,
      r.state,
      sc.effective_capacity,
      sc.bottleneck,
      ssa.suitability_tier,
      ssa.suitability_score,
      ssa.safety_score,
      ssa.confidence,
      ssa.passed_criteria,
      ssa.unmet_criteria,
      ssa.unavailable_criteria,
      ssa.explainability_summary,
      ssa.nearest_hospital_distance_m,
      ssa.terrain_status,
      h.id as hospital_id,
      h.hospital_name,
      h.has_emergency_services,
      h.has_ambulance,
      cr.distance_km as route_distance_km,
      cr.road_accessibility
    FROM relocation_sites s
    LEFT JOIN regions r ON r.id = s.region_id
    LEFT JOIN site_capacities sc ON sc.site_id = s.id
    LEFT JOIN site_suitability_assessments ssa ON ssa.site_id = s.id
    LEFT JOIN hospitals h ON h.id = ssa.nearest_hospital_id
    LEFT JOIN candidate_routes cr ON cr.site_id = s.id
    WHERE s.id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [siteId]);
  if (rows.length === 0) return null;

  const r = rows[0];
  const hospitalDistM = r.nearest_hospital_distance_m ? parseFloat(r.nearest_hospital_distance_m) : null;
  const explain = r.explainability_summary || {};

  return {
    siteId: r.id,
    siteName: r.name,
    district: r.district || 'Chamoli',
    state: r.state || 'Uttarakhand',
    coordinates: {
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
    },
    tier: (r.suitability_tier as SuitabilityTier) || 'INSUFFICIENT_DATA',
    suitabilityScore: r.suitability_score ? parseFloat(r.suitability_score) : 0.5,
    safetyScore: r.safety_score ? parseFloat(r.safety_score) : 0.5,
    confidence: r.confidence ? parseFloat(r.confidence) : 0.95,
    effectiveCapacity: r.effective_capacity ? parseInt(r.effective_capacity, 10) : 0,
    bottleneck: r.bottleneck || 'sanitation',
    nearestHospital: {
      id: r.hospital_id || null,
      name: r.hospital_name || null,
      distanceMeters: hospitalDistM,
      distanceKm: hospitalDistM ? Math.round((hospitalDistM / 1000.0) * 10) / 10 : null,
      hasEmergencyServices: r.has_emergency_services || false,
      hasAmbulance: r.has_ambulance || false,
    },
    nearestRoad: {
      distanceMeters: r.route_distance_km ? parseFloat(r.route_distance_km) * 1000 : null,
      distanceKm: r.route_distance_km ? parseFloat(r.route_distance_km) : null,
      accessibility: r.road_accessibility || 'all-weather',
      accessibilityClassification: 'ASSUMED_PLANNING_PARAMETER',
      routeType: 'HEURISTIC_CORRIDOR_ESTIMATE',
      planningNotice: 'Transit distance and times are estimated using a 1.6x winding factor heuristic at 35 km/h benchmark speed, not surveyed road centerlines or live telematics.',
    },
    terrain: {
      elevationMeters: null,
      slopeDegrees: null,
      status: r.terrain_status === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
      auditNote: explain.terrainNote || 'Outside bundled Cartosat-1 DEM tile coverage (Section 8).',
    },
    checks: {
      hardHazardExclusion: r.unmet_criteria?.includes('INTERSECTS_STATUTORY_RED_ZONE') ? 'FAIL' : 'PASS',
      roadProximity: r.unmet_criteria?.includes('ROAD_CORRIDOR_BLOCKED') ? 'FAIL' : 'PASS',
      healthcareProximity: r.unmet_criteria?.includes('HEALTHCARE_FACILITY_REMOTE') ? 'FAIL' : 'PASS',
      terrainSuitability: r.terrain_status === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
    },
    passedCriteria: r.passed_criteria || [],
    unmetCriteria: r.unmet_criteria || [],
    unavailableCriteria: r.unavailable_criteria || [],
    explainability: {
      summary: explain.summary || 'Suitability assessment generated by GIS spatial engine.',
      details: [
        `Exclusion check: ${r.unmet_criteria?.includes('INTERSECTS_STATUTORY_RED_ZONE') ? 'Inside Red Zone' : 'Clear of Red Zones'}`,
        `Road corridor: ${r.road_accessibility || 'Accessible'} (Heuristic corridor estimate)`,
        `Nearest facility: ${r.hospital_name || 'Unmapped'} (${hospitalDistM ? (hospitalDistM / 1000).toFixed(1) + ' km' : 'N/A'})`,
        `DEM status: ${r.terrain_status || 'UNAVAILABLE'} (Section 8 compliant)`,
      ],
    },
    dataProvenance: {
      siteSource: 'Chamoli Demonstration Relocation Benchmark (SIMULATED)',
      siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
      siteNotice: 'Candidate relocation sites are synthetic prototype planning hubs for demonstration testing, NOT gazetted disaster relief camps.',
      hospitalSource: 'National Hospital Directory (10,843 Geocoded Facilities, Quarantined Bed Count)',
      demStatus: 'UNAVAILABLE — Gujarat tiles do not cover Chamoli (Section 8 non-fabrication)',
      assessedAt: explain.assessedAt || new Date().toISOString(),
    },
  };
}

// CLI execution entrypoint
const isMain = process.argv[1] === import.meta.filename;
if (isMain) {
  evaluateAllSiteSuitability()
    .then((res) => {
      console.log('✓ Site suitability evaluation complete:', res);
      return pool.end();
    })
    .catch((err) => {
      console.error('Fatal suitability evaluation error:', err);
      pool.end().finally(() => process.exit(1));
    });
}
