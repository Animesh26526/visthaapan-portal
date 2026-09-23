/**
 * VISTHAAPAN Operations & Relocation Planning Types
 * PS 26191 — Decision-Support Prototype Interface
 */

export type RelocationPhaseKey = 'ALL' | 'IMMEDIATE' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';

export interface OperationalHazardZone {
  id: string;
  name: string;
  hazardType: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  areaSqKm: number;
  affectedHabitationsCount: number;
  relocationPriority: 'Immediate' | 'Short-term' | 'Medium-term';
  recommendedAction: string;
  mandateReference: string;
  geometry: any;
}

export interface OperationalHabitation {
  id: string;
  name: string;
  district: string;
  subDistrict: string;
  coordinates: { lat: number; lng: number };
  population: number;
  households: number;
  hazardStatus: 'CRITICAL' | 'HIGH' | 'WARNING' | 'MONITORED';
  primaryHazard: string;
  relocationPriority: 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term';
  relocationPhase: 'Immediate' | 'Short Term' | 'Medium Term' | 'Long Term';
  recommendedDestinationId: string;
  recommendedDestinationName: string;
  allocatedPopulation: number;
  routeId: string;
  routeDistanceKm: number;
  transitTimeMinutes: number;
  isInsideRedZone: boolean;
  redZoneName?: string;
  infrastructure: {
    healthcare: string;
    water: string;
    roads: string;
    powerGrid: string;
  };
}

export interface OperationalRelocationSite {
  id: string;
  name: string;
  district: string;
  coordinates: { lat: number; lng: number };
  type: string;
  nominalCapacity: number;
  effectiveCapacity: number;
  allocatedPopulation: number;
  remainingCapacity: number;
  suitability: 'SUITABLE' | 'CONDITIONALLY_SUITABLE' | 'RESTRICTED';
  safetyScore: number;
  bottleneck: string;
  hazardStatus: string;
  sourceHabitations: string[];
  roadAccess: string;
  isInsideRedZone: boolean;
  facilities: {
    hasFieldHospital: boolean;
    hasWaterPurification: boolean;
    hasHelipad: boolean;
    hasElectricitySubstation: boolean;
  };
}

export interface OperationalRoute {
  id: string;
  name: string;
  fromHabitationId: string;
  fromHabitationName: string;
  toSiteId: string;
  toSiteName: string;
  distanceKm: number;
  transitTimeMinutes: number;
  roadName: string;
  roadNetwork: string;
  status: 'Route Available' | 'Detour Active' | 'Corridor Impassable';
  phase: 'Immediate' | 'Short Term' | 'Medium Term' | 'Long Term';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat]
  };
}

export interface OperationalRelocationPlan {
  planId: string;
  name: string;
  scenario: string;
  phase: string;
  totalRequiredPopulation: number;
  totalEffectiveCapacity: number;
  totalAllocatedPopulation: number;
  capacityDeficit: number;
  habitationsCount: number;
  destinationsCount: number;
  activeRoutesCount: number;
  status: 'OPTIMAL' | 'DEFICIT_DETECTED' | 'RE-OPTIMIZED' | 'OFFICER_REVIEWED';
  statutoryReference: string;
}

export interface OperationalMapResponse {
  success: boolean;
  timestamp: string;
  activePhase: string;
  summary: {
    totalRequiredPopulation: number;
    totalEffectiveCapacity: number;
    totalAllocatedPopulation: number;
    capacityDeficit: number;
    satisfactionRate: number;
    status: 'OPTIMAL_ALLOCATION' | 'CAPACITY_DEFICIT';
  };
  hazardZones: OperationalHazardZone[];
  habitations: OperationalHabitation[];
  relocationSites: OperationalRelocationSite[];
  routes: OperationalRoute[];
  phases: {
    key: string;
    label: string;
    habitationsCount: number;
    totalPopulation: number;
    description?: string;
  }[];
  relocationPlans: OperationalRelocationPlan[];
}
