/**
 * VISTHAAPAN Phase 6 GIS Spatial Intelligence Service (Frontend)
 * Communicates with /api/v1/gis endpoints for PostGIS spatial intelligence.
 */

import { apiClient } from './apiClient';
import { USE_MOCK_API, MOCK_DELAY_MS } from './config';
import type {
  GeoJsonFeatureCollection,
  DistrictGisFeatureProperties,
  RedZoneFeatureProperties,
  RelocationSiteFeatureProperties,
  HazardLayerFeatureProperties,
  SiteSuitabilityAudit,
  StateBoundaryProperties,
  DistrictBoundaryProperties,
  SubdistrictBoundaryProperties,
  CensusSettlementProperties,
  OsmRoadProperties,
  OsmFacilityProperties,
} from '../types/gis';

// Offline / Mock Fallbacks
const FALLBACK_RED_ZONES: GeoJsonFeatureCollection<RedZoneFeatureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'RZ-CHAMOLI-COMPOSITE-001',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [79.52, 30.535],
              [79.515, 30.56],
              [79.535, 30.575],
              [79.575, 30.57],
              [79.59, 30.545],
              [79.575, 30.525],
              [79.54, 30.52],
              [79.52, 30.535],
            ],
          ],
        ],
      },
      properties: {
        zoneId: 'RZ-CHAMOLI-COMPOSITE-001',
        name: 'Chamoli High-Risk Multi-Hazard Exclusion Zone (Composite Model)',
        district: 'Chamoli',
        state: 'Uttarakhand',
        exclusionType: 'HARD_HAZARD',
        areaSqKm: 80.03,
        status: 'MODEL_DERIVED_EXCLUSION_ZONE',
        mandateReference: 'DM-ACT-2005-SEC-30-PLANNING-CRITERIA (SIMULATED MODEL)',
        constituentHazardCount: 4,
        constituentHazards: [
          { id: 'HAZ-JOSHIMATH-SUBSIDENCE-2023', name: 'Joshimath Subsidence Envelope (SIMULATED)', hazardType: 'subsidence', bufferRadiusMeters: 250 },
          { id: 'HAZ-ALAKNANDA-FLASHFLOOD-2021', name: 'Alaknanda Riverine Flash Flood Corridor (SIMULATED)', hazardType: 'flash_flood', bufferRadiusMeters: 150 },
          { id: 'HAZ-MALARI-DEBRIS-AVALANCHE-2022', name: 'Malari Glacier Debris Avalanche Zone (SIMULATED)', hazardType: 'landslide', bufferRadiusMeters: 200 },
          { id: 'HAZ-PIPALKOTI-SLOPE-BLUFF-2023', name: 'Pipalkoti Unstable Escarpment Bluff (SIMULATED)', hazardType: 'landslide', bufferRadiusMeters: 100 },
        ],
      },
    },
  ],
};

const FALLBACK_SITES: GeoJsonFeatureCollection<RelocationSiteFeatureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'SITE-001',
      geometry: { type: 'Point', coordinates: [79.4312, 30.4321] },
      properties: {
        siteId: 'SITE-001',
        code: 'SITE-PIP-TRANSIT',
        name: 'Pipalkoti Transit Shelter Hub (SIMULATED)',
        siteType: 'shelter',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: null,
        areaHectares: 4.5,
        effectiveCapacity: 2800,
        suitabilityScore: 0.20,
        tier: 'RESTRICTED',
        confidence: 0.95,
        nearestHospitalKm: 6.2,
        nearestRoadKm: 0.1,
        hardHazardExclusionPass: false,
        status: 'RESTRICTED',
        siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
        siteNotice: 'Simulated prototype facility parameterized for multi-criteria suitability testing. Not an official relief camp.',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-002',
      geometry: { type: 'Point', coordinates: [79.1542, 30.2854] },
      properties: {
        siteId: 'SITE-002',
        code: 'SITE-GAU-AIR',
        name: 'Gauchar Strategic Airstrip Hub (SIMULATED)',
        siteType: 'open-area',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: null,
        areaHectares: 25.0,
        effectiveCapacity: 5000,
        suitabilityScore: 0.88,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.90,
        nearestHospitalKm: 1.2,
        nearestRoadKm: 0.05,
        hardHazardExclusionPass: true,
        status: 'AVAILABLE',
        siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
        siteNotice: 'Simulated prototype facility parameterized for multi-criteria suitability testing. Not an official relief camp.',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-003',
      geometry: { type: 'Point', coordinates: [79.2198, 30.2589] },
      properties: {
        siteId: 'SITE-003',
        code: 'SITE-KARN-RELIEF',
        name: 'Karnaprayag Civil Relief Facility (SIMULATED)',
        siteType: 'public-building',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: null,
        areaHectares: 8.0,
        effectiveCapacity: 3500,
        suitabilityScore: 0.88,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.88,
        nearestHospitalKm: 2.1,
        nearestRoadKm: 0.15,
        hardHazardExclusionPass: true,
        status: 'AVAILABLE',
        siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
        siteNotice: 'Simulated prototype facility parameterized for multi-criteria suitability testing. Not an official relief camp.',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-004',
      geometry: { type: 'Point', coordinates: [78.9812, 30.2842] },
      properties: {
        siteId: 'SITE-004',
        code: 'SITE-RUDR-CAMP',
        name: 'Rudraprayag Safe Camp Hub (SIMULATED)',
        siteType: 'shelter',
        district: 'Rudraprayag',
        state: 'Uttarakhand',
        elevationMeters: null,
        areaHectares: 12.0,
        effectiveCapacity: 4800,
        suitabilityScore: 0.88,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.88,
        nearestHospitalKm: 3.5,
        nearestRoadKm: 0.2,
        hardHazardExclusionPass: true,
        status: 'AVAILABLE',
        siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
        siteNotice: 'Simulated prototype facility parameterized for multi-criteria suitability testing. Not an official relief camp.',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-005',
      geometry: { type: 'Point', coordinates: [78.7845, 30.2215] },
      properties: {
        siteId: 'SITE-005',
        code: 'SITE-SRIN-LOGIST',
        name: 'Srinagar Regional Logistics Haven (SIMULATED)',
        siteType: 'school',
        district: 'Pauri Garhwal',
        state: 'Uttarakhand',
        elevationMeters: null,
        areaHectares: 18.0,
        effectiveCapacity: 9000,
        suitabilityScore: 0.88,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.90,
        nearestHospitalKm: 1.8,
        nearestRoadKm: 0.1,
        hardHazardExclusionPass: true,
        status: 'AVAILABLE',
        siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
        siteNotice: 'Simulated prototype facility parameterized for multi-criteria suitability testing. Not an official relief camp.',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-006',
      geometry: { type: 'Point', coordinates: [78.2946, 30.1032] },
      properties: {
        siteId: 'SITE-006',
        code: 'SITE-RISH-TERM',
        name: 'Rishikesh State Reserve Terminal (SIMULATED)',
        siteType: 'camp',
        district: 'Dehradun',
        state: 'Uttarakhand',
        elevationMeters: null,
        areaHectares: 30.0,
        effectiveCapacity: 15000,
        suitabilityScore: 0.88,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.92,
        nearestHospitalKm: 0.9,
        nearestRoadKm: 0.05,
        hardHazardExclusionPass: true,
        status: 'AVAILABLE',
        siteProvenance: 'SIMULATED_BENCHMARK_FACILITY',
        siteNotice: 'Simulated prototype facility parameterized for multi-criteria suitability testing. Not an official relief camp.',
      },
    },
  ],
};

const FALLBACK_SUITABILITY_AUDIT: Record<string, SiteSuitabilityAudit> = {
  'SITE-001': {
    siteId: 'SITE-001',
    siteName: 'Pipalkoti Transit Shelter Hub (SIMULATED)',
    district: 'Chamoli',
    state: 'Uttarakhand',
    coordinates: { latitude: 30.4321, longitude: 79.4312 },
    tier: 'RESTRICTED',
    suitabilityScore: 0.20,
    safetyScore: 0.15,
    confidence: 0.95,
    effectiveCapacity: 2800,
    bottleneck: 'Red Zone Hazard Exclusion',
    nearestHospital: {
      id: 'HOSP-PIP-CHC',
      name: 'Community Health Centre Pipalkoti',
      distanceMeters: 6200,
      distanceKm: 6.2,
      hasEmergencyServices: false,
      hasAmbulance: true,
    },
    nearestRoad: {
      distanceMeters: 100,
      distanceKm: 0.1,
      accessibility: 'all-weather',
      routeType: 'HEURISTIC_CORRIDOR_ESTIMATE',
      accessibilityClassification: 'ASSUMED_PLANNING_PARAMETER',
      planningNotice: 'Road proximity is an indicative straight-line corridor estimate. All-weather condition is an assumed scenario parameter pending PWD field survey.',
    },
    terrain: {
      elevationMeters: null,
      slopeDegrees: null,
      status: 'UNAVAILABLE',
      auditNote: 'Section 8 non-fabrication rule enforced: Regional Chamoli DEM unavailable in repository. Marked UNAVAILABLE.',
    },
    checks: {
      hardHazardExclusion: 'FAIL',
      roadProximity: 'PASS',
      healthcareProximity: 'FAIL',
      terrainSuitability: 'UNAVAILABLE',
    },
    passedCriteria: ['Road proximity within 100m (indicative corridor)'],
    unmetCriteria: ['CRITICAL: Intersects model-derived Red Zone hazard envelope (Pipalkoti Bluff 100m buffer)', 'Healthcare emergency distance exceeds 5km threshold'],
    unavailableCriteria: ['High-resolution Cartosat DEM slope/elevation verification'],
    explainability: {
      summary: 'RESTRICTED: Site intersects model-derived Red Zone (Pipalkoti Unstable Escarpment Bluff). Permanent relocation prohibited under DM Act 2005 model planning criteria (SIMULATED).',
      details: [
        'Candidate boundary intersects RZ-CHAMOLI-COMPOSITE-001 model exclusion zone.',
        'Exclusion type: HARD_HAZARD (Pipalkoti Unstable Escarpment Bluff with 100m buffer).',
        'Relocation suitability score reduced to 0.20.',
      ],
    },
    dataProvenance: {
      siteSource: 'SIMULATED_BENCHMARK_FACILITY',
      hospitalSource: 'National Hospital Directory',
      demStatus: 'UNAVAILABLE_SECTION8_COMPLIANT',
      assessedAt: new Date().toISOString(),
    },
  },
  'SITE-002': {
    siteId: 'SITE-002',
    siteName: 'Gauchar Strategic Airstrip Hub (SIMULATED)',
    district: 'Chamoli',
    state: 'Uttarakhand',
    coordinates: { latitude: 30.2854, longitude: 79.1542 },
    tier: 'CONDITIONALLY_SUITABLE',
    suitabilityScore: 0.88,
    safetyScore: 0.92,
    confidence: 0.90,
    effectiveCapacity: 5000,
    bottleneck: 'Shelter',
    nearestHospital: {
      id: 'HOSP-GAU-CHC',
      name: 'Gauchar Community Health Centre',
      distanceMeters: 1200,
      distanceKm: 1.2,
      hasEmergencyServices: true,
      hasAmbulance: true,
    },
    nearestRoad: {
      distanceMeters: 50,
      distanceKm: 0.05,
      accessibility: 'all-weather',
      routeType: 'HEURISTIC_CORRIDOR_ESTIMATE',
      accessibilityClassification: 'ASSUMED_PLANNING_PARAMETER',
      planningNotice: 'Road proximity is an indicative straight-line corridor estimate. All-weather condition is an assumed scenario parameter pending PWD field survey.',
    },
    terrain: {
      elevationMeters: null,
      slopeDegrees: null,
      status: 'UNAVAILABLE',
      auditNote: 'Cartosat DEM raster tiles in repository cover western Gujarat. Chamoli coordinates require Section 8 non-fabrication declaration.',
    },
    checks: {
      hardHazardExclusion: 'PASS',
      roadProximity: 'PASS',
      healthcareProximity: 'PASS',
      terrainSuitability: 'UNAVAILABLE',
    },
    passedCriteria: ['Hard Hazard Red Zone Exclusion (0m overlap with model zones)', 'Assumed all-weather corridor connector within 50m', 'Geocoded emergency healthcare within 1.2km'],
    unmetCriteria: [],
    unavailableCriteria: ['High-resolution Cartosat DEM slope/elevation verification'],
    explainability: {
      summary: 'CONDITIONALLY SUITABLE: Site is verified outside all mapped model Red Zones. Road transit access is open (estimated corridor). Nearest hospital is 1.2 km away. Terrain evaluation is UNAVAILABLE pending regional DEM tiles.',
      details: [
        'Outside all active multi-hazard buffered model exclusion zones in Chamoli sector.',
        'Primary healthcare facility located 1.2 km away with 24/7 emergency & ambulance support.',
        'Direct road access with 50m connector to NH-58 corridor.',
        'Section 8 Audit Note: Elevation and slope verification marked UNAVAILABLE to prevent synthetic slope fabrication until Uttarakhand Cartosat tiles are provisioned.',
      ],
    },
    dataProvenance: {
      siteSource: 'SIMULATED_BENCHMARK_FACILITY',
      hospitalSource: 'National Hospital Directory (Geocoded facilities)',
      demStatus: 'UNAVAILABLE_SECTION8_COMPLIANT',
      assessedAt: new Date().toISOString(),
    },
  },
};

export const GisService = {
  /**
   * Fetch model-derived Red Zones (simulated benchmark)
   */
  getRedZones: async (): Promise<GeoJsonFeatureCollection<RedZoneFeatureProperties>> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(FALLBACK_RED_ZONES), MOCK_DELAY_MS);
      });
    }

    try {
      const resp = await apiClient.get<any>('/gis/red-zones');
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0) {
        return data as GeoJsonFeatureCollection<RedZoneFeatureProperties>;
      }
      return FALLBACK_RED_ZONES;
    } catch (err) {
      console.warn('[GisService] Failed to fetch red zones, using fallback:', err);
      return FALLBACK_RED_ZONES;
    }
  },

  /**
   * Fetch candidate relocation sites as GeoJSON with suitability tiers
   */
  getRelocationSites: async (): Promise<GeoJsonFeatureCollection<RelocationSiteFeatureProperties>> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(FALLBACK_SITES), MOCK_DELAY_MS);
      });
    }

    try {
      const resp = await apiClient.get<any>('/gis/sites');
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length > 0) {
        return data as GeoJsonFeatureCollection<RelocationSiteFeatureProperties>;
      }
      return FALLBACK_SITES;
    } catch (err) {
      console.warn('[GisService] Failed to fetch relocation sites, using fallback:', err);
      return FALLBACK_SITES;
    }
  },

  /**
   * Fetch canonical districts with Phase 5 AI risk scores
   */
  getDistricts: async (params?: {
    tier?: string;
    state?: string;
    limit?: number;
    offset?: number;
  }): Promise<GeoJsonFeatureCollection<DistrictGisFeatureProperties>> => {
    if (USE_MOCK_API) {
      return { type: 'FeatureCollection', features: [] };
    }

    try {
      const resp = await apiClient.get<any>('/gis/districts', { params });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<DistrictGisFeatureProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch districts:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Fetch detailed multi-criteria spatial suitability audit for a specific site
   */
  getSiteSuitabilityAudit: async (siteId: string): Promise<SiteSuitabilityAudit> => {
    if (USE_MOCK_API) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(FALLBACK_SUITABILITY_AUDIT[siteId] || FALLBACK_SUITABILITY_AUDIT['SITE-001']);
        }, MOCK_DELAY_MS);
      });
    }

    try {
      const resp = await apiClient.get<any>(`/gis/sites/${encodeURIComponent(siteId)}/suitability`);
      const data = resp?.data || resp;
      if (data && data.siteId) {
        return data as SiteSuitabilityAudit;
      }
      return FALLBACK_SUITABILITY_AUDIT[siteId] || FALLBACK_SUITABILITY_AUDIT['SITE-001'];
    } catch (err) {
      console.warn(`[GisService] Failed to fetch suitability audit for ${siteId}, using fallback:`, err);
      return FALLBACK_SUITABILITY_AUDIT[siteId] || FALLBACK_SUITABILITY_AUDIT['SITE-001'];
    }
  },

  /**
   * Fetch active spatial hazard layers
   */
  getHazardLayers: async (hazardType?: string): Promise<GeoJsonFeatureCollection<HazardLayerFeatureProperties>> => {
    if (USE_MOCK_API) {
      return { type: 'FeatureCollection', features: [] };
    }

    try {
      const resp = await apiClient.get<any>('/gis/hazard-layers', {
        params: hazardType ? { type: hazardType } : undefined,
      });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<HazardLayerFeatureProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch hazard layers:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Fetch geocoded hospital points
   */
  getHospitals: async (params?: {
    district?: string;
    bbox?: string;
    limit?: number;
  }): Promise<GeoJsonFeatureCollection> => {
    if (USE_MOCK_API) {
      return { type: 'FeatureCollection', features: [] };
    }

    try {
      const resp = await apiClient.get<any>('/gis/hospitals', { params });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch hospitals:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Fetch evacuation transit corridors
   */
  getCorridors: async (): Promise<GeoJsonFeatureCollection> => {
    if (USE_MOCK_API) {
      return { type: 'FeatureCollection', features: [] };
    }

    try {
      const resp = await apiClient.get<any>('/gis/corridors');
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch corridors:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Phase 9: Fetch official Survey of India state boundary
   */
  getStateBoundaries: async (): Promise<GeoJsonFeatureCollection<StateBoundaryProperties>> => {
    try {
      const resp = await apiClient.get<any>('/gis/boundaries/state');
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<StateBoundaryProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch state boundary:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Phase 9: Fetch official Survey of India 13 district boundaries
   */
  getOfficialDistrictBoundaries: async (): Promise<GeoJsonFeatureCollection<DistrictBoundaryProperties>> => {
    try {
      const resp = await apiClient.get<any>('/gis/boundaries/districts');
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<DistrictBoundaryProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch district boundaries:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Phase 9: Fetch official Survey of India subdistrict / tehsil boundaries
   */
  getSubdistrictBoundaries: async (districtCode?: string): Promise<GeoJsonFeatureCollection<SubdistrictBoundaryProperties>> => {
    try {
      const resp = await apiClient.get<any>('/gis/boundaries/subdistricts', {
        params: districtCode ? { district_code: districtCode } : undefined,
      });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<SubdistrictBoundaryProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch subdistrict boundaries:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Phase 9: Fetch official Census 2011 settlements (Towns & Villages)
   */
  getCensusSettlements: async (params?: {
    district_code?: string;
    subdistrict_code?: string;
    type?: string;
    geocoded_only?: boolean;
    limit?: number;
  }): Promise<GeoJsonFeatureCollection<CensusSettlementProperties>> => {
    try {
      const resp = await apiClient.get<any>('/gis/census-settlements', { params });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<CensusSettlementProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch census settlements:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Phase 9: Fetch OpenStreetMap mapped roads
   */
  getOsmRoads: async (params?: {
    bbox?: string;
    fclass?: string;
    limit?: number;
  }): Promise<GeoJsonFeatureCollection<OsmRoadProperties>> => {
    try {
      const resp = await apiClient.get<any>('/gis/osm/roads', { params });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<OsmRoadProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch OSM roads:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },

  /**
   * Phase 9: Fetch OpenStreetMap critical facilities
   */
  getOsmFacilities: async (params?: {
    category?: string;
    bbox?: string;
    limit?: number;
  }): Promise<GeoJsonFeatureCollection<OsmFacilityProperties>> => {
    try {
      const resp = await apiClient.get<any>('/gis/osm/facilities', { params });
      const data = resp?.data || resp;
      if (data && data.type === 'FeatureCollection') {
        return data as GeoJsonFeatureCollection<OsmFacilityProperties>;
      }
      return { type: 'FeatureCollection', features: [] };
    } catch (err) {
      console.warn('[GisService] Failed to fetch OSM facilities:', err);
      return { type: 'FeatureCollection', features: [] };
    }
  },
};
