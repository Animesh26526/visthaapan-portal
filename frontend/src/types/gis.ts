/**
 * VISTHAAPAN Phase 6 GIS & Spatial Intelligence Types (Frontend)
 * Canonical spatial data structures, GeoJSON contracts, and suitability schemas.
 */

export type GeoJsonGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection';

export interface GeoJsonGeometry {
  type: GeoJsonGeometryType;
  coordinates: any;
}

export interface GeoJsonFeature<P = Record<string, any>> {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJsonGeometry | null;
  properties: P;
}

export interface GeoJsonFeatureCollection<P = Record<string, any>> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
  bbox?: [number, number, number, number];
  metadata?: Record<string, any>;
}

export type SuitabilityTier =
  | 'SUITABLE'
  | 'CONDITIONALLY_SUITABLE'
  | 'RESTRICTED'
  | 'INSUFFICIENT_DATA';

export type SpatialHazardType =
  | 'flood'
  | 'flash_flood'
  | 'landslide'
  | 'cloudburst'
  | 'subsidence'
  | 'coastal'
  | 'earthquake'
  | 'multi_hazard';

export type ExclusionType =
  | 'HARD_HAZARD'
  | 'BUFFER_SETBACK'
  | 'SLOPE_INSTABILITY'
  | 'INFRASTRUCTURE_RESTRICTION';

export interface SiteSuitabilityAudit {
  siteId: string;
  siteName: string;
  district: string;
  state: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  tier: SuitabilityTier;
  suitabilityScore: number;
  safetyScore: number;
  confidence: number;
  effectiveCapacity: number;
  bottleneck: string;
  nearestHospital: {
    id: string | null;
    name: string | null;
    distanceMeters: number | null;
    distanceKm: number | null;
    hasEmergencyServices: boolean | null;
    hasAmbulance: boolean | null;
  };
  nearestRoad: {
    distanceMeters: number | null;
    distanceKm: number | null;
    accessibility: string | null;
    routeType?: string;
    accessibilityClassification?: string;
    planningNotice?: string;
  };
  terrain: {
    elevationMeters: number | null;
    slopeDegrees: number | null;
    status: 'AVAILABLE' | 'UNAVAILABLE';
    auditNote: string;
  };
  checks: {
    hardHazardExclusion: 'PASS' | 'FAIL';
    roadProximity: 'PASS' | 'FAIL' | 'NOT_EVALUATED';
    healthcareProximity: 'PASS' | 'FAIL' | 'NOT_EVALUATED';
    terrainSuitability: 'PASS' | 'FAIL' | 'UNAVAILABLE';
  };
  passedCriteria: string[];
  unmetCriteria: string[];
  unavailableCriteria: string[];
  explainability: {
    summary: string;
    details: string[];
  };
  dataProvenance: {
    siteSource: string;
    siteProvenance?: string;
    siteNotice?: string;
    hospitalSource: string;
    demStatus: string;
    assessedAt: string;
  };
}

export interface DistrictGisFeatureProperties {
  canonicalDistrictId: string;
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  centroidProvenance: string;
  boundaryGeometryAvailable?: boolean;
  boundaryStatus?: string;
  riskScore: number | null;
  calibratedRiskProbability: number | null;
  vulnerabilityScore: number | null;
  urgencyScore: number | null;
  priorityWeight: number | null;
  tier: 'immediate' | 'short-term' | 'medium-term' | null;
  primaryHazard: string | null;
  hazardReportsTotal: number;
  activeEventsTotal: number;
  censusPopulationTotal: number | null;
  hospitalCount: number;
  geocodedHospitalCount: number;
  topShapContributions?: Array<{
    feature: string;
    value: number | null;
    contribution: number;
    direction: string;
    explanation: string;
  }>;
  governanceReasons?: string[];
}

export interface RedZoneFeatureProperties {
  zoneId: string;
  name: string;
  district: string;
  state: string;
  exclusionType: string;
  areaSqKm: number;
  status: string;
  mandateReference: string;
  constituentHazardCount: number;
  constituentHazards?: Array<{
    id: string;
    name: string;
    hazardType: string;
    bufferRadiusMeters: number;
  }>;
}

export interface RelocationSiteFeatureProperties {
  siteId: string;
  code: string;
  name: string;
  siteType: string;
  district: string;
  state: string;
  elevationMeters: number | null;
  areaHectares: number;
  effectiveCapacity: number;
  suitabilityScore: number;
  tier: SuitabilityTier;
  confidence: number;
  nearestHospitalKm: number | null;
  nearestRoadKm: number | null;
  hardHazardExclusionPass: boolean;
  status: string;
  siteProvenance?: string;
  siteNotice?: string;
}

export interface HazardLayerFeatureProperties {
  hazardId: string;
  name: string;
  hazardType: string;
  sourceAgency: string;
  severity: string;
  bufferRadiusMeters: number;
  buffered: boolean;
  district: string;
  state: string;
}
