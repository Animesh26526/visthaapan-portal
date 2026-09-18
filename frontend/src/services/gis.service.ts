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
        name: 'Chamoli High-Risk Multi-Hazard Exclusion Zone (Composite)',
        district: 'Chamoli',
        state: 'Uttarakhand',
        exclusionType: 'HARD_HAZARD',
        areaSqKm: 80.03,
        status: 'ACTIVE_STATUTORY_RED_ZONE',
        mandateReference: 'SDMA-UK-2024-RZ-CHAMOLI-COMPOSITE-001',
        constituentHazardCount: 4,
        constituentHazards: [
          { id: 'HAZ-JOSHIMATH-SUBSIDENCE-2023', name: 'Joshimath Subsidence Envelope', hazardType: 'subsidence', bufferRadiusMeters: 250 },
          { id: 'HAZ-ALAKNANDA-FLASHFLOOD-2021', name: 'Alaknanda Riverine Flash Flood Corridor', hazardType: 'flash_flood', bufferRadiusMeters: 150 },
          { id: 'HAZ-MALARI-DEBRIS-AVALANCHE-2022', name: 'Malari Glacier Debris Avalanche Zone', hazardType: 'landslide', bufferRadiusMeters: 200 },
          { id: 'HAZ-PIPALKOTI-SLOPE-BLUFF-2023', name: 'Pipalkoti Unstable Escarpment Bluff', hazardType: 'landslide', bufferRadiusMeters: 100 },
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
      geometry: { type: 'Point', coordinates: [79.332, 30.413] },
      properties: {
        siteId: 'SITE-001',
        code: 'SITE-GOP',
        name: 'Gopeshwar Administrative Grounds',
        siteType: 'District HQ Plateau',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: 1550,
        areaHectares: 12.5,
        effectiveCapacity: 2400,
        suitabilityScore: 0.85,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.88,
        nearestHospitalKm: 0.85,
        nearestRoadKm: 0.15,
        hardHazardExclusionPass: true,
        status: 'ACTIVE_AVAILABLE',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-002',
      geometry: { type: 'Point', coordinates: [79.285, 30.38] },
      properties: {
        siteId: 'SITE-002',
        code: 'SITE-CHAM-STAD',
        name: 'Chamoli District Sports Complex',
        siteType: 'Sports Complex / Stadium',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: 1300,
        areaHectares: 8.0,
        effectiveCapacity: 1800,
        suitabilityScore: 0.82,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.85,
        nearestHospitalKm: 2.1,
        nearestRoadKm: 0.05,
        hardHazardExclusionPass: true,
        status: 'ACTIVE_AVAILABLE',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-003',
      geometry: { type: 'Point', coordinates: [79.215, 30.258] },
      properties: {
        siteId: 'SITE-003',
        code: 'SITE-GAU-AERO',
        name: 'Gauchar Airstrip Enclave',
        siteType: 'Aerodrome Ground / Flat Valley',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: 920,
        areaHectares: 25.0,
        effectiveCapacity: 5000,
        suitabilityScore: 0.91,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.92,
        nearestHospitalKm: 1.2,
        nearestRoadKm: 0.02,
        hardHazardExclusionPass: true,
        status: 'ACTIVE_AVAILABLE',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-004',
      geometry: { type: 'Point', coordinates: [79.255, 30.352] },
      properties: {
        siteId: 'SITE-004',
        code: 'SITE-NAND-TERR',
        name: 'Nandaprayag Upper Terraces',
        siteType: 'River Terrace Bench',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: 1050,
        areaHectares: 6.2,
        effectiveCapacity: 1200,
        suitabilityScore: 0.74,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.8,
        nearestHospitalKm: 4.5,
        nearestRoadKm: 0.3,
        hardHazardExclusionPass: true,
        status: 'ACTIVE_AVAILABLE',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-005',
      geometry: { type: 'Point', coordinates: [79.428, 30.485] },
      properties: {
        siteId: 'SITE-005',
        code: 'SITE-PIP-INTER',
        name: 'Pipalkoti Inter College Ground',
        siteType: 'Institutional Campus',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: 1340,
        areaHectares: 4.5,
        effectiveCapacity: 850,
        suitabilityScore: 0.0,
        tier: 'RESTRICTED',
        confidence: 0.95,
        nearestHospitalKm: 6.2,
        nearestRoadKm: 0.1,
        hardHazardExclusionPass: false,
        status: 'EXCLUDED_RED_ZONE',
      },
    },
    {
      type: 'Feature',
      id: 'SITE-006',
      geometry: { type: 'Point', coordinates: [79.355, 30.44] },
      properties: {
        siteId: 'SITE-006',
        code: 'SITE-MAND-HIGH',
        name: 'Mandal Valley Highland Meadow',
        siteType: 'Upland Meadow Ridge',
        district: 'Chamoli',
        state: 'Uttarakhand',
        elevationMeters: 1720,
        areaHectares: 15.0,
        effectiveCapacity: 1600,
        suitabilityScore: 0.76,
        tier: 'CONDITIONALLY_SUITABLE',
        confidence: 0.82,
        nearestHospitalKm: 8.4,
        nearestRoadKm: 0.8,
        hardHazardExclusionPass: true,
        status: 'ACTIVE_AVAILABLE',
      },
    },
  ],
};

const FALLBACK_SUITABILITY_AUDIT: Record<string, SiteSuitabilityAudit> = {
  'SITE-001': {
    siteId: 'SITE-001',
    siteName: 'Gopeshwar Administrative Grounds',
    district: 'Chamoli',
    state: 'Uttarakhand',
    coordinates: { latitude: 30.413, longitude: 79.332 },
    tier: 'CONDITIONALLY_SUITABLE',
    suitabilityScore: 0.85,
    safetyScore: 0.95,
    confidence: 0.88,
    effectiveCapacity: 2400,
    bottleneck: 'Water',
    nearestHospital: {
      id: 'HOSP-GOP-DIST',
      name: 'District Hospital Gopeshwar',
      distanceMeters: 850,
      distanceKm: 0.85,
      hasEmergencyServices: true,
      hasAmbulance: true,
    },
    nearestRoad: {
      distanceMeters: 150,
      distanceKm: 0.15,
      accessibility: 'all-weather',
    },
    terrain: {
      elevationMeters: null,
      slopeDegrees: null,
      status: 'UNAVAILABLE',
      auditNote: 'Cartosat DEM raster tiles in repository cover western Gujarat (68°E–71°E, 21°N–24°N). Chamoli coordinates (79.33°E, 30.41°N) require Section 8 non-fabrication declaration.',
    },
    checks: {
      hardHazardExclusion: 'PASS',
      roadProximity: 'PASS',
      healthcareProximity: 'PASS',
      terrainSuitability: 'UNAVAILABLE',
    },
    passedCriteria: ['Hard Hazard Red Zone Exclusion (0m overlap)', 'All-weather road connectivity within 150m', 'Geocoded emergency healthcare within 0.85km'],
    unmetCriteria: [],
    unavailableCriteria: ['High-resolution Cartosat DEM slope/elevation verification'],
    explainability: {
      summary: 'Candidate site satisfies statutory red-zone exclusion, all-weather road connectivity, and emergency healthcare access. DEM terrain slope pending regional raster ingestion.',
      details: [
        'Outside all active multi-hazard buffered red zones in Chamoli sector.',
        'Primary healthcare facility (District Hospital Gopeshwar) located 0.85 km away with 24/7 emergency & ambulance support.',
        'Direct road access with 150m connector to NH-58 corridor.',
        'Section 8 Audit Note: Elevation and slope verification marked UNAVAILABLE to prevent synthetic slope fabrication until Uttarakhand Cartosat tiles are provisioned.',
      ],
    },
    dataProvenance: {
      siteSource: 'PostGIS relocation_sites',
      hospitalSource: 'National Hospital Directory (Geocoded facilities, quarantine bed count)',
      demStatus: 'UNAVAILABLE_SECTION8_COMPLIANT',
      assessedAt: new Date().toISOString(),
    },
  },
  'SITE-005': {
    siteId: 'SITE-005',
    siteName: 'Pipalkoti Inter College Ground',
    district: 'Chamoli',
    state: 'Uttarakhand',
    coordinates: { latitude: 30.485, longitude: 79.428 },
    tier: 'RESTRICTED',
    suitabilityScore: 0.0,
    safetyScore: 0.0,
    confidence: 0.95,
    effectiveCapacity: 850,
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
    },
    terrain: {
      elevationMeters: null,
      slopeDegrees: null,
      status: 'UNAVAILABLE',
      auditNote: 'Section 8 non-fabrication rule enforced: Chamoli regional DEM unavailable.',
    },
    checks: {
      hardHazardExclusion: 'FAIL',
      roadProximity: 'PASS',
      healthcareProximity: 'FAIL',
      terrainSuitability: 'UNAVAILABLE',
    },
    passedCriteria: ['Road proximity within 100m'],
    unmetCriteria: ['CRITICAL: Intersects active statutory Multi-Hazard Red Zone (Pipalkoti Bluff 100m buffer)', 'Healthcare emergency distance exceeds 5km threshold'],
    unavailableCriteria: ['High-resolution Cartosat DEM slope/elevation verification'],
    explainability: {
      summary: 'STRICTLY RESTRICTED: Candidate site geometry directly intersects statutory Red Zone hazard envelope. Relocation prohibited under Disaster Management Act 2005.',
      details: [
        'Candidate boundary intersects RZ-CHAMOLI-COMPOSITE-001 active red zone.',
        'Exclusion type: HARD_HAZARD (Pipalkoti Unstable Escarpment Bluff with 100m buffer).',
        'Relocation suitability score reduced to 0.00.',
      ],
    },
    dataProvenance: {
      siteSource: 'PostGIS relocation_sites',
      hospitalSource: 'National Hospital Directory',
      demStatus: 'UNAVAILABLE_SECTION8_COMPLIANT',
      assessedAt: new Date().toISOString(),
    },
  },
};

export const GisService = {
  /**
   * Fetch derived statutory Red Zones
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
};
