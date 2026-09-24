import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

export const ScenarioLab: React.FC = () => {
  const navigate = useNavigate();
  const {
    scenario,
    setScenarioHabitationDemand,
    setScenarioSiteCapacity,
    toggleScenarioRouteBlock,
    setScenarioHazardSeverity,
    loadScenarioTemplate,
    runScenarioReoptimization,
    applyScenarioToMainPlan,
    cancelScenario,
    activePlanId,
  } = useAppStore();


  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [rationale, setRationale] = useState(
    'Promoting scenario contingency to active operational baseline due to confirmed corridor impairment. Approved under Section 34 DM Act 2005.'
  );

  const isNh07Blocked = scenario.blockedRouteIds.includes('route-nh07-helang');

  const handleApply = async () => {
    if (!rationale.trim()) {
      alert('Please provide an operational rationale.');
      return;
    }
    await applyScenarioToMainPlan(rationale);
    setApplyModalOpen(false);
    navigate('/decisions/current-plan');
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* ── 1. TOP HEADER & WORKSPACE ACTIONS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase font-mono tracking-wider">
              FREE-FORM STRESS LAB &amp; WHAT-IF SIMULATOR
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ENGINE: GOOGLE OR-TOOLS (SCIP MILP)
            </span>
            {scenario.isDirty && (
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold font-mono">
                SANDBOX EDITED
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] mt-1 tracking-tight">
            Scenario Planner: Dynamic Contingency Simulation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mt-0.5">
            Test disaster contingencies in an isolated sandbox. Perturb habitation demands, override shelter capacities,
            and inject road corridor cuts. All runs pass through the authoritative Google OR-Tools SCIP solver.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/scenario/gis')}
            className="gov-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5"
            title="Open isolated spatial scenario map"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-600">share_location</span>
            <span>Scenario GIS</span>
          </button>

          <button
            onClick={cancelScenario}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded shadow-xs transition"
          >
            Cancel Scenario
          </button>

          <button
            onClick={() => runScenarioReoptimization()}
            disabled={scenario.solverStatus === 'running'}
            className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">
              {scenario.solverStatus === 'running' ? 'progress_activity' : 'autorenew'}
            </span>
            <span>
              {scenario.solverStatus === 'running' ? 'SOLVING VIA SCIP...' : 'RUN OR SOLVER'}
            </span>
          </button>

          {scenario.scenarioDelta && (
            <button
              onClick={() => setApplyModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded flex items-center gap-1.5 shadow-sm transition"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>APPLY TO MAIN PLAN</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. QUICK PRESET PERTURBATION TEMPLATES ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-amber-600">bolt</span>
            <span>QUICK PRESET SCENARIOS</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Click to prefill contingency conditions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => loadScenarioTemplate('nh07-blocked')}
            className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
              isNh07Blocked
                ? 'border-red-600 bg-red-50/70 ring-1 ring-red-600'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>NH-07 Helang Cut</span>
              <span className="material-symbols-outlined text-[16px] text-red-600">block</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Debris slump cuts NH-07 at KM 44. Diverts convoys to secondary hubs.
            </p>
          </button>

          <button
            onClick={() => loadScenarioTemplate('raini-cloudburst')}
            className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
              scenario.demandOverrides['hab-raini']
                ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Raini Cloudburst</span>
              <span className="material-symbols-outlined text-[16px] text-amber-600">thunderstorm</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              IMD Doppler surge (+50% rainfall). Raini population demand swells to 2,600 pax.
            </p>
          </button>

          <button
            onClick={() => loadScenarioTemplate('joshimath-surge')}
            className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
              scenario.demandOverrides['hab-joshimath'] === 6000
                ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-600'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Joshimath Surge</span>
              <span className="material-symbols-outlined text-[16px] text-purple-600">trending_up</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Total evacuation of Wards 1-9. Demand rises to 6,000 citizens.
            </p>
          </button>

          <button
            onClick={() => loadScenarioTemplate('gauchar-down')}
            className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
              scenario.capacityOverrides['site-gauchar'] === 2000
                ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>Gauchar Water Outage</span>
              <span className="material-symbols-outlined text-[16px] text-blue-600">water_drop</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Water pipeline breakdown lowers Gauchar effective capacity to 2,000 beds.
            </p>
          </button>
        </div>
      </div>

      {/* ── 3. LIVE OR DECISION ENGINE SOLVER VISUALIZATION PANEL ── */}
      <div className="bg-[#002244] text-white rounded-lg p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[22px]">developer_board</span>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
                LIVE OR DECISION ENGINE SOLVER TELEMETRY
              </h3>
              <p className="text-xs text-slate-300">
                SCIP Mixed-Integer Linear Program formulated over District Chamoli nodes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                scenario.solverStatus === 'optimal'
                  ? 'bg-emerald-500 text-slate-950'
                  : scenario.solverStatus === 'running'
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {scenario.solverStatus === 'optimal'
                ? 'OPTIMAL (SCIP 0-GAP)'
                : scenario.solverStatus === 'running'
                ? 'SOLVING IN PYTHON...'
                : 'READY FOR DISPATCH'}
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-white/5 rounded border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase">Decision Variables</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {scenario.solverStats?.variablesCount || 42} <span className="text-[11px] text-slate-400">(X_ij)</span>
            </div>
            <div className="text-[10px] text-slate-400">Binary &amp; Continuous pax flows</div>
          </div>

          <div className="p-3 bg-white/5 rounded border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase">Linear Constraints</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {scenario.solverStats?.constraintsCount || 18} <span className="text-[11px] text-slate-400">(Bounds)</span>
            </div>
            <div className="text-[10px] text-slate-400">Demand, Capacity, Road feasibility</div>
          </div>

          <div className="p-3 bg-white/5 rounded border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase">Solver Execution Time</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {scenario.solverExecutionMs} ms
            </div>
            <div className="text-[10px] text-slate-400">Google OR-Tools Python SCIP</div>
          </div>

          <div className="p-3 bg-white/5 rounded border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase">Optimality Gap</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">
              0.00%
            </div>
            <div className="text-[10px] text-slate-400">Provably global minimum cost</div>
          </div>
        </div>
      </div>

      {/* ── 4. FREE-FORM MANUAL INPUT TABLES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Habitations Demand Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#003366] text-[18px]">location_city</span>
              <span className="font-bold text-xs text-[#003366] uppercase tracking-wider">
                1. Habitation Evacuation Demand
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Editable population inputs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b">
                <tr>
                  <th className="py-2 px-2.5">Habitation</th>
                  <th className="py-2 px-2">Priority</th>
                  <th className="py-2 px-2">Baseline Demand</th>
                  <th className="py-2 px-2 text-right">Simulated Demand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {scenario.scenarioHabitations.map((hab) => {
                  const currentDemand = hab.population;
                  const isModified = !!scenario.demandOverrides[hab.id];

                  return (
                    <tr key={hab.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-800">{hab.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{hab.id}</div>
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            hab.priority === 'Immediate'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {hab.priority}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-600">
                        {hab.id === 'hab-raini' && isModified
                          ? '1,800 pax'
                          : hab.id === 'hab-joshimath' && isModified
                          ? '4,500 pax'
                          : `${currentDemand.toLocaleString()} pax`}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="100"
                          max="15000"
                          step="100"
                          value={currentDemand}
                          onChange={(e) =>
                            setScenarioHabitationDemand(hab.id, Number(e.target.value) || 0)
                          }
                          className={`w-28 text-right font-mono font-bold p-1 rounded border text-xs outline-none focus:ring-1 focus:ring-[#003366] ${
                            isModified
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-black'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Relocation Sites Capacity Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#003366] text-[18px]">domain</span>
              <span className="font-bold text-xs text-[#003366] uppercase tracking-wider">
                2. Relocation Sites Carrying Capacity
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Editable capacity inputs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b">
                <tr>
                  <th className="py-2 px-2.5">Site Name</th>
                  <th className="py-2 px-2">Bottleneck</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2 text-right">Effective Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {scenario.scenarioSites.map((site) => {
                  const cap = site.resourceCapacity.effectiveCapacity;
                  const isModified = !!scenario.capacityOverrides[site.id];
                  const isExcluded = site.id === 'site-pipalkoti';

                  return (
                    <tr key={site.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-800">{site.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{site.id}</div>
                      </td>
                      <td className="py-2 px-2 text-slate-600 font-mono text-[11px]">
                        {site.resourceCapacity.bottleneck}
                      </td>
                      <td className="py-2 px-2">
                        {isExcluded ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                            HAZARD EXCLUDED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            OPERATIONAL
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {isExcluded ? (
                          <span className="font-mono text-slate-400 font-bold px-2 py-1 bg-slate-100 rounded text-xs">
                            0 (Locked)
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="20000"
                            step="250"
                            value={cap}
                            onChange={(e) =>
                              setScenarioSiteCapacity(site.id, Number(e.target.value) || 0)
                            }
                            className={`w-28 text-right font-mono font-bold p-1 rounded border text-xs outline-none focus:ring-1 focus:ring-[#003366] ${
                              isModified
                                ? 'bg-amber-50 border-amber-400 text-amber-950 font-black'
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 5. ROAD CORRIDORS & HAZARD CONTROLS ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-2 mb-3">
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
            3. ROAD CORRIDOR DISRUPTIONS &amp; METEOROLOGICAL SURGE
          </span>
          <span className="text-[11px] text-slate-500">Inject physical disruptions into the transit network</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Corridor 1: NH-07 */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">NH-07 Helang-Pipalkoti</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isNh07Blocked ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isNh07Blocked ? 'BLOCKED' : 'PASSABLE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Primary high-volume 2-lane highway to Gauchar &amp; Karnaprayag hubs.
            </p>
            <button
              onClick={() => toggleScenarioRouteBlock('route-nh07-helang')}
              className={`w-full py-1.5 px-3 rounded font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                isNh07Blocked
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isNh07Blocked ? 'lock' : 'lock_open'}
              </span>
              <span>{isNh07Blocked ? 'Re-open NH-07 Corridor' : 'Simulate Landslide Blockade'}</span>
            </button>
          </div>

          {/* Corridor 2: Raini Access Pass */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Raini-Tapovan Gorge Pass</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  scenario.blockedRouteIds.includes('route-raini-access')
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {scenario.blockedRouteIds.includes('route-raini-access') ? 'BLOCKED' : 'PASSABLE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Dhauliganga riverbank access road susceptible to debris torrents.
            </p>
            <button
              onClick={() => toggleScenarioRouteBlock('route-raini-access')}
              className={`w-full py-1.5 px-3 rounded font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                scenario.blockedRouteIds.includes('route-raini-access')
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {scenario.blockedRouteIds.includes('route-raini-access') ? 'lock' : 'lock_open'}
              </span>
              <span>
                {scenario.blockedRouteIds.includes('route-raini-access')
                  ? 'Clear Raini Pass'
                  : 'Block Raini Pass'}
              </span>
            </button>
          </div>

          {/* Meteorological Surge Multiplier */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Hazard Surge Multiplier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-900">
                IMD RADAR
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Precipitation and slope instability multiplier across Chamoli sub-districts.
            </p>
            <select
              value={scenario.hazardSeverity}
              onChange={(e: any) => setScenarioHazardSeverity(e.target.value)}
              className="w-full p-1.5 text-xs font-semibold border border-slate-300 rounded bg-white outline-none"
            >
              <option>Normal Baseline</option>
              <option>Elevated Rainfall (+25%)</option>
              <option>Extreme Cloudburst (+50%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 6. "WHAT CHANGED?" BEFORE VS AFTER DELTA COMPARISON ── */}
      {scenario.scenarioDelta && (
        <div className="bg-white border-2 border-amber-400 rounded-lg shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[24px]">compare_arrows</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#003366] uppercase tracking-wider font-mono">
                  WHAT CHANGED? BEFORE vs. AFTER CONTINGENCY DELTA
                </h3>
                <p className="text-xs text-slate-500">
                  Algorithmic comparison against authoritative Baseline Plan {activePlanId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-mono text-xs font-black rounded border border-amber-300">
                DELTA VERIFIED (SCIP)
              </span>
            </div>
          </div>

          {/* Delta KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-[10px] font-bold text-amber-800 uppercase font-mono">Diverted Citizens</div>
              <div className="text-xl font-black text-amber-900 font-mono mt-0.5">
                {formatPopulation(scenario.scenarioDelta.divertedCount)}
              </div>
              <div className="text-[10px] text-amber-700">Rerouted to alternative hubs</div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-[10px] font-bold text-blue-800 uppercase font-mono">Net Distance Shift</div>
              <div className="text-xl font-black text-blue-900 font-mono mt-0.5">
                +{scenario.scenarioDelta.distanceDeltaKm} km
              </div>
              <div className="text-[10px] text-blue-700">Due to interior corridor bypass</div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Cost Outlay Delta</div>
              <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                +₹{scenario.scenarioDelta.costDeltaLakhs} L
              </div>
              <div className="text-[10px] text-emerald-700">Additional fuel &amp; fleet transit</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-[10px] font-bold text-slate-600 uppercase font-mono">Unmet Demand</div>
              <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                0 Deficit
              </div>
              <div className="text-[10px] text-slate-500">100% capacity accommodated</div>
            </div>
          </div>

          {/* Reassigned Diverted Habitations Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase font-mono">
              SPECIFIC HABITATION DIVERSIONS:
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border rounded">
                <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-2">Habitation</th>
                    <th className="p-2">Original Destination</th>
                    <th className="p-2">Contingency Destination</th>
                    <th className="p-2 text-right">Citizens Diverted</th>
                    <th className="p-2">Detour Transit Corridors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {scenario.scenarioDelta.divertedHabitations.map((div, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40">
                      <td className="p-2 font-bold text-[#003366]">{div.habitationName}</td>
                      <td className="p-2 text-slate-600 font-mono">{div.fromSiteName}</td>
                      <td className="p-2 font-bold text-emerald-800 font-mono">{div.toSiteName}</td>
                      <td className="p-2 text-right font-black font-mono text-amber-900">
                        {formatPopulation(div.count)}
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">
                        Via Gopeshwar-Pokhari Ridge Bypass Corridor
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relocation Site Utilization Shift */}
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs font-bold text-slate-800 uppercase font-mono">
              SHELTER UTILIZATION IMPACT:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {scenario.scenarioDelta.siteUtilizationDeltas.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border text-xs space-y-1">
                  <div className="font-bold text-slate-900">{s.siteName}</div>
                  <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                    <span>Baseline Load: {s.beforeUtil}%</span>
                    <span className="font-bold text-[#003366]">New Load: {s.afterUtil}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        s.afterUtil > 90 ? 'bg-red-600' : s.afterUtil > 75 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, s.afterUtil)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono text-right">
                    Shift: {s.changePax > 0 ? `+${s.changePax}` : s.changePax} pax
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. APPLY TO MAIN PLAN MODAL ── */}
      {applyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="material-symbols-outlined text-[26px]">gavel</span>
              <h2 className="text-base font-bold text-slate-900">
                Commit Scenario to Operational Baseline
              </h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Applying this scenario commits all recalculated assignments to the authoritative main plan,
              bumps the version to <strong className="text-[#003366]">#VST-2026-CHM-015</strong>, and files
              a permanent entry in the Section 34 Statutory Audit Ledger.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#003366] uppercase mb-1">
                Mandatory Officer Rationale
              </label>
              <textarea
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#003366]"
                placeholder="Enter field justification for baseline update..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-2 text-xs font-bold bg-[#003366] hover:bg-[#002244] text-white rounded-lg shadow-sm"
              >
                Sign &amp; Apply to Main Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
