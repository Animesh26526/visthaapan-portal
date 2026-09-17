import React from 'react';
import { useAppStore } from '../stores/useAppStore';

export const ScenarioLab: React.FC = () => {
  const {
    roadR12Blocked,
    toggleRoadR12,
    siteAlphaCapacityOverride,
    setSiteAlphaCapacity,
    hazardSeverity,
    setHazardSeverity,
    reoptimizeScenario,
    resetScenario,
    isReoptimized
  } = useAppStore();

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase font-mono">
              DYNAMIC STRESS-TEST LAB &amp; WHAT-IF SIMULATOR
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ENGINE: SENSITIVITY ANALYSIS &amp; DYNAMIC RE-OPTIMIZATION
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Scenario Lab: Perturbation Stress Testing
          </h1>
          <p className="text-xs text-slate-600">
            Simulate real-time disaster contingencies: road corridor breaches, infrastructure failures, and emergency capacity drops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetScenario}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded shadow-xs"
          >
            Reset Baseline
          </button>
          <button
            onClick={reoptimizeScenario}
            className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm transition"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">autorenew</span>
            <span>RE-OPTIMIZE NOW</span>
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE CONTROLS CONSOLE */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
            OPERATIONAL PERTURBATION INJECTIONS
          </span>
          <span className="text-xs text-slate-500 font-mono">Simulate conditions before making official field changes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stress 1: Road R12 Blockage */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">1. Road Corridor Blockage</span>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                roadR12Blocked ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {roadR12Blocked ? 'BLOCKED' : 'PASSABLE'}
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              NH-07 Road R12 (Helang to Pipalkoti). Active debris slump on bridge abutment.
            </p>

            <button
              onClick={toggleRoadR12}
              className={`w-full py-2 px-3 text-xs font-bold rounded shadow-xs transition flex items-center justify-center gap-2 ${
                roadR12Blocked
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {roadR12Blocked ? 'cancel' : 'check_circle'}
              </span>
              <span>{roadR12Blocked ? 'Re-open Road R12' : 'Close Road R12 (Debris Slump)'}</span>
            </button>
          </div>

          {/* Stress 2: Site Alpha Carrying Capacity Override */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">2. Site Alpha Capacity Deficit</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-mono text-[10px] font-bold rounded">
                {siteAlphaCapacityOverride.toLocaleString()} BEDS
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Simulate water or sanitation contamination reducing available beds at Safe Site Alpha.
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>3,000 (Severe Deficit)</span>
                <span>9,200 (Normal)</span>
              </div>
              <input
                type="range"
                min="3000"
                max="9200"
                step="500"
                value={siteAlphaCapacityOverride}
                onChange={(e) => setSiteAlphaCapacity(Number(e.target.value))}
                className="w-full accent-[#003366]"
              />
            </div>
          </div>

          {/* Stress 3: Meteorological Hazard Multiplier */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">3. Hazard Intensity Surge</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-900 font-mono text-[10px] font-bold rounded">
                METEOROLOGICAL
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              IMD Doppler radar rainfall surge scenario over Joshimath catchment basin.
            </p>

            <select
              value={hazardSeverity}
              onChange={(e: any) => setHazardSeverity(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded bg-white font-semibold outline-none"
            >
              <option>Normal Baseline</option>
              <option>Elevated Rainfall (+25%)</option>
              <option>Extreme Cloudburst (+50%)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={reoptimizeScenario}
            className="px-6 py-2.5 bg-[#d9531e] hover:bg-[#b04014] text-white text-xs font-bold rounded shadow transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>APPLY &amp; RE-OPTIMIZE DISPATCH MATRIX</span>
          </button>
        </div>
      </div>

      {/* 3. BEFORE VS AFTER COMPARISON VIEW */}
      {isReoptimized && (
        <div className="bg-white border-2 border-amber-400 rounded-lg shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">compare_arrows</span>
              <div>
                <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider">
                  BEFORE vs. AFTER OPTIMIZATION COMPARISON
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time algorithmic delta generated after perturbation injection.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded">
              DELTA RECORDED
            </span>
          </div>

          {/* Dynamic Change Notification Callout */}
          <div className="p-3 bg-amber-50 rounded border border-amber-300 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-600">priority_high</span>
              <span>REROUTING DIRECTIVE EXECUTED</span>
            </div>
            <p className="text-[11px] text-amber-900">
              {roadR12Blocked
                ? 'Road R12 closure severed direct transit from Village A to Site Alpha. The OR engine automatically rerouted 4,800 persons via interior bypass to Safe Site Gamma (Ghingran Plateau), and diverted 3,440 persons to Safe Site Beta (Gauchar Aerodrome).'
                : 'Site Alpha capacity restriction handled. Overflow populations successfully rerouted to Site Gamma without violating sanitary constraints.'}
            </p>
          </div>

          {/* Side-by-Side Before vs After Metric Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BEFORE BASELINE */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-slate-500">BEFORE (BASELINE PLAN)</span>
              <div className="flex justify-between"><span>Village A → Site Alpha:</span><strong>7,000 pax</strong></div>
              <div className="flex justify-between"><span>Village A → Site Gamma:</span><strong>1,240 pax</strong></div>
              <div className="flex justify-between"><span>Total Fleet Outlay:</span><strong>₹53.0 Lakhs</strong></div>
              <div className="flex justify-between"><span>Total Road Distance:</span><strong>202.6 km</strong></div>
            </div>

            {/* AFTER RE-OPTIMIZED */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-300 space-y-2 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-emerald-800">AFTER (RE-OPTIMIZED PLAN)</span>
              <div className="flex justify-between text-emerald-950">
                <span>Village A → Site Gamma:</span>
                <strong>4,800 pax (+3,560 diverted)</strong>
              </div>
              <div className="flex justify-between text-emerald-950">
                <span>Village A → Site Beta:</span>
                <strong>3,440 pax (New corridor)</strong>
              </div>
              <div className="flex justify-between text-emerald-950">
                <span>Total Fleet Outlay:</span>
                <strong className="text-amber-700">₹68.5 Lakhs (+₹15.5L detour cost)</strong>
              </div>
              <div className="flex justify-between text-emerald-950">
                <span>Total Road Distance:</span>
                <strong>268.4 km</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. WORKFLOW FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-xs text-slate-600">
          Contingency scenario ready. Review the solver output or statutory orders using the workspace tabs above.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-amber-700">verified</span>
          <span>Perturbation Synthesized</span>
        </div>
      </div>
    </div>
  );
};
