// Shared Domain Types for VISTHAAPAN System Architecture

export type UrgencyTier = 'Immediate' | 'Short-term' | 'Medium-term';

export interface GovernmentOfficer {
  id: string;
  name: string;
  designation: string;
  department: string;
  state: string;
  district: string;
  office: string;
  employeeId: string;
  role: 'Incident Commander' | 'District Collector' | 'Relocation Officer' | 'GIS Analyst';
  avatar?: string;
  badgeNumber: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Habitation {
  id: string;
  code: string;
  name: string;
  subDistrict: string;
  district: string;
  state: string;
  population: number;
  households: number;
  vulnerableGroups: {
    elderly: number;
    children: number;
    disabled: number;
  };
  coordinates: Coordinates;
  elevationMeters: number;
  slopeDegrees: number;
  hazards: string[];
  primaryHazard: 'Flash Flood' | 'Landslide' | 'Cloudburst' | 'Subsidence' | 'Debris Flow' | 'River Inundation' | 'Slope Creep' | string;
  riskScore: number;          // 0.0 to 1.0
  vulnerabilityScore: number; // 0.0 to 1.0
  hazardExposureScore: number;
  priorityScore: number;
  priority: UrgencyTier;
  evacuationStatus: 'Pending Review' | 'Evacuation Ordered' | 'Transit En Route' | 'Relocated' | 'Sheltered' | 'Standby' | string;
  infrastructure: {
    healthcare: string;
    water: string;
    roads: string;
    powerGrid: string;
  };

  historicalEventsCount: number;
  lastIncidentYear: number;
  redZoneDistanceKm: number;
  isInsideRedZone: boolean;
}

export interface FeatureContribution {
  feature: string;
  category: 'Hazard Exposure' | 'Vulnerability' | 'Infrastructure' | 'Terrain';
  importanceWeight: number; // 0.0 to 1.0
  shapValue: number;
  description: string;
}

export interface RiskIntelligenceAssessment {
  habitationId: string;
  overallRisk: number;
  vulnerabilityIndex: number;
  hazardExposureIndex: number;
  infrastructureFragilityIndex: number;
  confidenceScore: number;
  features: FeatureContribution[];
  recommendationUrgency: UrgencyTier;
  calibratedThreshold: string;
  narrativeExplanation: string;
}

export interface ResourceCapacity {
  areaCapacity: number;
  waterCapacity: number;
  shelterCapacity: number;
  sanitationCapacity: number;
  healthcareCapacity: number;
  effectiveCapacity: number; // MIN of above
  bottleneck: 'Area' | 'Water' | 'Shelter' | 'Sanitation' | 'Healthcare' | string;
}

export interface RelocationSite {
  id: string;
  code: string;
  name: string;
  type: string;
  location: string;
  district: string;
  coordinates: Coordinates;
  elevationMeters: number;
  safetyScore: number; // 0.0 to 1.0
  isOutsideRedZone: boolean;
  resourceCapacity: ResourceCapacity;
  effectiveCapacity?: number;
  totalAllocated: number;
  availableCapacity: number;
  utilizationRate: number; // %
  accessibility: string;
  routeDistanceKm: number;
  transitTimeMinutes: number;
  logisticsStatus: string;
  facilities: {
    hasFieldHospital: boolean;
    hasWaterPurification: boolean;
    hasHelipad: boolean;
    hasElectricitySubstation: boolean;
  };
}

export interface AllocationItem {
  id: string;
  habitationId: string;
  habitationName: string;
  sourceHabitationId?: string;
  sourceHabitationName?: string;
  sourcePopulation?: number;
  priority?: UrgencyTier;
  siteId: string;
  siteName: string;
  targetSiteId?: string;
  targetSiteName?: string;
  allocatedPopulation: number;
  unmetDemand?: number;
  distanceKm?: number;
  travelTimeMin?: number;
  costInLakhs?: number;
  transitStatus?: string;
  transportMode?: string;
  assignedAgency?: string;
}

export interface AllocationSummary {
  totalTargetPopulation: number;
  totalAllocatedPopulation: number;
  unmetDemandTotal: number;
  totalDistanceKm: number;
  totalEstimatedCostLakhs: number;
  averageCapacityUtilization?: number;
  bottleneckCount?: number;
  highPrioritySatisfactionRate?: number;
}

export interface AllocationExplanation {
  allocationId: string;
  prioritizedHabitations: {
    name: string;
    rationale: string;
    factors: string[];
  }[];
  selectedSites: {
    name: string;
    advantage: string;
    bottleneckMitigation: string;
  }[];
  rejectedAlternatives: {
    alternative: string;
    rejectionReason: string;
  }[];
}

export interface ScenarioModification {
  scenarioId: string;
  name: string;
  description: string;
  siteCapacityOverrides: Record<string, number>;
  closedRoutes: string[];
  siteActiveStatus: Record<string, boolean>;
  hazardMultiplier: number;
  addedSites: Partial<RelocationSite>[];
}

export interface ScenarioComparison {
  baseline: AllocationSummary;
  scenario: AllocationSummary;
  affectedVillages: string[];
  divertedPopulation: number;
  costDifferenceLakhs: number;
  unmetDifference: number;
  primaryCause: string;
}

export interface RelocationPlanPhase {
  phase: string;
  items: {
    habitation: string;
    destination: string;
    headcount: number;
    agency: string;
    status: 'Pending Authorisation' | 'Convoy Staged' | 'Active Transit' | 'Completed' | string;
    criticalNeed: string;
  }[];
}

export interface OfficerDecision {
  id: string;
  timestamp: string;
  date?: string;
  time?: string;
  officerName: string;
  officerRole: string;
  action: 'ACCEPTED' | 'MODIFIED' | 'REJECTED';
  planId: string;
  affectedHabitations: string[];
  affectedSites: string[];
  rationale: string;
  statutoryReference: string;
  previousAllocationSummary: string;
  newAllocationSummary: string;
  digitalSignatureHash?: string;
  status?: string;
}


export interface DataSourceProvenance {
  id: string;
  layerName: string;
  category: 'Satellite Radar (SAR)' | 'Optical Multispectral' | 'Drone LiDAR' | 'Hydro Telemetry' | 'Census & GIS';
  sourceAgency: 'ISRO NRSC' | 'Survey of India' | 'CWC' | 'IMD' | 'DDMA Chamoli';
  acquisitionDate: string;
  spatialResolution: string;
  coveragePercentage: number;
  confidenceIndex: number;
  freshness: string;
  checksum: string;
  status: 'Verified Authoritative' | 'Provisional Live Feed' | 'Historical Baseline';
}

export interface DataQualityBenchmark {
  metric: string;
  category: 'Completeness' | 'Freshness' | 'Positional Accuracy' | 'Temporal Consistency';
  score: number; // %
  benchmarkTarget: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADED';
  notes: string;
}

// Backward Compatibility Aliases for services
export type Allocation = AllocationItem;
export type Scenario = ScenarioModification;

export * from './gis';

