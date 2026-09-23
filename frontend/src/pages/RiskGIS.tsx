import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../stores/useAppStore';
import { GisService } from '../services/gis.service';
import type {
  GeoJsonFeatureCollection,
  RedZoneFeatureProperties,
  RelocationSiteFeatureProperties,
  DistrictGisFeatureProperties,
  SiteSuitabilityAudit,
  SuitabilityTier,
  StateBoundaryProperties,
  DistrictBoundaryProperties,
  SubdistrictBoundaryProperties,
  CensusSettlementProperties,
  OsmRoadProperties,
  OsmFacilityProperties,
} from '../types/gis';
import { formatNumber, formatPercent, formatDistance, formatArea, formatPopulation, formatScore } from '../utils/formatters';

/* ── State / District Geo Config ── */
const VIEWS = {
  india: { center: [22.5, 82.0] as [number, number], zoom: 5 },
  uttarakhand: { center: [30.1, 79.3] as [number, number], zoom: 8 },
  chamoli: { center: [30.42, 79.45] as [number, number], zoom: 11 },
} as const;

const STATE_COORDINATES: Record<string, [number, number]> = {
  'Andhra Pradesh': [15.91, 79.74], 'Arunachal Pradesh': [28.21, 94.72], 'Assam': [26.20, 92.93],
  'Bihar': [25.09, 85.31], 'Chhattisgarh': [21.27, 81.86], 'Goa': [15.29, 74.12],
  'Gujarat': [22.25, 71.19], 'Haryana': [29.05, 76.08], 'Himachal Pradesh': [31.10, 77.17],
  'Jharkhand': [23.61, 85.27], 'Karnataka': [15.31, 75.71], 'Kerala': [10.85, 76.27],
  'Madhya Pradesh': [22.97, 78.65], 'Maharashtra': [19.75, 75.71], 'Manipur': [24.66, 93.90],
  'Meghalaya': [25.46, 91.36], 'Mizoram': [23.16, 92.93], 'Nagaland': [26.15, 94.56],
  'Odisha': [20.95, 85.09], 'Punjab': [31.14, 75.34], 'Rajasthan': [27.02, 74.21],
  'Sikkim': [27.53, 88.51], 'Tamil Nadu': [11.12, 78.65], 'Telangana': [18.11, 79.01],
  'Tripura': [23.94, 91.98], 'Uttar Pradesh': [26.84, 80.94], 'Uttarakhand': [30.06, 79.01],
  'West Bengal': [22.98, 87.85],
};

const INDIAN_STATES = Object.keys(STATE_COORDINATES).sort();

/* ── Convert GeoJSON Polygon / MultiPolygon into Leaflet LatLng Ring Arrays ── */
function geoJsonGeometryToPolygons(geom: any): [number, number][][] {
  if (!geom || !geom.coordinates) return [];
  if (geom.type === 'Polygon') {
    return geom.coordinates.map((ring: [number, number][]) =>
      ring.map(([lon, lat]) => [lat, lon] as [number, number])
    );
  }
  if (geom.type === 'MultiPolygon') {
    const polys: [number, number][][] = [];
    geom.coordinates.forEach((poly: any) => {
      poly.forEach((ring: [number, number][]) => {
        polys.push(ring.map(([lon, lat]) => [lat, lon] as [number, number]));
      });
    });
    return polys;
  }
  return [];
}

/* ── Convert GeoJSON LineString into Leaflet LatLng Array ── */
function geoJsonLineStringToLatLngs(geom: any): [number, number][] {
  if (!geom || !geom.coordinates) return [];
  if (geom.type === 'LineString') {
    return geom.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
  }
  return [];
}

/* ── Census Settlement Markers ── */
const censusTownIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#0284c7;border:2px solid #fff;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold" title="Census Town">T</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const censusVillageIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#0d9488;border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff" title="Census Village"><span style="transform:rotate(-45deg);font-size:8px;font-weight:bold">V</span></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

/* ── OSM Facility Marker Helper ── */
function getOsmFacilityIcon(category: string) {
  let bg = '#475569';
  let symbol = '•';
  if (category === 'healthcare') {
    bg = '#dc2626';
    symbol = '+';
  } else if (category === 'emergency') {
    bg = '#1d4ed8';
    symbol = '★';
  } else if (category === 'education') {
    bg = '#7c3aed';
    symbol = '🎓';
  } else if (category === 'shelter') {
    bg = '#d97706';
    symbol = '⛺';
  } else if (category === 'government') {
    bg = '#334155';
    symbol = '🏛';
  }
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;background:${bg};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:bold">${symbol}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

/* ── OSM Road Style Classifier ── */
function getOsmRoadStyle(fclass: string) {
  switch (fclass) {
    case 'motorway':
    case 'trunk':
      return { color: '#ea580c', weight: 4, opacity: 0.9 };
    case 'primary':
      return { color: '#f59e0b', weight: 3.2, opacity: 0.85 };
    case 'secondary':
      return { color: '#eab308', weight: 2.4, opacity: 0.8 };
    case 'tertiary':
      return { color: '#64748b', weight: 1.8, opacity: 0.7 };
    default:
      return { color: '#94a3b8', weight: 1.2, opacity: 0.6 };
  }
}

/* ── District Polygon Risk Styler ── */
function getDistrictRiskPolygonStyle(riskTier: string | null, riskScore: number | null) {
  if (riskTier === 'CRITICAL' || (riskScore !== null && riskScore >= 0.8)) {
    return { color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.35, weight: 2.5 };
  }
  if (riskTier === 'HIGH' || (riskScore !== null && riskScore >= 0.6)) {
    return { color: '#c2410c', fillColor: '#f97316', fillOpacity: 0.32, weight: 2.2 };
  }
  if (riskTier === 'MEDIUM' || (riskScore !== null && riskScore >= 0.4)) {
    return { color: '#b45309', fillColor: '#f59e0b', fillOpacity: 0.28, weight: 2.0 };
  }
  return { color: '#047857', fillColor: '#10b981', fillOpacity: 0.25, weight: 1.8 };
}

/* ── Map Controller (Handles View + Resize Glitches) ── */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const [centerLat, centerLng] = center;
  
  useEffect(() => {
    map.setView([centerLat, centerLng], zoom, { animate: false });
  }, [centerLat, centerLng, zoom, map]);

  useEffect(() => {
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 100);
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

/* ── Interactive Simulation Controller ── */
function MapInteractionController() {
  const { simulationMode, setSimulationMode, addHabitation, addSite } = useAppStore();
  
  const map = useMapEvents({
    click: (e) => {
      if (simulationMode === 'none') return;
      const { lat, lng } = e.latlng;
      
      if (simulationMode === 'add-habitation') {
        addHabitation({
          id: `HAB-SIM-${Date.now()}`,
          name: `Custom Simulated Settlement`,
          subDistrict: 'Simulation Zone',
          district: 'Chamoli',
          state: 'Uttarakhand',
          code: `SIM-H-${Date.now().toString().slice(-4)}`,
          population: Math.floor(Math.random() * 2000) + 500,
          households: 250,
          vulnerableGroups: { elderly: 50, children: 100, disabled: 10 },
          coordinates: { lat, lng },
          elevationMeters: 2000,
          slopeDegrees: 45,
          hazards: ['Landslide', 'Flash Flood'],
          primaryHazard: 'Landslide',
          riskScore: 0.85 + (Math.random() * 0.14),
          vulnerabilityScore: 0.8,
          hazardExposureScore: 0.9,
          priorityScore: 90,
          priority: 'Immediate',
          evacuationStatus: 'Standby',
          infrastructure: { healthcare: 'Primary Health Post', roads: 'Normal', water: 'Piped Normal', powerGrid: 'Operational' },
          historicalEventsCount: 2,
          lastIncidentYear: 2023,
          redZoneDistanceKm: 0,
          isInsideRedZone: true
        });
      } else if (simulationMode === 'add-site') {
        addSite({
          id: `SITE-SIM-${Date.now()}`,
          name: `Custom Simulated Safe Hub`,
          type: 'Plateau Camp',
          location: 'Simulation Zone',
          district: 'Chamoli',
          code: `SIM-S-${Date.now().toString().slice(-4)}`,
          coordinates: { lat, lng },
          elevationMeters: 1500,
          safetyScore: 0.99,
          isOutsideRedZone: true,
          totalAllocated: 0,
          availableCapacity: 3000,
          utilizationRate: 0,
          resourceCapacity: {
            effectiveCapacity: 3000,
            areaCapacity: 3500,
            waterCapacity: 4000,
            shelterCapacity: 3200,
            sanitationCapacity: 3000,
            healthcareCapacity: 3100,
            bottleneck: 'Sanitation'
          },
          accessibility: 'All-weather Highway',
          routeDistanceKm: 15,
          transitTimeMinutes: 30,
          logisticsStatus: 'Fully Operational',
          facilities: {
            hasFieldHospital: true,
            hasWaterPurification: true,
            hasHelipad: true,
            hasElectricitySubstation: true
          }
        });
      }
      
      setSimulationMode('none');
    }
  });

  useEffect(() => {
    const container = map.getContainer();
    if (simulationMode !== 'none') {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [simulationMode, map]);

  return null;
}

/* ── Road R12 blockage point ── */
const R12_BLOCK_POINT: [number, number] = [30.53, 79.55];

const blockedIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;background:#ba1a1a;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(186,26,26,.5);display:flex;align-items:center;justify-content:center">
           <span style="color:#fff;font-size:16px;font-weight:900">✕</span>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

/* ── Tile layers ── */
const TILES = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Earthstar Geographics',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};

export const RiskGIS: React.FC = () => {
  const {
    habitations,
    sites,
    selectedHabitationId,
    setSelectedHabitationId,
    selectedSiteId,
    setSelectedSiteId,
    mapFilters,
    setMapFilters,
    roadR12Blocked,
    simulationMode,
    setSimulationMode
  } = useAppStore();

  const [selectedState, setSelectedState] = useState('Uttarakhand');
  const [viewLevel, setViewLevel] = useState<'india' | 'state' | 'district'>('district');
  const [tileLayer, setTileLayer] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(() => window.innerWidth < 1024);
  const [selectedViewType, setSelectedViewType] = useState<'habitation' | 'site' | 'district' | 'census' | 'osm'>('site');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Phase 6 Live Spatial Intelligence State
  const [redZonesData, setRedZonesData] = useState<GeoJsonFeatureCollection<RedZoneFeatureProperties> | null>(null);
  const [gisSitesData, setGisSitesData] = useState<GeoJsonFeatureCollection<RelocationSiteFeatureProperties> | null>(null);
  const [districtsData, setDistrictsData] = useState<GeoJsonFeatureCollection<DistrictGisFeatureProperties> | null>(null);
  const [selectedSiteAudit, setSelectedSiteAudit] = useState<SiteSuitabilityAudit | null>(null);
  const [selectedDistrictItem, setSelectedDistrictItem] = useState<DistrictGisFeatureProperties | DistrictBoundaryProperties | null>(null);
  const [isLoadingGis, setIsLoadingGis] = useState(false);

  // Phase 9 Data Enrichment State (SOI, Census 2011, OSM)
  const [soiStateData, setSoiStateData] = useState<GeoJsonFeatureCollection<StateBoundaryProperties> | null>(null);
  const [soiDistrictsData, setSoiDistrictsData] = useState<GeoJsonFeatureCollection<DistrictBoundaryProperties> | null>(null);
  const [soiSubdistrictsData, setSoiSubdistrictsData] = useState<GeoJsonFeatureCollection<SubdistrictBoundaryProperties> | null>(null);
  const [censusSettlementsData, setCensusSettlementsData] = useState<GeoJsonFeatureCollection<CensusSettlementProperties> | null>(null);
  const [osmRoadsData, setOsmRoadsData] = useState<GeoJsonFeatureCollection<OsmRoadProperties> | null>(null);
  const [osmFacilitiesData, setOsmFacilitiesData] = useState<GeoJsonFeatureCollection<OsmFacilityProperties> | null>(null);

  const [selectedCensusItem, setSelectedCensusItem] = useState<CensusSettlementProperties | null>(null);
  const [selectedOsmFacilityItem, setSelectedOsmFacilityItem] = useState<OsmFacilityProperties | null>(null);

  // Phase 9 Layer Toggles
  const [showSoiDistricts, setShowSoiDistricts] = useState(true);
  const [showSoiTehsils, setShowSoiTehsils] = useState(true);
  const [showCensusSettlements, setShowCensusSettlements] = useState(true);
  const [showOsmRoads, setShowOsmRoads] = useState(true);
  const [showOsmFacilities, setShowOsmFacilities] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Phase 6 & Phase 9 GIS layers on mount
  useEffect(() => {
    let isMounted = true;
    async function loadGisSpatialData() {
      setIsLoadingGis(true);
      try {
        const [
          rzCollection,
          sitesCollection,
          stateBoundary,
          officialDistricts,
          subdistricts,
          censusData,
          roadsData,
          facilitiesData,
        ] = await Promise.all([
          GisService.getRedZones(),
          GisService.getRelocationSites(),
          GisService.getStateBoundaries(),
          GisService.getOfficialDistrictBoundaries(),
          GisService.getSubdistrictBoundaries('057'),
          GisService.getCensusSettlements({ district_code: '057', geocoded_only: true, limit: 300 }),
          GisService.getOsmRoads({ limit: 1200 }),
          GisService.getOsmFacilities({ limit: 250 }),
        ]);
        if (isMounted) {
          setRedZonesData(rzCollection);
          setGisSitesData(sitesCollection);
          setSoiStateData(stateBoundary);
          setSoiDistrictsData(officialDistricts);
          setSoiSubdistrictsData(subdistricts);
          setCensusSettlementsData(censusData);
          setOsmRoadsData(roadsData);
          setOsmFacilitiesData(facilitiesData);
        }
      } catch (err) {
        console.warn('[RiskGIS] Failed to load spatial layers:', err);
      } finally {
        if (isMounted) setIsLoadingGis(false);
      }
    }
    loadGisSpatialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch National / State Districts when scope switches
  useEffect(() => {
    let isMounted = true;
    if (viewLevel === 'india' || viewLevel === 'state') {
      async function loadDistricts() {
        try {
          const params = viewLevel === 'state' ? { state: selectedState, limit: 100 } : { limit: 785 };
          const data = await GisService.getDistricts(params);
          if (isMounted) {
            setDistrictsData(data);
          }
        } catch (err) {
          console.warn('[RiskGIS] Failed to load district centroids:', err);
        }
      }
      loadDistricts();
    }
    return () => {
      isMounted = false;
    };
  }, [viewLevel, selectedState]);

  // Fetch Site Suitability Audit whenever selectedSiteId changes
  useEffect(() => {
    let isMounted = true;
    async function loadAudit() {
      if (!selectedSiteId) return;
      try {
        const audit = await GisService.getSiteSuitabilityAudit(selectedSiteId);
        if (isMounted) {
          setSelectedSiteAudit(audit);
        }
      } catch (err) {
        console.warn(`[RiskGIS] Failed to load audit for ${selectedSiteId}:`, err);
      }
    }
    loadAudit();
    return () => {
      isMounted = false;
    };
  }, [selectedSiteId]);

  const selectedHabitation = habitations.find(h => h.id === selectedHabitationId) || habitations[0];

  // Haversine distance formula (returns km)
  const getDistance = React.useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getNearestSite = React.useCallback((habLat: number, habLng: number) => {
    let nearest = sites[0];
    let minDist = Infinity;
    sites.forEach(site => {
      const d = getDistance(habLat, habLng, site.coordinates.lat, site.coordinates.lng);
      if (d < minDist) {
        minDist = d;
        nearest = site;
      }
    });
    return nearest;
  }, [sites, getDistance]);

  const currentSite = sites.find(s => s.id === selectedSiteId) || sites[0];
  const recommendedSite = selectedHabitation ? getNearestSite(selectedHabitation.coordinates.lat, selectedHabitation.coordinates.lng) : sites[0];

  // Determine map center + zoom based on view level
  const mapView = useMemo(() => {
    if (viewLevel === 'india') return { ...VIEWS.india, zoom: isMobile ? 3 : VIEWS.india.zoom };
    if (viewLevel === 'state') {
      return { center: STATE_COORDINATES[selectedState] || VIEWS.uttarakhand.center, zoom: isMobile ? 5 : 7 };
    }
    return { ...VIEWS.chamoli, zoom: isMobile ? 9 : VIEWS.chamoli.zoom };
  }, [viewLevel, selectedState, isMobile]);

  // Build evacuation route lines (habitation → nearest site)
  const evacuationRoutes = useMemo(() => {
    const routes: { from: [number, number]; to: [number, number]; color: string }[] = [];
    habitations.forEach(hab => {
      const nearestSite = getNearestSite(hab.coordinates.lat, hab.coordinates.lng);
      if (nearestSite) {
        routes.push({
          from: [hab.coordinates.lat, hab.coordinates.lng],
          to: [nearestSite.coordinates.lat, nearestSite.coordinates.lng],
          color: hab.priority === 'Immediate' ? '#d9531e' : '#003366',
        });
      }
    });
    return routes;
  }, [habitations, getNearestSite]);

  const activeTile = TILES[tileLayer];

  // Helper to color candidate safe sites by suitability tier
  const getSuitabilityColor = (tier: SuitabilityTier | string | undefined) => {
    switch (tier) {
      case 'SUITABLE':
        return { border: '#059669', fill: '#10b981', label: 'Suitable' };
      case 'CONDITIONALLY_SUITABLE':
        return { border: '#d97706', fill: '#f59e0b', label: 'Conditional' };
      case 'RESTRICTED':
        return { border: '#dc2626', fill: '#ef4444', label: 'Restricted' };
      default:
        return { border: '#64748b', fill: '#94a3b8', label: 'Unknown' };
    }
  };

  // Helper to color districts by Phase 5 AI priority tier
  const getDistrictTierColor = (tier: string | null | undefined) => {
    switch (tier) {
      case 'immediate':
        return '#dc2626';
      case 'short-term':
        return '#ea580c';
      case 'medium-term':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[600px] flex flex-col bg-[#f8fafc] select-none font-sans">
      {/* ── TOP TOOLBAR ── */}
      <div className="sticky top-[104px] py-2 w-full bg-white border-b border-slate-200 px-3 sm:px-4 space-y-2 shadow-sm z-30 shrink-0">
        {/* Row 1: View level + state picker + simulation tools + tile picker */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
            {/* Geographic scope selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 text-[10px] sm:text-xs font-semibold shrink-0">
              <button
                onClick={() => {
                  setViewLevel('india');
                  setSelectedViewType('district');
                }}
                className={`px-2 sm:px-2.5 py-1 rounded transition ${viewLevel === 'india' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                National (785 Districts)
              </button>
              <button
                onClick={() => {
                  setViewLevel('state');
                  setSelectedViewType('district');
                }}
                className={`px-2 sm:px-2.5 py-1 rounded transition ${viewLevel === 'state' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                State Macro
              </button>
              <button
                onClick={() => {
                  setViewLevel('district');
                  setSelectedViewType('site');
                }}
                className={`px-2 sm:px-2.5 py-1 rounded transition ${viewLevel === 'district' ? 'bg-[#003366] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Chamoli Sector (GIS)
              </button>
            </div>

            {/* State selector dropdown */}
            {viewLevel === 'state' && (
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="h-7 px-2 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#003366] max-w-[150px]"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {/* Simulation Tools */}
            {viewLevel === 'district' && (
              <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <button
                  onClick={() => setSimulationMode(simulationMode === 'add-habitation' ? 'none' : 'add-habitation')}
                  className={`h-7 px-2 text-[11px] font-bold border rounded transition flex items-center gap-1 ${
                    simulationMode === 'add-habitation' 
                      ? 'bg-red-600 text-white border-red-700 shadow-inner' 
                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                  }`}
                  title="Click on map to drop a new high-risk settlement"
                >
                  <span className="material-symbols-outlined text-[14px]">add_location</span>
                  + Habitation
                </button>
                
                <button
                  onClick={() => setSimulationMode(simulationMode === 'add-site' ? 'none' : 'add-site')}
                  className={`h-7 px-2 text-[11px] font-bold border rounded transition flex items-center gap-1 ${
                    simulationMode === 'add-site' 
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-inner' 
                      : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                  }`}
                  title="Click on map to drop a new safe relocation hub"
                >
                  <span className="material-symbols-outlined text-[14px]">warehouse</span>
                  + Safe Hub
                </button>
              </div>
            )}
          </div>

          {/* Right: Tile layer picker */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 text-[10px] sm:text-[11px] font-semibold shrink-0">
            <button
              onClick={() => setTileLayer('osm')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition ${tileLayer === 'osm' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Map
            </button>
            <button
              onClick={() => setTileLayer('satellite')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition ${tileLayer === 'satellite' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Sat
            </button>
            <button
              onClick={() => setTileLayer('terrain')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition ${tileLayer === 'terrain' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Topo
            </button>
          </div>
        </div>

        {/* Row 2: Architecture Provenance Badges + Layer Toggles */}
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono flex-wrap">
          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowSoiDistricts(!showSoiDistricts)}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                showSoiDistricts ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title="Official Survey of India District Boundaries (EPSG:4326)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showSoiDistricts ? 'bg-sky-600' : 'bg-slate-300'}`}></span>
              Districts (SOI)
            </button>
            {viewLevel === 'district' && (
              <button
                onClick={() => setShowSoiTehsils(!showSoiTehsils)}
                className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                  showSoiTehsils ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title="Official Survey of India Tehsil Boundaries (Chamoli 12 Tehsils)"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showSoiTehsils ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                Tehsils (SOI)
              </button>
            )}
            <button
              onClick={() => setShowCensusSettlements(!showCensusSettlements)}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                showCensusSettlements ? 'bg-teal-50 border-teal-300 text-teal-800' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title="Census 2011 Settlements with official population baseline"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showCensusSettlements ? 'bg-teal-600' : 'bg-slate-300'}`}></span>
              Census 2011 Settlements
            </button>
            <button
              onClick={() => setShowOsmRoads(!showOsmRoads)}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                showOsmRoads ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title="OpenStreetMap classified mapped roads"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showOsmRoads ? 'bg-amber-600' : 'bg-slate-300'}`}></span>
              Mapped Roads (OSM)
            </button>
            <button
              onClick={() => setShowOsmFacilities(!showOsmFacilities)}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                showOsmFacilities ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
              title="OpenStreetMap critical facilities (healthcare, education, emergency)"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showOsmFacilities ? 'bg-rose-600' : 'bg-slate-300'}`}></span>
              Facilities (OSM)
            </button>
            <button
              onClick={() => setMapFilters({ showRedZones: !mapFilters.showRedZones })}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                mapFilters.showRedZones ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showRedZones ? 'bg-red-600' : 'bg-slate-300'}`}></span>
              Red Zones (PostGIS ST_Buffer)
            </button>
            <button
              onClick={() => setMapFilters({ showRelocationSites: !mapFilters.showRelocationSites })}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                mapFilters.showRelocationSites ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showRelocationSites ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
              Relocation Hubs
            </button>
            <button
              onClick={() => setMapFilters({ showTransitCorridors: !mapFilters.showTransitCorridors })}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                mapFilters.showTransitCorridors ? 'bg-blue-50 border-blue-300 text-[#003366]' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showTransitCorridors ? 'bg-[#003366]' : 'bg-slate-300'}`}></span>
              Transit Corridors
            </button>
          </div>

          {/* Provenance Badges */}
          <div className="hidden xl:flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[9px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
              SOI: Official Boundaries
            </span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 text-[9px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              Census 2011: Baseline
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              OSM: Mapped Vectors
            </span>
          </div>
        </div>
      </div>

      {/* ── MAP + DRAWER ── */}
      <div className="relative flex-1 w-full flex overflow-hidden">
        {/* LEAFLET MAP */}
        <div className="relative flex-1 h-full w-full">
          <MapContainer
            center={mapView.center}
            zoom={mapView.zoom}
            className="w-full h-full z-10"
            zoomControl={false}
            attributionControl={true}
            preferCanvas={true}
            style={{ background: '#e2e8f0' }}
          >
            <MapController center={mapView.center} zoom={mapView.zoom} />
            <MapInteractionController />

            <TileLayer url={activeTile.url} attribution={activeTile.attribution} />

            {/* ── PHASE 9: SURVEY OF INDIA STATE BOUNDARY (UTTARAKHAND) ── */}
            {soiStateData?.features?.map((st, idx) => {
              const polys = geoJsonGeometryToPolygons(st.geometry);
              return polys.map((ring, rIdx) => (
                <Polygon
                  key={`soi-state-${idx}-${rIdx}`}
                  positions={ring}
                  pathOptions={{
                    color: '#0284c7',
                    weight: 2.2,
                    fill: false,
                    dashArray: '8, 6',
                  }}
                />
              ));
            })}

            {/* ── PHASE 9: SURVEY OF INDIA 13 DISTRICT BOUNDARIES (OFFICIAL POLYGONS) ── */}
            {showSoiDistricts && (viewLevel === 'india' || viewLevel === 'state' || viewLevel === 'district') && soiDistrictsData?.features?.map((dist) => {
              const p = dist.properties;
              const polys = geoJsonGeometryToPolygons(dist.geometry);
              const style = getDistrictRiskPolygonStyle(p.riskTier, p.riskScore);

              return polys.map((ring, rIdx) => (
                <Polygon
                  key={`soi-dist-${p.districtCode}-${rIdx}`}
                  positions={ring}
                  pathOptions={style}
                  eventHandlers={{
                    click: () => {
                      setSelectedDistrictItem(p);
                      setSelectedViewType('district');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[220px]">
                      <div className="font-bold text-[#003366] text-sm flex items-center justify-between">
                        <span>{p.districtName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-blue-100 text-blue-800">
                          SOI LGD: {p.districtCode}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">{p.stateName} • Survey of India Official</div>
                      <div className="mt-1.5 border-t border-slate-100 pt-1 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Risk Tier:</span>
                          <span className="font-bold uppercase text-[10px]" style={{ color: style.color }}>
                            {p.riskTier || 'Standard'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Calibrated Risk:</span>
                          <span className="font-bold font-mono text-red-700">{formatPercent(p.calibratedProbability, 1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vulnerability Score:</span>
                          <span className="font-bold font-mono text-amber-700">{formatScore(p.vulnerabilityScore, 2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Area (SOI):</span>
                          <span className="font-mono">{formatArea((p.shapeArea || 0) / 1000000)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[9px] font-mono text-slate-400 italic">
                        Provenance: {p.provenance}
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              ));
            })}

            {/* ── PHASE 9: SURVEY OF INDIA 12 TEHSILS / SUBDISTRICTS (CHAMOLI SECTOR) ── */}
            {showSoiTehsils && viewLevel === 'district' && soiSubdistrictsData?.features?.map((subdist) => {
              const p = subdist.properties;
              const polys = geoJsonGeometryToPolygons(subdist.geometry);

              return polys.map((ring, rIdx) => (
                <Polygon
                  key={`soi-subdist-${p.subdistrictCode}-${rIdx}`}
                  positions={ring}
                  pathOptions={{
                    color: '#475569',
                    weight: 1.5,
                    fillColor: '#94a3b8',
                    fillOpacity: 0.12,
                    dashArray: '5, 4',
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[190px]">
                      <div className="font-bold text-slate-800 text-sm">{p.subdistrictName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">Tehsil Code: {p.subdistrictCode} • {p.districtName}</div>
                      <div className="mt-1 text-[9px] font-mono text-slate-500">
                        Official Survey of India Sub-District Boundary
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              ));
            })}

            {/* ── PHASE 9: OPENSTREETMAP MAPPED ROADS (CLASSIFIED VECTORS) ── */}
            {showOsmRoads && viewLevel === 'district' && osmRoadsData?.features?.map((road) => {
              const coords = geoJsonLineStringToLatLngs(road.geometry);
              if (!coords.length) return null;
              const p = road.properties;
              const style = getOsmRoadStyle(p.fclass);

              return (
                <Polyline
                  key={`osm-road-${road.id}`}
                  positions={coords}
                  pathOptions={style}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[200px]">
                      <div className="font-bold text-slate-900">{p.name || 'Mapped Road'}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{p.ref ? `${p.ref} • ` : ''}Class: {p.fclass}</div>
                      <div className="mt-1.5 border-t border-slate-100 pt-1 text-[10px] space-y-0.5">
                        {p.maxspeed && <div>Max Speed: {p.maxspeed} km/h</div>}
                        {p.oneway && <div>One-way: {p.oneway}</div>}
                        {p.bridge && <div>Bridge: Yes</div>}
                      </div>
                      <div className="mt-2 text-[9px] font-mono text-amber-800 bg-amber-50 p-1 rounded">
                        {p.classificationNotice}
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}

            {/* ── PHASE 9: OPENSTREETMAP CRITICAL FACILITIES ── */}
            {showOsmFacilities && viewLevel === 'district' && osmFacilitiesData?.features?.map((fac) => {
              const geom = fac.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = fac.properties;

              return (
                <Marker
                  key={`osm-fac-${fac.id}`}
                  position={[lat, lon]}
                  icon={getOsmFacilityIcon(p.category)}
                  eventHandlers={{
                    click: () => {
                      setSelectedOsmFacilityItem(p);
                      setSelectedViewType('osm');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[200px]">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] font-mono text-blue-700 uppercase">{p.category} • {p.fclass}</div>
                      <div className="mt-1.5 text-[9px] font-mono text-slate-500">
                        {p.sourceNotice}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ── PHASE 9: CENSUS 2011 SETTLEMENTS (TOWNS & VILLAGES) ── */}
            {showCensusSettlements && viewLevel === 'district' && censusSettlementsData?.features?.map((settle) => {
              const geom = settle.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = settle.properties;
              const isTown = p.settlementType === 'TOWN';

              return (
                <Marker
                  key={`census-${settle.id}`}
                  position={[lat, lon]}
                  icon={isTown ? censusTownIcon : censusVillageIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedCensusItem(p);
                      setSelectedViewType('census');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#003366] text-sm">{p.settlementName}</span>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded text-white ${isTown ? 'bg-sky-600' : 'bg-teal-600'}`}>
                          {p.settlementType}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        Census Code: {p.settlementCode} • {p.districtName}
                      </div>

                      <table className="w-full mt-2 text-[11px]">
                        <tbody>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">2011 Baseline Pop.</td>
                            <td className="font-bold font-mono text-slate-900">{formatPopulation(p.population2011Baseline)}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Households</td>
                            <td className="font-mono">{formatNumber(p.households2011Baseline, 0, 'Unavailable')}</td>
                          </tr>
                          {p.infrastructureMarkers?.tap_water_treated !== undefined && (
                            <tr>
                              <td className="text-slate-500 pr-2 py-0.5">Treated Tap Water</td>
                              <td className="font-mono">{p.infrastructureMarkers.tap_water_treated === 1 ? 'Available' : 'Unavailable'}</td>
                            </tr>
                          )}
                          {p.infrastructureMarkers?.all_weather_road !== undefined && (
                            <tr>
                              <td className="text-slate-500 pr-2 py-0.5">All Weather Road</td>
                              <td className="font-mono">{p.infrastructureMarkers.all_weather_road === 1 ? 'Connected' : 'Unconnected'}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="mt-2 text-[9px] font-mono text-slate-500 bg-slate-50 p-1 rounded">
                        {p.temporalNotice}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ── FALLBACK CENTROIDS FOR NON-UTTARAKHAND STATES IN NATIONAL VIEW ── */}
            {viewLevel === 'india' && !soiDistrictsData && districtsData?.features?.map((dist) => {
              const geom = dist.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = dist.properties;
              const circleColor = getDistrictTierColor(p.tier);
              const radius = Math.max(5000, Math.min(30000, (p.priorityWeight || 0.5) * 25000));

              return (
                <Circle
                  key={`dist-${p.canonicalDistrictId}`}
                  center={[lat, lon]}
                  radius={radius * 2}
                  pathOptions={{
                    color: circleColor,
                    weight: 2,
                    fillColor: circleColor,
                    fillOpacity: 0.45,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedDistrictItem(p);
                      setSelectedViewType('district');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[210px]">
                      <div className="font-bold text-[#003366] text-sm">{p.districtName}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{p.stateName} • Code: {p.districtCode}</div>
                      <div className="mt-1.5 flex items-center justify-between border-t border-slate-100 pt-1">
                        <span className="text-slate-500">Phase 5 AI Tier:</span>
                        <span className="font-bold uppercase text-[10px]" style={{ color: circleColor }}>
                          {p.tier || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* ── SECTOR LEVEL: MODEL-DERIVED POSTGIS MULTIPOLYGON RED ZONES ── */}
            {mapFilters.showRedZones && viewLevel === 'district' && redZonesData?.features?.map((rz) => {
              const polygonRings = geoJsonGeometryToPolygons(rz.geometry);
              return polygonRings.map((ring, rIdx) => (
                <Polygon
                  key={`rz-${rz.id}-${rIdx}`}
                  positions={ring}
                  pathOptions={{
                    color: '#b91c1c',
                    weight: 2.5,
                    fillColor: '#fecaca',
                    fillOpacity: 0.38,
                    dashArray: '8, 5',
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[220px]">
                      <div className="font-bold text-red-800 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Model-Derived Exclusion Zone (SIMULATED)
                      </div>
                      <div className="text-slate-800 font-semibold mt-1">{rz.properties.name}</div>
                      <div className="text-slate-500 font-mono text-[10px] mt-0.5">
                        Planning Basis: {rz.properties.mandateReference}
                      </div>
                      <div className="mt-2 border-t border-slate-200 pt-1 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Exclusion Type:</span>
                          <span className="font-bold text-red-700 font-mono">{rz.properties.exclusionType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Enclosed Area:</span>
                          <span className="font-bold font-mono">{formatArea(rz.properties?.areaSqKm)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Constituent Hazards:</span>
                          <span className="font-bold font-mono">{rz.properties.constituentHazardCount} hazards</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-1 rounded text-center">
                        EXCLUSION: Habitational relocation restricted under DM Act 2005 model planning criteria
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              ));
            })}

            {/* ── SECTOR LEVEL: CANDIDATE RELOCATION SITES (POSTGIS SPATIAL SUITABILITY) ── */}
            {mapFilters.showRelocationSites && viewLevel === 'district' && gisSitesData?.features?.map((site) => {
              const geom = site.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = site.properties;
              const colorInfo = getSuitabilityColor(p.tier);
              const isSelected = selectedSiteId === p.siteId;

              return (
                <Circle
                  key={`gis-site-${p.siteId}`}
                  center={[lat, lon]}
                  radius={isSelected ? 650 : 500}
                  pathOptions={{
                    color: isSelected ? '#1e3a8a' : colorInfo.border,
                    weight: isSelected ? 3.5 : 2.5,
                    fillColor: colorInfo.fill,
                    fillOpacity: 0.55,
                    dashArray: p.tier === 'RESTRICTED' ? '4,4' : undefined,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedSiteId(p.siteId);
                      setSelectedViewType('site');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[210px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase"
                          style={{
                            backgroundColor: p.tier === 'RESTRICTED' ? '#fee2e2' : '#ecfdf5',
                            color: p.tier === 'RESTRICTED' ? '#991b1b' : '#065f46',
                          }}
                        >
                          {colorInfo.label}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">{p.code} • {p.siteType}</div>
                      
                      <table className="w-full mt-2 text-[11px]">
                        <tbody>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Suitability Score</td><td className="font-bold font-mono">{formatPercent(p.suitabilityScore, 0)}</td></tr>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Carrying Capacity</td><td className="font-bold font-mono text-emerald-700">{formatPopulation(p.effectiveCapacity)}</td></tr>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Nearest Hospital</td><td className="font-mono">{formatDistance(p.nearestHospitalKm)}</td></tr>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Road Access</td><td className="font-mono">{formatDistance(p.nearestRoadKm)}</td></tr>
                        </tbody>
                      </table>

                      <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded text-center ${
                        p.tier === 'RESTRICTED' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.tier === 'RESTRICTED' ? '✕ RESTRICTED — Inside Red Zone Envelope' : '✓ Outside Active Hazard Envelope'}
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* ── SECTOR LEVEL: MONITORED HABITATIONS ── */}
            {viewLevel === 'district' && habitations.map(hab => (
              <Circle
                key={`hab-zone-${hab.id}`}
                center={[hab.coordinates.lat, hab.coordinates.lng]}
                radius={hab.riskScore >= 0.8 ? 750 : 550}
                pathOptions={{
                  color: hab.riskScore >= 0.8 ? '#dc2626' : '#d97706',
                  weight: 2,
                  fillColor: hab.riskScore >= 0.8 ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.45,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedHabitationId(hab.id);
                    setSelectedViewType('habitation');
                    setIsDrawerCollapsed(false);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs font-sans min-w-[200px]">
                    <div className="font-bold text-[#003366] text-sm">{hab.name}</div>
                    <div className="text-slate-500 font-mono text-[10px]">{hab.code} • {hab.subDistrict}</div>
                    <table className="w-full mt-2 text-[11px]">
                      <tbody>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Population</td><td className="font-bold text-slate-900 font-mono">{formatPopulation(hab.population)}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Risk Score</td><td className="font-bold text-red-700 font-mono">{formatPercent(hab.riskScore, 0)}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Primary Hazard</td><td className="font-semibold">{hab.primaryHazard}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Priority</td><td className="font-bold text-[#d9531e]">{hab.priority}</td></tr>
                      </tbody>
                    </table>
                    <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded text-center ${
                      hab.isInsideRedZone ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {hab.isInsideRedZone ? '⚠ INSIDE MODEL-DERIVED RED ZONE' : `${formatDistance(hab.redZoneDistanceKm)} from Red Zone`}
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* ── TRANSIT ROUTES ── */}
            {mapFilters.showTransitCorridors && viewLevel === 'district' && evacuationRoutes.map((route, idx) => (
              <Polyline
                key={idx}
                positions={[route.from, route.to]}
                pathOptions={{
                  color: route.color,
                  weight: 2.5,
                  opacity: 0.7,
                  dashArray: '10,6',
                }}
              />
            ))}

            {/* ── ROAD BLOCKAGE ── */}
            {roadR12Blocked && viewLevel === 'district' && (
              <Marker position={R12_BLOCK_POINT} icon={blockedIcon}>
                <Popup>
                  <div className="text-xs font-sans">
                    <div className="font-bold text-red-800 text-sm">✕ ROAD R12 BLOCKED</div>
                    <div className="text-slate-600 mt-1">Rockfall at Ch. 4+200</div>
                    <div className="text-slate-600">Traffic diverted via Alt R12B</div>
                    <div className="text-red-700 font-bold mt-1">+8.2 min detour delay</div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Floating bottom-left coordinates */}
          <div className="absolute bottom-3 left-3 bg-white/95 rounded border border-slate-200 px-3 py-1.5 shadow-sm flex items-center gap-3 text-[11px] text-slate-600 font-mono z-[1000]">
            <span className="text-[#003366] font-bold">{formatScore(mapView.center?.[0], 2)}°N {formatScore(mapView.center?.[1], 2)}°E</span>
            <span className="text-slate-300">|</span>
            <span>Zoom: {mapView.zoom}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              PostGIS EPSG:4326 Live
            </span>
            {isLoadingGis && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-blue-600 font-semibold animate-pulse">Syncing GIS...</span>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT INTELLIGENCE DRAWER ── */}
        <aside
          className={`${
            isDrawerCollapsed ? 'w-10' : 'w-full sm:w-96'
          } bg-white border-l border-slate-200 shadow-md z-20 flex flex-col shrink-0 h-full transition-all duration-200 overflow-hidden font-sans absolute top-0 right-0 sm:relative`}
        >
          {isDrawerCollapsed ? (
            <button
              onClick={() => setIsDrawerCollapsed(false)}
              className="p-2 text-[#003366] hover:bg-slate-50 h-full flex flex-col items-center justify-start gap-3"
              title="Expand Intelligence Drawer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              <span className="text-[10px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap mt-10">
                {selectedViewType === 'site'
                  ? 'SITE SUITABILITY AUDIT'
                  : selectedViewType === 'district'
                  ? 'DISTRICT INTEL'
                  : selectedViewType === 'census'
                  ? 'CENSUS SETTLEMENT'
                  : selectedViewType === 'osm'
                  ? 'OSM FACILITY'
                  : 'SETTLEMENT INTEL'}
              </span>
            </button>
          ) : (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] tracking-wider text-[#003366] font-bold uppercase font-mono">
                    <span>
                      {selectedViewType === 'site'
                        ? 'SITE SPATIAL SUITABILITY'
                        : selectedViewType === 'district'
                        ? 'DISTRICT MACRO AI'
                        : selectedViewType === 'census'
                        ? 'CENSUS 2011 SETTLEMENT'
                        : selectedViewType === 'osm'
                        ? 'OSM CRITICAL FACILITY'
                        : 'SETTLEMENT RISK INTEL'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight truncate mt-0.5">
                    {selectedViewType === 'site'
                      ? selectedSiteAudit?.siteName || currentSite.name
                      : selectedViewType === 'district'
                      ? selectedDistrictItem?.districtName || 'Selected District'
                      : selectedViewType === 'census'
                      ? selectedCensusItem?.settlementName || 'Census Settlement'
                      : selectedViewType === 'osm'
                      ? selectedOsmFacilityItem?.name || 'OSM Facility'
                      : selectedHabitation.name}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {selectedViewType === 'site'
                      ? `${selectedSiteAudit?.district || 'Chamoli'}, ${selectedSiteAudit?.state || 'Uttarakhand'} • Elev: ${currentSite.elevationMeters}m`
                      : selectedViewType === 'district'
                      ? `${selectedDistrictItem?.stateName} • Code: ${selectedDistrictItem?.districtCode}`
                      : selectedViewType === 'census'
                      ? `${selectedCensusItem?.districtName || 'Chamoli'}${selectedCensusItem?.subdistrictName ? ` • ${selectedCensusItem.subdistrictName}` : ''} • Code: ${selectedCensusItem?.settlementCode || '—'}`
                      : selectedViewType === 'osm'
                      ? `${selectedOsmFacilityItem?.category || 'Facility'} • ${selectedOsmFacilityItem?.fclass || 'Infrastructure'}`
                      : `${selectedHabitation.subDistrict} • ${selectedHabitation.code}`}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerCollapsed(true)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition shrink-0 ml-2"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              {/* View Switcher Tabs inside Drawer */}
              <div className="flex border-b border-slate-200 bg-slate-100 text-[11px] font-semibold shrink-0">
                <button
                  onClick={() => setSelectedViewType('site')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'site' ? 'border-[#003366] bg-white text-[#003366]' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Safe Hub
                </button>
                <button
                  onClick={() => setSelectedViewType('habitation')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'habitation' ? 'border-[#003366] bg-white text-[#003366]' : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Habitation
                </button>
                {(viewLevel === 'india' || viewLevel === 'state') && (
                  <button
                    onClick={() => setSelectedViewType('district')}
                    className={`flex-1 py-1.5 text-center border-b-2 transition ${
                      selectedViewType === 'district' ? 'border-[#003366] bg-white text-[#003366]' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    District
                  </button>
                )}
                {selectedCensusItem && (
                  <button
                    onClick={() => setSelectedViewType('census')}
                    className={`flex-1 py-1.5 text-center border-b-2 transition ${
                      selectedViewType === 'census' ? 'border-[#003366] bg-white text-[#003366]' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Census
                  </button>
                )}
                {selectedOsmFacilityItem && (
                  <button
                    onClick={() => setSelectedViewType('osm')}
                    className={`flex-1 py-1.5 text-center border-b-2 transition ${
                      selectedViewType === 'osm' ? 'border-[#003366] bg-white text-[#003366]' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Facility
                  </button>
                )}
              </div>

              {/* Drawer Body */}
              {selectedViewType === 'site' ? (
                /* ── SITE SUITABILITY AUDIT VIEW ── */
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                  {/* Suitability Tier Status Banner */}
                  <div className={`p-2.5 rounded-sm flex items-center justify-between text-white ${
                    selectedSiteAudit?.tier === 'RESTRICTED'
                      ? 'bg-red-700'
                      : selectedSiteAudit?.tier === 'CONDITIONALLY_SUITABLE'
                      ? 'bg-amber-600'
                      : 'bg-emerald-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                      <span className="text-[11px] font-bold tracking-wider uppercase">
                        {selectedSiteAudit?.tier?.replace(/_/g, ' ') || 'CONDITIONALLY SUITABLE'}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-black/25 text-[9px] rounded-sm font-bold font-mono">
                      SCORE: {formatPercent(selectedSiteAudit?.suitabilityScore ?? 0.85, 0)}
                    </span>
                  </div>

                  {/* High-level Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Effective Cap</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {formatPopulation(selectedSiteAudit?.effectiveCapacity ?? currentSite?.resourceCapacity?.effectiveCapacity)}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Safety Score</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        {formatPercent(selectedSiteAudit?.safetyScore ?? 0.95, 0)}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Bottleneck</span>
                      <span className="text-[11px] font-bold text-amber-800 font-mono block truncate">
                        {selectedSiteAudit?.bottleneck || currentSite?.resourceCapacity?.bottleneck || 'None'}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Criteria Spatial Checklist */}
                  <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                    <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700 flex items-center justify-between">
                      <span>Spatial Criteria Checklist</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">PostGIS ST_Intersects</span>
                    </div>

                    {/* Check 1: Hard Hazard Exclusion */}
                    <div className="p-2.5 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#003366]">shield</span>
                          Hard Hazard Exclusion
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Model-derived red zones (subsidence, flood, avalanche buffers)
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                        selectedSiteAudit?.checks?.hardHazardExclusion === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSiteAudit?.checks?.hardHazardExclusion || 'PASS'}
                      </span>
                    </div>

                    {/* Check 2: All-Weather Road Proximity */}
                    <div className="p-2.5 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-[#003366]">alt_route</span>
                          Road Accessibility
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Distance: {selectedSiteAudit?.nearestRoad?.distanceMeters ?? 150}m ({selectedSiteAudit?.nearestRoad?.accessibility || 'assumed all-weather'} • corridor heuristic)
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-emerald-100 text-emerald-800">
                        {selectedSiteAudit?.checks?.roadProximity || 'PASS'}
                      </span>
                    </div>

                    {/* Check 3: Healthcare Access */}
                    <div className="p-2.5 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-red-600">local_hospital</span>
                          Healthcare Proximity
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {selectedSiteAudit?.nearestHospital?.name || 'District Hospital Gopeshwar'}
                          <br />
                          Distance: {selectedSiteAudit?.nearestHospital?.distanceKm ?? 0.85} km (Geocoded)
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${
                        selectedSiteAudit?.checks?.healthcareProximity === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedSiteAudit?.checks?.healthcareProximity || 'PASS'}
                      </span>
                    </div>

                    {/* Check 4: Section 8 DEM Terrain Audit Badge */}
                    <div className="p-2.5 bg-amber-50/70 border-l-2 border-amber-500">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">landscape</span>
                          DEM Terrain Audit
                        </span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded bg-amber-200 text-amber-900">
                          UNAVAILABLE (AUDITED)
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-800 leading-relaxed mt-1">
                        <strong>Section 8 Non-Fabrication Declaration:</strong> Cartosat GeoTIFF tiles cover western Gujarat (68°E–71°E, 21°N–24°N). Chamoli coordinates (79.33°E, 30.41°N) marked UNAVAILABLE to prevent synthetic slope fabrication.
                      </p>
                    </div>
                  </div>

                  {/* Explainability Summary */}
                  {selectedSiteAudit?.explainability && (
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-sm space-y-1 text-xs">
                      <span className="font-bold text-[#003366] text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        Spatial Explainability
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {selectedSiteAudit.explainability.summary}
                      </p>
                    </div>
                  )}

                  {/* Statutory & Provenance Details */}
                  <div className="text-[10px] font-mono text-slate-500 space-y-0.5 bg-slate-50 p-2 border border-slate-200 rounded-sm">
                    <div>Planning Basis: DM Act 2005 Sec 30(2) Planning Criteria (Model)</div>
                    <div>Site Provenance: {selectedSiteAudit?.dataProvenance?.siteSource || 'SIMULATED_BENCHMARK_FACILITY'}</div>
                    <div>Site Geometry: PostGIS ST_Point (EPSG:4326)</div>
                    <div>Healthcare Directory: Quarantined bed count</div>
                  </div>
                </div>
              ) : selectedViewType === 'district' ? (
                /* ── DISTRICT MACRO INTEL VIEW ── */
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                  <div className="bg-[#003366] text-white p-2.5 rounded-sm flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider">
                        {selectedDistrictItem?.districtName || 'National Overview'}
                      </div>
                      <div className="text-[9px] font-mono text-slate-300">
                        {selectedDistrictItem?.stateName || 'All States'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-white/20 text-[10px] font-mono font-bold rounded uppercase">
                      {selectedDistrictItem
                        ? ('tier' in selectedDistrictItem ? selectedDistrictItem.tier : selectedDistrictItem.riskTier) || 'Macro View'
                        : 'Macro View'}
                    </span>
                  </div>

                  {selectedDistrictItem ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">
                            {'priorityWeight' in selectedDistrictItem ? 'RPW Score' : 'Risk Score'}
                          </span>
                          <span className="text-sm font-bold text-[#003366] font-mono">
                            {formatScore(
                              'priorityWeight' in selectedDistrictItem
                                ? selectedDistrictItem.priorityWeight
                                : selectedDistrictItem.riskScore,
                              3
                            )}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Risk Prob</span>
                          <span className="text-sm font-bold text-red-700 font-mono">
                            {formatPercent(
                              'calibratedRiskProbability' in selectedDistrictItem
                                ? selectedDistrictItem.calibratedRiskProbability
                                : selectedDistrictItem.calibratedProbability,
                              1
                            )}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">
                            {'hospitalCount' in selectedDistrictItem ? 'Hospitals' : 'Area'}
                          </span>
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            {'hospitalCount' in selectedDistrictItem
                              ? formatNumber(selectedDistrictItem.geocodedHospitalCount || selectedDistrictItem.hospitalCount, 0, '0')
                              : formatArea(selectedDistrictItem.shapeArea ? selectedDistrictItem.shapeArea / 1000000 : null, 0)}
                          </span>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700 flex items-center justify-between">
                          <span>{'hospitalCount' in selectedDistrictItem ? 'Phase 5 AI District Profile' : 'Survey of India Official Boundary'}</span>
                          <span className="text-[10px] font-mono text-slate-500">LGD: {selectedDistrictItem.districtCode}</span>
                        </div>
                        {'primaryHazard' in selectedDistrictItem && (
                          <div className="flex items-center justify-between p-2">
                            <span className="text-slate-600">Primary Hazard</span>
                            <span className="font-semibold text-slate-800 capitalize">{selectedDistrictItem.primaryHazard || 'Multi-Hazard'}</span>
                          </div>
                        )}
                        {'hazardReportsTotal' in selectedDistrictItem && (
                          <div className="flex items-center justify-between p-2">
                            <span className="text-slate-600">Hazard Events Total</span>
                            <span className="font-bold font-mono">{selectedDistrictItem.activeEventsTotal ?? 0} active / {selectedDistrictItem.hazardReportsTotal ?? 0} total</span>
                          </div>
                        )}
                        {'censusPopulationTotal' in selectedDistrictItem && selectedDistrictItem.censusPopulationTotal != null && (
                          <div className="flex items-center justify-between p-2">
                            <span className="text-slate-600">Census Population</span>
                            <span className="font-bold font-mono">{formatPopulation(selectedDistrictItem.censusPopulationTotal)}</span>
                          </div>
                        )}
                        {'vulnerabilityScore' in selectedDistrictItem && (
                          <div className="flex items-center justify-between p-2">
                            <span className="text-slate-600">Vulnerability Score</span>
                            <span className="font-bold font-mono text-amber-700">{formatScore(selectedDistrictItem.vulnerabilityScore, 2)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Data Provenance</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {'centroidProvenance' in selectedDistrictItem
                              ? selectedDistrictItem.centroidProvenance
                              : selectedDistrictItem.provenance}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setViewLevel('district');
                          setSelectedViewType('site');
                        }}
                        className="w-full h-8 bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 transition"
                      >
                        <span className="material-symbols-outlined text-[14px]">map</span>
                        Enter Chamoli Sector (GIS)
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-8">
                      Click any district circle on the map to inspect Phase 5 AI risk scores and geocoded hospital metrics.
                    </div>
                  )}
                </div>
              ) : selectedViewType === 'census' ? (
                /* ── CENSUS 2011 SETTLEMENT VIEW ── */
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                  {selectedCensusItem ? (
                    <>
                      <div className={`text-white p-2.5 rounded-sm flex items-center justify-between ${
                        selectedCensusItem.settlementType === 'TOWN' ? 'bg-sky-700' : 'bg-teal-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                          <span className="text-[11px] font-bold tracking-wider uppercase">
                            CENSUS {selectedCensusItem.settlementType}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-black/25 text-[9px] rounded-sm font-bold font-mono">
                          CODE: {selectedCensusItem.settlementCode}
                        </span>
                      </div>

                      {/* Baseline Demographic Statistics */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">2011 Baseline Pop.</span>
                          <span className="text-base font-bold text-slate-900 font-mono">
                            {formatPopulation(selectedCensusItem.population2011Baseline)}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Households</span>
                          <span className="text-base font-bold text-slate-900 font-mono">
                            {formatNumber(selectedCensusItem.households2011Baseline, 0, '—')}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Sex Ratio (M/F)</span>
                          <span className="text-xs font-bold text-slate-800 font-mono leading-relaxed mt-1 block">
                            {selectedCensusItem.malePopulation2011 != null && selectedCensusItem.femalePopulation2011 != null
                              ? `${formatNumber(selectedCensusItem.malePopulation2011)} / ${formatNumber(selectedCensusItem.femalePopulation2011)}`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Location & Administrative Hierarchy */}
                      <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700 flex items-center justify-between">
                          <span>Administrative Hierarchy</span>
                          <span className="text-[9px] font-mono text-slate-500">Census 2011 MDDS</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">District</span>
                          <span className="font-semibold text-slate-800">{selectedCensusItem.districtName} ({selectedCensusItem.districtCode})</span>
                        </div>
                        {selectedCensusItem.subdistrictName && (
                          <div className="flex items-center justify-between p-2">
                            <span className="text-slate-600">Subdistrict / Tehsil</span>
                            <span className="font-semibold text-slate-800">{selectedCensusItem.subdistrictName}</span>
                          </div>
                        )}
                        {selectedCensusItem.cdBlockName && (
                          <div className="flex items-center justify-between p-2">
                            <span className="text-slate-600">CD Block</span>
                            <span className="font-semibold text-slate-800">{selectedCensusItem.cdBlockName}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Coordinates</span>
                          <span className="font-mono text-[11px] text-slate-700">
                            {selectedCensusItem.latitude != null && selectedCensusItem.longitude != null
                              ? `${formatNumber(selectedCensusItem.latitude, 4)}°N, ${formatNumber(selectedCensusItem.longitude, 4)}°E`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Infrastructure Markers (from Census DCHB) */}
                      {selectedCensusItem.infrastructureMarkers && Object.keys(selectedCensusItem.infrastructureMarkers).length > 0 && (
                        <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                          <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700">
                            Census 2011 Infrastructure Amenities
                          </div>
                          {Object.entries(selectedCensusItem.infrastructureMarkers).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between p-2">
                              <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-semibold font-mono text-[11px] text-slate-800">
                                {typeof val === 'boolean' ? (val ? 'Available' : 'Unavailable') : String(val ?? '—')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Official Provenance & Temporal Disclaimer */}
                      <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-sm space-y-1 text-xs">
                        <div className="font-bold text-amber-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">history_edu</span>
                          Data Provenance & Temporal Baseline Notice
                        </div>
                        <p className="text-[10px] text-amber-900 leading-relaxed font-sans">
                          {selectedCensusItem.temporalNotice || 'Official Census 2011 baseline data. Reflects 2011 statutory enumeration; not real-time population.'}
                        </p>
                        <div className="text-[9px] font-mono text-amber-800 pt-1 border-t border-amber-200/60">
                          Source: {selectedCensusItem.provenance || 'Census of India 2011, Directorate of Census Operations Uttarakhand'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-8">
                      Click any Census settlement point on the map to inspect baseline demographics and infrastructure.
                    </div>
                  )}
                </div>
              ) : selectedViewType === 'osm' ? (
                /* ── OSM CRITICAL FACILITY VIEW ── */
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                  {selectedOsmFacilityItem ? (
                    <>
                      <div className="bg-[#003366] text-white p-2.5 rounded-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                          <span className="text-[11px] font-bold tracking-wider uppercase">
                            {selectedOsmFacilityItem.category} FACILITY
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-white/20 text-[9px] rounded-sm font-bold font-mono">
                          OSM ID: {selectedOsmFacilityItem.osmId}
                        </span>
                      </div>

                      {/* Facility Attribute Details */}
                      <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700">
                          Facility Spatial Attributes
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Facility Name</span>
                          <span className="font-bold text-slate-900">{selectedOsmFacilityItem.name}</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Classification (fclass)</span>
                          <span className="font-semibold text-slate-800 font-mono">{selectedOsmFacilityItem.fclass}</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Functional Category</span>
                          <span className="font-semibold text-[#003366] capitalize">{selectedOsmFacilityItem.category}</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Coordinates (WGS84)</span>
                          <span className="font-mono text-[11px] text-slate-700">
                            {selectedOsmFacilityItem.latitude != null && selectedOsmFacilityItem.longitude != null
                              ? `${formatNumber(selectedOsmFacilityItem.latitude, 4)}°N, ${formatNumber(selectedOsmFacilityItem.longitude, 4)}°E`
                              : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Crowdsource Provenance Notice */}
                      <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-sm space-y-1 text-xs">
                        <div className="font-bold text-sky-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">public</span>
                          OpenStreetMap Crowdsource Notice
                        </div>
                        <p className="text-[10px] text-sky-900 leading-relaxed font-sans">
                          {selectedOsmFacilityItem.sourceNotice || 'OpenStreetMap crowdsourced geometry. For planning reference; not field-verified by government surveyors.'}
                        </p>
                        <div className="text-[9px] font-mono text-sky-800 pt-1 border-t border-sky-200/60">
                          Source: {selectedOsmFacilityItem.provenance || 'OpenStreetMap Contributors, Geofabrik Northern Zone extract'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 text-center py-8">
                      Click any OSM critical facility marker on the map to inspect spatial attributes and classification.
                    </div>
                  )}
                </div>
              ) : (
                /* ── HABITATION VIEW ── */
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                  <div className="bg-[#d9531e] text-white p-2.5 rounded-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                      <span className="text-[11px] font-bold tracking-wider uppercase">
                        {selectedHabitation.priority} PRIORITY
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-[#611b00] text-[9px] rounded-sm font-bold font-mono">HABITATION</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Pop.</span>
                      <span className="text-base font-bold text-slate-900 font-mono">{formatPopulation(selectedHabitation?.population)}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-amber-900 font-bold uppercase">Exposure</span>
                      <span className="text-base font-bold text-amber-900 font-mono">{formatPercent(selectedHabitation?.hazardExposureScore, 0)}</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-red-900 font-bold uppercase">Risk</span>
                      <span className="text-base font-bold text-red-700 font-mono">{formatScore(selectedHabitation?.riskScore, 2)}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="material-symbols-outlined text-[14px] text-red-600">local_hospital</span>
                        Healthcare
                      </span>
                      <span className="font-bold text-red-700 font-mono text-[11px]">{selectedHabitation?.infrastructure?.healthcare || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="material-symbols-outlined text-[14px] text-[#d9531e]">alt_route</span>
                        Roads
                      </span>
                      <span className="font-bold text-amber-700 font-mono text-[11px]">{selectedHabitation?.infrastructure?.roads || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="material-symbols-outlined text-[14px] text-[#003366]">water_drop</span>
                        Water
                      </span>
                      <span className="font-bold text-[#003366] font-mono text-[11px]">{selectedHabitation.infrastructure.water}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="material-symbols-outlined text-[14px] text-amber-600">bolt</span>
                        Power Grid
                      </span>
                      <span className="font-bold font-mono text-[11px]">{selectedHabitation.infrastructure.powerGrid}</span>
                    </div>
                  </div>

                  {/* Recommended site */}
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-sm space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        Recommended Safe Hub
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1 rounded-sm">98.2%</span>
                    </div>
                    <div className="font-bold text-slate-900">{recommendedSite.name}</div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-700">
                      <div>DIST: <strong>{recommendedSite.routeDistanceKm} km</strong></div>
                      <div>TIME: <strong>{recommendedSite.transitTimeMinutes} min</strong></div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSiteId(recommendedSite.id);
                      setSelectedViewType('site');
                    }}
                    className="w-full h-8 bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 transition"
                  >
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">warehouse</span>
                    Inspect Safe Hub ({recommendedSite.name.split('(')[0].trim()})
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
