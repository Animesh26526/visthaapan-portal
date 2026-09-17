import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../stores/useAppStore';

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

/* ── Map Controller (Handles View + Resize Glitches) ── */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center[0], center[1], zoom, map]);

  React.useEffect(() => {
    if (!map) return;
    // Initial tick to fix layout mount glitches
    const t = setTimeout(() => map.invalidateSize(), 100);
    // Observe container size changes (e.g., side drawer toggles)
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

  React.useEffect(() => {
    const container = map.getContainer();
    if (simulationMode !== 'none') {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
  }, [simulationMode, map]);

  return null;
}

/* ── Chamoli Red Zone polygon (approximate subsidence zone around Joshimath) ── */
const RED_ZONE_POLYGON: [number, number][] = [
  [30.575, 79.535],
  [30.570, 79.575],
  [30.545, 79.590],
  [30.525, 79.575],
  [30.520, 79.540],
  [30.535, 79.520],
  [30.560, 79.515],
  [30.575, 79.535],
];

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
  const [selectedViewType, setSelectedViewType] = useState<'habitation' | 'site'>('habitation');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedHabitation = habitations.find(h => h.id === selectedHabitationId) || habitations[0];
  // Haversine distance formula (returns km)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getNearestSite = (habLat: number, habLng: number) => {
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
  };

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
  }, [habitations, sites]);

  const activeTile = TILES[tileLayer];

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[600px] flex flex-col bg-[#f8fafc] select-none font-sans">
      {/* ── TOP TOOLBAR ── */}
      <div className="sticky top-[104px] py-1.5 w-full bg-white border-b border-slate-200 px-2 sm:px-3 space-y-1.5 shadow-sm z-30 shrink-0">
        {/* Row 1: View level + state + tile picker */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Geographic scope selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 text-[10px] sm:text-xs font-semibold shrink-0">
              <button
                onClick={() => setViewLevel('india')}
                className={`px-1.5 sm:px-2.5 py-1 rounded transition ${viewLevel === 'india' ? 'bg-[#003366] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                National
              </button>
              <button
                onClick={() => setViewLevel('state')}
                className={`px-1.5 sm:px-2.5 py-1 rounded transition ${viewLevel === 'state' ? 'bg-[#003366] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                State
              </button>
              <button
                onClick={() => setViewLevel('district')}
                className={`px-1.5 sm:px-2.5 py-1 rounded transition ${viewLevel === 'district' ? 'bg-[#003366] text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                District
              </button>
            </div>

            {/* State selector dropdown - hidden on very small screens */}
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setViewLevel('state');
              }}
              className="hidden sm:block h-7 px-2 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#003366] max-w-[140px]"
            >
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Simulation Tools - hidden on mobile */}
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
                + Red Zone
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

        {/* Row 2: Layer toggle filters - hidden on small screens */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono">
          <button
            onClick={() => setMapFilters({ showRedZones: !mapFilters.showRedZones })}
            className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
              mapFilters.showRedZones ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showRedZones ? 'bg-red-600' : 'bg-slate-300'}`}></span>
            Red Zones
          </button>
          <button
            onClick={() => setMapFilters({ showRelocationSites: !mapFilters.showRelocationSites })}
            className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
              mapFilters.showRelocationSites ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showRelocationSites ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
            Safe Sites
          </button>
          <button
            onClick={() => setMapFilters({ showTransitCorridors: !mapFilters.showTransitCorridors })}
            className={`h-6 px-2 rounded border flex items-center gap-1 font-bold transition ${
              mapFilters.showTransitCorridors ? 'bg-blue-50 border-blue-300 text-[#003366]' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mapFilters.showTransitCorridors ? 'bg-[#003366]' : 'bg-slate-300'}`}></span>
            Routes
          </button>
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

            {/* Red Zone polygon */}
            {mapFilters.showRedZones && viewLevel === 'district' && (
              <Polygon
                positions={RED_ZONE_POLYGON}
                pathOptions={{
                  color: '#b91c1c',
                  weight: 2.5,
                  fillColor: '#fecaca',
                  fillOpacity: 0.35,
                  dashArray: '8,5',
                }}
              >
                <Popup>
                  <div className="text-xs font-sans">
                    <div className="font-bold text-red-800 text-sm">⚠ Active Subsidence Red Zone</div>
                    <div className="text-slate-600 mt-1">Ground displacement: <strong>14+ mm/month</strong></div>
                    <div className="text-slate-600">Source: ISRO NRSC InSAR Radar</div>
                    <div className="text-red-700 font-bold mt-1">Permanent habitation prohibited</div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* Habitation Zones (Drawn Areas in meters) */}
            {viewLevel === 'district' && habitations.map(hab => (
              <Circle
                key={`zone-${hab.id}`}
                center={[hab.coordinates.lat, hab.coordinates.lng]}
                radius={hab.riskScore >= 0.8 ? 800 : 600} // radius in meters
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
                    <div className="font-bold text-[#003366] text-sm">{hab.name} Zone</div>
                    <div className="text-slate-500 font-mono text-[10px]">{hab.code} • {hab.subDistrict}</div>
                    <table className="w-full mt-2 text-[11px]">
                      <tbody>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Population</td><td className="font-bold text-slate-900 font-mono">{hab.population.toLocaleString()}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Risk Score</td><td className="font-bold text-red-700 font-mono">{(hab.riskScore * 100).toFixed(0)}%</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Primary Hazard</td><td className="font-semibold">{hab.primaryHazard}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Priority</td><td className="font-bold text-[#d9531e]">{hab.priority}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Slope</td><td className="font-mono">{hab.slopeDegrees}°</td></tr>
                      </tbody>
                    </table>
                    <div className={`mt-2 text-[10px] font-bold px-2 py-1 rounded text-center ${
                      hab.isInsideRedZone ? 'bg-red-100 text-red-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {hab.isInsideRedZone ? '⚠ INSIDE RED ZONE' : `${hab.redZoneDistanceKm} km from Red Zone`}
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Safe site Zones (Drawn Areas in meters) */}
            {mapFilters.showRelocationSites && viewLevel === 'district' && sites.map(site => (
              <Circle
                key={`site-zone-${site.id}`}
                center={[site.coordinates.lat, site.coordinates.lng]}
                radius={600}
                pathOptions={{
                  color: '#059669',
                  weight: 2,
                  fillColor: '#10b981',
                  fillOpacity: 0.5,
                  dashArray: '4,4'
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedSiteId(site.id);
                    setSelectedViewType('site');
                    setIsDrawerCollapsed(false);
                  },
                }}
              >
                <Popup>
                  <div className="text-xs font-sans min-w-[200px]">
                    <div className="font-bold text-emerald-800 text-sm">{site.name}</div>
                    <div className="text-slate-500 font-mono text-[10px]">{site.code} • {site.location}</div>
                    <table className="w-full mt-2 text-[11px]">
                      <tbody>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Effective Capacity</td><td className="font-bold text-emerald-700 font-mono">{site.resourceCapacity.effectiveCapacity.toLocaleString()}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Allocated</td><td className="font-bold font-mono">{site.totalAllocated.toLocaleString()}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Bottleneck</td><td className="font-bold text-amber-700">{site.resourceCapacity.bottleneck}</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Safety Score</td><td className="font-mono">{(site.safetyScore * 100).toFixed(0)}%</td></tr>
                        <tr><td className="text-slate-500 pr-3 py-0.5">Accessibility</td><td className="text-[10px]">{site.accessibility}</td></tr>
                      </tbody>
                    </table>
                    <div className="mt-2 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-center">
                      ✓ VERIFIED SAFE — Outside Red Zone
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* Evacuation route polylines */}
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

            {/* Road R12 blockage marker */}
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
          <div className="absolute bottom-3 left-3 bg-white/95 rounded border border-slate-200 px-2 sm:px-3 py-1.5 shadow-sm flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-600 font-mono z-[1000]">
            <span className="text-[#003366] font-bold">{mapView.center[0].toFixed(2)}°N {mapView.center[1].toFixed(2)}°E</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Zoom: {mapView.zoom}</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">OSM Live</span>
            </span>
          </div>
        </div>

        {/* ── RIGHT INTELLIGENCE DRAWER ── */}
        <aside
          className={`${
            isDrawerCollapsed ? 'w-10' : 'w-full sm:w-80'
          } bg-white border-l border-slate-200 shadow-sm z-20 flex flex-col shrink-0 h-full transition-all duration-200 overflow-hidden font-sans absolute top-0 right-0 sm:relative`}
        >
          {isDrawerCollapsed ? (
            <button
              onClick={() => setIsDrawerCollapsed(false)}
              className="p-2 text-[#003366] hover:bg-slate-50 h-full flex flex-col items-center justify-start gap-3"
              title="Expand Intelligence Drawer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              <span className="text-[10px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap mt-8">
                {selectedViewType === 'site' ? 'SITE INTEL' : 'SETTLEMENT'}
              </span>
            </button>
          ) : (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] tracking-wider text-[#003366] font-bold uppercase font-mono">
                    {selectedViewType === 'site' ? 'SAFE SITE' : 'SETTLEMENT'} INTEL
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedViewType === 'site' ? currentSite.name : selectedHabitation.name}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {selectedViewType === 'site'
                      ? `${currentSite.location} • Elev: ${currentSite.elevationMeters}m`
                      : `${selectedHabitation.subDistrict} • ${selectedHabitation.code}`}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerCollapsed(true)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              {selectedViewType === 'site' ? (
                /* ── SITE VIEW ── */
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="bg-emerald-700 text-white p-2 rounded-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span className="text-[11px] font-bold tracking-wider uppercase">TIER 1 SAFE HUB</span>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-900 text-[9px] rounded-sm font-bold font-mono">VERIFIED</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-emerald-900 font-bold uppercase">Capacity</span>
                      <span className="text-base font-bold text-emerald-800 font-mono">{currentSite.resourceCapacity.effectiveCapacity.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-slate-500 font-bold uppercase">Allocated</span>
                      <span className="text-base font-bold text-slate-900 font-mono">{currentSite.totalAllocated.toLocaleString()}</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded-sm">
                      <span className="block text-[9px] text-amber-900 font-bold uppercase">Bottleneck</span>
                      <span className="text-xs font-bold text-amber-800 font-mono block truncate">{currentSite.resourceCapacity.bottleneck}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-sm divide-y divide-slate-100 text-xs">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                      <span className="text-slate-600">Area Capacity</span>
                      <span className="font-bold font-mono">{currentSite.resourceCapacity.areaCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-slate-600">Water Capacity</span>
                      <span className="font-bold font-mono text-emerald-700">{currentSite.resourceCapacity.waterCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                      <span className="text-slate-600">Sanitation Cap.</span>
                      <span className="font-bold font-mono text-amber-700">{currentSite.resourceCapacity.sanitationCapacity.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-slate-600">Healthcare Cap.</span>
                      <span className="font-bold font-mono">{currentSite.resourceCapacity.healthcareCapacity.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedViewType('habitation')}
                    className="w-full h-8 bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold rounded-sm flex items-center justify-center gap-1 transition"
                  >
                    Switch to Settlement View
                  </button>
                </div>
              ) : (
                /* ── HABITATION VIEW ── */
                <>
                  <div className="px-3 pt-2.5 shrink-0">
                    <div className="bg-[#d9531e] text-white p-2 rounded-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span className="text-[11px] font-bold tracking-wider uppercase">
                          {selectedHabitation.priority} PRIORITY
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-[#611b00] text-[9px] rounded-sm font-bold font-mono">LVL 1</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                          Recommended Site
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
                      Inspect {recommendedSite.name.split('(')[0]}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
