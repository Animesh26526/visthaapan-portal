import type {
  GovernmentOfficer,
  Habitation,
  RelocationSite,
  AllocationItem,
  AllocationSummary,
  AllocationExplanation,
  RiskIntelligenceAssessment,
  OfficerDecision,
  DataSourceProvenance,
  DataQualityBenchmark,
  RelocationPlanPhase,
  ScenarioModification
} from '../types';

export const mockCurrentOfficer: GovernmentOfficer = {
  id: 'OFF-IND-2026-8841',
  name: 'Shri R. K. Sharma, IAS',
  designation: 'District Magistrate & Incident Commander',
  department: 'DDMA Chamoli / Revenue & Disaster Management Dept',
  state: 'Uttarakhand',
  district: 'Chamoli',
  office: 'District Disaster Emergency Operations Center, Gopeshwar',
  employeeId: 'IAS-UK-2012-0941',
  role: 'Incident Commander',
  badgeNumber: 'DDMA-CHM-01',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
};

export const mockHabitations: Habitation[] = [
  {
    id: 'hab-joshimath',
    code: 'HAB-JOSHIMATH',
    name: 'Joshimath',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 4500,
    households: 1020,
    vulnerableGroups: { elderly: 740, children: 1120, disabled: 180 },
    coordinates: { lat: 30.5564, lng: 79.5645 },
    elevationMeters: 2180,
    slopeDegrees: 34.2,
    hazards: ['Active Land Subsidence', 'Slope Instability', 'Ground Cracks'],
    primaryHazard: 'Land Subsidence',
    riskScore: 0.95,
    vulnerabilityScore: 0.91,
    hazardExposureScore: 0.98,
    priorityScore: 0.95,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'Severely Strained',
      water: 'Disrupted (Subsidence Shear)',
      roads: 'Single-Lane Compromised',
      powerGrid: 'Intermittent'
    },
    historicalEventsCount: 8,
    lastIncidentYear: 2024,
    redZoneDistanceKm: 0.0,
    isInsideRedZone: true
  },
  {
    id: 'hab-raini',
    code: 'HAB-RAINI',
    name: 'Raini',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 1800,
    households: 390,
    vulnerableGroups: { elderly: 290, children: 440, disabled: 75 },
    coordinates: { lat: 30.485, lng: 79.712 },
    elevationMeters: 1980,
    slopeDegrees: 36.5,
    hazards: ['Glacial Lake Outburst Vulnerability', 'Flash Flood', 'Debris Flow'],
    primaryHazard: 'Flash Flood',
    riskScore: 0.91,
    vulnerabilityScore: 0.86,
    hazardExposureScore: 0.94,
    priorityScore: 0.90,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'None (Sub-Center Destroyed)',
      water: 'Spring Source Compromised',
      roads: 'NH-58 Ext Impassable',
      powerGrid: 'Outage'
    },
    historicalEventsCount: 6,
    lastIncidentYear: 2024,
    redZoneDistanceKm: 0.0,
    isInsideRedZone: true
  },
  {
    id: 'hab-tapovan',
    code: 'HAB-TAPOVAN',
    name: 'Tapovan',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 3150,
    households: 710,
    vulnerableGroups: { elderly: 480, children: 760, disabled: 120 },
    coordinates: { lat: 30.492, lng: 79.628 },
    elevationMeters: 1910,
    slopeDegrees: 31.0,
    hazards: ['Debris Flow', 'Riverbank Erosion', 'Flash Flood'],
    primaryHazard: 'Debris Flow',
    riskScore: 0.88,
    vulnerabilityScore: 0.83,
    hazardExposureScore: 0.90,
    priorityScore: 0.87,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'Primary Health Post',
      water: 'Disrupted',
      roads: 'Single-Lane Passable',
      powerGrid: 'Partial'
    },
    historicalEventsCount: 5,
    lastIncidentYear: 2023,
    redZoneDistanceKm: 0.2,
    isInsideRedZone: true
  },
  {
    id: 'hab-helang',
    code: 'HAB-HELANG',
    name: 'Helang',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 2800,
    households: 620,
    vulnerableGroups: { elderly: 410, children: 670, disabled: 95 },
    coordinates: { lat: 30.518, lng: 79.497 },
    elevationMeters: 1840,
    slopeDegrees: 28.5,
    hazards: ['Active Landslide Zone', 'Highway Slope Failure'],
    primaryHazard: 'Landslide',
    riskScore: 0.84,
    vulnerabilityScore: 0.79,
    hazardExposureScore: 0.86,
    priorityScore: 0.83,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'Primary Health Post',
      water: 'Contaminated',
      roads: 'Single-lane Passable',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 4,
    lastIncidentYear: 2024,
    redZoneDistanceKm: 0.4,
    isInsideRedZone: true
  },
  {
    id: 'hab-pandukeshwar',
    code: 'HAB-PANDUKESHWAR',
    name: 'Pandukeshwar',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 3200,
    households: 730,
    vulnerableGroups: { elderly: 460, children: 780, disabled: 110 },
    coordinates: { lat: 30.64, lng: 79.545 },
    elevationMeters: 1820,
    slopeDegrees: 29.8,
    hazards: ['River Gorge Inundation', 'Slope Instability'],
    primaryHazard: 'River Inundation',
    riskScore: 0.81,
    vulnerabilityScore: 0.77,
    hazardExposureScore: 0.83,
    priorityScore: 0.80,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'Sub-Center',
      water: 'Piped Supply',
      roads: 'NH-07 Passable',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 3,
    lastIncidentYear: 2023,
    redZoneDistanceKm: 0.8,
    isInsideRedZone: true
  },
  // Peripheral and Short-Term Habitations
  {
    id: 'hab-gopeshwar',
    code: 'HAB-GOPESHWAR',
    name: 'Gopeshwar',
    subDistrict: 'Chamoli',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 2400,
    households: 540,
    vulnerableGroups: { elderly: 320, children: 510, disabled: 70 },
    coordinates: { lat: 30.418, lng: 79.332 },
    elevationMeters: 1450,
    slopeDegrees: 22.0,
    hazards: ['Heavy Runoff', 'Slope Creep'],
    primaryHazard: 'Slope Creep',
    riskScore: 0.65,
    vulnerabilityScore: 0.62,
    hazardExposureScore: 0.67,
    priorityScore: 0.64,
    priority: 'Short-term',
    evacuationStatus: 'Standby',
    infrastructure: {
      healthcare: 'District Hospital',
      water: 'Operational',
      roads: 'All-Weather Highway',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 2,
    lastIncidentYear: 2022,
    redZoneDistanceKm: 3.2,
    isInsideRedZone: false
  },
  {
    id: 'hab-nandprayag',
    code: 'HAB-NANDPRAYAG',
    name: 'Nandprayag',
    subDistrict: 'Chamoli',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 1950,
    households: 430,
    vulnerableGroups: { elderly: 240, children: 390, disabled: 50 },
    coordinates: { lat: 30.33, lng: 79.32 },
    elevationMeters: 1100,
    slopeDegrees: 19.5,
    hazards: ['River Confluence Swell'],
    primaryHazard: 'River Inundation',
    riskScore: 0.58,
    vulnerabilityScore: 0.55,
    hazardExposureScore: 0.60,
    priorityScore: 0.57,
    priority: 'Short-term',
    evacuationStatus: 'Standby',
    infrastructure: {
      healthcare: 'Primary Health Post',
      water: 'Operational',
      roads: 'All-Weather Highway',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 2,
    lastIncidentYear: 2021,
    redZoneDistanceKm: 4.5,
    isInsideRedZone: false
  }
];

// Backward-compatibility mapping
export const HABITATION_ALIAS_MAP: Record<string, string> = {
  'HAB-001': 'hab-joshimath',
  'HAB-002': 'hab-raini',
  'HAB-003': 'hab-tapovan',
  'HAB-004': 'hab-helang',
  'HAB-005': 'hab-pandukeshwar',
};

export const mockSites: RelocationSite[] = [
  {
    id: 'site-gauchar',
    code: 'SITE-GAUCHAR',
    name: 'Gauchar Aerodrome',
    type: 'Strategic Aerodrome Terrace',
    location: 'Gauchar West Terrace, Alaknanda Bank',
    district: 'Chamoli',
    coordinates: { lat: 30.2854, lng: 79.1542 },
    elevationMeters: 820,
    safetyScore: 0.96,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 8000,
      waterCapacity: 7500,
      shelterCapacity: 6000,
      sanitationCapacity: 5500,
      healthcareCapacity: 7000,
      effectiveCapacity: 5500, // Limiting is Sanitation
      bottleneck: 'Sanitation'
    },
    totalAllocated: 4500,
    availableCapacity: 1000,
    utilizationRate: 81.8,
    accessibility: 'All-weather National Highway NH-07',
    routeDistanceKm: 79.2,
    transitTimeMinutes: 136,
    logisticsStatus: 'Operational',
    facilities: {
      hasFieldHospital: true,
      hasWaterPurification: true,
      hasHelipad: true,
      hasElectricitySubstation: true
    }
  },
  {
    id: 'site-karnaprayag',
    code: 'SITE-KARNAPRAYAG',
    name: 'Karnaprayag Hub',
    type: 'Plateau Shelter Hub',
    location: 'Karnaprayag Upper Plateau, Sector 2',
    district: 'Chamoli',
    coordinates: { lat: 30.2589, lng: 79.2198 },
    elevationMeters: 860,
    safetyScore: 0.94,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 6000,
      waterCapacity: 5000,
      shelterCapacity: 4500,
      sanitationCapacity: 3800,
      healthcareCapacity: 4800,
      effectiveCapacity: 3800, // Limiting is Sanitation
      bottleneck: 'Sanitation'
    },
    totalAllocated: 1800,
    availableCapacity: 2000,
    utilizationRate: 47.4,
    accessibility: 'All-weather National Highway NH-07',
    routeDistanceKm: 68.5,
    transitTimeMinutes: 118,
    logisticsStatus: 'Operational',
    facilities: {
      hasFieldHospital: true,
      hasWaterPurification: true,
      hasHelipad: false,
      hasElectricitySubstation: true
    }
  },
  {
    id: 'site-rudraprayag',
    code: 'SITE-RUDRAPRAYAG',
    name: 'Rudraprayag Camp',
    type: 'District Egress Camp',
    location: 'Rudraprayag South Bench, Sector 1',
    district: 'Rudraprayag',
    coordinates: { lat: 30.2842, lng: 78.9812 },
    elevationMeters: 890,
    safetyScore: 0.93,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 6500,
      waterCapacity: 5500,
      shelterCapacity: 5000,
      sanitationCapacity: 4200,
      healthcareCapacity: 5000,
      effectiveCapacity: 4200, // Limiting is Sanitation
      bottleneck: 'Sanitation'
    },
    totalAllocated: 3150,
    availableCapacity: 1050,
    utilizationRate: 75.0,
    accessibility: 'All-weather National Highway NH-07',
    routeDistanceKm: 112.4,
    transitTimeMinutes: 190,
    logisticsStatus: 'Operational',
    facilities: {
      hasFieldHospital: true,
      hasWaterPurification: true,
      hasHelipad: true,
      hasElectricitySubstation: true
    }
  },
  {
    id: 'site-srinagar',
    code: 'SITE-SRINAGAR',
    name: 'Srinagar Base',
    type: 'Regional Base Facility',
    location: 'Srinagar University Buffer Grounds',
    district: 'Pauri Garhwal',
    coordinates: { lat: 30.2215, lng: 78.7845 },
    elevationMeters: 560,
    safetyScore: 0.98,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 12000,
      waterCapacity: 10000,
      shelterCapacity: 8000,
      sanitationCapacity: 6000,
      healthcareCapacity: 9500,
      effectiveCapacity: 6000, // Limiting is Sanitation
      bottleneck: 'Sanitation'
    },
    totalAllocated: 6000,
    availableCapacity: 0,
    utilizationRate: 100.0,
    accessibility: 'All-weather 4-Lane Highway Corridor',
    routeDistanceKm: 148.0,
    transitTimeMinutes: 240,
    logisticsStatus: 'At Capacity',
    facilities: {
      hasFieldHospital: true,
      hasWaterPurification: true,
      hasHelipad: true,
      hasElectricitySubstation: true
    }
  },
  {
    id: 'site-pipalkoti',
    code: 'SITE-PIPALKOTI',
    name: 'Pipalkoti',
    type: 'Transit Staging Shelter',
    location: 'Pipalkoti Escarpment Terrace',
    district: 'Chamoli',
    coordinates: { lat: 30.4321, lng: 79.4312 },
    elevationMeters: 1320,
    safetyScore: 0.35,
    isOutsideRedZone: false, // Inside Red Zone!
    resourceCapacity: {
      areaCapacity: 5000,
      waterCapacity: 4000,
      shelterCapacity: 3500,
      sanitationCapacity: 3000,
      healthcareCapacity: 2500,
      effectiveCapacity: 0, // Hard Hazard Exclusion
      bottleneck: 'Hard Hazard Exclusion'
    },
    totalAllocated: 0,
    availableCapacity: 0,
    utilizationRate: 0.0,
    accessibility: 'Restricted - High-Angle Escarpment Hazard',
    routeDistanceKm: 34.0,
    transitTimeMinutes: 60,
    logisticsStatus: 'Restricted by Hazard',
    facilities: {
      hasFieldHospital: false,
      hasWaterPurification: true,
      hasHelipad: false,
      hasElectricitySubstation: true
    }
  }
];

export const SITE_ALIAS_MAP: Record<string, string> = {
  'SITE-001': 'site-gauchar',
  'SITE-002': 'site-karnaprayag',
  'SITE-003': 'site-rudraprayag',
  'SITE-004': 'site-srinagar',
  'SITE-005': 'site-pipalkoti',
};

// Exact OR-Generated Optimal Baseline Allocations
export const mockAllocations: AllocationItem[] = [
  {
    id: 'AL-001',
    habitationId: 'hab-joshimath',
    habitationName: 'Joshimath',
    sourcePopulation: 4500,
    priority: 'Immediate',
    siteId: 'site-gauchar',
    siteName: 'Gauchar Aerodrome',
    allocatedPopulation: 4500,
    unmetDemand: 0,
    distanceKm: 79.2,
    travelTimeMin: 136,
    costInLakhs: 16.5,
    transitStatus: 'Staged',
    transportMode: 'Convoy Bus',
    assignedAgency: 'ITBP Force'
  },
  {
    id: 'AL-002',
    habitationId: 'hab-raini',
    habitationName: 'Raini',
    sourcePopulation: 1800,
    priority: 'Immediate',
    siteId: 'site-karnaprayag',
    siteName: 'Karnaprayag Hub',
    allocatedPopulation: 1800,
    unmetDemand: 0,
    distanceKm: 68.5,
    travelTimeMin: 118,
    costInLakhs: 12.0,
    transitStatus: 'Staged',
    transportMode: 'Utility 4x4',
    assignedAgency: 'SDRF Uttarakhand'
  },
  {
    id: 'AL-003',
    habitationId: 'hab-tapovan',
    habitationName: 'Tapovan',
    sourcePopulation: 3150,
    priority: 'Immediate',
    siteId: 'site-rudraprayag',
    siteName: 'Rudraprayag Camp',
    allocatedPopulation: 3150,
    unmetDemand: 0,
    distanceKm: 112.4,
    travelTimeMin: 190,
    costInLakhs: 15.2,
    transitStatus: 'Staged',
    transportMode: 'Convoy Bus',
    assignedAgency: 'ITBP Force'
  },
  {
    id: 'AL-004',
    habitationId: 'hab-helang',
    habitationName: 'Helang',
    sourcePopulation: 2800,
    priority: 'Immediate',
    siteId: 'site-srinagar',
    siteName: 'Srinagar Base',
    allocatedPopulation: 2800,
    unmetDemand: 0,
    distanceKm: 135.0,
    travelTimeMin: 220,
    costInLakhs: 14.0,
    transitStatus: 'Staged',
    transportMode: 'Convoy Bus',
    assignedAgency: 'ITBP Force'
  },
  {
    id: 'AL-005',
    habitationId: 'hab-pandukeshwar',
    habitationName: 'Pandukeshwar',
    sourcePopulation: 3200,
    priority: 'Immediate',
    siteId: 'site-srinagar',
    siteName: 'Srinagar Base',
    allocatedPopulation: 3200,
    unmetDemand: 0,
    distanceKm: 148.0,
    travelTimeMin: 240,
    costInLakhs: 18.5,
    transitStatus: 'Staged',
    transportMode: 'Convoy Bus',
    assignedAgency: 'ITBP Force'
  }
];

export const mockAllocationSummary: AllocationSummary = {
  totalTargetPopulation: 15450,
  totalAllocatedPopulation: 15450,
  unmetDemandTotal: 0,
  totalDistanceKm: 1436.9,
  totalEstimatedCostLakhs: 76.2,
  averageCapacityUtilization: 79.2,
  bottleneckCount: 2,
  highPrioritySatisfactionRate: 100.0
};

export const mockRiskIntelligence: Record<string, RiskIntelligenceAssessment> = {
  'hab-joshimath': {
    habitationId: 'hab-joshimath',
    overallRisk: 0.95,
    vulnerabilityIndex: 0.91,
    hazardExposureIndex: 0.98,
    infrastructureFragilityIndex: 0.94,
    confidenceScore: 0.96,
    calibratedThreshold: 'Tier 1 - Immediate Relocation (>0.85)',
    recommendationUrgency: 'Immediate',
    narrativeExplanation: 'Joshimath exhibits active ground displacement exceeding 14 mm/week across its Sunil and Manohar Bagh wards, combined with steep slope declivity (34°) and compromised road integrity along NH-07.',
    features: [
      {
        feature: 'InSAR Satellite Ground Subsidence Velocity',
        category: 'Hazard Exposure',
        importanceWeight: 0.42,
        shapValue: +0.45,
        description: 'Permanent radar scatterers demonstrate accelerated ground subsidence velocity of -18.2 mm/month.'
      },
      {
        feature: 'Demographic Age Vulnerability & Immobility',
        category: 'Vulnerability',
        importanceWeight: 0.28,
        shapValue: +0.31,
        description: '41% of resident population consists of elderly individuals and children requiring assisted transit.'
      },
      {
        feature: 'Single-Point Road Vulnerability (NH-07)',
        category: 'Infrastructure',
        importanceWeight: 0.18,
        shapValue: +0.20,
        description: 'Primary egress route traverses active shear crack zones.'
      },
      {
        feature: 'Slope Declivity and Drainage Shear',
        category: 'Terrain',
        importanceWeight: 0.12,
        shapValue: +0.14,
        description: '34.2° slope combined with subsurface seepage acceleration.'
      }
    ]
  },
  'hab-raini': {
    habitationId: 'hab-raini',
    overallRisk: 0.91,
    vulnerabilityIndex: 0.86,
    hazardExposureIndex: 0.94,
    infrastructureFragilityIndex: 0.92,
    confidenceScore: 0.94,
    calibratedThreshold: 'Tier 1 - Immediate Relocation (>0.85)',
    recommendationUrgency: 'Immediate',
    narrativeExplanation: 'Raini settlement is situated directly downstream of the Rishiganga-Dhauliganga confluence, exposed to flash flood inundation and severe riverbank erosion.',
    features: [
      {
        feature: 'Glacial Catchment Flash Flood Exposure',
        category: 'Hazard Exposure',
        importanceWeight: 0.45,
        shapValue: +0.48,
        description: 'High velocity flood risk corridor along Dhauliganga gorge.'
      },
      {
        feature: 'Egress Severance Risk',
        category: 'Infrastructure',
        importanceWeight: 0.30,
        shapValue: +0.32,
        description: 'Bridge connection to Joshimath vulnerable to high river flow.'
      }
    ]
  },
  'hab-tapovan': {
    habitationId: 'hab-tapovan',
    overallRisk: 0.88,
    vulnerabilityIndex: 0.83,
    hazardExposureIndex: 0.90,
    infrastructureFragilityIndex: 0.85,
    confidenceScore: 0.93,
    calibratedThreshold: 'Tier 1 - Immediate Relocation (>0.85)',
    recommendationUrgency: 'Immediate',
    narrativeExplanation: 'Tapovan is situated in the Dhauliganga alluvial fan, exposed to torrential debris flow and barrage backwater rise during peak monsoon.',
    features: [
      {
        feature: 'Debris Flow Vulnerability',
        category: 'Hazard Exposure',
        importanceWeight: 0.40,
        shapValue: +0.42,
        description: 'Active sedimentation channel adjacent to residential cluster.'
      }
    ]
  },
  'hab-helang': {
    habitationId: 'hab-helang',
    overallRisk: 0.84,
    vulnerabilityIndex: 0.79,
    hazardExposureIndex: 0.86,
    infrastructureFragilityIndex: 0.82,
    confidenceScore: 0.92,
    calibratedThreshold: 'Tier 1 - Immediate Relocation (>0.80)',
    recommendationUrgency: 'Immediate',
    narrativeExplanation: 'Helang valley corridor exhibits active rockfall and highway slope failures along the NH-07 bypass route.',
    features: [
      {
        feature: 'Highway Escarpment Instability',
        category: 'Hazard Exposure',
        importanceWeight: 0.38,
        shapValue: +0.39,
        description: 'Pagal Nala debris slump zone frequently closes arterial access.'
      }
    ]
  },
  'hab-pandukeshwar': {
    habitationId: 'hab-pandukeshwar',
    overallRisk: 0.81,
    vulnerabilityIndex: 0.77,
    hazardExposureIndex: 0.83,
    infrastructureFragilityIndex: 0.80,
    confidenceScore: 0.91,
    calibratedThreshold: 'Tier 1 - Immediate Relocation (>0.80)',
    recommendationUrgency: 'Immediate',
    narrativeExplanation: 'Pandukeshwar river terrace is exposed to high water levels and glacial discharge from the Badrinath watershed.',
    features: [
      {
        feature: 'River Inundation Risk',
        category: 'Hazard Exposure',
        importanceWeight: 0.36,
        shapValue: +0.37,
        description: 'Alaknanda high flood buffer zone boundary intersection.'
      }
    ]
  }
};

// Aliases for legacy IDs
mockRiskIntelligence['HAB-001'] = mockRiskIntelligence['hab-joshimath'];
mockRiskIntelligence['HAB-002'] = mockRiskIntelligence['hab-raini'];
mockRiskIntelligence['HAB-003'] = mockRiskIntelligence['hab-tapovan'];
mockRiskIntelligence['HAB-004'] = mockRiskIntelligence['hab-helang'];
mockRiskIntelligence['HAB-005'] = mockRiskIntelligence['hab-pandukeshwar'];

export const mockAllocationExplanation: AllocationExplanation = {
  allocationId: 'VST-2026-CHM-014',
  prioritizedHabitations: [
    {
      name: 'Joshimath',
      rationale: 'Assigned maximum priority due to active structural subsidence (0.95 risk score) and 100% intersection with the Joshimath Subsidence Red Zone.',
      factors: ['0.95 composite risk score', '740 elderly dependents requiring assisted transit', 'Imminent slope failure within 48h']
    },
    {
      name: 'Raini',
      rationale: 'Assigned immediate priority due to flash flood risk along the Dhauliganga gorge and single-point bridge vulnerability.',
      factors: ['0.91 risk score', 'Direct river proximity', 'Disrupted road network']
    },
    {
      name: 'Tapovan',
      rationale: 'Assigned immediate priority due to active debris avalanche risk and damaged water infrastructure.',
      factors: ['0.88 risk score', 'Debris flow corridor', 'Limited healthcare capacity']
    }
  ],
  selectedSites: [
    {
      name: 'Gauchar Relocation Site',
      advantage: 'Optimal highway proximity (79.2 km) along NH-07 and strategic aerodrome air-bridge runway clearance for emergency supply logistics.',
      bottleneckMitigation: 'Effective capacity constrained by sanitation (5,500 beds); 4,500 allocated leaving 1,000 remaining buffer.'
    },
    {
      name: 'Karnaprayag Relocation Site',
      advantage: 'Plateau shelter hub outside red zones with rapid access along NH-07.',
      bottleneckMitigation: 'Sanitation capacity constrained at 3,800; 1,800 allocated leaving 2,000 available capacity.'
    },
    {
      name: 'Rudraprayag Relocation Site',
      advantage: 'Major district egress camp with field hospital and helipad facilities.',
      bottleneckMitigation: 'Sanitation capacity constrained at 4,200; 3,150 allocated leaving 1,050 available capacity.'
    },
    {
      name: 'Srinagar Relocation Site',
      advantage: 'Highest regional base capacity (6,000 effective safe beds) with university campus logistics support.',
      bottleneckMitigation: 'Binding capacity at 6,000 / 6,000; safely accommodates Helang (2,800) and Pandukeshwar (3,200).'
    }
  ],
  rejectedAlternatives: [
    {
      alternative: 'Pipalkoti Transit Site',
      rejectionReason: 'Strictly disqualified by hard hazard exclusion constraint because the facility boundary intersects the Pipalkoti High-Angle Escarpment Red Zone.'
    },
    {
      alternative: 'Govt Polytechnic Campus, Helang',
      rejectionReason: 'Disqualified because the access bridge exceeds load capacity limits for 40-seater transport buses.'
    }
  ]
};

export const mockDecisions: OfficerDecision[] = [
  {
    id: 'DEC-2026-014',
    timestamp: '2026-09-18 17:30 IST',
    date: '18 Sep 2026',
    time: '17:30:00',
    officerName: 'Shri R. K. Sharma, IAS',
    officerRole: 'Incident Commander / DM Chamoli',
    action: 'ACCEPTED',
    planId: 'VST-2026-CHM-014',
    affectedHabitations: ['Joshimath', 'Raini', 'Tapovan', 'Helang', 'Pandukeshwar'],
    affectedSites: ['Gauchar Relocation Site', 'Karnaprayag Relocation Site', 'Rudraprayag Relocation Site', 'Srinagar Relocation Site'],
    rationale: 'All computational constraints verified against ground survey reports from Sub-Divisional Magistrate Joshimath. Approved immediate mobilization of NDRF 8th Bn convoys.',
    statutoryReference: 'Planning Recommendation / Incident Commander Review',
    previousAllocationSummary: 'Algorithmic Linear Program Optimal Matrix (15,450 relocated)',
    newAllocationSummary: 'Plan Accepted without modifications. Dispatch directive issued.'
  },
  {
    id: 'DEC-2026-013',
    timestamp: '2026-09-12 14:15 IST',
    date: '12 Sep 2026',
    time: '14:15:00',
    officerName: 'Shri R. K. Sharma, IAS',
    officerRole: 'Incident Commander / DM Chamoli',
    action: 'MODIFIED',
    planId: 'VST-2026-CHM-013',
    affectedHabitations: ['Tapovan', 'Helang'],
    affectedSites: ['Karnaprayag Relocation Site', 'Gauchar Relocation Site'],
    rationale: 'Local SDM reported debris on NH-07 link near Birahi. Re-routed 1,000 citizens from southern corridor to Karnaprayag bypass.',
    statutoryReference: 'Planning Recommendation / Incident Commander Review',
    previousAllocationSummary: 'Initial baseline plan prior to corridor rerouting',
    newAllocationSummary: 'Plan Modified. Rerouting verified in OR solver.'
  },
  {
    id: 'DEC-2026-012',
    timestamp: '2026-09-04 11:00 IST',
    date: '04 Sep 2026',
    time: '11:00:00',
    officerName: 'Shri R. K. Sharma, IAS',
    officerRole: 'Incident Commander / DM Chamoli',
    action: 'REJECTED',
    planId: 'VST-2026-CHM-012',
    affectedHabitations: ['Joshimath'],
    affectedSites: ['Pipalkoti Transit Site'],
    rationale: 'Rejected proposed allocation to Pipalkoti facility due to active slope instability detected on highway escarpment.',
    statutoryReference: 'Planning Recommendation / Incident Commander Review',
    previousAllocationSummary: 'Proposal included Pipalkoti staging',
    newAllocationSummary: 'Plan Rejected. Hard hazard exclusion enforced.'
  }
];

export const mockRelocationPhases: RelocationPlanPhase[] = [
  {
    phase: 'Immediate (0-24h)',
    items: [
      {
        habitation: 'Joshimath',
        destination: 'Gauchar Aerodrome',
        headcount: 4500,
        agency: 'ITBP Force',
        status: 'Active Transit',
        criticalNeed: 'Wheelchair ambulant assistance & portable medical oxygen'
      },
      {
        habitation: 'Raini',
        destination: 'Karnaprayag Hub',
        headcount: 1800,
        agency: 'SDRF Uttarakhand',
        status: 'Convoy Staged',
        criticalNeed: 'Infant nutritional packets & tarp shelter kits'
      },
      {
        habitation: 'Tapovan',
        destination: 'Rudraprayag Camp',
        headcount: 3150,
        agency: 'ITBP Force',
        status: 'Convoy Staged',
        criticalNeed: 'Water filtration tablets & emergency rations'
      },
      {
        habitation: 'Helang',
        destination: 'Srinagar Base',
        headcount: 2800,
        agency: 'ITBP Force',
        status: 'Convoy Staged',
        criticalNeed: 'Emergency blankets & warm clothing'
      },
      {
        habitation: 'Pandukeshwar',
        destination: 'Srinagar Base',
        headcount: 3200,
        agency: 'ITBP Force',
        status: 'Convoy Staged',
        criticalNeed: 'Medical triage kits & senior citizen assistance'
      }
    ]
  },
  {
    phase: 'Short-Term (1-7d)',
    items: [
      {
        habitation: 'Gopeshwar',
        destination: 'Gauchar Aerodrome',
        headcount: 2400,
        agency: 'District Administration',
        status: 'Pending Review',
        criticalNeed: 'Large family weatherized tents'
      },
      {
        habitation: 'Nandprayag',
        destination: 'Karnaprayag Hub',
        headcount: 1950,
        agency: 'SDRF Uttarakhand',
        status: 'Pending Review',
        criticalNeed: 'Livestock temporary penning facilities'
      }
    ]
  },
  {
    phase: 'Medium-Term (weeks/months)',
    items: [
      {
        habitation: 'Helang',
        destination: 'Rudraprayag Camp',
        headcount: 1600,
        agency: 'District Administration',
        status: 'Pending Review',
        criticalNeed: 'Prefabricated modular community shelters'
      },
      {
        habitation: 'Tapovan',
        destination: 'Karnaprayag Hub',
        headcount: 1350,
        agency: 'District Administration',
        status: 'Pending Review',
        criticalNeed: 'Community water purification units'
      }
    ]
  },
  {
    phase: 'Long-Term (permanent)',
    items: [
      {
        habitation: 'Raini',
        destination: 'Srinagar Base',
        headcount: 1100,
        agency: 'Revenue & Rehabilitation Dept',
        status: 'Pending Review',
        criticalNeed: 'Permanent housing construction grants'
      },
      {
        habitation: 'Pandukeshwar',
        destination: 'Srinagar Base',
        headcount: 850,
        agency: 'Town & Country Planning Dept',
        status: 'Pending Review',
        criticalNeed: 'Rehabilitation titling & educational access'
      }
    ]
  }
];

export const mockDataProvenances: DataSourceProvenance[] = [
  {
    id: 'PROV-001',
    layerName: 'High-Resolution Synthetic Aperture Radar (SAR) Inundation Matrix',
    category: 'Satellite Radar (SAR)',
    sourceAgency: 'ISRO NRSC',
    acquisitionDate: '18 Sep 2026, 06:00 IST',
    spatialResolution: '0.5m Ground Resolution',
    coveragePercentage: 98.4,
    confidenceIndex: 0.97,
    freshness: '2.5 hours ago',
    checksum: 'sha256:7f8a92b8c9d10e11...',
    status: 'Verified Authoritative'
  },
  {
    id: 'PROV-002',
    layerName: 'Multi-Temporal Subsidence Velocity Vector (InSAR)',
    category: 'Satellite Radar (SAR)',
    sourceAgency: 'ISRO NRSC',
    acquisitionDate: '17 Sep 2026, 18:30 IST',
    spatialResolution: '1.0m Pixel Grid',
    coveragePercentage: 94.2,
    confidenceIndex: 0.94,
    freshness: '14 hours ago',
    checksum: 'sha256:91b8c11e405a...',
    status: 'Verified Authoritative'
  },
  {
    id: 'PROV-003',
    layerName: 'Chamoli Catchment River Hydro-Telemetry & Discharge Sensor Array',
    category: 'Hydro Telemetry',
    sourceAgency: 'CWC',
    acquisitionDate: '18 Sep 2026, 12:45 IST',
    spatialResolution: '12 Telemetry Gauging Stations',
    coveragePercentage: 100.0,
    confidenceIndex: 0.99,
    freshness: '15 minutes ago',
    checksum: 'sha256:4a5c889f0112...',
    status: 'Provisional Live Feed'
  },
  {
    id: 'PROV-004',
    layerName: 'National Population Register & District Habitation Geodatabase',
    category: 'Census & GIS',
    sourceAgency: 'Survey of India',
    acquisitionDate: 'Census Revision 2024 / Updated May 2026',
    spatialResolution: 'Cadastral Parcel Level',
    coveragePercentage: 96.8,
    confidenceIndex: 0.92,
    freshness: 'Quarterly Sync',
    checksum: 'sha256:6e1b78290fa1...',
    status: 'Verified Authoritative'
  }
];

export const mockDataQualityBenchmarks: DataQualityBenchmark[] = [
  {
    metric: 'Spatial Grid Completeness (Chamoli Sub-Districts)',
    category: 'Completeness',
    score: 98.6,
    benchmarkTarget: 95.0,
    status: 'OPTIMAL',
    notes: 'No missing demographic centroids in 28 monitored valley settlements.'
  },
  {
    metric: 'Sensor Telemetry Freshness (< 30 minutes)',
    category: 'Freshness',
    score: 94.2,
    benchmarkTarget: 90.0,
    status: 'OPTIMAL',
    notes: '11 out of 12 hydrological sensors transmitting on real-time satellite link.'
  },
  {
    metric: 'Road Passability Ground Verification Latency',
    category: 'Temporal Consistency',
    score: 87.5,
    benchmarkTarget: 90.0,
    status: 'ACCEPTABLE',
    notes: 'NH-07 sector 4 verified via drone scout; interior bridle paths pending manual verification.'
  },
  {
    metric: 'Carrying Capacity Sanitary Baseline Audit',
    category: 'Positional Accuracy',
    score: 92.0,
    benchmarkTarget: 90.0,
    status: 'OPTIMAL',
    notes: 'On-site sanitation capacity audited by Chief Medical Officer 12 hours ago.'
  }
];

export const mockScenarios: ScenarioModification[] = [
  {
    scenarioId: 'BASE-001',
    name: 'Baseline Chamoli Operations Plan',
    description: 'Baseline allocation under full road passability with all designated transit corridors open.',
    siteCapacityOverrides: {},
    closedRoutes: [],
    siteActiveStatus: {},
    hazardMultiplier: 1.0,
    addedSites: []
  },
  {
    scenarioId: 'SCEN-002',
    name: 'Reduce Srinagar Capacity (6,000 → 4,000)',
    description: 'Simulates municipal water line damage and sanitary constraint reducing intake at Srinagar Hub by 2,000 beds.',
    siteCapacityOverrides: { 'site-srinagar': 4000 },
    closedRoutes: [],
    siteActiveStatus: {},
    hazardMultiplier: 1.0,
    addedSites: []
  },
  {
    scenarioId: 'SCEN-003',
    name: 'NH-07 Pagal Nala Route Closure',
    description: 'Simulates severe debris collapse on NH-07 Pagal Nala corridor forcing diversion to alternative hubs.',
    siteCapacityOverrides: {},
    closedRoutes: ['route-joshimath-pipalkoti', 'R12'],
    siteActiveStatus: {},
    hazardMultiplier: 1.25,
    addedSites: []
  }
];
