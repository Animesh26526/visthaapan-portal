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

export interface StateBoundaryProperties {
  stateCode: string;
  stateName: string;
  shapeLength: number | null;
  shapeArea: number | null;
  provenance: string;
}

export interface DistrictBoundaryProperties {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
  shapeLength: number | null;
  shapeArea: number | null;
  riskScore: number | null;
  riskTier: string | null;
  calibratedProbability?: number | null;
  vulnerabilityScore: number | null;
  hazardScore: number | null;
  provenance: string;
}

export interface SubdistrictBoundaryProperties {
  subdistrictCode: string;
  subdistrictName: string;
  districtCode: string;
  districtName: string;
  shapeLength: number | null;
  shapeArea: number | null;
  provenance: string;
}

export interface CensusSettlementProperties {
  settlementCode: string;
  settlementName: string;
  settlementType: 'TOWN' | 'VILLAGE';
  districtCode: string;
  districtName: string;
  subdistrictCode?: string;
  subdistrictName?: string;
  cdBlockName?: string;
  population2011Baseline: number | null;
  households2011Baseline: number | null;
  malePopulation2011?: number | null;
  femalePopulation2011?: number | null;
  infrastructureMarkers?: Record<string, any>;
  longitude: number | null;
  latitude: number | null;
  provenance: string;
  temporalNotice: string;
}

export interface OsmRoadProperties {
  osmId: string;
  name: string;
  ref: string | null;
  fclass: string;
  oneway: string | null;
  maxspeed: number | null;
  bridge: string | null;
  tunnel: string | null;
  provenance: string;
  classificationNotice: string;
}

export interface OsmFacilityProperties {
  osmId: string;
  name: string;
  fclass: string;
  category: 'healthcare' | 'education' | 'emergency' | 'government' | 'shelter' | string;
  longitude: number | null;
  latitude: number | null;
  provenance: string;
  sourceNotice: string;
}

export interface HazardEvidenceFeatureProperties {
  id: string;
  name: string;
  hazardType: string;
  semanticType: 'OBSERVED_EVENT' | 'INVENTORY' | 'SUSCEPTIBILITY' | 'HAZARD_MAP' | 'HISTORICAL_EVENT' | 'DERIVED_SPATIAL_BUFFER' | 'SIMULATED_DEMONSTRATION';
  dataOrigin: 'REAL' | 'DERIVED' | 'SIMULATED' | 'QUARANTINED' | 'UNKNOWN';
  source: string;
  authority: string;
  datasetName?: string;
  datasetVersion?: string;
  referenceDate?: string;
  severity: string;
  confidence: number;
  methodology?: string;
  provenance: string;
  bufferMeters: number;
  metadata?: Record<string, any>;
}

export interface SettlementHazardExposure {
  hazardFeatureId: string;
  name: string;
  hazardType: string;
  semanticType: string;
  dataOrigin: 'REAL' | 'DERIVED' | 'SIMULATED' | 'QUARANTINED' | 'UNKNOWN';
  relationship: 'WITHIN' | 'INTERSECTS' | 'NEAR' | 'OUTSIDE' | 'UNKNOWN';
  distanceMeters: number;
  exposureClassification: 'HARD_EXCLUSION' | 'WARNING' | 'INFORMATIONAL' | 'UNKNOWN';
  interpretation: string;
  source: string;
  authority: string;
  confidence: number;
}

export interface SettlementHistoricalDisaster {
  eventName: string;
  disasterType: string;
  eventDate?: string;
  spatialPrecision: string;
  distanceMeters?: number;
  deathsTotal: number;
  housesDamagedTotal: number;
  source: string;
  provenance: string;
}

export interface SettlementNearbyInfrastructure {
  nearestRoad?: {
    name: string;
    fclass: string;
    distanceMeters: number;
    provenance: string;
  } | null;
  nearestFacility?: {
    name: string;
    category: string;
    fclass: string;
    distanceMeters: number;
    provenance: string;
  } | null;
}

export interface SettlementIntelligenceResponse {
  settlement: {
    id: string;
    settlementCode: string;
    settlementName: string;
    settlementType: 'TOWN' | 'VILLAGE';
    coordinates: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  administration: {
    stateCode: string;
    stateName: string;
    districtCode: string;
    districtName: string;
    subdistrictCode?: string;
    subdistrictName?: string;
    cdBlockName?: string;
  };
  census: {
    population2011Baseline: number | null;
    households2011Baseline: number | null;
    malePopulation2011: number | null;
    femalePopulation2011: number | null;
    infrastructureMarkers: Record<string, any>;
    provenance: string;
    temporalNotice: string;
  };
  districtAI: {
    districtName: string;
    riskScore: number | null;
    priorityTier: string | null;
    primaryHazard: string | null;
    modelLevel: 'DISTRICT_LEVEL_ONLY';
    disclaimer: string;
  };
  hazards: SettlementHazardExposure[];
  terrain: {
    elevationMeters: number | null;
    slopeDegrees: number | null;
    aspectDegrees: number | null;
    terrainStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_BOUNDS';
    source: string;
    provenance: string;
    note: string;
  };
  historicalEvidence: SettlementHistoricalDisaster[];
  nearbyInfrastructure: SettlementNearbyInfrastructure;
  dataQuality: {
    confidence: number;
    spatialPrecision: string;
    hazardEvidenceCount: number;
    analyzedAt: string;
    analysisVersion: string;
    overallStatus: 'SUFFICIENT_EVIDENCE' | 'LIMITED_EVIDENCE' | 'NO_SPATIAL_HAZARD_OBSERVED';
  };
}

export interface SettlementSearchResult {
  id: string;
  settlementCode: string;
  settlementName: string;
  settlementType: 'TOWN' | 'VILLAGE';
  districtCode: string;
  districtName: string;
  subdistrictCode?: string;
  subdistrictName?: string;
  population2011Baseline: number | null;
  latitude: number | null;
  longitude: number | null;
  hasHazardExclusions: boolean;
  hasHazardWarnings: boolean;
  exposureCount: number;
}

