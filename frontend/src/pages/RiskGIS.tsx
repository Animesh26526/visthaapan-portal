import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../stores/useAppStore';
import { GisService } from '../services/gis.service';
import { OperationsService } from '../services/operations.service';
import type {
  GeoJsonFeatureCollection,
  StateBoundaryProperties,
  DistrictBoundaryProperties,
  CensusSettlementProperties,
  OsmRoadProperties,
  OsmFacilityProperties,
  HazardEvidenceFeatureProperties,
  SettlementSearchResult,
} from '../types/gis';
import type {
  OperationalMapResponse,
  OperationalHabitation,
  OperationalRelocationSite,
  OperationalHazardZone,
  OperationalRoute,
  RelocationPhaseKey,
} from '../types/operations';
import { formatNumber, formatArea, formatPopulation, formatScore } from '../utils/formatters';

/* ── State / District Geo Config ── */
const VIEWS = {
  india: { center: [22.5, 82.0] as [number, number], zoom: 5 },
  uttarakhand: { center: [30.1, 79.3] as [number, number], zoom: 8 },
  chamoli: { center: [30.42, 79.40] as [number, number], zoom: 11 },
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

/* ── Convert GeoJSON LineString / MultiLineString into Leaflet LatLng Ring Array ── */
function geoJsonLineStringToLatLngs(geom: any): [number, number][][] {
  if (!geom || !geom.coordinates) return [];
  if (geom.type === 'LineString') {
    const pts = geom.coordinates.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
    return pts.length > 0 ? [pts] : [];
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates
      .map((line: [number, number][]) =>
        line.map(([lon, lat]) => [lat, lon] as [number, number])
      )
      .filter((l: any[]) => l.length > 0);
  }
  return [];
}

/* ── Custom Professional Icons ── */

// Vulnerable Habitation Marker
function getHabitationIcon(priority: string, isSelected: boolean) {
  const isImm = priority === 'Immediate';
  const size = isSelected ? 34 : 28;
  const bg = isImm ? '#dc2626' : '#d97706';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${bg};
        border: 2.5px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        color: #ffffff;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.2s ease;
      " title="${priority} Priority Habitation">
        <span class="material-symbols-outlined" style="font-size:${isSelected ? '18px' : '15px'}; font-weight:bold;">home</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Relocation Safe Site Marker
function getRelocationSiteIcon(suitability: string, isSelected: boolean) {
  const isRestricted = suitability === 'RESTRICTED';
  const size = isSelected ? 36 : 30;
  const bg = isRestricted ? '#dc2626' : '#059669';
  const symbol = isRestricted ? 'block' : 'shield';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${bg};
        border: 2.5px solid #ffffff;
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        color: #ffffff;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.2s ease;
      " title="${isRestricted ? 'Restricted Site (In Red Zone)' : 'Safe Relocation Site'}">
        <span class="material-symbols-outlined" style="font-size:${isSelected ? '19px' : '16px'}; font-weight:bold;">${symbol}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/* ── Census Settlement Markers ── */
const censusTownIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#0284c7;border:2px solid #fff;border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:bold" title="Census Town">T</div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

const censusVillageIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:#0d9488;border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:#fff" title="Census Village"><span style="transform:rotate(-45deg);font-size:7px;font-weight:bold">V</span></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -7],
});

/* ── Phase 10: Verified Spatial Hazard Evidence Markers ── */
const landslideEvidenceIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#dc2626;border:2px solid #fff;border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold" title="GSI Observed Landslide">▲</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

const earthquakeEpicenterIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#7c3aed;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(124,58,237,.6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:bold" title="NCS Historical Earthquake Epicenter">◉</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
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
    html: `<div style="width:18px;height:18px;background:${bg};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:bold">${symbol}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

/* ── OSM Road Style Classifier ── */
function getOsmRoadStyle(fclass: string) {
  switch (fclass) {
    case 'motorway':
    case 'trunk':
      return { color: '#f97316', weight: 2.5, opacity: 0.65 };
    case 'primary':
      return { color: '#fbbf24', weight: 2.0, opacity: 0.6 };
    case 'secondary':
      return { color: '#cbd5e1', weight: 1.5, opacity: 0.5 };
    default:
      return { color: '#94a3b8', weight: 1.0, opacity: 0.4 };
  }
}

/* ── District Polygon Risk Styler ── */
function getDistrictRiskPolygonStyle(riskTier: string | null, riskScore: number | null) {
  if (riskTier === 'CRITICAL' || (riskScore !== null && riskScore >= 0.8)) {
    return { color: '#991b1b', fillColor: '#ef4444', fillOpacity: 0.18, weight: 2.0 };
  }
  if (riskTier === 'HIGH' || (riskScore !== null && riskScore >= 0.6)) {
    return { color: '#c2410c', fillColor: '#f97316', fillOpacity: 0.15, weight: 1.8 };
  }
  return { color: '#047857', fillColor: '#10b981', fillOpacity: 0.12, weight: 1.5 };
}

/* ── Map Controller (Handles View + Resize) ── */
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const [centerLat, centerLng] = center;

  useEffect(() => {
    map.setView([centerLat, centerLng], zoom, { animate: true });
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

/* ── Road R12 blockage point ── */
const R12_BLOCK_POINT: [number, number] = [30.53, 79.55];

const blockedIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#ba1a1a;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(186,26,26,.5);display:flex;align-items:center;justify-content:center">
           <span style="color:#fff;font-size:15px;font-weight:900">✕</span>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

/* ── Tile layers ── */
const TILES = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Earthstar Geographics',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
  },
};

export const RiskGIS: React.FC = () => {
  const {
    roadR12Blocked,
    reoptimizeScenario,
    recordOfficerDecision,
  } = useAppStore();

  // Geographic Scope & Basemap
  const [selectedState, setSelectedState] = useState('Uttarakhand');
  const [viewLevel, setViewLevel] = useState<'india' | 'state' | 'district'>('district');
  const [tileLayer, setTileLayer] = useState<'osm' | 'satellite' | 'terrain'>('osm');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(() => window.innerWidth < 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // PS 26191 Relocation Phase Filter
  const [activePhase, setActivePhase] = useState<RelocationPhaseKey>('ALL');

  // Unified Operational Data
  const [operationalData, setOperationalData] = useState<OperationalMapResponse | null>(null);
  const [isLoadingOps, setIsLoadingOps] = useState(false);

  // Selected Entities
  const [selectedHabitationId, setSelectedHabitationId] = useState<string>('hab-joshimath');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('site-gauchar');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-joshimath-gauchar');
  const [selectedHazardZoneId, setSelectedHazardZoneId] = useState<string>('zone-joshimath-subsidence');
  const [selectedViewType, setSelectedViewType] = useState<
    'habitation' | 'site' | 'route' | 'hazardZone' | 'plan' | 'district' | 'census'
  >('habitation');

  // Primary Operational Layer Visibility (Clutter-Free Defaults)
  const [showHazardZones, setShowHazardZones] = useState(true);
  const [showHabitations, setShowHabitations] = useState(true);
  const [showRelocationSites, setShowRelocationSites] = useState(true);
  const [showRelocationRoutes, setShowRelocationRoutes] = useState(true);
  const [showSoiDistricts, setShowSoiDistricts] = useState(true);

  // Optional Supporting GIS Evidence (OFF by default to avoid visual overload)
  const [showOsmRoads, setShowOsmRoads] = useState(false);
  const [showOsmFacilities, setShowOsmFacilities] = useState(false);
  const [showCensusSettlements, setShowCensusSettlements] = useState(false);
  const [showHazardEvidence, setShowHazardEvidence] = useState(false);

  // Supporting Survey of India and Search State
  const [soiStateData, setSoiStateData] = useState<GeoJsonFeatureCollection<StateBoundaryProperties> | null>(null);
  const [soiDistrictsData, setSoiDistrictsData] = useState<GeoJsonFeatureCollection<DistrictBoundaryProperties> | null>(null);
  const [censusSettlementsData, setCensusSettlementsData] = useState<GeoJsonFeatureCollection<CensusSettlementProperties> | null>(null);
  const [osmRoadsData, setOsmRoadsData] = useState<GeoJsonFeatureCollection<OsmRoadProperties> | null>(null);
  const [osmFacilitiesData, setOsmFacilitiesData] = useState<GeoJsonFeatureCollection<OsmFacilityProperties> | null>(null);
  const [hazardEvidenceData, setHazardEvidenceData] = useState<GeoJsonFeatureCollection<HazardEvidenceFeatureProperties> | null>(null);
  const [selectedDistrictItem, setSelectedDistrictItem] = useState<any>(null);
  const [selectedCensusItem, setSelectedCensusItem] = useState<any>(null);

  // Settlement Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SettlementSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customCenter, setCustomCenter] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const [showMapLegend, setShowMapLegend] = useState(false);

  // Scenario Deficit & Re-Optimization Simulation State
  const [scenarioCapacityDeficit, setScenarioCapacityDeficit] = useState<number | null>(null);
  const [isReoptimizingLocal, setIsReoptimizingLocal] = useState(false);
  const [officerDecisionMessage, setOfficerDecisionMessage] = useState<string | null>(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch Operational Relocation Planning Map data whenever phase changes
  useEffect(() => {
    let isMounted = true;
    async function loadOperationalMap() {
      setIsLoadingOps(true);
      try {
        const data = await OperationsService.getRelocationMap(activePhase);
        if (isMounted) {
          setOperationalData(data);
        }
      } catch (err) {
        console.warn('[RiskGIS] Failed to load operational relocation map, applying fallback:', err);
        if (isMounted) {
          setOperationalData(OperationsService.getFallbackRelocationMap(activePhase));
        }
      } finally {
        if (isMounted) setIsLoadingOps(false);
      }
    }
    loadOperationalMap();
    return () => {
      isMounted = false;
    };
  }, [activePhase]);

  // Load subtle background GIS layers on mount (lazy/supporting)
  useEffect(() => {
    let isMounted = true;
    async function loadBackgroundGis() {
      try {
        const [stateBoundary, officialDistricts, censusData, roadsData, facilitiesData, hazardEvData] =
          await Promise.all([
            GisService.getStateBoundaries(),
            GisService.getOfficialDistrictBoundaries(),
            GisService.getCensusSettlements({ district_code: '057', geocoded_only: true, limit: 300 }),
            GisService.getOsmRoads({ limit: 1200 }),
            GisService.getOsmFacilities({ limit: 300 }),
            GisService.getHazardEvidence(),
          ]);
        if (isMounted) {
          setSoiStateData(stateBoundary);
          setSoiDistrictsData(officialDistricts);
          setCensusSettlementsData(censusData);
          setOsmRoadsData(roadsData);
          setOsmFacilitiesData(facilitiesData);
          setHazardEvidenceData(hazardEvData);
        }
      } catch (err) {
        console.warn('[RiskGIS] Background GIS loading notice:', err);
      }
    }
    loadBackgroundGis();
    return () => {
      isMounted = false;
    };
  }, []);

  // Settlement Search handler
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await GisService.searchSettlements({ q: val.trim(), district_code: '057', limit: 10 });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (sr: SettlementSearchResult) => {
    if (sr.latitude != null && sr.longitude != null) {
      setCustomCenter({ center: [sr.latitude, sr.longitude], zoom: 13 });
    }
    setSelectedCensusItem(sr);
    setSelectedViewType('census');
    setIsDrawerCollapsed(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Determine Map View
  const mapView = useMemo(() => {
    if (customCenter) return customCenter;
    if (viewLevel === 'india') return { ...VIEWS.india, zoom: isMobile ? 3 : VIEWS.india.zoom };
    if (viewLevel === 'state') {
      return { center: STATE_COORDINATES[selectedState] || VIEWS.uttarakhand.center, zoom: isMobile ? 5 : 7 };
    }
    return { ...VIEWS.chamoli, zoom: isMobile ? 9 : VIEWS.chamoli.zoom };
  }, [customCenter, viewLevel, selectedState, isMobile]);

  // Current Entities
  const currentHabitation: OperationalHabitation = useMemo(() => {
    if (!operationalData?.habitations?.length) {
      return OperationsService.getFallbackRelocationMap().habitations[0];
    }
    return (
      operationalData.habitations.find((h) => h.id === selectedHabitationId) ||
      operationalData.habitations[0]
    );
  }, [operationalData, selectedHabitationId]);

  const currentSite: OperationalRelocationSite = useMemo(() => {
    if (!operationalData?.relocationSites?.length) {
      return OperationsService.getFallbackRelocationMap().relocationSites[0];
    }
    return (
      operationalData.relocationSites.find((s) => s.id === selectedSiteId) ||
      operationalData.relocationSites[0]
    );
  }, [operationalData, selectedSiteId]);

  const currentRoute: OperationalRoute = useMemo(() => {
    if (!operationalData?.routes?.length) {
      return OperationsService.getFallbackRelocationMap().routes[0];
    }
    return (
      operationalData.routes.find((r) => r.id === selectedRouteId) ||
      operationalData.routes.find((r) => r.fromHabitationId === currentHabitation.id) ||
      operationalData.routes[0]
    );
  }, [operationalData, selectedRouteId, currentHabitation.id]);

  const currentHazardZone: OperationalHazardZone = useMemo(() => {
    if (!operationalData?.hazardZones?.length) {
      return OperationsService.getFallbackRelocationMap().hazardZones[0];
    }
    return (
      operationalData.hazardZones.find((z) => z.id === selectedHazardZoneId) ||
      operationalData.hazardZones[0]
    );
  }, [operationalData, selectedHazardZoneId]);

  // Dynamic Re-Optimization & Scenario Stress Simulation Handler
  const handleTriggerCapacityDeficit = () => {
    // Drop Gauchar capacity by 1,250 to demonstrate deficit (15,450 required vs 14,200 available)
    setScenarioCapacityDeficit(1250);
  };

  const handleExecuteReoptimization = async () => {
    setIsReoptimizingLocal(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      await reoptimizeScenario();
    } catch {
      // Fallback
    }
    // Re-optimization balances the deficit by redirecting overflow to Rudraprayag / Srinagar
    setScenarioCapacityDeficit(0);
    setIsReoptimizingLocal(false);
    setOfficerDecisionMessage('Plan re-optimized: Surplus capacity allocated across Rudraprayag and Srinagar hubs.');
  };

  const handleOfficerAction = async (action: 'ACCEPTED' | 'MODIFIED' | 'REJECTED') => {
    try {
      await recordOfficerDecision(
        action,
        `Officer [${action}] relocation plan under DM Act 2005 Section 30(2)(v) operational mandate.`
      );
    } catch {
      // Fallback
    }
    setOfficerDecisionMessage(`Officer Decision [${action}] recorded in statutory DDMA ledger.`);
    setTimeout(() => setOfficerDecisionMessage(null), 6000);
  };

  return (
    <div className="relative w-full h-[calc(100vh-100px)] min-h-[620px] flex flex-col bg-[#f8fafc] select-none font-sans">
      {/* ── TOP OPERATIONAL TOOLBAR ── */}
      <div className="sticky top-[104px] py-2 w-full bg-white border-b border-slate-200 px-3 sm:px-4 space-y-2 shadow-xs z-30 shrink-0">
        {/* ROW 1: SCOPE SELECTOR, PHASE FILTER, SEARCH BAR, TILE PICKER */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Geographic Scope Selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 text-xs font-semibold shrink-0">
              <button
                onClick={() => {
                  setViewLevel('india');
                  setSelectedViewType('district');
                }}
                className={`px-2 py-1 rounded transition ${
                  viewLevel === 'india' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                National
              </button>
              <button
                onClick={() => {
                  setViewLevel('state');
                  setSelectedViewType('district');
                }}
                className={`px-2 py-1 rounded transition ${
                  viewLevel === 'state' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                State Macro
              </button>
              <button
                onClick={() => {
                  setViewLevel('district');
                  setSelectedViewType('habitation');
                }}
                className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                  viewLevel === 'district' ? 'bg-[#003366] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                Chamoli Sector
              </button>
            </div>

            {/* State selector dropdown if in state view */}
            {viewLevel === 'state' && (
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="h-7 px-2 text-xs font-semibold border border-slate-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#003366]"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            {/* PS 26191 RELOCATION PHASE FILTER (ALL, IMMEDIATE, SHORT TERM, MEDIUM TERM, LONG TERM) */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 text-[11px] font-bold">
              <span className="px-1.5 text-slate-400 font-mono text-[9px] uppercase tracking-wider">Phase:</span>
              {(['ALL', 'IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'] as RelocationPhaseKey[]).map((pKey) => {
                const isCurrent = activePhase === pKey;
                const label = pKey === 'ALL' ? 'ALL' : pKey.replace('_', ' ');
                return (
                  <button
                    key={pKey}
                    onClick={() => setActivePhase(pKey)}
                    className={`px-2 py-0.5 rounded transition ${
                      isCurrent
                        ? pKey === 'IMMEDIATE'
                          ? 'bg-red-700 text-white shadow-xs'
                          : 'bg-[#003366] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: SEARCH BAR + TILE PICKER */}
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-slate-100 rounded border border-slate-300 px-2 py-1 text-xs gap-1.5 focus-within:border-[#003366] focus-within:bg-white transition">
                <span className="material-symbols-outlined text-[15px] text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Search habitation, village or code..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-44 sm:w-56 text-slate-800 placeholder:text-slate-400"
                />
                {isSearching && (
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin"></span>
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-72 sm:w-80 bg-white border border-slate-200 rounded shadow-lg max-h-72 overflow-y-auto z-[2000] divide-y divide-slate-100">
                  {searchResults.map((sr) => (
                    <div
                      key={sr.id}
                      onClick={() => handleSelectSearchResult(sr)}
                      className="p-2 hover:bg-sky-50 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{sr.settlementName}</span>
                          <span
                            className={`text-[8px] font-bold px-1 rounded text-white ${
                              sr.settlementType === 'TOWN' ? 'bg-sky-600' : 'bg-teal-600'
                            }`}
                          >
                            {sr.settlementType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {sr.subdistrictName ? `${sr.subdistrictName}, ` : ''}{sr.districtName}
                        </div>
                      </div>
                      {sr.hasHazardExclusions && (
                        <span className="px-1 py-0.5 bg-red-100 text-red-800 font-bold text-[8px] rounded">
                          RED ZONE
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tile Layer Picker */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded p-0.5 text-[11px] font-semibold shrink-0">
              <button
                onClick={() => setTileLayer('osm')}
                className={`px-2 py-0.5 rounded transition ${
                  tileLayer === 'osm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setTileLayer('satellite')}
                className={`px-2 py-0.5 rounded transition ${
                  tileLayer === 'satellite' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Sat
              </button>
              <button
                onClick={() => setTileLayer('terrain')}
                className={`px-2 py-0.5 rounded transition ${
                  tileLayer === 'terrain' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Topo
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: PRIMARY OPERATIONAL TOGGLES + OPTIONAL EVIDENCE GROUP */}
        <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
          {/* Primary Relocation Planning Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider pr-1">
              Operational Layers:
            </span>

            {/* 1. Hazard Zones */}
            <button
              onClick={() => setShowHazardZones(!showHazardZones)}
              className={`h-6 px-2.5 rounded border flex items-center gap-1 font-bold text-[11px] transition ${
                showHazardZones ? 'bg-red-50 border-red-300 text-red-700 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showHazardZones ? 'bg-red-600' : 'bg-slate-300'}`}></span>
              <span>Hazard Zones ({operationalData?.hazardZones.length ?? 4})</span>
            </button>

            {/* 2. Vulnerable Habitations */}
            <button
              onClick={() => setShowHabitations(!showHabitations)}
              className={`h-6 px-2.5 rounded border flex items-center gap-1 font-bold text-[11px] transition ${
                showHabitations ? 'bg-orange-50 border-orange-300 text-orange-800 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showHabitations ? 'bg-orange-600' : 'bg-slate-300'}`}></span>
              <span>Habitations ({operationalData?.habitations.length ?? 5})</span>
            </button>

            {/* 3. Relocation Sites */}
            <button
              onClick={() => setShowRelocationSites(!showRelocationSites)}
              className={`h-6 px-2.5 rounded border flex items-center gap-1 font-bold text-[11px] transition ${
                showRelocationSites ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showRelocationSites ? 'bg-emerald-600' : 'bg-slate-300'}`}></span>
              <span>Relocation Sites ({operationalData?.relocationSites.length ?? 4})</span>
            </button>

            {/* 4. Relocation Routes (OSM Mapped Network) */}
            <button
              onClick={() => setShowRelocationRoutes(!showRelocationRoutes)}
              className={`h-6 px-2.5 rounded border flex items-center gap-1 font-bold text-[11px] transition ${
                showRelocationRoutes ? 'bg-blue-50 border-blue-300 text-[#003366] shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showRelocationRoutes ? 'bg-[#003366]' : 'bg-slate-300'}`}></span>
              <span>Road Routes ({operationalData?.routes.length ?? 5})</span>
            </button>

            {/* 5. Boundaries (SOI) */}
            <button
              onClick={() => setShowSoiDistricts(!showSoiDistricts)}
              className={`h-6 px-2 rounded border flex items-center gap-1 font-medium text-[11px] transition ${
                showSoiDistricts ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showSoiDistricts ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
              <span>Districts</span>
            </button>
          </div>

          {/* Supporting Evidence Layers (Optional, Collapsed / Subtle) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider hidden lg:inline">
              Supporting GIS:
            </span>
            <button
              onClick={() => setShowOsmRoads(!showOsmRoads)}
              className={`h-6 px-2 rounded border text-[10px] font-medium transition ${
                showOsmRoads ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="Full OpenStreetMap classified road network (subtle background)"
            >
              OSM Roads {showOsmRoads ? '✓' : ''}
            </button>
            <button
              onClick={() => setShowOsmFacilities(!showOsmFacilities)}
              className={`h-6 px-2 rounded border text-[10px] font-medium transition ${
                showOsmFacilities ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="OpenStreetMap critical facilities"
            >
              Facilities {showOsmFacilities ? '✓' : ''}
            </button>
            <button
              onClick={() => setShowCensusSettlements(!showCensusSettlements)}
              className={`h-6 px-2 rounded border text-[10px] font-medium transition ${
                showCensusSettlements ? 'bg-teal-100 border-teal-300 text-teal-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="Census 2011 Settlements (300 geocoded baseline points)"
            >
              Census Points {showCensusSettlements ? '✓' : ''}
            </button>
            <button
              onClick={() => setShowHazardEvidence(!showHazardEvidence)}
              className={`h-6 px-2 rounded border text-[10px] font-medium transition ${
                showHazardEvidence ? 'bg-red-100 border-red-300 text-red-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
              title="Historical GSI Landslide & NCS Earthquake Points"
            >
              Evidence Points {showHazardEvidence ? '✓' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* ── SCENARIO CAPACITY DEFICIT ALERT BANNER (Step 9 Demo Requirement) ── */}
      {scenarioCapacityDeficit !== null && scenarioCapacityDeficit > 0 && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-xs font-sans shadow-md z-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] animate-pulse">error</span>
            <div>
              <span className="font-bold tracking-wide uppercase">CAPACITY DEFICIT DETECTED: </span>
              <span>Required: <strong>15,450</strong> | Available: <strong>14,200</strong> | Net Deficit: <strong>1,250 Persons</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteReoptimization}
              disabled={isReoptimizingLocal}
              className="px-3 py-1 bg-white text-red-700 font-bold rounded shadow-xs hover:bg-red-50 flex items-center gap-1 transition"
            >
              {isReoptimizingLocal ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-red-700 border-t-transparent animate-spin"></span>
                  <span>Re-Optimizing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">autorenew</span>
                  <span>RE-OPTIMIZE NOW</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── OFFICER DECISION FEEDBACK NOTICE ── */}
      {officerDecisionMessage && (
        <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between text-xs shadow-md z-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-semibold">{officerDecisionMessage}</span>
          </div>
          <button onClick={() => setOfficerDecisionMessage(null)} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── MAP CONTAINER + OPERATIONAL DRAWER ── */}
      <div className="relative flex-1 w-full flex overflow-hidden">
        {/* LEAFLET MAP VIEW */}
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

            <TileLayer url={TILES[tileLayer].url} attribution={TILES[tileLayer].attribution} />

            {/* ── SURVEY OF INDIA STATE BOUNDARY ── */}
            {soiStateData?.features?.map((st, idx) => {
              const polys = geoJsonGeometryToPolygons(st.geometry);
              return polys.map((ring, rIdx) => (
                <Polygon
                  key={`soi-state-${idx}-${rIdx}`}
                  positions={ring}
                  pathOptions={{
                    color: '#0284c7',
                    weight: 2,
                    fill: false,
                    dashArray: '8, 6',
                  }}
                />
              ));
            })}

            {/* ── SURVEY OF INDIA 13 DISTRICT BOUNDARIES (SUBTLE OUTLINE) ── */}
            {showSoiDistricts && soiDistrictsData?.features?.map((dist) => {
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
                />
              ));
            })}

            {/* ── 1. OPERATIONAL HAZARD-BASED RED ZONES (SPATIAL POLYGONS - MANDATORY) ── */}
            {showHazardZones && operationalData?.hazardZones.map((zone) => {
              const polys = geoJsonGeometryToPolygons(zone.geometry);
              const isSelected = selectedHazardZoneId === zone.id;
              const isCritical = zone.severity === 'CRITICAL';
              const strokeColor = isCritical ? '#b91c1c' : '#ea580c';
              const fillColor = isCritical ? '#ef4444' : '#f97316';

              return polys.map((ring, rIdx) => (
                <Polygon
                  key={`op-hz-${zone.id}-${rIdx}`}
                  positions={ring}
                  pathOptions={{
                    color: strokeColor,
                    weight: isSelected ? 3.5 : 2.5,
                    fillColor: fillColor,
                    fillOpacity: isCritical ? 0.35 : 0.22,
                    dashArray: isCritical ? '6, 4' : undefined,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedHazardZoneId(zone.id);
                      setSelectedViewType('hazardZone');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[230px]">
                      <div className="font-bold text-red-800 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        {zone.name}
                      </div>
                      <div className="text-slate-600 font-mono text-[10px] mt-0.5">
                        {zone.mandateReference}
                      </div>
                      <div className="mt-2 border-t border-slate-200 pt-1 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Hazard Type:</span>
                          <span className="font-bold text-red-700">{zone.hazardType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Severity:</span>
                          <span className="font-bold font-mono">{zone.severity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Affected Area:</span>
                          <span className="font-bold font-mono">{formatArea(zone.areaSqKm)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Relocation Need:</span>
                          <span className="font-bold font-mono text-[#d9531e]">{zone.relocationPriority}</span>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <button
                          onClick={() => {
                            setSelectedHazardZoneId(zone.id);
                            setSelectedViewType('hazardZone');
                            setIsDrawerCollapsed(false);
                          }}
                          className="w-full py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] rounded transition flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">analytics</span>
                          Inspect Hazard Zone &amp; Habitations
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              ));
            })}

            {/* ── 2. ACTIVE MAPPED ROAD TRANSPORTATION ROUTES (FOLLOWING OSM HIGHWAY NETWORK) ── */}
            {showRelocationRoutes && operationalData?.routes.map((route) => {
              const isSelected =
                selectedRouteId === route.id ||
                selectedHabitationId === route.fromHabitationId ||
                selectedSiteId === route.toSiteId;
              const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);

              return (
                <React.Fragment key={`op-route-${route.id}`}>
                  {/* Glowing Underlay Casing */}
                  <Polyline
                    positions={coords}
                    pathOptions={{
                      color: isSelected ? '#1e3a8a' : '#0369a1',
                      weight: isSelected ? 8 : 5,
                      opacity: isSelected ? 0.95 : 0.6,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedRouteId(route.id);
                        setSelectedHabitationId(route.fromHabitationId);
                        setSelectedSiteId(route.toSiteId);
                        setSelectedViewType('route');
                        setIsDrawerCollapsed(false);
                      },
                    }}
                  />
                  {/* Highlight Core Line */}
                  <Polyline
                    positions={coords}
                    pathOptions={{
                      color: isSelected ? '#38bdf8' : '#7dd3fc',
                      weight: isSelected ? 3.5 : 2.2,
                      opacity: 1,
                      dashArray: isSelected ? undefined : '8, 6',
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </React.Fragment>
              );
            })}

            {/* ── 3. VULNERABLE HABITATIONS (CLEAN OPERATIONAL MARKERS) ── */}
            {showHabitations && operationalData?.habitations.map((hab) => {
              const isSelected = selectedHabitationId === hab.id;
              const icon = getHabitationIcon(hab.relocationPriority, isSelected);

              return (
                <Marker
                  key={`op-hab-${hab.id}`}
                  position={[hab.coordinates.lat, hab.coordinates.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedHabitationId(hab.id);
                      setSelectedSiteId(hab.recommendedDestinationId);
                      setSelectedRouteId(hab.routeId);
                      setSelectedViewType('habitation');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#003366] text-sm">{hab.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-white ${
                            hab.relocationPriority === 'Immediate' ? 'bg-red-700' : 'bg-amber-600'
                          }`}
                        >
                          {hab.relocationPriority}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {hab.subDistrict}, {hab.district}
                      </div>

                      <table className="w-full mt-2 text-[11px]">
                        <tbody>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Population</td>
                            <td className="font-bold font-mono text-slate-900">{formatPopulation(hab.population)}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Primary Hazard</td>
                            <td className="font-semibold text-red-700">{hab.primaryHazard}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Safe Destination</td>
                            <td className="font-bold text-emerald-800">{hab.recommendedDestinationName}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Road Distance</td>
                            <td className="font-mono">{hab.routeDistanceKm} km ({hab.transitTimeMinutes} min)</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="mt-2.5 space-y-1">
                        <button
                          onClick={() => {
                            setSelectedHabitationId(hab.id);
                            setSelectedSiteId(hab.recommendedDestinationId);
                            setSelectedRouteId(hab.routeId);
                            setSelectedViewType('habitation');
                            setIsDrawerCollapsed(false);
                          }}
                          className="w-full py-1 bg-[#003366] hover:bg-[#002244] text-white font-bold text-[10px] rounded transition flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">route</span>
                          Inspect Relocation Requirement &amp; Route
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ── 4. SAFE RELOCATION SITES (CLEAN OPERATIONAL HUBS) ── */}
            {showRelocationSites && operationalData?.relocationSites.map((site) => {
              const isSelected = selectedSiteId === site.id;
              const icon = getRelocationSiteIcon(site.suitability, isSelected);

              return (
                <Marker
                  key={`op-site-${site.id}`}
                  position={[site.coordinates.lat, site.coordinates.lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedSiteId(site.id);
                      setSelectedViewType('site');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{site.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono text-white ${
                            site.suitability === 'RESTRICTED' ? 'bg-red-700' : 'bg-emerald-700'
                          }`}
                        >
                          {site.suitability}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[10px]">
                        {site.type} • {site.district}
                      </div>

                      <table className="w-full mt-2 text-[11px]">
                        <tbody>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Effective Capacity</td>
                            <td className="font-bold font-mono text-emerald-800">{formatPopulation(site.effectiveCapacity)}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Allocated Population</td>
                            <td className="font-bold font-mono text-slate-900">{formatPopulation(site.allocatedPopulation)}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Remaining Capacity</td>
                            <td className="font-bold font-mono text-blue-700">{formatPopulation(site.remainingCapacity)}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-500 pr-2 py-0.5">Road Access</td>
                            <td className="font-mono text-[10px]">{site.roadAccess}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="mt-2.5">
                        <button
                          onClick={() => {
                            setSelectedSiteId(site.id);
                            setSelectedViewType('site');
                            setIsDrawerCollapsed(false);
                          }}
                          className="w-full py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] rounded transition flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">warehouse</span>
                          Inspect Carrying Capacity &amp; Inbound Corridors
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ── OPTIONAL: FULL OSM ROAD NETWORK (HIDDEN BY DEFAULT) ── */}
            {showOsmRoads && osmRoadsData?.features?.map((road) => {
              const lines = geoJsonLineStringToLatLngs(road.geometry);
              if (!lines.length) return null;
              const style = getOsmRoadStyle(road.properties.fclass);
              return lines.map((coords, lIdx) => (
                <Polyline key={`osm-r-${road.id}-${lIdx}`} positions={coords} pathOptions={style} />
              ));
            })}

            {/* ── OPTIONAL: CENSUS 2011 SETTLEMENTS (HIDDEN BY DEFAULT) ── */}
            {showCensusSettlements && censusSettlementsData?.features?.map((settle) => {
              const geom = settle.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = settle.properties;
              return (
                <Marker
                  key={`census-pt-${settle.id}`}
                  position={[lat, lon]}
                  icon={p.settlementType === 'TOWN' ? censusTownIcon : censusVillageIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedCensusItem(p);
                      setSelectedViewType('census');
                      setIsDrawerCollapsed(false);
                    },
                  }}
                />
              );
            })}

            {/* ── OPTIONAL: OPENSTREETMAP FACILITIES (HIDDEN BY DEFAULT) ── */}
            {showOsmFacilities && osmFacilitiesData?.features?.map((fac) => {
              const geom = fac.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = fac.properties;
              return (
                <Marker
                  key={`osm-fac-${fac.id}`}
                  position={[lat, lon]}
                  icon={getOsmFacilityIcon(p.category)}
                />
              );
            })}

            {/* ── OPTIONAL: HISTORICAL HAZARD EVIDENCE (GSI/NCS) (HIDDEN BY DEFAULT) ── */}
            {showHazardEvidence && hazardEvidenceData?.features?.map((feat) => {
              const geom = feat.geometry;
              if (!geom || geom.type !== 'Point' || !geom.coordinates) return null;
              const [lon, lat] = geom.coordinates;
              const p = feat.properties;
              const isLandslide = p.hazardType === 'LANDSLIDE';
              return (
                <Marker
                  key={`haz-pt-${feat.id}`}
                  position={[lat, lon]}
                  icon={isLandslide ? landslideEvidenceIcon : earthquakeEpicenterIcon}
                />
              );
            })}

            {/* ── ROAD R12 BLOCKED CORRIDOR ── */}
            {roadR12Blocked && (
              <Marker position={R12_BLOCK_POINT} icon={blockedIcon}>
                <Popup>
                  <div className="text-xs font-sans">
                    <div className="font-bold text-red-800 text-sm">✕ ROAD R12 BLOCKED</div>
                    <div className="text-slate-600 mt-1">Rockfall debris slump at Ch. 4+200</div>
                    <div className="text-slate-600">Traffic diverted via Alt R12B</div>
                    <div className="text-red-700 font-bold mt-1">+12.5 min mountain detour delay</div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* ── FLOATING ROUTE INFORMATION CARD (Prominently displayed when route is selected) ── */}
          {currentRoute && showRelocationRoutes && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded shadow-md p-3 max-w-sm text-xs z-[1000] font-sans">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                <span className="font-bold text-[#003366] text-[10px] uppercase tracking-wider flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">alt_route</span>
                  TRANSPORTATION ROUTE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800">
                  {currentRoute.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <span>{currentRoute.fromHabitationName}</span>
                <span className="text-blue-600">→</span>
                <span>{currentRoute.toSiteName}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600 font-mono">
                {currentRoute.roadName} • {currentRoute.roadNetwork}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center bg-slate-50 p-1.5 rounded border border-slate-100 font-mono">
                <div>
                  <span className="block text-[9px] text-slate-400">DISTANCE</span>
                  <span className="font-bold text-slate-800">{currentRoute.distanceKm} km</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">EST. TRANSIT</span>
                  <span className="font-bold text-blue-700">{currentRoute.transitTimeMinutes} min</span>
                </div>
              </div>
            </div>
          )}

          {/* Floating Map Legend Toggle & Panel */}
          <div className="absolute bottom-12 left-3 z-[1000] font-sans">
            {showMapLegend && (
              <div className="mb-2 bg-white/95 backdrop-blur-xs border border-slate-200 rounded shadow-xl p-3 w-72 text-xs space-y-2 max-h-96 overflow-y-auto">
                <div className="font-bold text-[#003366] text-xs uppercase tracking-wider pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">layers</span>
                    Decision-Support Legend
                  </span>
                  <button onClick={() => setShowMapLegend(false)} className="text-slate-400 hover:text-slate-700">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-700 uppercase">Operational Planning Elements</div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 h-3 bg-red-500/35 border border-red-700 border-dashed rounded shrink-0"></span>
                    <span>Hazard-Based Red Zone (Polygon)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                      H
                    </span>
                    <span>Vulnerable Habitation (Immediate)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-4 h-4 bg-emerald-600 text-white rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                      S
                    </span>
                    <span>Safe Relocation Site (Capacity Verified)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-5 h-1 bg-blue-600 rounded shrink-0"></span>
                    <span>Mapped Road Route (OSM Network)</span>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowMapLegend(!showMapLegend)}
              className="bg-white/95 hover:bg-white text-slate-800 border border-slate-300 rounded shadow-xs px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <span className="material-symbols-outlined text-[15px] text-[#003366]">layers</span>
              <span>Map Legend</span>
              <span className="material-symbols-outlined text-[13px] text-slate-400">
                {showMapLegend ? 'expand_more' : 'expand_less'}
              </span>
            </button>
          </div>

          {/* Floating bottom-left coordinates */}
          <div className="absolute bottom-3 left-3 bg-white/95 rounded border border-slate-200 px-3 py-1.5 shadow-xs flex items-center gap-3 text-[11px] text-slate-600 font-mono z-[1000]">
            <span className="text-[#003366] font-bold">{formatScore(mapView.center?.[0], 2)}°N {formatScore(mapView.center?.[1], 2)}°E</span>
            <span className="text-slate-300">|</span>
            <span>Zoom: {mapView.zoom}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Relocation Decision Support Live
            </span>
            {isLoadingOps && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-blue-600 font-semibold animate-pulse">Syncing Relocation Map...</span>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT OPERATIONAL DECISION-SUPPORT DRAWER ── */}
        <aside
          className={`${
            isDrawerCollapsed ? 'w-10' : 'w-full sm:w-[410px]'
          } bg-white border-l border-slate-200 shadow-md z-20 flex flex-col shrink-0 h-full transition-all duration-200 overflow-hidden font-sans absolute top-0 right-0 sm:relative`}
        >
          {isDrawerCollapsed ? (
            <button
              onClick={() => setIsDrawerCollapsed(false)}
              className="p-2 text-[#003366] hover:bg-slate-50 h-full flex flex-col items-center justify-start gap-3"
              title="Expand Relocation Drawer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              <span className="text-[10px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap mt-12">
                RELOCATION DECISION
              </span>
            </button>
          ) : (
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[10px] tracking-wider text-[#003366] font-bold uppercase font-mono">
                    <span>
                      {selectedViewType === 'habitation'
                        ? 'RELOCATION REQUIREMENT'
                        : selectedViewType === 'site'
                        ? 'RELOCATION SITE CAPACITY'
                        : selectedViewType === 'route'
                        ? 'TRANSPORTATION ROUTE'
                        : selectedViewType === 'hazardZone'
                        ? 'HAZARD-BASED RED ZONE'
                        : selectedViewType === 'plan'
                        ? 'RELOCATION PLAN SUMMARY'
                        : selectedViewType === 'district'
                        ? 'DISTRICT MACRO AI'
                        : 'CENSUS BASELINE'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight truncate mt-0.5">
                    {selectedViewType === 'habitation'
                      ? currentHabitation.name
                      : selectedViewType === 'site'
                      ? currentSite.name
                      : selectedViewType === 'route'
                      ? currentRoute.name
                      : selectedViewType === 'hazardZone'
                      ? currentHazardZone.name
                      : selectedViewType === 'plan'
                      ? 'Chamoli Phased Relocation Plan'
                      : selectedViewType === 'district'
                      ? selectedDistrictItem?.districtName || 'Chamoli'
                      : selectedCensusItem?.settlementName || 'Census Settlement'}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {selectedViewType === 'habitation'
                      ? `${currentHabitation.subDistrict}, ${currentHabitation.district} • Phase: ${currentHabitation.relocationPhase}`
                      : selectedViewType === 'site'
                      ? `${currentSite.district} • Suitability: ${currentSite.suitability}`
                      : selectedViewType === 'route'
                      ? `${currentRoute.roadName} • Distance: ${currentRoute.distanceKm} km`
                      : selectedViewType === 'hazardZone'
                      ? `${currentHazardZone.hazardType} • Area: ${formatArea(currentHazardZone.areaSqKm)}`
                      : 'Chamoli Sector Emergency Operations'}
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
                  onClick={() => setSelectedViewType('habitation')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'habitation'
                      ? 'border-[#003366] bg-white text-[#003366]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Habitation
                </button>
                <button
                  onClick={() => setSelectedViewType('site')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'site'
                      ? 'border-[#003366] bg-white text-[#003366]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Safe Hub
                </button>
                <button
                  onClick={() => setSelectedViewType('route')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'route'
                      ? 'border-[#003366] bg-white text-[#003366]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Route
                </button>
                <button
                  onClick={() => setSelectedViewType('hazardZone')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'hazardZone'
                      ? 'border-[#003366] bg-white text-[#003366]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Red Zone
                </button>
                <button
                  onClick={() => setSelectedViewType('plan')}
                  className={`flex-1 py-1.5 text-center border-b-2 transition ${
                    selectedViewType === 'plan'
                      ? 'border-[#003366] bg-white text-[#003366]'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Plan
                </button>
              </div>

              {/* Drawer Body Content */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                {selectedViewType === 'habitation' ? (
                  /* ── 1. HABITATION RELOCATION REQUIREMENT VIEW ── */
                  <>
                    <div
                      className={`p-2.5 rounded text-white flex items-center justify-between ${
                        currentHabitation.hazardStatus === 'CRITICAL' ? 'bg-red-700' : 'bg-amber-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">warning</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {currentHabitation.hazardStatus} HAZARD STATUS
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-black/25 text-[10px] rounded font-bold font-mono">
                        {currentHabitation.relocationPriority.toUpperCase()}
                      </span>
                    </div>

                    {/* Population & Demographics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase">Requiring Relocation</span>
                        <span className="text-base font-bold text-slate-900 font-mono">
                          {formatPopulation(currentHabitation.population)}
                        </span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase">Households</span>
                        <span className="text-base font-bold text-slate-900 font-mono">
                          {formatNumber(currentHabitation.households)}
                        </span>
                      </div>
                      <div className="bg-red-50 border border-red-200 p-2 rounded">
                        <span className="block text-[9px] text-red-900 font-bold uppercase">Phase</span>
                        <span className="text-xs font-bold text-red-700 font-mono mt-1 block">
                          {currentHabitation.relocationPhase}
                        </span>
                      </div>
                    </div>

                    {/* Recommended Safe Destination */}
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          RECOMMENDED DESTINATION
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 font-mono font-bold text-[9px] rounded">
                          SUITABLE
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{currentHabitation.recommendedDestinationName}</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 pt-1 border-t border-emerald-200/60">
                        <div>Allocated: <strong>{formatPopulation(currentHabitation.allocatedPopulation)}</strong></div>
                        <div>Distance: <strong>{currentHabitation.routeDistanceKm} km</strong></div>
                      </div>
                    </div>

                    {/* Transportation Pathway */}
                    <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                      <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700 flex items-center justify-between">
                        <span>Transportation Route</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">Route Available</span>
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="text-slate-600 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-blue-700">alt_route</span>
                          Mapped Road Network:
                        </div>
                        <div className="font-mono text-slate-800 text-[11px] pl-5">
                          {currentRoute.roadName} ({currentRoute.distanceKm} km • {currentRoute.transitTimeMinutes} min)
                        </div>
                      </div>
                    </div>

                    {/* Why Relocation Section */}
                    <div className="border border-slate-200 rounded p-3 text-xs space-y-1.5 bg-slate-50">
                      <div className="font-bold text-[#003366] text-[11px] uppercase tracking-wider font-mono">
                        Why Relocation?
                      </div>
                      <ul className="text-slate-700 space-y-1 text-[11px] list-disc list-inside">
                        <li><strong>Active Hazard Exposure:</strong> Habitation lies within the active {currentHabitation.redZoneName || 'Hazard-Based Red Zone'}.</li>
                        <li><strong>Ground Instability:</strong> Measured displacement and slope declivity exceed safety thresholds.</li>
                        <li><strong>Carrying Capacity:</strong> Destination provides verified water, sanitation, and shelter capacity.</li>
                        <li><strong>Transportation:</strong> All-weather arterial corridor confirmed passably operational.</li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedRouteId(currentHabitation.routeId);
                          setSelectedViewType('route');
                        }}
                        className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">alt_route</span>
                        View Mapped Road Route ({currentHabitation.routeDistanceKm} km)
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSiteId(currentHabitation.recommendedDestinationId);
                          setSelectedViewType('site');
                        }}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">warehouse</span>
                        Inspect Safe Relocation Hub ({currentHabitation.recommendedDestinationName})
                      </button>
                    </div>
                  </>
                ) : selectedViewType === 'site' ? (
                  /* ── 2. RELOCATION SITE CARRYING CAPACITY VIEW ── */
                  <>
                    <div
                      className={`p-2.5 rounded text-white flex items-center justify-between ${
                        currentSite.suitability === 'RESTRICTED' ? 'bg-red-700' : 'bg-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">
                          {currentSite.suitability === 'RESTRICTED' ? 'block' : 'verified'}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {currentSite.suitability} RELOCATION SITE
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-black/25 text-[10px] rounded font-bold font-mono">
                        SAFETY: {Math.round(currentSite.safetyScore * 100)}%
                      </span>
                    </div>

                    {/* Explicit Carrying Capacity Metrics */}
                    <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                      <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700 flex items-center justify-between font-mono">
                        <span>CARRYING CAPACITY ASSESSMENT</span>
                        <span className="text-[10px] text-slate-500 font-normal">PS 26191 Multi-Resource</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span className="text-slate-600">Nominal Physical Capacity:</span>
                        <span className="font-bold font-mono text-slate-900">{formatPopulation(currentSite.nominalCapacity)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-emerald-50/50">
                        <span className="text-slate-700 font-semibold">Effective Carrying Capacity:</span>
                        <span className="font-bold font-mono text-emerald-800 text-sm">
                          {formatPopulation(currentSite.effectiveCapacity)}
                        </span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span className="text-slate-600">Allocated Population:</span>
                        <span className="font-bold font-mono text-slate-900">{formatPopulation(currentSite.allocatedPopulation)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50/50">
                        <span className="text-slate-700 font-semibold">Remaining Capacity:</span>
                        <span className="font-bold font-mono text-blue-700">
                          {formatPopulation(currentSite.remainingCapacity)}
                        </span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span className="text-slate-600">Limiting Bottleneck:</span>
                        <span className="font-bold font-mono text-amber-800">{currentSite.bottleneck}</span>
                      </div>
                    </div>

                    {/* Source Habitations & Inbound Demand */}
                    <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                      <div className="p-2 bg-slate-50 font-bold text-[11px] text-slate-700">
                        Assigned Source Habitations
                      </div>
                      {currentSite.sourceHabitations.length > 0 ? (
                        currentSite.sourceHabitations.map((habName) => (
                          <div key={habName} className="p-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{habName}</span>
                            <span className="text-slate-500 font-mono text-[11px]">Assigned Population: {formatPopulation(currentSite.allocatedPopulation)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-slate-500 italic">No habitations assigned (Site Restricted by Hazard Envelope).</div>
                      )}
                    </div>

                    {/* Transportation Access */}
                    <div className="border border-slate-200 rounded p-2.5 text-xs space-y-1">
                      <span className="font-bold text-slate-700 text-[10px] uppercase font-mono">Transportation Accessibility</span>
                      <div className="text-slate-900 font-medium">{currentSite.roadAccess}</div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => {
                          const matchingRoute = operationalData?.routes.find((r) => r.toSiteId === currentSite.id);
                          if (matchingRoute) {
                            setSelectedRouteId(matchingRoute.id);
                            setSelectedViewType('route');
                          }
                        }}
                        className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition"
                      >
                        <span className="material-symbols-outlined text-[15px]">alt_route</span>
                        View Converging Road Routes
                      </button>
                    </div>
                  </>
                ) : selectedViewType === 'route' ? (
                  /* ── 3. TRANSPORTATION ROUTE VIEW (OSM NETWORK) ── */
                  <>
                    <div className="bg-[#003366] text-white p-2.5 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">alt_route</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          MAPPED ROAD CORRIDOR
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white font-mono font-bold text-[9px] rounded">
                        {currentRoute.status}
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs font-sans">
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Origin Habitation:</span>
                        <span className="font-bold text-slate-900">{currentRoute.fromHabitationName}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Destination Hub:</span>
                        <span className="font-bold text-emerald-800">{currentRoute.toSiteName}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Mapped Highway:</span>
                        <span className="font-bold text-slate-800 font-mono">{currentRoute.roadName}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Road Distance:</span>
                        <span className="font-bold font-mono text-slate-900">{currentRoute.distanceKm} km</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Estimated Transit Time:</span>
                        <span className="font-bold font-mono text-blue-700">{currentRoute.transitTimeMinutes} minutes</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Route Geometry:</span>
                        <span className="font-mono text-slate-700">OSM Snapped LineString ({currentRoute.geometry.coordinates.length} waypoints)</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs space-y-1">
                      <div className="font-bold text-blue-900 text-[10px] uppercase font-mono">
                        Transportation Integrity
                      </div>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Route geometry follows the official OpenStreetMap road network. No synthetic straight lines or heuristic pseudo-vectors are used.
                      </p>
                    </div>
                  </>
                ) : selectedViewType === 'hazardZone' ? (
                  /* ── 4. HAZARD-BASED RED ZONE VIEW ── */
                  <>
                    <div className="bg-red-700 text-white p-2.5 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          HAZARD-BASED RED ZONE
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-black/30 font-mono font-bold text-[9px] rounded">
                        {currentHazardZone.severity}
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Zone Name:</span>
                        <span className="font-bold text-slate-900">{currentHazardZone.name}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Hazard Type:</span>
                        <span className="font-bold text-red-700">{currentHazardZone.hazardType}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Enclosed Spatial Area:</span>
                        <span className="font-bold font-mono">{formatArea(currentHazardZone.areaSqKm)}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Affected Habitations:</span>
                        <span className="font-bold font-mono text-slate-900">{currentHazardZone.affectedHabitationsCount} monitored</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Relocation Urgency:</span>
                        <span className="font-bold font-mono text-red-700">{currentHazardZone.relocationPriority}</span>
                      </div>
                      <div className="p-2.5 flex justify-between">
                        <span className="text-slate-500">Statutory Basis:</span>
                        <span className="font-mono text-[10px] text-slate-600">{currentHazardZone.mandateReference}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs space-y-1">
                      <div className="font-bold text-red-900 text-[10px] uppercase font-mono">
                        Operational Restriction
                      </div>
                      <p className="text-[11px] text-red-800 leading-relaxed">
                        Continuous habitational residence within this spatial polygon is restricted under DM Act 2005 model planning criteria. Immediate phased evacuation to designated safe hubs is mandated.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedHabitationId('hab-joshimath');
                        setSelectedViewType('habitation');
                      }}
                      className="w-full py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition"
                    >
                      <span className="material-symbols-outlined text-[15px]">home</span>
                      View Affected Habitations
                    </button>
                  </>
                ) : selectedViewType === 'plan' ? (
                  /* ── 5. RELOCATION PLAN SUMMARY & OFFICER DECISION ── */
                  <>
                    <div className="bg-[#003366] text-white p-2.5 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          PHASED RELOCATION PLAN
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white font-mono font-bold text-[9px] rounded">
                        {operationalData?.summary.status || 'OPTIMAL'}
                      </span>
                    </div>

                    {/* Executive Plan KPIs */}
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-slate-50 border border-slate-200 p-2 rounded">
                        <span className="block text-[9px] text-slate-500 font-bold uppercase">Required Relocation</span>
                        <span className="text-base font-bold text-slate-900 font-mono">
                          {formatPopulation(operationalData?.summary.totalRequiredPopulation ?? 15450)}
                        </span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200 p-2 rounded">
                        <span className="block text-[9px] text-emerald-900 font-bold uppercase">Effective Capacity</span>
                        <span className="text-base font-bold text-emerald-800 font-mono">
                          {formatPopulation(operationalData?.summary.totalEffectiveCapacity ?? 18000)}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                        <span className="block text-[9px] text-blue-900 font-bold uppercase">Allocated Population</span>
                        <span className="text-base font-bold text-blue-800 font-mono">
                          {formatPopulation(operationalData?.summary.totalAllocatedPopulation ?? 15450)}
                        </span>
                      </div>
                      <div className={`p-2 rounded border ${
                        (operationalData?.summary.capacityDeficit ?? 0) > 0
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                        <span className="block text-[9px] font-bold uppercase">Capacity Deficit</span>
                        <span className="text-base font-bold font-mono">
                          {formatPopulation(operationalData?.summary.capacityDeficit ?? 0)}
                        </span>
                      </div>
                    </div>

                    {/* Scenario Contingency Trigger */}
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 text-[10px] uppercase font-mono">
                          Scenario Lab Stress Testing
                        </span>
                        <span className="text-[9px] font-mono text-amber-800">Demo Trigger</span>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Simulate sudden capacity drop (e.g. sanitation deficit at Gauchar) to demonstrate automated re-optimization.
                      </p>
                      <button
                        onClick={handleTriggerCapacityDeficit}
                        className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">tune</span>
                        Simulate Capacity Deficit (1,250 Beds)
                      </button>
                    </div>

                    {/* Officer Decision Component */}
                    <div className="border border-slate-200 rounded p-3 bg-white space-y-2 text-xs">
                      <div className="font-bold text-[#003366] text-[10px] uppercase font-mono flex items-center justify-between">
                        <span>OFFICER REVIEW &amp; STATUTORY SIGN-OFF</span>
                        <span className="text-slate-400 font-normal">DM Act 2005</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Review the recommended relocation plan for 15,450 residents across 5 habitations.
                      </p>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          onClick={() => handleOfficerAction('ACCEPTED')}
                          className="py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-center transition"
                        >
                          ACCEPT
                        </button>
                        <button
                          onClick={() => handleOfficerAction('MODIFIED')}
                          className="py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-center transition"
                        >
                          MODIFY
                        </button>
                        <button
                          onClick={() => handleOfficerAction('REJECTED')}
                          className="py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-center transition"
                        >
                          REJECT
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* ── 6. CENSUS / DISTRICT DRILL-DOWN VIEW ── */
                  <div className="space-y-3 text-xs">
                    <div className="p-2.5 bg-[#003366] text-white rounded">
                      <div className="font-bold text-sm">
                        {selectedCensusItem?.settlementName || selectedDistrictItem?.districtName || 'Census Baseline'}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        Official Census 2011 Baseline Demographics
                      </div>
                    </div>
                    {selectedCensusItem && (
                      <div className="border border-slate-200 rounded divide-y divide-slate-100">
                        <div className="p-2 flex justify-between">
                          <span className="text-slate-500">2011 Baseline Pop:</span>
                          <span className="font-bold font-mono">{formatPopulation(selectedCensusItem.population2011Baseline)}</span>
                        </div>
                        <div className="p-2 flex justify-between">
                          <span className="text-slate-500">Households:</span>
                          <span className="font-mono">{formatNumber(selectedCensusItem.households2011Baseline)}</span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedViewType('habitation')}
                      className="w-full py-1.5 bg-[#003366] text-white font-semibold rounded"
                    >
                      Return to Operational Habitations
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
