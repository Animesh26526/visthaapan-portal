/**
 * VISTHAAPAN Operations & Relocation Planning Controller
 * PS 26191 — Prototype Relocation Decision-Support API
 * 
 * Provides clean operational relocation planning data:
 * - Hazard-Based Red Zones (Spatial Polygons)
 * - Vulnerable Habitations
 * - Safe Relocation Sites with Carrying Capacity
 * - Mapped Road Transportation Routes (OSM Road Network)
 * - Relocation Phases (Immediate, Short Term, Medium Term, Long Term)
 * - Relocation Plans
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool.js';

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

// ── ROAD NETWORK COORDINATE SNAPPING (Derived from actual OSM NH-7 & NH-58 Ext roads) ──
const OSM_ROAD_COORDINATES: Record<string, [number, number][]> = {
  // Joshimath to Gauchar along NH-7
  'route-joshimath-gauchar': [
    [79.5645, 30.5564], // Joshimath
    [79.542, 30.541],   // Upper Alaknanda gorge
    [79.497, 30.518],   // Helang
    [79.468, 30.479],   // Pakhi
    [79.4312, 30.4321], // Pipalkoti
    [79.38, 30.415],    // Birahi
    [79.337, 30.403],   // Chamoli town
    [79.32, 30.33],     // Nandprayag
    [79.28, 30.3],      // Langasu
    [79.2198, 30.2589], // Karnaprayag
    [79.185, 30.272],   // Alaknanda river bend
    [79.1542, 30.2854], // Gauchar
  ],

  // Raini to Karnaprayag along NH-58 Ext to Joshimath, then NH-7
  'route-raini-karnaprayag': [
    [79.712, 30.485],   // Raini
    [79.675, 30.488],   // Dhauliganga confluence
    [79.628, 30.492],   // Tapovan
    [79.595, 30.528],   // Dhak
    [79.5645, 30.5564], // Joshimath
    [79.497, 30.518],   // Helang
    [79.4312, 30.4321], // Pipalkoti
    [79.38, 30.415],    // Birahi
    [79.337, 30.403],   // Chamoli town
    [79.32, 30.33],     // Nandprayag
    [79.2198, 30.2589], // Karnaprayag
  ],

  // Tapovan to Rudraprayag along NH-58 Ext to Joshimath, NH-7 through Karnaprayag & Gauchar to Rudraprayag
  'route-tapovan-rudraprayag': [
    [79.628, 30.492],   // Tapovan
    [79.595, 30.528],   // Dhak
    [79.5645, 30.5564], // Joshimath
    [79.497, 30.518],   // Helang
    [79.4312, 30.4321], // Pipalkoti
    [79.337, 30.403],   // Chamoli
    [79.32, 30.33],     // Nandprayag
    [79.2198, 30.2589], // Karnaprayag
    [79.1542, 30.2854], // Gauchar
    [79.08, 30.284],    // Tilani / Nagrasu
    [78.9812, 30.2842], // Rudraprayag
  ],

  // Helang to Srinagar along NH-7
  'route-helang-srinagar': [
    [79.497, 30.518],   // Helang
    [79.4312, 30.4321], // Pipalkoti
    [79.38, 30.415],    // Birahi
    [79.337, 30.403],   // Chamoli town
    [79.32, 30.33],     // Nandprayag
    [79.2198, 30.2589], // Karnaprayag
    [79.1542, 30.2854], // Gauchar
    [78.9812, 30.2842], // Rudraprayag
    [78.89, 30.25],     // Dhari Devi
    [78.7845, 30.2215], // Srinagar
  ],

  // Pandukeshwar to Srinagar along NH-7
  'route-pandukeshwar-srinagar': [
    [79.545, 30.64],    // Pandukeshwar
    [79.552, 30.598],   // Govindghat
    [79.5645, 30.5564], // Joshimath
    [79.497, 30.518],   // Helang
    [79.4312, 30.4321], // Pipalkoti
    [79.337, 30.403],   // Chamoli town
    [79.32, 30.33],     // Nandprayag
    [79.2198, 30.2589], // Karnaprayag
    [79.1542, 30.2854], // Gauchar
    [78.9812, 30.2842], // Rudraprayag
    [78.7845, 30.2215], // Srinagar
  ],

  // Short-Term: Gopeshwar to Gauchar
  'route-gopeshwar-gauchar': [
    [79.332, 30.418],   // Gopeshwar
    [79.337, 30.403],   // Chamoli
    [79.32, 30.33],     // Nandprayag
    [79.2198, 30.2589], // Karnaprayag
    [79.1542, 30.2854], // Gauchar
  ],

  // Short-Term: Nandprayag to Karnaprayag
  'route-nandprayag-karnaprayag': [
    [79.32, 30.33],     // Nandprayag
    [79.28, 30.3],      // Langasu
    [79.2198, 30.2589], // Karnaprayag
  ],

  // Medium-Term: Tharali to Gwaldam
  'route-tharali-gwaldam': [
    [79.5021, 30.0614], // Tharali
    [79.54, 30.03],     // Chepna
    [79.5612, 30.0156], // Gwaldam
  ],

  // Medium-Term: Ghat to Karnaprayag
  'route-ghat-karnaprayag': [
    [79.4328, 30.2541], // Ghat
    [79.32, 30.33],     // Nandprayag
    [79.2198, 30.2589], // Karnaprayag
  ],

  // Long-Term: Malari to Srinagar
  'route-malari-srinagar': [
    [79.8891, 30.6872], // Malari
    [79.78, 30.54],     // Suraithota
    [79.712, 30.485],   // Raini
    [79.5645, 30.5564], // Joshimath
    [79.497, 30.518],   // Helang
    [79.337, 30.403],   // Chamoli
    [79.2198, 30.2589], // Karnaprayag
    [78.7845, 30.2215], // Srinagar
  ],

  // Long-Term: Mana to Srinagar
  'route-mana-srinagar': [
    [79.4939, 30.7719], // Mana
    [79.4912, 30.7447], // Badrinath
    [79.545, 30.64],    // Pandukeshwar
    [79.5645, 30.5564], // Joshimath
    [79.337, 30.403],   // Chamoli
    [79.2198, 30.2589], // Karnaprayag
    [78.7845, 30.2215], // Srinagar
  ]
};

/**
 * GET /api/v1/operations/relocation-map
 * Returns the clean, unified operational relocation planning dataset for PS 26191 demo.
 */
export async function getRelocationMapOperations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const phaseFilter = (req.query.phase as string || 'ALL').toUpperCase();

    // 1. Fetch Real Hazard Polygons from Database
    let dbRedZones: any[] = [];
    try {
      const rzRes = await pool.query(`
        SELECT 
          id, 
          name, 
          exclusion_type, 
          reason, 
          ST_AsGeoJSON(geometry)::json as geojson_geom
        FROM red_zones;
      `);
      dbRedZones = rzRes.rows;
    } catch (err) {
      console.warn('[OperationsController] Failed to query red_zones table, using fallback geometries:', err);
    }

    // Transform database red zones into clean operational hazard zones
    const hazardZones: OperationalHazardZone[] = [
      {
        id: 'zone-joshimath-subsidence',
        name: 'Joshimath Subsidence Zone',
        hazardType: 'Land Subsidence / Landslide Risk',
        severity: 'CRITICAL',
        areaSqKm: 4.2,
        affectedHabitationsCount: 2,
        relocationPriority: 'Immediate',
        recommendedAction: 'Immediate Relocation Planning & Egress Staging',
        mandateReference: 'DM Act 2005 Sec 30(2) Planning Criteria',
        geometry: dbRedZones.find(r => r.name.toLowerCase().includes('joshimath'))?.geojson_geom || {
          type: 'Polygon',
          coordinates: [[
            [79.540, 30.540], [79.585, 30.545], [79.590, 30.575], [79.550, 30.580], [79.530, 30.560], [79.540, 30.540]
          ]]
        }
      },
      {
        id: 'zone-alaknanda-corridor',
        name: 'Alaknanda Flood-Prone Corridor',
        hazardType: 'Flash Flood / Riparian Inundation',
        severity: 'HIGH',
        areaSqKm: 12.8,
        affectedHabitationsCount: 3,
        relocationPriority: 'Immediate',
        recommendedAction: 'Riparian Buffer Setback Enforcement',
        mandateReference: 'Central Water Commission (CWC) High Flood Level Buffer',
        geometry: dbRedZones.find(r => r.name.toLowerCase().includes('alaknanda'))?.geojson_geom || {
          type: 'Polygon',
          coordinates: [[
            [79.520, 30.510], [79.535, 30.515], [79.480, 30.440], [79.450, 30.420], [79.430, 30.425], [79.490, 30.490], [79.520, 30.510]
          ]]
        }
      },
      {
        id: 'zone-malari-landslide',
        name: 'Malari Landslide-Prone Zone',
        hazardType: 'Debris Flow & Slope Instability',
        severity: 'CRITICAL',
        areaSqKm: 6.5,
        affectedHabitationsCount: 2,
        relocationPriority: 'Immediate',
        recommendedAction: 'Steep Slope Relocation Execution',
        mandateReference: 'Geological Survey of India Landslide Inventory',
        geometry: dbRedZones.find(r => r.name.toLowerCase().includes('malari'))?.geojson_geom || {
          type: 'Polygon',
          coordinates: [[
            [79.850, 30.660], [79.910, 30.670], [79.920, 30.710], [79.870, 30.715], [79.850, 30.660]
          ]]
        }
      },
      {
        id: 'zone-pipalkoti-escarpment',
        name: 'Pipalkoti Hazard Zone',
        hazardType: 'High-Angle Highway Escarpment Bluff',
        severity: 'WARNING',
        areaSqKm: 3.8,
        affectedHabitationsCount: 1,
        relocationPriority: 'Short-term',
        recommendedAction: 'Slope Stabilization Monitoring',
        mandateReference: 'Highway Slope Hazard Assessment',
        geometry: dbRedZones.find(r => r.name.toLowerCase().includes('pipalkoti'))?.geojson_geom || {
          type: 'Polygon',
          coordinates: [[
            [79.410, 30.415], [79.445, 30.420], [79.450, 30.450], [79.415, 30.445], [79.410, 30.415]
          ]]
        }
      },
      {
        id: 'zone-chamoli-composite',
        name: 'Chamoli Composite Hazard Restricted Area',
        hazardType: 'Composite Multi-Hazard Envelope',
        severity: 'CRITICAL',
        areaSqKm: 32.4,
        affectedHabitationsCount: 5,
        relocationPriority: 'Immediate',
        recommendedAction: 'Inter-Tehsil Egress Coordination',
        mandateReference: 'Multi-Criteria PostGIS Spatial Union Benchmark',
        geometry: dbRedZones.find(r => r.name.toLowerCase().includes('composite'))?.geojson_geom || {
          type: 'Polygon',
          coordinates: [[
            [79.480, 30.480], [79.720, 30.460], [79.740, 30.590], [79.520, 30.610], [79.480, 30.480]
          ]]
        }
      }
    ];

    // 2. Realistic, Geographically Plausible Habitations
    const allHabitations: OperationalHabitation[] = [
      // ── IMMEDIATE PHASE (5 Habitations, 15,450 Population) ──
      {
        id: 'hab-joshimath',
        name: 'Joshimath',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.5564, lng: 79.5645 },
        population: 4500,
        households: 1020,
        hazardStatus: 'CRITICAL',
        primaryHazard: 'Active Land Subsidence',
        relocationPriority: 'Immediate',
        relocationPhase: 'Immediate',
        recommendedDestinationId: 'site-gauchar',
        recommendedDestinationName: 'Gauchar Relocation Site',
        allocatedPopulation: 4500,
        routeId: 'route-joshimath-gauchar',
        routeDistanceKm: 79.2,
        transitTimeMinutes: 136,
        isInsideRedZone: true,
        redZoneName: 'Joshimath Subsidence Zone',
        infrastructure: {
          healthcare: 'Severely Strained',
          water: 'Disrupted (Subsidence Shear)',
          roads: 'Single Lane Passable (NH-07)',
          powerGrid: 'Intermittent'
        }
      },
      {
        id: 'hab-raini',
        name: 'Raini',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.4850, lng: 79.7120 },
        population: 2200,
        households: 490,
        hazardStatus: 'CRITICAL',
        primaryHazard: 'Flash Flood & Debris Flow',
        relocationPriority: 'Immediate',
        relocationPhase: 'Immediate',
        recommendedDestinationId: 'site-karnaprayag',
        recommendedDestinationName: 'Karnaprayag Relocation Site',
        allocatedPopulation: 2200,
        routeId: 'route-raini-karnaprayag',
        routeDistanceKm: 127.7,
        transitTimeMinutes: 219,
        isInsideRedZone: true,
        redZoneName: 'Alaknanda Flood-Prone Corridor',
        infrastructure: {
          healthcare: 'Sub-Center Damaged',
          water: 'Tanker Dependent',
          roads: 'NH-58 Ext Restored Single-Lane',
          powerGrid: 'Outage (Aux Solar Only)'
        }
      },
      {
        id: 'hab-tapovan',
        name: 'Tapovan',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.4920, lng: 79.6280 },
        population: 3150,
        households: 710,
        hazardStatus: 'CRITICAL',
        primaryHazard: 'Glacial Outburst & River Flank Inundation',
        relocationPriority: 'Immediate',
        relocationPhase: 'Immediate',
        recommendedDestinationId: 'site-rudraprayag',
        recommendedDestinationName: 'Rudraprayag Relocation Site',
        allocatedPopulation: 3150,
        routeId: 'route-tapovan-rudraprayag',
        routeDistanceKm: 125.0,
        transitTimeMinutes: 210,
        isInsideRedZone: true,
        redZoneName: 'Alaknanda Flood-Prone Corridor',
        infrastructure: {
          healthcare: 'Temporary Aid Post',
          water: 'Surface Source Compromised',
          roads: 'Paved Secondary Passable',
          powerGrid: 'Operational'
        }
      },
      {
        id: 'hab-helang',
        name: 'Helang',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.5180, lng: 79.4970 },
        population: 2800,
        households: 630,
        hazardStatus: 'CRITICAL',
        primaryHazard: 'Slope Failure & Rockfall',
        relocationPriority: 'Immediate',
        relocationPhase: 'Immediate',
        recommendedDestinationId: 'site-srinagar',
        recommendedDestinationName: 'Srinagar Relocation Site',
        allocatedPopulation: 2800,
        routeId: 'route-helang-srinagar',
        routeDistanceKm: 118.5,
        transitTimeMinutes: 202,
        isInsideRedZone: true,
        redZoneName: 'Joshimath Subsidence Zone',
        infrastructure: {
          healthcare: 'Primary Health Post',
          water: 'Piped Normal',
          roads: 'NH-07 Normal',
          powerGrid: 'Operational'
        }
      },
      {
        id: 'hab-pandukeshwar',
        name: 'Pandukeshwar',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.6400, lng: 79.5450 },
        population: 2800,
        households: 620,
        hazardStatus: 'CRITICAL',
        primaryHazard: 'River Flank Erosion & Flash Flood',
        relocationPriority: 'Immediate',
        relocationPhase: 'Immediate',
        recommendedDestinationId: 'site-srinagar',
        recommendedDestinationName: 'Srinagar Relocation Site',
        allocatedPopulation: 2800,
        routeId: 'route-pandukeshwar-srinagar',
        routeDistanceKm: 148.0,
        transitTimeMinutes: 250,
        isInsideRedZone: true,
        redZoneName: 'Alaknanda Flood-Prone Corridor',
        infrastructure: {
          healthcare: 'Primary Health Center',
          water: 'Spring Piped',
          roads: 'NH-07 Passable',
          powerGrid: 'Operational'
        }
      },

      // ── SHORT TERM PHASE (2 Habitations, 3,000 Population) ──
      {
        id: 'hab-gopeshwar-west',
        name: 'Gopeshwar West Slope',
        district: 'Chamoli',
        subDistrict: 'Chamoli',
        coordinates: { lat: 30.4180, lng: 79.3320 },
        population: 1800,
        households: 410,
        hazardStatus: 'HIGH',
        primaryHazard: 'Moderate Slope Creep',
        relocationPriority: 'Short-term',
        relocationPhase: 'Short Term',
        recommendedDestinationId: 'site-gauchar',
        recommendedDestinationName: 'Gauchar Relocation Site',
        allocatedPopulation: 1800,
        routeId: 'route-gopeshwar-gauchar',
        routeDistanceKm: 42.5,
        transitTimeMinutes: 72,
        isInsideRedZone: false,
        infrastructure: {
          healthcare: 'District Hospital Gopeshwar',
          water: 'Municipal Supply',
          roads: 'NH-107A All-weather',
          powerGrid: 'Fully Operational'
        }
      },
      {
        id: 'hab-nandprayag-flank',
        name: 'Nandprayag River Flank',
        district: 'Chamoli',
        subDistrict: 'Chamoli',
        coordinates: { lat: 30.3300, lng: 79.3200 },
        population: 1200,
        households: 270,
        hazardStatus: 'HIGH',
        primaryHazard: 'Seasonal River Spate Flood',
        relocationPriority: 'Short-term',
        relocationPhase: 'Short Term',
        recommendedDestinationId: 'site-karnaprayag',
        recommendedDestinationName: 'Karnaprayag Relocation Site',
        allocatedPopulation: 1200,
        routeId: 'route-nandprayag-karnaprayag',
        routeDistanceKm: 21.0,
        transitTimeMinutes: 35,
        isInsideRedZone: false,
        infrastructure: {
          healthcare: 'Community Health Center',
          water: 'Piped Water Supply',
          roads: 'NH-07 2-lane All-weather',
          powerGrid: 'Fully Operational'
        }
      },

      // ── MEDIUM TERM PHASE (2 Habitations, 4,000 Population) ──
      {
        id: 'hab-tharali-buffer',
        name: 'Tharali Buffer Zone',
        district: 'Chamoli',
        subDistrict: 'Tharali',
        coordinates: { lat: 30.0614, lng: 79.5021 },
        population: 2400,
        households: 550,
        hazardStatus: 'WARNING',
        primaryHazard: 'Pindar River Overflow',
        relocationPriority: 'Medium-term',
        relocationPhase: 'Medium Term',
        recommendedDestinationId: 'site-karnaprayag',
        recommendedDestinationName: 'Karnaprayag Relocation Site',
        allocatedPopulation: 2400,
        routeId: 'route-tharali-gwaldam',
        routeDistanceKm: 34.0,
        transitTimeMinutes: 58,
        isInsideRedZone: false,
        infrastructure: {
          healthcare: 'Sub-District Hospital',
          water: 'Piped Normal',
          roads: 'NH-109 All-weather',
          powerGrid: 'Operational'
        }
      },
      {
        id: 'hab-ghat-lowland',
        name: 'Ghat Lowland Hamlet',
        district: 'Chamoli',
        subDistrict: 'Ghat',
        coordinates: { lat: 30.2541, lng: 79.4328 },
        population: 1600,
        households: 360,
        hazardStatus: 'WARNING',
        primaryHazard: 'Nandakini Inundation',
        relocationPriority: 'Medium-term',
        relocationPhase: 'Medium Term',
        recommendedDestinationId: 'site-karnaprayag',
        recommendedDestinationName: 'Karnaprayag Relocation Site',
        allocatedPopulation: 1600,
        routeId: 'route-ghat-karnaprayag',
        routeDistanceKm: 38.5,
        transitTimeMinutes: 65,
        isInsideRedZone: false,
        infrastructure: {
          healthcare: 'Primary Health Post',
          water: 'Piped Normal',
          roads: 'MDR-14 Secondary Paved',
          powerGrid: 'Operational'
        }
      },

      // ── LONG TERM PHASE (2 Habitations, 2,450 Population) ──
      {
        id: 'hab-malari-valley',
        name: 'Malari Valley Extended',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.6872, lng: 79.8891 },
        population: 1500,
        households: 340,
        hazardStatus: 'MONITORED',
        primaryHazard: 'Severe Winter Avalanches & Permafrost Melt',
        relocationPriority: 'Long-term',
        relocationPhase: 'Long Term',
        recommendedDestinationId: 'site-srinagar',
        recommendedDestinationName: 'Srinagar Relocation Site',
        allocatedPopulation: 1500,
        routeId: 'route-malari-srinagar',
        routeDistanceKm: 185.0,
        transitTimeMinutes: 320,
        isInsideRedZone: false,
        infrastructure: {
          healthcare: 'Army/ITBP Aid Station',
          water: 'Seasonal Glacial Melt',
          roads: 'Border Roads Org (BRO) Managed',
          powerGrid: 'Solar/Generator Hybrid'
        }
      },
      {
        id: 'hab-mana-sector',
        name: 'Mana Strategic Sector',
        district: 'Chamoli',
        subDistrict: 'Joshimath',
        coordinates: { lat: 30.7719, lng: 79.4939 },
        population: 950,
        households: 210,
        hazardStatus: 'MONITORED',
        primaryHazard: 'Glacial Outburst Surge Catchment',
        relocationPriority: 'Long-term',
        relocationPhase: 'Long Term',
        recommendedDestinationId: 'site-srinagar',
        recommendedDestinationName: 'Srinagar Relocation Site',
        allocatedPopulation: 950,
        routeId: 'route-mana-srinagar',
        routeDistanceKm: 172.0,
        transitTimeMinutes: 295,
        isInsideRedZone: false,
        infrastructure: {
          healthcare: 'Primary Medical Unit',
          water: 'Saraswati River Intake',
          roads: 'NH-07 Terminus All-weather',
          powerGrid: 'Operational'
        }
      }
    ];

    // 3. Realistic Relocation Sites with Explicit Carrying Capacity
    const relocationSites: OperationalRelocationSite[] = [
      {
        id: 'site-gauchar',
        name: 'Gauchar Relocation Site',
        district: 'Chamoli',
        coordinates: { lat: 30.2854, lng: 79.1542 },
        type: 'Aerodrome Relief Grounds',
        nominalCapacity: 5500,
        effectiveCapacity: 5000,
        allocatedPopulation: 4500, // Allocated from Joshimath
        remainingCapacity: 500,    // Exactly 5,000 - 4,500 = 500
        suitability: 'SUITABLE',
        safetyScore: 0.98,
        bottleneck: 'Sanitation (5,000 max capacity)',
        hazardStatus: 'Outside Hazard-Based Restricted Area',
        sourceHabitations: ['Joshimath'],
        roadAccess: 'All-weather 2-Lane NH-07 Highway',
        isInsideRedZone: false,
        facilities: {
          hasFieldHospital: true,
          hasWaterPurification: true,
          hasHelipad: true,
          hasElectricitySubstation: true
        }
      },
      {
        id: 'site-karnaprayag',
        name: 'Karnaprayag Relocation Site',
        district: 'Chamoli',
        coordinates: { lat: 30.2589, lng: 79.2198 },
        type: 'Civil Relief Facility',
        nominalCapacity: 3500,
        effectiveCapacity: 3000,
        allocatedPopulation: 2200, // Allocated from Raini
        remainingCapacity: 800,    // Exactly 3,000 - 2,200 = 800
        suitability: 'SUITABLE',
        safetyScore: 0.95,
        bottleneck: 'Water Supply (3,000 max capacity)',
        hazardStatus: 'Outside Hazard-Based Restricted Area',
        sourceHabitations: ['Raini'],
        roadAccess: 'All-weather NH-07 Highway',
        isInsideRedZone: false,
        facilities: {
          hasFieldHospital: true,
          hasWaterPurification: true,
          hasHelipad: false,
          hasElectricitySubstation: true
        }
      },
      {
        id: 'site-rudraprayag',
        name: 'Rudraprayag Relocation Site',
        district: 'Rudraprayag',
        coordinates: { lat: 30.2842, lng: 78.9812 },
        type: 'Inter-District Relief Complex',
        nominalCapacity: 4500,
        effectiveCapacity: 4000,
        allocatedPopulation: 3150, // Allocated from Tapovan
        remainingCapacity: 850,    // Exactly 4,000 - 3,150 = 850
        suitability: 'SUITABLE',
        safetyScore: 0.97,
        bottleneck: 'Shelter Units (4,000 max capacity)',
        hazardStatus: 'Outside Hazard-Based Restricted Area',
        sourceHabitations: ['Tapovan'],
        roadAccess: 'All-weather 2-Lane NH-07 Highway',
        isInsideRedZone: false,
        facilities: {
          hasFieldHospital: true,
          hasWaterPurification: true,
          hasHelipad: true,
          hasElectricitySubstation: true
        }
      },
      {
        id: 'site-srinagar',
        name: 'Srinagar Relocation Site',
        district: 'Pauri Garhwal',
        coordinates: { lat: 30.2215, lng: 78.7845 },
        type: 'Regional Logistics Haven',
        nominalCapacity: 7000,
        effectiveCapacity: 6000,
        allocatedPopulation: 5600, // 2,800 from Helang + 2,800 from Pandukeshwar = 5,600
        remainingCapacity: 400,    // Exactly 6,000 - 5,600 = 400
        suitability: 'SUITABLE',
        safetyScore: 0.99,
        bottleneck: 'Sanitation (6,000 max capacity)',
        hazardStatus: 'Outside Hazard-Based Restricted Area',
        sourceHabitations: ['Helang', 'Pandukeshwar'],
        roadAccess: 'All-weather 4-Lane NH-07 Arterial',
        isInsideRedZone: false,
        facilities: {
          hasFieldHospital: true,
          hasWaterPurification: true,
          hasHelipad: true,
          hasElectricitySubstation: true
        }
      },
      {
        id: 'site-pipalkoti-restricted',
        name: 'Pipalkoti Transit Site',
        district: 'Chamoli',
        coordinates: { lat: 30.4321, lng: 79.4312 },
        type: 'Transit Camp',
        nominalCapacity: 3500,
        effectiveCapacity: 0,
        allocatedPopulation: 0,
        remainingCapacity: 0,
        suitability: 'RESTRICTED',
        safetyScore: 0.15,
        bottleneck: 'Inside Red Zone Envelope',
        hazardStatus: 'RESTRICTED: Intersects Active Hazard Zone',
        sourceHabitations: [],
        roadAccess: 'Single-Lane NH-07',
        isInsideRedZone: true,
        facilities: {
          hasFieldHospital: false,
          hasWaterPurification: false,
          hasHelipad: false,
          hasElectricitySubstation: true
        }
      }
    ];

    // 4. Mapped Road Transportation Routes (Following real OSM road coordinates)
    const allRoutes: OperationalRoute[] = [
      {
        id: 'route-joshimath-gauchar',
        name: 'Joshimath to Gauchar Relocation Route',
        fromHabitationId: 'hab-joshimath',
        fromHabitationName: 'Joshimath',
        toSiteId: 'site-gauchar',
        toSiteName: 'Gauchar Relocation Site',
        distanceKm: 79.2,
        transitTimeMinutes: 136,
        roadName: 'NH-07 Badrinath National Highway',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Immediate',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-joshimath-gauchar']
        }
      },
      {
        id: 'route-raini-karnaprayag',
        name: 'Raini to Karnaprayag Relocation Route',
        fromHabitationId: 'hab-raini',
        fromHabitationName: 'Raini',
        toSiteId: 'site-karnaprayag',
        toSiteName: 'Karnaprayag Relocation Site',
        distanceKm: 127.7,
        transitTimeMinutes: 219,
        roadName: 'NH-58 Ext to Joshimath & NH-07 Lifeline',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Immediate',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-raini-karnaprayag']
        }
      },
      {
        id: 'route-tapovan-rudraprayag',
        name: 'Tapovan to Rudraprayag Relocation Route',
        fromHabitationId: 'hab-tapovan',
        fromHabitationName: 'Tapovan',
        toSiteId: 'site-rudraprayag',
        toSiteName: 'Rudraprayag Relocation Site',
        distanceKm: 125.0,
        transitTimeMinutes: 210,
        roadName: 'NH-58 Ext & NH-07 Regional Arterial',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Immediate',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-tapovan-rudraprayag']
        }
      },
      {
        id: 'route-helang-srinagar',
        name: 'Helang to Srinagar Relocation Route',
        fromHabitationId: 'hab-helang',
        fromHabitationName: 'Helang',
        toSiteId: 'site-srinagar',
        toSiteName: 'Srinagar Relocation Site',
        distanceKm: 118.5,
        transitTimeMinutes: 202,
        roadName: 'NH-07 Garhwal Lifeline Arterial',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Immediate',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-helang-srinagar']
        }
      },
      {
        id: 'route-pandukeshwar-srinagar',
        name: 'Pandukeshwar to Srinagar Relocation Route',
        fromHabitationId: 'hab-pandukeshwar',
        fromHabitationName: 'Pandukeshwar',
        toSiteId: 'site-srinagar',
        toSiteName: 'Srinagar Relocation Site',
        distanceKm: 148.0,
        transitTimeMinutes: 250,
        roadName: 'NH-07 Upper Alaknanda Corridor to Pauri',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Immediate',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-pandukeshwar-srinagar']
        }
      },
      {
        id: 'route-gopeshwar-gauchar',
        name: 'Gopeshwar to Gauchar Relocation Route',
        fromHabitationId: 'hab-gopeshwar-west',
        fromHabitationName: 'Gopeshwar West Slope',
        toSiteId: 'site-gauchar',
        toSiteName: 'Gauchar Relocation Site',
        distanceKm: 42.5,
        transitTimeMinutes: 72,
        roadName: 'NH-107A & NH-07',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Short Term',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-gopeshwar-gauchar']
        }
      },
      {
        id: 'route-nandprayag-karnaprayag',
        name: 'Nandprayag to Karnaprayag Relocation Route',
        fromHabitationId: 'hab-nandprayag-flank',
        fromHabitationName: 'Nandprayag River Flank',
        toSiteId: 'site-karnaprayag',
        toSiteName: 'Karnaprayag Relocation Site',
        distanceKm: 21.0,
        transitTimeMinutes: 35,
        roadName: 'NH-07',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Short Term',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-nandprayag-karnaprayag']
        }
      },
      {
        id: 'route-tharali-gwaldam',
        name: 'Tharali to Gwaldam Relocation Route',
        fromHabitationId: 'hab-tharali-buffer',
        fromHabitationName: 'Tharali Buffer Zone',
        toSiteId: 'site-karnaprayag',
        toSiteName: 'Karnaprayag Relocation Site',
        distanceKm: 34.0,
        transitTimeMinutes: 58,
        roadName: 'NH-109 Pindar Valley Corridor',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Medium Term',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-tharali-gwaldam']
        }
      },
      {
        id: 'route-ghat-karnaprayag',
        name: 'Ghat to Karnaprayag Relocation Route',
        fromHabitationId: 'hab-ghat-lowland',
        fromHabitationName: 'Ghat Lowland Hamlet',
        toSiteId: 'site-karnaprayag',
        toSiteName: 'Karnaprayag Relocation Site',
        distanceKm: 38.5,
        transitTimeMinutes: 65,
        roadName: 'MDR-14 & NH-07',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Medium Term',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-ghat-karnaprayag']
        }
      },
      {
        id: 'route-malari-srinagar',
        name: 'Malari to Srinagar Relocation Route',
        fromHabitationId: 'hab-malari-valley',
        fromHabitationName: 'Malari Valley Extended',
        toSiteId: 'site-srinagar',
        toSiteName: 'Srinagar Relocation Site',
        distanceKm: 185.0,
        transitTimeMinutes: 320,
        roadName: 'NH-58 Ext & NH-07',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Long Term',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-malari-srinagar']
        }
      },
      {
        id: 'route-mana-srinagar',
        name: 'Mana to Srinagar Relocation Route',
        fromHabitationId: 'hab-mana-sector',
        fromHabitationName: 'Mana Strategic Sector',
        toSiteId: 'site-srinagar',
        toSiteName: 'Srinagar Relocation Site',
        distanceKm: 172.0,
        transitTimeMinutes: 295,
        roadName: 'NH-07 Trans-Himalayan Arterial',
        roadNetwork: 'Mapped Road Network',
        status: 'Route Available',
        phase: 'Long Term',
        geometry: {
          type: 'LineString',
          coordinates: OSM_ROAD_COORDINATES['route-mana-srinagar']
        }
      }
    ];

    // Filter habitations & routes by phase if specified
    const filteredHabitations = phaseFilter === 'ALL'
      ? allHabitations
      : allHabitations.filter(h => h.relocationPhase.toUpperCase().replace(/\s+/g, '_') === phaseFilter);

    const filteredRoutes = phaseFilter === 'ALL'
      ? allRoutes
      : allRoutes.filter(r => r.phase.toUpperCase().replace(/\s+/g, '_') === phaseFilter);

    // Calculate total populations and capacities
    const totalRequiredPopulation = filteredHabitations.reduce((acc, h) => acc + h.population, 0);
    const totalAllocatedPopulation = filteredHabitations.reduce((acc, h) => acc + h.allocatedPopulation, 0);
    const totalEffectiveCapacity = relocationSites.reduce((acc, s) => acc + s.effectiveCapacity, 0);
    const capacityDeficit = Math.max(0, totalRequiredPopulation - totalEffectiveCapacity);

    // Relocation Plan Summary
    const relocationPlans: OperationalRelocationPlan[] = [
      {
        planId: 'PLAN-CHAMOLI-2026-IMM',
        name: 'Chamoli Sector Immediate Relocation Plan',
        scenario: 'Baseline Operations Order 2026-CHM',
        phase: phaseFilter,
        totalRequiredPopulation,
        totalEffectiveCapacity,
        totalAllocatedPopulation,
        capacityDeficit,
        habitationsCount: filteredHabitations.length,
        destinationsCount: relocationSites.filter(s => s.effectiveCapacity > 0).length,
        activeRoutesCount: filteredRoutes.length,
        status: capacityDeficit > 0 ? 'DEFICIT_DETECTED' : 'OPTIMAL',
        statutoryReference: 'Section 30(2)(v) Disaster Management Act 2005'
      }
    ];

    // Phases metadata
    const phases = [
      { key: 'ALL', label: 'All Phases', habitationsCount: allHabitations.length, totalPopulation: allHabitations.reduce((acc, h) => acc + h.population, 0) },
      { key: 'IMMEDIATE', label: 'Immediate', habitationsCount: 5, totalPopulation: 15450, description: 'Urgent relocation requirement under active ground displacement & flood hazard.' },
      { key: 'SHORT_TERM', label: 'Short Term', habitationsCount: 2, totalPopulation: 3000, description: 'Near-term planned relocation with pre-staged municipal infrastructure.' },
      { key: 'MEDIUM_TERM', label: 'Medium Term', habitationsCount: 2, totalPopulation: 4000, description: 'Planned relocation requiring additional inter-tehsil shelter staging.' },
      { key: 'LONG_TERM', label: 'Long Term', habitationsCount: 2, totalPopulation: 2450, description: 'Strategic / permanent high-altitude community relocation.' }
    ];

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      activePhase: phaseFilter,
      summary: {
        totalRequiredPopulation,
        totalEffectiveCapacity,
        totalAllocatedPopulation,
        capacityDeficit,
        satisfactionRate: totalRequiredPopulation > 0 ? (totalAllocatedPopulation / totalRequiredPopulation) * 100 : 100,
        status: capacityDeficit > 0 ? 'CAPACITY_DEFICIT' : 'OPTIMAL_ALLOCATION'
      },
      hazardZones,
      habitations: filteredHabitations,
      relocationSites,
      routes: filteredRoutes,
      phases,
      relocationPlans
    });
  } catch (err) {
    next(err);
  }
}
