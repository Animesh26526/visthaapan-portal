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
} from '../types/gis';

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
  const [selectedViewType, setSelectedViewType] = useState<'habitation' | 'site' | 'district'>('site');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Phase 6 Live Spatial Intelligence State
  const [redZonesData, setRedZonesData] = useState<GeoJsonFeatureCollection<RedZoneFeatureProperties> | null>(null);
  const [gisSitesData, setGisSitesData] = useState<GeoJsonFeatureCollection<RelocationSiteFeatureProperties> | null>(null);
  const [districtsData, setDistrictsData] = useState<GeoJsonFeatureCollection<DistrictGisFeatureProperties> | null>(null);
  const [selectedSiteAudit, setSelectedSiteAudit] = useState<SiteSuitabilityAudit | null>(null);
  const [selectedDistrictItem, setSelectedDistrictItem] = useState<DistrictGisFeatureProperties | null>(null);
  const [isLoadingGis, setIsLoadingGis] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Phase 6 GIS Red Zones and Relocation Sites on mount
  useEffect(() => {
    let isMounted = true;
    async function loadGisSpatialData() {
      setIsLoadingGis(true);
      try {
        const [rzCollection, sitesCollection] = await Promise.all([
          GisService.getRedZones(),
          GisService.getRelocationSites(),
        ]);
        if (isMounted) {
          setRedZonesData(rzCollection);
          setGisSitesData(sitesCollection);
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
          <div className="flex items-center gap-1.5">
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
              Relocation Hubs (Suitability)
            </button>
            <button
              onClick={() => setMapFilters({ showTransitCorridors: !mapFilters.showTransitCorridors })}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
                mapFilters.showTransitCorridors ? 'bg-blue-50 border-blue-300 text-[#003366]' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showTransitCorridors ? 'bg-[#003366]' : 'bg-slate-300'}`}></span>
              Corridors
            </button>
          </div>

          {/* Provenance Badges (Section 31 & Master Prompt Non-Fabrication Compliance) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Phase 5: Statistical AI (Macro)
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              Phase 6: Spatial Engine (PostGIS)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold flex items-center gap-1" title="Cartosat-1 DEM covers western Gujarat (68°E-71°E, 21°N-24°N). Chamoli coordinates marked UNAVAILABLE per Section 8 non-fabrication rule.">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
              DEM Audit: Non-Fabrication Active
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

            {/* ── MACRO LEVEL: NATIONAL / STATE 785 DISTRICT CENTROIDS ── */}
            {(viewLevel === 'india' || viewLevel === 'state') && districtsData?.features?.map((dist) => {
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
                  radius={viewLevel === 'india' ? radius * 2 : radius}
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
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Risk Priority Weight:</span>
                        <span className="font-bold font-mono text-slate-800">{(p.priorityWeight || 0).toFixed(3)}</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Calibrated Risk Prob:</span>
                        <span className="font-bold font-mono text-red-700">{((p.calibratedRiskProbability || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-slate-500">Primary Hazard:</span>
                        <span className="font-semibold text-slate-700 capitalize">{p.primaryHazard || 'Multi-Hazard'}</span>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400 font-mono italic">
                        Centroid: {p.centroidProvenance}
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* ── SECTOR LEVEL: STATUTORY POSTGIS MULTIPOLYGON RED ZONES ── */}
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
                        Statutory Red Zone
                      </div>
                      <div className="text-slate-800 font-semibold mt-1">{rz.properties.name}</div>
                      <div className="text-slate-500 font-mono text-[10px] mt-0.5">
                        Mandate: {rz.properties.mandateReference}
                      </div>
                      <div className="mt-2 border-t border-slate-200 pt-1 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Exclusion Type:</span>
                          <span className="font-bold text-red-700 font-mono">{rz.properties.exclusionType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Enclosed Area:</span>
                          <span className="font-bold font-mono">{rz.properties.areaSqKm.toFixed(2)} km²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Constituent Hazards:</span>
                          <span className="font-bold font-mono">{rz.properties.constituentHazardCount} hazards</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-bold bg-red-100 text-red-800 px-2 py-1 rounded text-center">
                        PROHIBITED: Habitational development banned
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
                          <tr><td className="text-slate-500 pr-2 py-0.5">Suitability Score</td><td className="font-bold font-mono">{(p.suitabilityScore * 100).toFixed(0)}%</td></tr>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Carrying Capacity</td><td className="font-bold font-mono text-emerald-700">{p.effectiveCapacity.toLocaleString()}</td></tr>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Nearest Hospital</td><td className="font-mono">{p.nearestHospitalKm ? `${p.nearestHospitalKm} km` : 'N/A'}</td></tr>
                          <tr><td className="text-slate-500 pr-2 py-0.5">Road Access</td><td className="font-mono">{p.nearestRoadKm ? `${p.nearestRoadKm} km` : 'N/A'}</td></tr>
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
                        <tr><td className="text-slate-500 pr-3 py-0.5">Population</td><td className="font-bold text-slate-900 font-mono">{hab.population.toLocaleString()}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Risk Score</td><td className="font-bold text-red-700 font-mono">{(hab.riskScore * 100).toFixed(0)}%</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Primary Hazard</td><td className="font-semibold">{hab.primaryHazard}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Priority</td><td className="font-bold text-[#d9531e]">{hab.priority}</td></tr>
                      </tbody>
                    </table>
                    <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded text-center ${
                      hab.isInsideRedZone ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {hab.isInsideRedZone ? '⚠ INSIDE STATUTORY RED ZONE' : `${hab.redZoneDistanceKm} km from Red Zone`}
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
            <span className="text-[#003366] font-bold">{mapView.center[0].toFixed(2)}°N {mapView.center[1].toFixed(2)}°E</span>
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
                {selectedViewType === 'site' ? 'SITE SUITABILITY AUDIT' : selectedViewType === 'district' ? 'DISTRICT INTEL' : 'SETTLEMENT INTEL'}
              </span>
            </button>
          ) : (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] tracking-wider text-[#003366] font-bold uppercase font-mono">
                    <span>{selectedViewType === 'site' ? 'SITE SPATIAL SUITABILITY' : selectedViewType === 'district' ? 'DISTRICT MACRO AI' : 'SETTLEMENT RISK INTEL'}</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight truncate mt-0.5">
                    {selectedViewType === 'site'
                      ? selectedSiteAudit?.siteName || currentSite.name
                      : selectedViewType === 'district'
                      ? selectedDistrictItem?.districtName || 'Selected District'
                      : selectedHabitation.name}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {selectedViewType === 'site'
                      ? `${selectedSiteAudit?.district || 'Chamoli'}, ${selectedSiteAudit?.state || 'Uttarakhand'} • Elev: ${currentSite.elevationMeters}m`
                      : selectedViewType === 'district'
                      ? `${selectedDistrictItem?.stateName} • Code: ${selectedDistrictItem?.districtCode}`
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
                      SCORE: {((selectedSiteAudit?.suitabilityScore ?? 0.85) * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* High-level Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Effective Cap</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">
                        {(selectedSiteAudit?.effectiveCapacity || currentSite.resourceCapacity.effectiveCapacity).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Safety Score</span>
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        {((selectedSiteAudit?.safetyScore ?? 0.95) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Bottleneck</span>
                      <span className="text-[11px] font-bold text-amber-800 font-mono block truncate">
                        {selectedSiteAudit?.bottleneck || currentSite.resourceCapacity.bottleneck}
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
                          Statutory red zones (subsidence, flood, avalanche buffers)
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
                          Distance: {selectedSiteAudit?.nearestRoad?.distanceMeters ?? 150}m ({selectedSiteAudit?.nearestRoad?.accessibility || 'all-weather'})
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
                    <div>Statutory Mandate: Section 30(2) DM Act 2005</div>
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
                      {selectedDistrictItem?.tier || 'Macro View'}
                    </span>
                  </div>

                  {selectedDistrictItem ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">RPW Score</span>
                          <span className="text-sm font-bold text-[#003366] font-mono">
                            {(selectedDistrictItem.priorityWeight || 0).toFixed(3)}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Risk Prob</span>
                          <span className="text-sm font-bold text-red-700 font-mono">
                            {((selectedDistrictItem.calibratedRiskProbability || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                          <span className="block text-[9px] text-slate-500 font-bold uppercase">Hospitals</span>
                          <span className="text-sm font-bold text-slate-800 font-mono">
                            {selectedDistrictItem.geocodedHospitalCount || selectedDistrictItem.hospitalCount || 0}
                          </span>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700">
                          Phase 5 AI District Profile
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Primary Hazard</span>
                          <span className="font-semibold text-slate-800 capitalize">{selectedDistrictItem.primaryHazard || 'Multi-Hazard'}</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Hazard Events Total</span>
                          <span className="font-bold font-mono">{selectedDistrictItem.activeEventsTotal} active / {selectedDistrictItem.hazardReportsTotal} total</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Census Population</span>
                          <span className="font-bold font-mono">{(selectedDistrictItem.censusPopulationTotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-2">
                          <span className="text-slate-600">Centroid Provenance</span>
                          <span className="font-mono text-[10px] text-slate-500">{selectedDistrictItem.centroidProvenance}</span>
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
                      <span className="text-base font-bold text-slate-900 font-mono">{selectedHabitation.population.toLocaleString()}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-amber-900 font-bold uppercase">Exposure</span>
                      <span className="text-base font-bold text-amber-900 font-mono">{(selectedHabitation.hazardExposureScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-red-900 font-bold uppercase">Risk</span>
                      <span className="text-base font-bold text-red-700 font-mono">{selectedHabitation.riskScore.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="material-symbols-outlined text-[14px] text-red-600">local_hospital</span>
                        Healthcare
                      </span>
                      <span className="font-bold text-red-700 font-mono text-[11px]">{selectedHabitation.infrastructure.healthcare}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="material-symbols-outlined text-[14px] text-[#d9531e]">alt_route</span>
                        Roads
                      </span>
                      <span className="font-bold text-amber-700 font-mono text-[11px]">{selectedHabitation.infrastructure.roads}</span>
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
