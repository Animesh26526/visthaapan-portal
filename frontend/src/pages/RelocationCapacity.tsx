import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { formatPercent, formatPopulation } from '../utils/formatters';

export const RelocationCapacity: React.FC = () => {
  const { sites, selectedSiteId, setSelectedSiteId, habitations } = useAppStore();

  const activeSite = sites.find(s => s.id === selectedSiteId) || sites[0];
  const totalTargetPopulation = (habitations || []).reduce((sum, h) => sum + (h?.population || 0), 0);
  const totalEffectiveCapacity = (sites || []).reduce((sum, s) => sum + (s?.resourceCapacity?.effectiveCapacity || 0), 0);
  const totalDeficit = Math.max(0, totalTargetPopulation - totalEffectiveCapacity);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP SECTOR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase font-mono">
              STAGE 2 CAPACITY MATRIX
            </span>
            <span className="text-xs text-slate-500 font-mono">SECTOR: CHAMOLI BUFFER REGION</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Safe Relocation Sites &amp; Resource Bottlenecks
          </h1>
          <p className="text-xs text-slate-600">
            Evaluating multi-dimensional carrying capacity to prevent unsafe shelter overcrowding.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Capacity Telemetry Active</span>
        </div>
      </div>

      {/* 1B. PROVENANCE & GOVERNANCE NOTICE */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <span className="text-base leading-none">⚠️</span>
        <div>
          <strong className="font-semibold">DECISION SUPPORT ONLY — SIMULATED BENCHMARK INFRASTRUCTURE</strong>
          <p className="mt-0.5 text-amber-800 leading-normal">
            Relocation sites SITE-001 through SITE-006, lifeline parameters, and candidate corridors represent deterministic simulated benchmark test fixtures for Chamoli (SIMULATED_BENCHMARK). This system provides analytical decision support and does NOT create statutory legal orders or official gazetted designations. National hospital bed counts are quarantined and excluded from capacity math; triage capacities reflect simulated benchmark configurations. Cartosat-1 DEM terrain slope is recorded as UNAVAILABLE outside western Gujarat.
          </p>
        </div>
      </div>

      {/* 2. CARRYING CAPACITY BOTTLENECK FORMULA BANNER */}
      <div id="tour-planning-formula" data-tour="planning-capacity" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#d9531e] font-bold">
            Mathematical Formulation: Multi-Resource Effective Capacity
          </div>
          <div className="text-sm sm:text-base font-mono font-extrabold text-[#003366]">
            Effective Capacity = MIN( Physical Area, Water Supply, Shelter Beds, Sanitation, Healthcare )
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            A site cannot house 15,000 citizens if sanitation or potable water only supports 9,200. The strict limiting bottleneck dictates modeled safe carrying capacity.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div className="text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Displaced</span>
            <span className="text-xl font-bold font-mono text-slate-900">{formatPopulation(totalTargetPopulation)}</span>
          </div>
          <span className="text-slate-400 font-bold">-</span>
          <div className="text-center">
            <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Safe Capacity</span>
            <span className="text-xl font-bold font-mono text-emerald-700">{formatPopulation(totalEffectiveCapacity)}</span>
          </div>
          <span className="text-slate-400 font-bold">=</span>
          <div className="text-center">
            <span className="block text-[10px] text-red-700 uppercase font-mono font-bold">Unmet Deficit</span>
            <span className="text-xl font-bold font-mono text-red-700">{formatPopulation(totalDeficit)}</span>
          </div>
        </div>
      </div>

      {/* 3. SITE CARDS GRID (ALL 3 SAFE SITES) */}
      <div id="tour-planning-sites" data-tour="planning-effective-capacity" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sites.map((site) => {
          const isSelected = site.id === activeSite.id;
          return (
            <div
              key={site.id}
              onClick={() => setSelectedSiteId(site.id)}
              className={`bg-white rounded-lg border p-4 shadow-sm cursor-pointer transition flex flex-col justify-between ${
                isSelected
                  ? 'border-[#003366] ring-2 ring-[#003366]'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{site.code}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded font-mono">
                    SAFETY {formatPercent(site?.safetyScore, 0)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#003366] mt-1">{site.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{site.location}</p>

                {/* Primary Metric: Effective Capacity */}
                <div className="my-4 p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">Effective Capacity:</span>
                    <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                      {formatPopulation(site?.resourceCapacity?.effectiveCapacity)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Limiting Bottleneck:</span>
                    <span data-tour="planning-bottleneck" className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold font-mono text-[10px] uppercase">
                      {site?.resourceCapacity?.bottleneck || 'None'}
                    </span>
                  </div>
                </div>

                {/* Resource Dimensions Mini-Bars */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-mono">
                      <span>Area Footprint</span>
                      <span>{formatPopulation(site?.resourceCapacity?.areaCapacity)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-500 h-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-mono">
                      <span>Water Supply</span>
                      <span>{formatPopulation(site?.resourceCapacity?.waterCapacity)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-600 h-full"
                        style={{ width: `${Math.min(100, Math.max(0, ((site?.resourceCapacity?.waterCapacity || 0) / (site?.resourceCapacity?.areaCapacity || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-mono">
                      <span>Sanitation (Toilets)</span>
                      <span>{formatPopulation(site?.resourceCapacity?.sanitationCapacity)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full"
                        style={{ width: `${Math.min(100, Math.max(0, ((site?.resourceCapacity?.sanitationCapacity || 0) / (site?.resourceCapacity?.areaCapacity || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-0.5 font-mono">
                      <span>Healthcare Tents</span>
                      <span>{formatPopulation(site?.resourceCapacity?.healthcareCapacity)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full"
                        style={{ width: `${Math.min(100, Math.max(0, ((site?.resourceCapacity?.healthcareCapacity || 0) / (site?.resourceCapacity?.areaCapacity || 1)) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Dist: {site.routeDistanceKm} km</span>
                <span>Transit: {site.transitTimeMinutes} min</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. ACTIVE SITE DEEP DIVE AUDIT */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-mono text-[#003366] font-bold uppercase">
              Shelter Capacity Assessment (Decision Support — SIMULATED_BENCHMARK): {activeSite.name} ({activeSite.code})
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">{activeSite.name}</h2>
            <p className="text-xs text-slate-500">
              {activeSite.location} • Access: <strong>{activeSite.accessibility}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-xs">
              EFFECTIVE: {formatPopulation(activeSite?.resourceCapacity?.effectiveCapacity)} PERSONS
            </span>
          </div>
        </div>

        {/* Detailed Bottleneck Analysis Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                <th className="p-2.5">Resource Dimension</th>
                <th className="p-2.5">Configured Limit (SIMULATED_BENCHMARK)</th>
                <th className="p-2.5">Supported Headcount</th>
                <th className="p-2.5">Standard Criterion</th>
                <th className="p-2.5">Status / Bottleneck Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-bold flex items-center gap-1.5 text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">square_foot</span>
                  Physical Land Area
                </td>
                <td className="p-2.5 font-mono">45.0 Hectares</td>
                <td className="p-2.5 font-mono font-bold">{formatPopulation(activeSite?.resourceCapacity?.areaCapacity)}</td>
                <td className="p-2.5 text-slate-500 font-mono">30 m² / person</td>
                <td className="p-2.5"><span className="text-emerald-700 font-bold">Surplus (+5,800)</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold flex items-center gap-1.5 text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-sky-600">water_drop</span>
                  Potable Water Supply
                </td>
                <td className="p-2.5 font-mono">180,000 L/day</td>
                <td className="p-2.5 font-mono font-bold">{formatPopulation(activeSite?.resourceCapacity?.waterCapacity)}</td>
                <td className="p-2.5 text-slate-500 font-mono">15 L / person / day (Sphere)</td>
                <td className="p-2.5"><span className="text-emerald-700 font-bold">Adequate (+2,800)</span></td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold flex items-center gap-1.5 text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-slate-600">cabin</span>
                  Shelter Units (Weatherized)
                </td>
                <td className="p-2.5 font-mono">2,000 Modular Tents</td>
                <td className="p-2.5 font-mono font-bold">{formatPopulation(activeSite?.resourceCapacity?.shelterCapacity)}</td>
                <td className="p-2.5 text-slate-500 font-mono">5 persons / family tent</td>
                <td className="p-2.5"><span className="text-emerald-700 font-bold">Adequate (+800)</span></td>
              </tr>
              <tr className="bg-red-50/70">
                <td className="p-2.5 font-bold flex items-center gap-1.5 text-red-900">
                  <span className="material-symbols-outlined text-[16px] text-red-600">wc</span>
                  Sanitation / Latrine Blocks
                </td>
                <td className="p-2.5 font-mono text-red-900 font-bold">460 Bio-Toilet Units</td>
                <td className="p-2.5 font-mono font-bold text-red-700">{formatPopulation(activeSite?.resourceCapacity?.sanitationCapacity)}</td>
                <td className="p-2.5 text-red-800 font-mono">1 toilet per 20 persons</td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 bg-red-600 text-white font-bold font-mono text-[9px] rounded uppercase">
                    PRIMARY BOTTLENECK
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold flex items-center gap-1.5 text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">local_hospital</span>
                  Field Healthcare Facility
                </td>
                <td className="p-2.5 font-mono">Level-3 Trauma Outpost</td>
                <td className="p-2.5 font-mono font-bold">{formatPopulation(activeSite?.resourceCapacity?.healthcareCapacity)}</td>
                <td className="p-2.5 text-slate-500 font-mono">1 doctor per 2,500 pop</td>
                <td className="p-2.5"><span className="text-emerald-700 font-bold">Adequate (+3,800)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. NEXT WORKFLOW ACTIONS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-600">
          Capacity assessment formulated against <strong>NDMA / Sphere Humanitarian Standards (Modeled Decision Support)</strong>. Benchmark limits are enforced in all solver simulations.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
          <span>Bottleneck Audited</span>
        </div>
      </div>
    </div>
  );
};
