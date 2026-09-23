/**
 * VISTHAAPAN Phase 6 GIS Spatial Intelligence Controller
 * Exposes REST endpoints delivering GeoJSON FeatureCollections and multi-criteria spatial audits.
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { getHazardLayersGeoJson } from '../gis/hazardLayerService.js';
import { getRedZonesGeoJson } from '../gis/unsafeZoneEngine.js';
import { getRelocationSitesGeoJson, getSiteSuitabilityAuditById } from '../gis/siteSuitabilityEngine.js';
import type { GeoJsonFeature, GeoJsonFeatureCollection, DistrictGisFeatureProperties } from '../types/gis.js';

/**
 * GET /api/v1/gis/districts
 * Returns GeoJSON FeatureCollection of canonical districts with Phase 5 AI scores.
 */
export async function getGisDistricts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tierFilter = req.query.tier ? String(req.query.tier).toLowerCase() : null;
    const stateFilter = req.query.state ? String(req.query.state) : null;
    const limit = req.query.limit ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 100, 1), 1000) : 785;
    const offset = req.query.offset ? Math.max(parseInt(String(req.query.offset), 10) || 0, 0) : 0;

    const conditions: string[] = ['cd.centroid_geometry IS NOT NULL'];
    const params: any[] = [];

    if (tierFilter) {
      params.push(tierFilter);
      conditions.push(`rp.tier = $${params.length}`);
    }

    if (stateFilter) {
      params.push(stateFilter);
      conditions.push(`cd.state_name ILIKE '%' || $${params.length} || '%'`);
    }

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const query = `
      SELECT 
        cd.id AS canonical_district_id,
        cd.district_code,
        cd.district_name,
        cd.state_code,
        cd.state_name,
        cd.centroid_provenance,
        ST_AsGeoJSON(cd.centroid_geometry)::json as geojson_geom,
        -- Phase 5 AI Intelligence
        ra.risk_score,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.urgency_score,
        rp.priority_weight,
        rp.tier,
        vdi.primary_hazard_type,
        COALESCE(vdi.hazard_total_reports, 0) as hazard_reports_total,
        COALESCE(vdi.hazard_active_events, 0) as active_events_total,
        vdi.census_population_total,
        COALESCE(vdi.hospital_count, 0) as hospital_count,
        COALESCE(vdi.geocoded_hospital_count, 0) as geocoded_hospital_count
      FROM canonical_districts cd
      LEFT JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      LEFT JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      LEFT JOIN view_district_intelligence vdi ON vdi.canonical_district_id = cd.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY rp.priority_weight DESC NULLS LAST, cd.district_name ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const { rows } = await pool.query(query, params);

    const features: GeoJsonFeature<DistrictGisFeatureProperties>[] = rows.map((r) => ({
      type: 'Feature',
      id: r.canonical_district_id,
      geometry: r.geojson_geom,
      properties: {
        canonicalDistrictId: r.canonical_district_id,
        districtCode: r.district_code,
        districtName: r.district_name,
        stateCode: r.state_code,
        stateName: r.state_name,
        centroidProvenance: r.centroid_provenance,
        riskScore: r.risk_score ? parseFloat(r.risk_score) : null,
        calibratedRiskProbability: r.calibrated_risk_probability ? parseFloat(r.calibrated_risk_probability) : null,
        vulnerabilityScore: r.vulnerability_score ? parseFloat(r.vulnerability_score) : null,
        urgencyScore: r.urgency_score ? parseFloat(r.urgency_score) : null,
        priorityWeight: r.priority_weight ? parseFloat(r.priority_weight) : null,
        tier: r.tier || null,
        primaryHazard: r.primary_hazard_type || null,
        hazardReportsTotal: parseInt(r.hazard_reports_total, 10),
        activeEventsTotal: parseInt(r.active_events_total, 10),
        censusPopulationTotal: r.census_population_total ? parseInt(r.census_population_total, 10) : null,
        hospitalCount: parseInt(r.hospital_count, 10),
        geocodedHospitalCount: parseInt(r.geocoded_hospital_count, 10),
      },
    }));

    const collection: GeoJsonFeatureCollection<DistrictGisFeatureProperties> = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        limit,
        offset,
        tierFilter,
        stateFilter,
        geometryType: 'POINT_CENTROID',
        boundaryGeometryCount: 0,
        boundaryCoverageStatus: 'UNAVAILABLE_PENDING_REGIONAL_SHAPEFILE_INGESTION',
        source: 'PostGIS canonical_districts centroids + Phase 5 AI risk engine',
        provenanceBreakdown: {
          facilityDerivedMedian: 300,
          officialDistrictHqAnchors: 10,
          stateCapitalFallbacks: 475,
          boundaryPolygonsAvailable: 0,
        },
      },
    };

    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/districts/:id
 * Returns GeoJSON Feature for a single district with comprehensive AI & hazard attributes.
 */
export async function getGisDistrictById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        cd.id AS canonical_district_id,
        cd.district_code,
        cd.district_name,
        cd.state_code,
        cd.state_name,
        cd.centroid_provenance,
        ST_AsGeoJSON(cd.centroid_geometry)::json as geojson_geom,
        ra.id as risk_assessment_id,
        ra.risk_score,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.urgency_score,
        rp.priority_weight,
        rp.tier,
        rp.reasons as governance_reasons,
        vdi.primary_hazard_type,
        vdi.hazard_total_reports,
        vdi.hazard_active_events,
        vdi.census_population_total,
        vdi.hospital_count,
        vdi.geocoded_hospital_count
      FROM canonical_districts cd
      LEFT JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      LEFT JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      LEFT JOIN view_district_intelligence vdi ON vdi.canonical_district_id = cd.id
      WHERE cd.id::text = $1 OR cd.district_name ILIKE $1 OR cd.district_code = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`District with identifier '${id}' not found in GIS catalog.`);
    }

    const r = rows[0];

    // Fetch SHAP feature contributions if available
    let shapContributions: any[] = [];
    if (r.risk_assessment_id) {
      const shapQuery = `
        SELECT feature, value, contribution, direction, explanation
        FROM risk_feature_contributions
        WHERE risk_assessment_id = $1
        ORDER BY ABS(contribution) DESC
        LIMIT 5;
      `;
      const { rows: shapRows } = await pool.query(shapQuery, [r.risk_assessment_id]);
      shapContributions = shapRows.map((s) => ({
        feature: s.feature,
        value: s.value ? parseFloat(s.value) : null,
        contribution: parseFloat(s.contribution),
        direction: s.direction,
        explanation: s.explanation,
      }));
    }

    const feature = {
      type: 'Feature',
      id: r.canonical_district_id,
      geometry: r.geojson_geom,
      properties: {
        canonicalDistrictId: r.canonical_district_id,
        districtCode: r.district_code,
        districtName: r.district_name,
        stateCode: r.state_code,
        stateName: r.state_name,
        centroidProvenance: r.centroid_provenance,
        boundaryGeometryAvailable: false,
        boundaryStatus: 'UNAVAILABLE_PENDING_REGIONAL_SHAPEFILE_INGESTION',
        riskScore: r.risk_score ? parseFloat(r.risk_score) : null,
        calibratedRiskProbability: r.calibrated_risk_probability ? parseFloat(r.calibrated_risk_probability) : null,
        vulnerabilityScore: r.vulnerability_score ? parseFloat(r.vulnerability_score) : null,
        urgencyScore: r.urgency_score ? parseFloat(r.urgency_score) : null,
        priorityWeight: r.priority_weight ? parseFloat(r.priority_weight) : null,
        tier: r.tier || null,
        primaryHazard: r.primary_hazard_type || null,
        hazardReportsTotal: parseInt(r.hazard_total_reports || '0', 10),
        activeEventsTotal: parseInt(r.hazard_active_events || '0', 10),
        censusPopulationTotal: r.census_population_total ? parseInt(r.census_population_total, 10) : null,
        hospitalCount: parseInt(r.hospital_count || '0', 10),
        geocodedHospitalCount: parseInt(r.geocoded_hospital_count || '0', 10),
        governanceReasons: r.governance_reasons || [],
        topShapContributions: shapContributions,
      },
    };

    sendSuccess(res, feature);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/hazard-layers
 * Returns active spatial hazard layers as GeoJSON.
 */
export async function getHazardLayers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hazardType = req.query.type ? String(req.query.type) : undefined;
    const collection = await getHazardLayersGeoJson(hazardType);
    sendSuccess(res, collection, {
      count: collection.features.length,
      datasetClassification: 'SIMULATED_BENCHMARK_POLYGONS',
      semanticNotice: 'Hazard polygons are benchmark modeling footprints parameterized after historical events; not raw satellite InSAR rasters or live hydro telemetry feeds.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/red-zones
 * Returns model-derived Red Zones as GeoJSON (benchmarked planning model).
 */
export async function getRedZones(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collection = await getRedZonesGeoJson();
    sendSuccess(res, collection, {
      count: collection.features.length,
      datasetClassification: 'DERIVED_BENCHMARK_ENVELOPES',
      statutoryAuthorityBasis: 'Disaster Management Act 2005 Sec 30(2)(v) Model Planning Criteria (SIMULATED BENCHMARK)',
      statutoryDisclaimer: 'Exclusion zones are algorithmically derived spatial models for disaster mitigation planning; NOT legally gazetted executive orders.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/sites
 * Returns candidate relocation sites as GeoJSON with suitability tiers.
 */
export async function getRelocationSites(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const collection = await getRelocationSitesGeoJson();
    sendSuccess(res, collection, {
      count: collection.features.length,
      datasetClassification: 'SIMULATED_BENCHMARK_FACILITIES',
      siteProvenanceNotice: 'Candidate relocation sites and capacities are synthetic planning fixtures from the Chamoli demonstration benchmark, not gazetted disaster relief camps.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/sites/:id/suitability
 * Returns detailed multi-criteria spatial suitability audit for a specific candidate site.
 */
export async function getSiteSuitabilityAudit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const audit = await getSiteSuitabilityAuditById(id);
    if (!audit) {
      throw new NotFoundError(`Candidate relocation site with ID '${id}' not found.`);
    }
    sendSuccess(res, audit);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/hospitals
 * Returns geocoded hospital Points within bounding box or district.
 */
export async function getGisHospitals(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const district = req.query.district ? String(req.query.district) : null;
    const bboxParam = req.query.bbox ? String(req.query.bbox) : null;
    const limit = req.query.limit ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 50, 1), 500) : 100;

    const conditions: string[] = [
      'has_valid_coordinates = TRUE',
      'geometry IS NOT NULL',
      'latitude >= 6.5 AND latitude <= 37.5',
      'longitude >= 68.0 AND longitude <= 97.5',
    ];
    const params: any[] = [];

    if (district) {
      params.push(district);
      conditions.push(`(district_raw ILIKE '%' || $${params.length} || '%')`);
    }

    if (bboxParam) {
      const parts = bboxParam.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        const [minLon, minLat, maxLon, maxLat] = parts;
        params.push(minLon, minLat, maxLon, maxLat);
        const l = params.length;
        conditions.push(`ST_Intersects(geometry, ST_MakeEnvelope($${l - 3}, $${l - 2}, $${l - 1}, $${l}, 4326))`);
      } else {
        throw new BadRequestError('Invalid bbox parameter format. Expected minLon,minLat,maxLon,maxLat');
      }
    }

    params.push(limit);
    const limitIdx = params.length;

    const query = `
      SELECT 
        id,
        hospital_name,
        state_raw,
        district_raw,
        hospital_category,
        hospital_care_type,
        has_emergency_services,
        has_ambulance,
        latitude,
        longitude,
        ST_AsGeoJSON(geometry)::json as geojson_geom
      FROM hospitals
      WHERE ${conditions.join(' AND ')}
      ORDER BY hospital_name ASC
      LIMIT $${limitIdx};
    `;

    const { rows } = await pool.query(query, params);

    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        hospitalId: r.id,
        name: r.hospital_name,
        state: r.state_raw,
        district: r.district_raw,
        category: r.hospital_category,
        careType: r.hospital_care_type,
        hasEmergencyServices: r.has_emergency_services,
        hasAmbulance: r.has_ambulance,
        coordinates: {
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
        },
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        source: 'National Hospital Directory (Geocoded facilities)',
        bedCountQuarantineNote: 'Raw bed numbers quarantined per Phase 4.5 audit.',
      },
    };

    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/corridors
 * Returns candidate evacuation transit routes as GeoJSON LineStrings.
 */
export async function getGisCorridors(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = `
      SELECT 
        cr.id,
        cr.habitation_id,
        cr.site_id,
        h.name as habitation_name,
        s.name as site_name,
        cr.distance_km,
        cr.travel_time_minutes,
        cr.road_accessibility,
        cr.safety_constraint_satisfied,
        cr.blocked,
        cr.feasible,
        ST_AsGeoJSON(cr.route_geometry)::json as geojson_geom
      FROM candidate_routes cr
      JOIN habitations h ON h.id = cr.habitation_id
      JOIN relocation_sites s ON s.id = cr.site_id
      ORDER BY cr.distance_km ASC;
    `;

    const { rows } = await pool.query(query);

    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        routeId: r.id,
        habitationId: r.habitation_id,
        habitationName: r.habitation_name,
        siteId: r.site_id,
        siteName: r.site_name,
        distanceKm: parseFloat(r.distance_km),
        travelTimeMinutes: r.travel_time_minutes ? parseFloat(r.travel_time_minutes) : null,
        accessibility: r.road_accessibility || 'all-weather',
        accessibilityClassification: 'ASSUMED_PLANNING_PARAMETER',
        distanceMethodology: '1.6x mountain winding factor over straight-line distance (HEURISTIC)',
        travelTimeMethodology: 'Estimated via 35 km/h mountain evacuation benchmark speed (HEURISTIC)',
        geometryType: 'STRAIGHT_LINE_INDICATIVE_VECTOR',
        feasible: r.feasible,
        blocked: r.blocked,
        safetySatisfied: r.safety_constraint_satisfied,
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        source: 'PostGIS candidate_routes (SIMULATED BENCHMARK)',
        corridorNotice: 'Corridor lines are straight-line demonstration vectors; distances and travel times are benchmark heuristics (1.6x winding factor, 35 km/h assumed transit speed) without live traffic or surveyed road centerlines.',
      },
    };

    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/boundaries/state
 * Returns GeoJSON FeatureCollection of official Survey of India state boundary.
 */
export async function getStateBoundaries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = `
      SELECT 
        id,
        state_code,
        state_name,
        shape_length,
        shape_area,
        provenance,
        ST_AsGeoJSON(geometry)::json as geojson_geom
      FROM state_boundaries
      ORDER BY state_name ASC;
    `;
    const { rows } = await pool.query(query);
    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        stateCode: r.state_code,
        stateName: r.state_name,
        shapeLength: parseFloat(r.shape_length) || null,
        shapeArea: parseFloat(r.shape_area) || null,
        provenance: r.provenance,
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        source: 'Survey of India (Official Administrative Boundary Database)',
        crs: 'EPSG:4326',
      },
    };
    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/boundaries/districts
 * Returns GeoJSON FeatureCollection of official Survey of India 13 district boundaries for Uttarakhand.
 */
export async function getDistrictBoundaries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = `
      SELECT 
        db.id,
        db.state_code,
        db.state_name,
        db.district_code,
        db.district_name,
        db.shape_length,
        db.shape_area,
        db.provenance,
        ST_AsGeoJSON(db.geometry)::json as geojson_geom,
        ra.risk_score,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.hazard_exposure_score,
        ra.urgency
      FROM district_boundaries db
      LEFT JOIN canonical_districts cd ON cd.district_code = db.district_code
      LEFT JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      ORDER BY db.district_name ASC;
    `;
    const { rows } = await pool.query(query);
    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        districtCode: r.district_code,
        districtName: r.district_name,
        stateCode: r.state_code,
        stateName: r.state_name,
        shapeLength: parseFloat(r.shape_length) || null,
        shapeArea: parseFloat(r.shape_area) || null,
        riskScore: r.risk_score ? parseFloat(r.risk_score) : null,
        riskTier: r.urgency || null,
        calibratedProbability: r.calibrated_risk_probability ? parseFloat(r.calibrated_risk_probability) : null,
        vulnerabilityScore: r.vulnerability_score ? parseFloat(r.vulnerability_score) : null,
        hazardScore: r.hazard_exposure_score ? parseFloat(r.hazard_exposure_score) : null,
        provenance: r.provenance,
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        source: 'Survey of India (Official Administrative Boundary Database)',
        crs: 'EPSG:4326',
      },
    };
    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/boundaries/subdistricts
 * Returns GeoJSON FeatureCollection of official Survey of India 111 subdistricts / tehsils.
 * Supports optional ?district_code=057 (Chamoli) filter.
 */
export async function getSubdistrictBoundaries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const districtCode = req.query.district_code ? String(req.query.district_code).trim() : null;
    let query = `
      SELECT 
        sdb.id,
        sdb.district_code,
        sdb.district_name,
        sdb.subdistrict_code,
        sdb.subdistrict_name,
        sdb.shape_length,
        sdb.shape_area,
        sdb.provenance,
        ST_AsGeoJSON(sdb.geometry)::json as geojson_geom
      FROM subdistrict_boundaries sdb
    `;
    const params: any[] = [];
    if (districtCode) {
      params.push(districtCode.padStart(3, '0'));
      query += ` WHERE sdb.district_code = $1`;
    }
    query += ` ORDER BY sdb.district_name ASC, sdb.subdistrict_name ASC;`;

    const { rows } = await pool.query(query, params);
    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        subdistrictCode: r.subdistrict_code,
        subdistrictName: r.subdistrict_name,
        districtCode: r.district_code,
        districtName: r.district_name,
        shapeLength: parseFloat(r.shape_length) || null,
        shapeArea: parseFloat(r.shape_area) || null,
        provenance: r.provenance,
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        districtFilter: districtCode || 'ALL',
        source: 'Survey of India (Official Administrative Boundary Database)',
        crs: 'EPSG:4326',
      },
    };
    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/census-settlements
 * Returns GeoJSON FeatureCollection of official Census 2011 Settlements (Towns and Villages).
 * Supports ?district_code=...&subdistrict_code=...&type=TOWN|VILLAGE&geocoded_only=true
 */
export async function getCensusSettlements(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const districtCode = req.query.district_code ? String(req.query.district_code).trim() : null;
    const subdistrictCode = req.query.subdistrict_code ? String(req.query.subdistrict_code).trim() : null;
    const type = req.query.type ? String(req.query.type).toUpperCase().trim() : null;
    const geocodedOnly = req.query.geocoded_only === 'true';
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 500, 1), 5000);
    const offset = Math.max(parseInt(String(req.query.offset), 10) || 0, 0);

    const conditions: string[] = [];
    const params: any[] = [];

    if (geocodedOnly) {
      conditions.push(`cs.geometry IS NOT NULL`);
    }
    if (districtCode) {
      params.push(districtCode.padStart(3, '0'));
      conditions.push(`cs.district_code = $${params.length}`);
    }
    if (subdistrictCode) {
      params.push(subdistrictCode);
      conditions.push(`cs.subdistrict_code = $${params.length}`);
    }
    if (type && (type === 'TOWN' || type === 'VILLAGE')) {
      params.push(type);
      conditions.push(`cs.settlement_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const query = `
      SELECT 
        cs.id,
        cs.settlement_type,
        cs.settlement_code,
        cs.settlement_name,
        cs.state_code,
        cs.district_code,
        cs.district_name,
        cs.subdistrict_code,
        cs.subdistrict_name,
        cs.cd_block_name,
        cs.population_2011_baseline,
        cs.households_2011_baseline,
        cs.male_population_2011,
        cs.female_population_2011,
        cs.infrastructure_markers,
        cs.longitude,
        cs.latitude,
        cs.provenance,
        ST_AsGeoJSON(cs.geometry)::json as geojson_geom
      FROM census_settlements cs
      ${whereClause}
      ORDER BY cs.population_2011_baseline DESC NULLS LAST
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const { rows } = await pool.query(query, params);
    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        settlementCode: r.settlement_code,
        settlementName: r.settlement_name,
        settlementType: r.settlement_type,
        districtCode: r.district_code,
        districtName: r.district_name,
        subdistrictCode: r.subdistrict_code,
        subdistrictName: r.subdistrict_name,
        cdBlockName: r.cd_block_name,
        population2011Baseline: r.population_2011_baseline,
        households2011Baseline: r.households_2011_baseline,
        malePopulation2011: r.male_population_2011,
        femalePopulation2011: r.female_population_2011,
        infrastructureMarkers: r.infrastructure_markers || {},
        longitude: r.longitude ? parseFloat(r.longitude) : null,
        latitude: r.latitude ? parseFloat(r.latitude) : null,
        provenance: r.provenance,
        temporalNotice: 'Census 2011 Baseline Population (Official Government Census, not real-time population)',
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        limit,
        offset,
        source: 'Census of India 2011 - District Census Handbook (DCHB) Uttarakhand',
        provenanceNotice: 'Demographic baseline figures reflect 2011 decennial census release; for operational decision support only.',
      },
    };
    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/osm/roads
 * Returns GeoJSON FeatureCollection of OpenStreetMap mapped road vectors.
 * Supports ?bbox=minLon,minLat,maxLon,maxLat&fclass=primary,secondary...
 */
export async function getOsmRoads(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bboxStr = req.query.bbox ? String(req.query.bbox).trim() : null;
    const fclassFilter = req.query.fclass ? String(req.query.fclass).split(',').map((s) => s.trim()) : null;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 1000, 1), 5000);

    const conditions: string[] = [];
    const params: any[] = [];

    if (bboxStr) {
      const parts = bboxStr.split(',').map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        params.push(parts[0], parts[1], parts[2], parts[3]);
        conditions.push(`geometry && ST_MakeEnvelope($${params.length - 3}, $${params.length - 2}, $${params.length - 1}, $${params.length}, 4326)`);
      }
    }

    if (fclassFilter && fclassFilter.length > 0) {
      params.push(fclassFilter);
      conditions.push(`fclass = ANY($${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    const limitIdx = params.length;

    const query = `
      SELECT 
        id,
        osm_id,
        name,
        ref,
        fclass,
        oneway,
        maxspeed,
        bridge,
        tunnel,
        provenance,
        ST_AsGeoJSON(geometry)::json as geojson_geom
      FROM osm_roads
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN fclass IN ('motorway', 'trunk') THEN 1
          WHEN fclass = 'primary' THEN 2
          WHEN fclass = 'secondary' THEN 3
          WHEN fclass = 'tertiary' THEN 4
          ELSE 5
        END ASC
      LIMIT $${limitIdx};
    `;

    const { rows } = await pool.query(query, params);
    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        osmId: r.osm_id,
        name: r.name || 'Unnamed Road',
        ref: r.ref || null,
        fclass: r.fclass,
        oneway: r.oneway,
        maxspeed: r.maxspeed,
        bridge: r.bridge,
        tunnel: r.tunnel,
        provenance: r.provenance,
        classificationNotice: 'Mapped Road (Not real-time passability verified; derived from OpenStreetMap Northern Zone)',
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        source: 'OpenStreetMap contributors / Geofabrik Northern Zone',
        provenance: 'Mapped Road (Not real-time passability verified)',
      },
    };
    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/gis/osm/facilities
 * Returns GeoJSON FeatureCollection of OpenStreetMap critical facilities (healthcare, education, emergency, government, shelter).
 * Supports ?category=healthcare|education|emergency|government|shelter&bbox=...
 */
export async function getOsmFacilities(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = req.query.category ? String(req.query.category).toLowerCase().trim() : null;
    const bboxStr = req.query.bbox ? String(req.query.bbox).trim() : null;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 500, 1), 2000);

    const conditions: string[] = [];
    const params: any[] = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (bboxStr) {
      const parts = bboxStr.split(',').map(Number);
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        params.push(parts[0], parts[1], parts[2], parts[3]);
        conditions.push(`geometry && ST_MakeEnvelope($${params.length - 3}, $${params.length - 2}, $${params.length - 1}, $${params.length}, 4326)`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    const limitIdx = params.length;

    const query = `
      SELECT 
        id,
        osm_id,
        name,
        fclass,
        category,
        longitude,
        latitude,
        provenance,
        ST_AsGeoJSON(geometry)::json as geojson_geom
      FROM osm_facilities
      ${whereClause}
      ORDER BY category ASC, name ASC
      LIMIT $${limitIdx};
    `;

    const { rows } = await pool.query(query, params);
    const features = rows.map((r) => ({
      type: 'Feature' as const,
      id: r.id,
      geometry: r.geojson_geom,
      properties: {
        osmId: r.osm_id,
        name: r.name,
        fclass: r.fclass,
        category: r.category,
        longitude: r.longitude ? parseFloat(r.longitude) : null,
        latitude: r.latitude ? parseFloat(r.latitude) : null,
        provenance: r.provenance,
        sourceNotice: 'OSM-mapped facility (Derived from OpenStreetMap Northern Zone POIs)',
      },
    }));

    const collection: GeoJsonFeatureCollection = {
      type: 'FeatureCollection',
      features,
      metadata: {
        count: features.length,
        source: 'OpenStreetMap contributors / Geofabrik Northern Zone',
        provenance: 'OSM-mapped facility',
      },
    };
    sendSuccess(res, collection, { count: features.length });
  } catch (err) {
    next(err);
  }
}

