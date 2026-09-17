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
  id: 'OFF-IND-2024-8841',
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
    id: 'HAB-001',
    code: 'VIL-A-MAL',
    name: 'Village A (Malari Upper / Joshimath Ridge)',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 8240,
    households: 1850,
    vulnerableGroups: { elderly: 1240, children: 1980, disabled: 310 },
    coordinates: { lat: 30.556, lng: 79.563 },
    elevationMeters: 2180,
    slopeDegrees: 34.2,
    hazards: ['Active Subsidence', 'Flash Flood', 'Debris Avalanches'],
    primaryHazard: 'Subsidence',
    riskScore: 0.94,
    vulnerabilityScore: 0.89,
    hazardExposureScore: 0.96,
    priorityScore: 0.92,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'Primary Health Post',
      water: 'Disrupted',
      roads: 'Severely Compromised',
      powerGrid: 'Intermittent'
    },
    historicalEventsCount: 7,
    lastIncidentYear: 2023,
    redZoneDistanceKm: 0.2,
    isInsideRedZone: true
  },
  {
    id: 'HAB-002',
    code: 'VIL-B-HEL',
    name: 'Village B (Helang Valley Corridor)',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 6700,
    households: 1480,
    vulnerableGroups: { elderly: 890, children: 1420, disabled: 210 },
    coordinates: { lat: 30.518, lng: 79.497 },
    elevationMeters: 1840,
    slopeDegrees: 28.5,
    hazards: ['Debris Flow', 'River Inundation', 'Slope Failure'],
    primaryHazard: 'Debris Flow',
    riskScore: 0.89,
    vulnerabilityScore: 0.82,
    hazardExposureScore: 0.91,
    priorityScore: 0.84,
    priority: 'Immediate',
    evacuationStatus: 'Pending Review',
    infrastructure: {
      healthcare: 'None',
      water: 'Contaminated',
      roads: 'Single-lane Passable',
      powerGrid: 'Outage'
    },
    historicalEventsCount: 5,
    lastIncidentYear: 2024,
    redZoneDistanceKm: 0.6,
    isInsideRedZone: true
  },
  {
    id: 'HAB-003',
    code: 'VIL-C-PIP',
    name: 'Village C (Pipalkoti East Flank)',
    subDistrict: 'Chamoli',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 4100,
    households: 920,
    vulnerableGroups: { elderly: 510, children: 830, disabled: 115 },
    coordinates: { lat: 30.432, lng: 79.431 },
    elevationMeters: 1320,
    slopeDegrees: 22.0,
    hazards: ['Flash Flood', 'Torrential Runoff'],
    primaryHazard: 'Flash Flood',
    riskScore: 0.82,
    vulnerabilityScore: 0.76,
    hazardExposureScore: 0.85,
    priorityScore: 0.78,
    priority: 'Short-term',
    evacuationStatus: 'Standby',
    infrastructure: {
      healthcare: 'Sub-center',
      water: 'Tanker Dependent',
      roads: 'Single-lane Passable',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 3,
    lastIncidentYear: 2021,
    redZoneDistanceKm: 1.4,
    isInsideRedZone: false
  },
  {
    id: 'HAB-004',
    code: 'VIL-D-TAP',
    name: 'Village D (Tapovan Buffer Hamlet)',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 3400,
    households: 750,
    vulnerableGroups: { elderly: 420, children: 680, disabled: 95 },
    coordinates: { lat: 30.492, lng: 79.628 },
    elevationMeters: 1910,
    slopeDegrees: 31.0,
    hazards: ['Glacial Outburst Vulnerability', 'Flash Flood'],
    primaryHazard: 'Flash Flood',
    riskScore: 0.68,
    vulnerabilityScore: 0.64,
    hazardExposureScore: 0.72,
    priorityScore: 0.65,
    priority: 'Short-term',
    evacuationStatus: 'Standby',
    infrastructure: {
      healthcare: 'Sub-center',
      water: 'Piped Normal',
      roads: 'Normal',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 2,
    lastIncidentYear: 2021,
    redZoneDistanceKm: 2.8,
    isInsideRedZone: false
  },
  {
    id: 'HAB-005',
    code: 'VIL-E-RIN',
    name: 'Village E (Rini Settlement)',
    subDistrict: 'Joshimath',
    district: 'Chamoli',
    state: 'Uttarakhand',
    population: 2150,
    households: 480,
    vulnerableGroups: { elderly: 260, children: 410, disabled: 60 },
    coordinates: { lat: 30.485, lng: 79.712 },
    elevationMeters: 1980,
    slopeDegrees: 24.1,
    hazards: ['Stream Bank Erosion', 'Rockfall'],
    primaryHazard: 'Landslide',
    riskScore: 0.54,
    vulnerabilityScore: 0.58,
    hazardExposureScore: 0.51,
    priorityScore: 0.55,
    priority: 'Medium-term',
    evacuationStatus: 'Sheltered',
    infrastructure: {
      healthcare: 'Primary Health Post',
      water: 'Piped Normal',
      roads: 'Normal',
      powerGrid: 'Operational'
    },
    historicalEventsCount: 4,
    lastIncidentYear: 2021,
    redZoneDistanceKm: 4.1,
    isInsideRedZone: false
  }
];

export const mockSites: RelocationSite[] = [
  {
    id: 'SITE-001',
    code: 'SITE-A-HLR',
    name: 'Safe Site Alpha (Highland Ridge Enclave, Pipalkoti)',
    type: 'Highland Ridge Enclave',
    location: 'Pipalkoti North Plateau, Sector 4',
    district: 'Chamoli',
    coordinates: { lat: 30.415, lng: 79.380 },
    elevationMeters: 1540,
    safetyScore: 0.96,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 15000,
      waterCapacity: 12000,
      shelterCapacity: 10000,
      sanitationCapacity: 9200,
      healthcareCapacity: 13000,
      effectiveCapacity: 9200, // MIN is sanitation
      bottleneck: 'Sanitation'
    },
    totalAllocated: 9200,
    availableCapacity: 0,
    utilizationRate: 100,
    accessibility: 'All-weather Highway',
    routeDistanceKm: 18.4,
    transitTimeMinutes: 42,
    logisticsStatus: 'At Capacity',
    facilities: {
      hasFieldHospital: true,
      hasWaterPurification: true,
      hasHelipad: true,
      hasElectricitySubstation: true
    }
  },
  {
    id: 'SITE-002',
    code: 'SITE-B-RBG',
    name: 'Safe Site Beta (Gauchar Aerodrome Buffer Grounds)',
    type: 'Aerodrome Grounds',
    location: 'Gauchar West Terrace, Alaknanda Bank',
    district: 'Chamoli',
    coordinates: { lat: 30.288, lng: 79.155 },
    elevationMeters: 820,
    safetyScore: 0.91,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 8000,
      waterCapacity: 7500,
      shelterCapacity: 6000,
      sanitationCapacity: 5500,
      healthcareCapacity: 7000,
      effectiveCapacity: 5500, // MIN is sanitation
      bottleneck: 'Sanitation'
    },
    totalAllocated: 5500,
    availableCapacity: 0,
    utilizationRate: 100,
    accessibility: 'All-weather Highway',
    routeDistanceKm: 46.2,
    transitTimeMinutes: 78,
    logisticsStatus: 'At Capacity',
    facilities: {
      hasFieldHospital: true,
      hasWaterPurification: true,
      hasHelipad: true,
      hasElectricitySubstation: true
    }
  },
  {
    id: 'SITE-003',
    code: 'SITE-C-GPC',
    name: 'Safe Site Gamma (Ghingran Plateau Complex)',
    type: 'Plateau Camp',
    location: 'Gopeshwar-Ghingran Inter-District Corridor',
    district: 'Chamoli',
    coordinates: { lat: 30.402, lng: 79.319 },
    elevationMeters: 1720,
    safetyScore: 0.89,
    isOutsideRedZone: true,
    resourceCapacity: {
      areaCapacity: 6500,
      waterCapacity: 4800,
      shelterCapacity: 5500,
      sanitationCapacity: 5000,
      healthcareCapacity: 5200,
      effectiveCapacity: 4800, // MIN is water
      bottleneck: 'Water'
    },
    totalAllocated: 4800,
    availableCapacity: 0,
    utilizationRate: 100,
    accessibility: 'Paved Secondary',
    routeDistanceKm: 32.1,
    transitTimeMinutes: 65,
    logisticsStatus: 'At Capacity',
    facilities: {
      hasFieldHospital: false,
      hasWaterPurification: true,
      hasHelipad: false,
      hasElectricitySubstation: true
    }
  }
];

export const mockAllocations: AllocationItem[] = [
  {
    id: 'AL-001',
    habitationId: 'HAB-001',
    habitationName: 'Village A (Malari Upper)',
    sourcePopulation: 8240,
    priority: 'Immediate',
    siteId: 'SITE-001',
    siteName: 'Safe Site Alpha (Highland Ridge)',
    allocatedPopulation: 7000,
    unmetDemand: 0,
    distanceKm: 18.4,
    travelTimeMin: 42,
    costInLakhs: 14.8,
    transitStatus: 'In Transit',
    transportMode: 'Convoy Bus',
    assignedAgency: 'NDRF 8th Bn'
  },
  {
    id: 'AL-002',
    habitationId: 'HAB-001',
    habitationName: 'Village A (Malari Upper)',
    sourcePopulation: 8240,
    priority: 'Immediate',
    siteId: 'SITE-003',
    siteName: 'Safe Site Gamma (Ghingran Plateau)',
    allocatedPopulation: 1240,
    unmetDemand: 0,
    distanceKm: 32.1,
    travelTimeMin: 65,
    costInLakhs: 4.2,
    transitStatus: 'Staged',
    transportMode: 'Utility 4x4',
    assignedAgency: 'SDRF Uttarakhand'
  },
  {
    id: 'AL-003',
    habitationId: 'HAB-002',
    habitationName: 'Village B (Helang Valley)',
    sourcePopulation: 6700,
    priority: 'Immediate',
    siteId: 'SITE-001',
    siteName: 'Safe Site Alpha (Highland Ridge)',
    allocatedPopulation: 2200,
    unmetDemand: 0,
    distanceKm: 21.0,
    travelTimeMin: 48,
    costInLakhs: 5.6,
    transitStatus: 'Staged',
    transportMode: 'Convoy Bus',
    assignedAgency: 'District Transport Corp'
  },
  {
    id: 'AL-004',
    habitationId: 'HAB-002',
    habitationName: 'Village B (Helang Valley)',
    sourcePopulation: 6700,
    priority: 'Immediate',
    siteId: 'SITE-002',
    siteName: 'Safe Site Beta (Gauchar Aerodrome)',
    allocatedPopulation: 4500,
    unmetDemand: 0,
    distanceKm: 46.2,
    travelTimeMin: 78,
    costInLakhs: 16.4,
    transitStatus: 'Standby',
    transportMode: 'Convoy Bus',
    assignedAgency: 'ITBP Force'
  },
  {
    id: 'AL-005',
    habitationId: 'HAB-003',
    habitationName: 'Village C (Pipalkoti Flank)',
    sourcePopulation: 4100,
    priority: 'Short-term',
    siteId: 'SITE-002',
    siteName: 'Safe Site Beta (Gauchar Aerodrome)',
    allocatedPopulation: 1000,
    unmetDemand: 0,
    distanceKm: 38.5,
    travelTimeMin: 62,
    costInLakhs: 3.1,
    transitStatus: 'Standby',
    transportMode: 'Utility 4x4',
    assignedAgency: 'District Transport Corp'
  },
  {
    id: 'AL-006',
    habitationId: 'HAB-003',
    habitationName: 'Village C (Pipalkoti Flank)',
    sourcePopulation: 4100,
    priority: 'Short-term',
    siteId: 'SITE-003',
    siteName: 'Safe Site Gamma (Ghingran Plateau)',
    allocatedPopulation: 3100,
    unmetDemand: 0,
    distanceKm: 28.4,
    travelTimeMin: 55,
    costInLakhs: 8.9,
    transitStatus: 'Standby',
    transportMode: 'Convoy Bus',
    assignedAgency: 'SDRF Uttarakhand'
  }
];

export const mockAllocationSummary: AllocationSummary = {
  totalTargetPopulation: 24590,
  totalAllocatedPopulation: 19500,
  unmetDemandTotal: 5090, // Transparent deficit as per Framework Section 12
  totalDistanceKm: 202.6,
  totalEstimatedCostLakhs: 53.0,
  averageCapacityUtilization: 100.0,
  bottleneckCount: 3,
  highPrioritySatisfactionRate: 100.0
};

export const mockRiskIntelligence: Record<string, RiskIntelligenceAssessment> = {
  'HAB-001': {
    habitationId: 'HAB-001',
    overallRisk: 0.94,
    vulnerabilityIndex: 0.89,
    hazardExposureIndex: 0.96,
    infrastructureFragilityIndex: 0.91,
    confidenceScore: 0.93,
    calibratedThreshold: 'T1 - Critical Redline (>0.85)',
    recommendationUrgency: 'Immediate',
    narrativeExplanation: 'Village A (Malari Upper) exhibits active ground displacement exceeding 14 mm/week across its north-eastern flank, combined with severe slope declivity (34°) and complete lack of alternative escape routes if NH-07 bridge is severed.',
    features: [
      {
        feature: 'InSAR Satellite Land Subsidence Velocity',
        category: 'Hazard Exposure',
        importanceWeight: 0.38,
        shapValue: +0.41,
        description: 'Permanent radar scatterers demonstrate accelerated ground subsidence velocity of -18.2 mm/month.'
      },
      {
        feature: 'Demographic Age Vulnerability & Immobility',
        category: 'Vulnerability',
        importanceWeight: 0.26,
        shapValue: +0.29,
        description: '39% of resident population consists of elderly individuals and young children unable to evacuate steep slopes unassisted.'
      },
      {
        feature: 'Single-Point Road Failure Risk (NH-07)',
        category: 'Infrastructure',
        importanceWeight: 0.22,
        shapValue: +0.24,
        description: 'Primary egress route traverses a known active landslide zone at Km Post 212.'
      },
      {
        feature: 'Historical Cloudburst Impact Index',
        category: 'Terrain',
        importanceWeight: 0.14,
        shapValue: +0.16,
        description: '7 major debris incidents recorded in the watershed catchment since 2013.'
      }
    ]
  }
};

export const mockAllocationExplanation: AllocationExplanation = {
  allocationId: 'AL-EXEC-2024-001',
  prioritizedHabitations: [
    {
      name: 'Village A (Malari Upper)',
      rationale: 'Assigned maximum priority due to active structural subsidence (0.94 risk) and 100% Red Zone ingress.',
      factors: ['0.94 composite risk score', '1,240 elderly dependents', 'Imminent slope failure within 48h']
    },
    {
      name: 'Village B (Helang Valley)',
      rationale: 'Assigned secondary immediate priority due to riverine overflow threat and contaminated potable aquifer.',
      factors: ['0.89 risk score', 'Direct river proximity', 'Disrupted electricity grid']
    }
  ],
  selectedSites: [
    {
      name: 'Safe Site Alpha (Highland Ridge)',
      advantage: 'Optimal proximity (18.4 km) and existing level-3 surgical trauma unit.',
      bottleneckMitigation: 'Sanitation capacity constrained at 9,200; mobile biotoilet units dispatched from Srinagar.'
    },
    {
      name: 'Safe Site Beta (Gauchar Aerodrome)',
      advantage: 'Air-bridge runway clearance for C-130J aircraft and heavy logistics offloading.',
      bottleneckMitigation: 'Water tanker rotation active to support population overflow.'
    }
  ],
  rejectedAlternatives: [
    {
      alternative: 'Safe Site Delta (Pandukeshwar Meadow)',
      rejectionReason: 'Disqualified due to proximity to secondary flood plain (Falls within 200m buffer of River Alaknanda).'
    },
    {
      alternative: 'Govt Polytechnic Campus, Helang',
      rejectionReason: 'Disqualified because the access bridge exceeds load capacity limits for 40-seater transport buses.'
    }
  ]
};

export const mockDecisions: OfficerDecision[] = [
  {
    id: 'DEC-2024-089',
    timestamp: '2026-09-08 18:30 IST',
    date: '08 Sep 2026',
    time: '18:30:14',
    officerName: 'Shri R. K. Sharma, IAS',
    officerRole: 'Incident Commander / DM Chamoli',
    action: 'ACCEPTED',
    planId: 'PLAN-PHASE-1-OPT',
    affectedHabitations: ['Village A (Malari Upper)', 'Village B (Helang Valley)'],
    affectedSites: ['Site Alpha (Highland Ridge)', 'Site Beta (Gauchar)'],
    rationale: 'All computational constraints verified against ground survey reports from Sub-Divisional Magistrate Joshimath. Approved immediate mobilization of NDRF 8th Bn convoys.',
    statutoryReference: 'Section 30(2)(v) Disaster Management Act 2005 / NDMA Guidelines 2024',
    previousAllocationSummary: 'Algorithmic Linear Program Optimal Matrix (19,500 relocated)',
    newAllocationSummary: 'Accepted without modifications. Executive Dispatch Order DDMA/2026/CHM/901 issued.'
  },
  {
    id: 'DEC-2024-088',
    timestamp: '2026-09-08 14:15 IST',
    date: '08 Sep 2026',
    time: '14:15:00',
    officerName: 'Shri R. K. Sharma, IAS',
    officerRole: 'Incident Commander / DM Chamoli',
    action: 'MODIFIED',
    planId: 'PLAN-PRE-OPT-02',
    affectedHabitations: ['Village C (Pipalkoti Flank)'],
    affectedSites: ['Site Beta (Gauchar Aerodrome)', 'Site Gamma (Ghingran Plateau)'],
    rationale: 'Local SDM reported active rockfall on link road between Pipalkoti and Site Beta. Diverted 1,000 persons from Gauchar route to Ghingran Plateau road via interior bypass.',
    statutoryReference: 'Emergency Powers DDMA Act Section 34',
    previousAllocationSummary: '2,000 allocated to Site Beta; 2,100 to Site Gamma',
    newAllocationSummary: '1,000 allocated to Site Beta; 3,100 to Site Gamma'
  }
];

export const mockRelocationPhases: RelocationPlanPhase[] = [
  {
    phase: 'Immediate (0-24h)',
    items: [
      {
        habitation: 'Village A (Malari Upper)',
        destination: 'Safe Site Alpha (Highland Ridge)',
        headcount: 7000,
        agency: 'NDRF 8th Bn',
        status: 'Active Transit',
        criticalNeed: 'Wheelchair ambulant assistance & portable oxygen'
      },
      {
        habitation: 'Village A (Malari Upper)',
        destination: 'Safe Site Gamma (Ghingran Plateau)',
        headcount: 1240,
        agency: 'SDRF Uttarakhand',
        status: 'Convoy Staged',
        criticalNeed: 'Infant nutritional packets & tarp kits'
      },
      {
        habitation: 'Village B (Helang Valley)',
        destination: 'Safe Site Alpha (Highland Ridge)',
        headcount: 2200,
        agency: 'District Transport Corp',
        status: 'Convoy Staged',
        criticalNeed: 'Water filtration tablets'
      }
    ]
  },
  {
    phase: 'Short-Term (1-7d)',
    items: [
      {
        habitation: 'Village B (Helang Valley)',
        destination: 'Safe Site Beta (Gauchar Aerodrome)',
        headcount: 4500,
        agency: 'ITBP Force',
        status: 'Pending Authorisation',
        criticalNeed: 'Large family weatherized tents'
      },
      {
        habitation: 'Village C (Pipalkoti Flank)',
        destination: 'Safe Site Gamma (Ghingran Plateau)',
        headcount: 3100,
        agency: 'SDRF Uttarakhand',
        status: 'Pending Authorisation',
        criticalNeed: 'Livestock temporary penning facilities'
      }
    ]
  },
  {
    phase: 'Medium-Term (weeks/months)',
    items: [
      {
        habitation: 'Village C (Pipalkoti Flank)',
        destination: 'Safe Site Beta (Gauchar Aerodrome)',
        headcount: 1000,
        agency: 'District Administration',
        status: 'Pending Authorisation',
        criticalNeed: 'Prefabricated modular community shelters'
      },
      {
        habitation: 'Village D (Tapovan Buffer Hamlet)',
        destination: 'Site E (Permanent Relocation Colony, Karnaprayag)',
        headcount: 3400,
        agency: 'Town & Country Planning Dept',
        status: 'Pending Authorisation',
        criticalNeed: 'Land titling and agricultural rehabilitation grants'
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
    acquisitionDate: '08 Sep 2026, 06:00 IST',
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
    acquisitionDate: '07 Sep 2026, 18:30 IST',
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
    acquisitionDate: '08 Sep 2026, 22:45 IST',
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
    description: 'Baseline allocation under full road passability.',
    siteCapacityOverrides: {},
    closedRoutes: [],
    siteActiveStatus: {},
    hazardMultiplier: 1.0,
    addedSites: []
  },
  {
    scenarioId: 'SCEN-002',
    name: 'Road R12 Landslide Closure',
    description: 'NH-07 blocked at Km 212, diverting to Site Gamma and Beta.',
    siteCapacityOverrides: { 'SITE-001': 5000 },
    closedRoutes: ['NH-07-R12'],
    siteActiveStatus: {},
    hazardMultiplier: 1.25,
    addedSites: []
  }
];

