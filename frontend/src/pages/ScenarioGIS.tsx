import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

// Fix Leaflet Default Icon in Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons for Habitations and Relocation Hubs
const createIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.4); color: white; font-weight: bold; font-size: 11px;">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const habIcon = createIcon('#b91c1c', 'H');
const siteIcon = createIcon('#047857', 'S');
const excludedSiteIcon = createIcon('#475569', '✕');

export const ScenarioGIS: React.FC = () => {
  const navigate = useNavigate();
  const {
    scenario,
    allocations,
    toggleScenarioRouteBlock,
    applyScenarioToMainPlan,
    cancelScenario,
  } = useAppStore();

  const [showBaselineOverlay, setShowBaselineOverlay] = useState(true);
  const [rationaleModalOpen, setRationaleModalOpen] = useState(false);
  const [rationaleText, setRationaleText] = useState(
    'Scenario rerouting approved following ground corridor status report. Diversion to secondary hubs confirmed.'
  );

  const isNh07Blocked = scenario.blockedRouteIds.includes('route-nh07-helang');

  // Coordinates for Chamoli Corridors
  const nh07Coordinates: [number, number][] = [
    [30.5564, 79.5645], // Joshimath
    [30.518, 79.497],   // Helang
    [30.4321, 79.4312], // Pipalkoti
    [30.33, 79.32],     // Nandprayag
    [30.2589, 79.2198], // Karnaprayag
    [30.2854, 79.1542], // Gauchar
  ];

  const rainiCorridor: [number, number][] = [
    [30.485, 79.712],   // Raini
    [30.492, 79.628],   // Tapovan
    [30.5564, 79.5645], // Joshimath
  ];

  const interiorBypassCoordinates: [number, number][] = [
    [30.518, 79.497],   // Helang
    [30.418, 79.332],   // Gopeshwar ridge bypass
    [30.2842, 78.9812], // Rudraprayag
  ];

  const handleApply = async () => {
    if (!rationaleText.trim()) {
      alert('Please provide an operational rationale.');
      return;
    }
    await applyScenarioToMainPlan(rationaleText);
    setRationaleModalOpen(false);
    navigate('/decisions/current-plan');
  };

  return (
    <div className="relative w-full h-[calc(100vh-5.5rem)] flex flex-col font-sans">
      {/* ── TOP SCENARIO STATUS BANNER ── */}
      <div className="bg-[#002244] text-white px-4 py-2 border-b border-[#003366] flex flex-wrap items-center justify-between gap-3 shadow-md z-20">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs uppercase font-mono tracking-wider">
            SCENARIO GIS SANDBOX
          </span>
          <span className="text-xs text-slate-300 font-medium">
            Active Scenario: <strong className="text-white">{scenario.scenarioName}</strong>
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ISOLATED FROM BASELINE GIS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBaselineOverlay(!showBaselineOverlay)}
            className={`px-2.5 py-1 text-xs rounded font-medium border transition ${
              showBaselineOverlay
                ? 'bg-blue-600/40 border-blue-400 text-white'
                : 'bg-white/5 border-white/20 text-slate-300 hover:text-white'
            }`}
          >
            {showBaselineOverlay ? 'Hide Baseline Routes' : 'Show Baseline Routes'}
          </button>

          <button
            onClick={() => navigate('/scenario/planner')}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold border border-white/20 transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Scenario Lab</span>
          </button>

          <button
            onClick={cancelScenario}
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition"
          >
            Cancel Scenario
          </button>

          <button
            onClick={() => setRationaleModalOpen(true)}
            className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black shadow-sm transition flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">done_all</span>
            <span>APPLY TO MAIN PLAN</span>
          </button>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div className="relative flex-1 w-full h-full">
        <MapContainer
          center={[30.45, 79.45]}
          zoom={10}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Red Zone Hazard Circles */}
          <Circle
            center={[30.5564, 79.5645]}
            radius={2500}
            pathOptions={{ color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }}
          >
            <Tooltip permanent direction="top" className="text-xs font-bold">
              Joshimath Subsidence Red Zone
            </Tooltip>
          </Circle>

          <Circle
            center={[30.485, 79.712]}
            radius={2200}
            pathOptions={{ color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.25, weight: 2 }}
          >
            <Tooltip permanent direction="top" className="text-xs font-bold">
              Raini Flash Flood Red Zone
            </Tooltip>
          </Circle>

          {/* Road Corridors */}
          {/* Raini to Joshimath corridor */}
          <Polyline
            positions={rainiCorridor}
            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.8 }}
          >
            <Popup>
              <div className="text-xs">
                <strong>Dhauliganga Transit Corridor</strong>
                <p>Passable under standard convoy speed</p>
              </div>
            </Popup>
          </Polyline>

          {/* NH-07 Main Corridor */}
          <Polyline
            positions={nh07Coordinates}
            pathOptions={{
              color: isNh07Blocked ? '#dc2626' : '#16a34a',
              weight: isNh07Blocked ? 5 : 4,
              dashArray: isNh07Blocked ? '8, 8' : undefined,
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>NH-07 Rishikesh-Badrinath Highway</strong>
                <p>Status: {isNh07Blocked ? 'BLOCKED AT HELANG KM 44' : 'OPEN & PASSABLE'}</p>
                <button
                  onClick={() => toggleScenarioRouteBlock('route-nh07-helang')}
                  className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                >
                  {isNh07Blocked ? 'Clear Blockade' : 'Inject Blockade'}
                </button>
              </div>
            </Popup>
          </Polyline>

          {/* Interior Bypass Corridor (Used when NH-07 is blocked) */}
          {isNh07Blocked && (
            <Polyline
              positions={interiorBypassCoordinates}
              pathOptions={{ color: '#d97706', weight: 4, dashArray: '6, 6' }}
            >
              <Tooltip permanent direction="center">
                ACTIVE BYPASS: Gopeshwar Interior Ridge to Rudraprayag
              </Tooltip>
            </Polyline>
          )}

          {/* Baseline Allocation Lines (Optional Overlay) */}
          {showBaselineOverlay &&
            allocations.map((alloc, idx) => {
              const habId = alloc.sourceHabitationId || alloc.habitationId;
              const siteId = alloc.targetSiteId || alloc.siteId;
              const hab = scenario.scenarioHabitations.find((h) => h.id === habId);
              const site = scenario.scenarioSites.find((s) => s.id === siteId);
              if (!hab || !site) return null;
              return (
                <Polyline
                  key={`baseline-${idx}`}
                  positions={[
                    [hab.coordinates.lat, hab.coordinates.lng],
                    [site.coordinates.lat, site.coordinates.lng],
                  ]}
                  pathOptions={{
                    color: '#64748b',
                    weight: 2,
                    dashArray: '4, 4',
                    opacity: 0.6,
                  }}
                />
              );
            })}

          {/* Scenario Allocation Transit Lines */}
          {scenario.scenarioAllocations.map((alloc, idx) => {
            const habId = alloc.sourceHabitationId || alloc.habitationId;
            const siteId = alloc.targetSiteId || alloc.siteId;
            const hab = scenario.scenarioHabitations.find((h) => h.id === habId);
            const site = scenario.scenarioSites.find((s) => s.id === siteId);
            if (!hab || !site) return null;


            return (
              <Polyline
                key={`scenario-${idx}`}
                positions={[
                  [hab.coordinates.lat, hab.coordinates.lng],
                  [site.coordinates.lat, site.coordinates.lng],
                ]}
                pathOptions={{
                  color: isNh07Blocked ? '#d9531e' : '#047857',
                  weight: 4,
                  opacity: 0.9,
                }}
              >
                <Tooltip direction="center">
                  {hab.name} → {site.name}: {alloc.allocatedPopulation} pax
                </Tooltip>
              </Polyline>
            );
          })}

          {/* Habitation Markers */}
          {scenario.scenarioHabitations.map((hab) => (
            <Marker
              key={hab.id}
              position={[hab.coordinates.lat, hab.coordinates.lng]}
              icon={habIcon}
            >
              <Popup>
                <div className="text-xs space-y-1 font-sans">
                  <div className="font-bold text-[#003366] text-sm">{hab.name}</div>
                  <div>Population Demand: <strong>{formatPopulation(hab.population)}</strong></div>
                  <div>Risk Score: <strong className="text-red-600">{hab.riskScore}</strong></div>
                  <div>Priority: <strong className="text-red-700">{hab.priority}</strong></div>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Coordinates: {hab.coordinates.lat.toFixed(4)}, {hab.coordinates.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Relocation Site Markers */}
          {scenario.scenarioSites.map((site) => {
            const isExcluded = site.id === 'site-pipalkoti';
            return (
              <Marker
                key={site.id}
                position={[site.coordinates.lat, site.coordinates.lng]}
                icon={isExcluded ? excludedSiteIcon : siteIcon}
              >
                <Popup>
                  <div className="text-xs space-y-1 font-sans">
                    <div className="font-bold text-slate-900 text-sm">{site.name}</div>
                    <div>Effective Capacity: <strong>{formatPopulation(site.resourceCapacity.effectiveCapacity)}</strong></div>
                    <div>Bottleneck: <strong>{site.resourceCapacity.bottleneck}</strong></div>
                    <div>Safety Score: <strong>{site.safetyScore}</strong></div>
                    {isExcluded && (
                      <div className="text-red-600 font-bold bg-red-50 p-1 rounded border border-red-200 text-[10px]">
                        HARD HAZARD EXCLUSION (Slope Instability)
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── FLOATING SCENARIO LEGEND & OVERLAY ── */}
        <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur-sm p-3.5 rounded-lg shadow-xl border border-slate-200 text-xs w-72 space-y-2">
          <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between border-b pb-1">
            <span>Scenario GIS Layers</span>
            <span className="text-[10px] text-amber-600 font-mono">SANDBOX</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-700 flex items-center justify-center text-white text-[9px] font-bold">H</span>
              <span>Habitation at Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[9px] font-bold">S</span>
              <span>Safe Relocation Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-[#d9531e]"></div>
              <span>Scenario Transit Dispatch Vector</span>
            </div>
            {showBaselineOverlay && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 border-t border-dashed border-slate-500"></div>
                <span className="text-slate-500">Baseline Allocation Path</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-6 h-1 ${isNh07Blocked ? 'bg-red-600 border-dashed' : 'bg-emerald-600'}`}></div>
              <span>NH-07 Status: <strong>{isNh07Blocked ? 'BLOCKED' : 'OPEN'}</strong></span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => toggleScenarioRouteBlock('route-nh07-helang')}
              className={`w-full py-1.5 rounded font-bold text-xs text-white transition ${
                isNh07Blocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {isNh07Blocked ? 'Re-open NH-07 Highway' : 'Simulate NH-07 Blockade'}
            </button>
          </div>
        </div>
      </div>

      {/* ── APPLY TO MAIN PLAN MODAL ── */}
      {rationaleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="material-symbols-outlined text-[26px]">gavel</span>
              <h2 className="text-base font-bold text-slate-900">
                Apply Scenario Contingency to Main Plan
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Applying this scenario will promote the simulated dispatch matrix to the authoritative
              operational baseline, incrementing the plan version to{' '}
              <strong className="text-[#003366]">#VST-2026-CHM-015</strong> and recording a formal
              Section 34 statutory adjudication order.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#003366] uppercase mb-1">
                Mandatory Operational Rationale
              </label>
              <textarea
                rows={3}
                value={rationaleText}
                onChange={(e) => setRationaleText(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#003366]"
                placeholder="State reason for promoting scenario to main plan..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRationaleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-2 text-xs font-bold bg-[#003366] hover:bg-[#002244] text-white rounded-lg shadow-sm"
              >
                Confirm &amp; Commit to Main Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
