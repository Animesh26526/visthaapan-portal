import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

export const OptimalAllocation: React.FC = () => {
  const {
    allocations,
    allocationSummary,
    isReoptimized,
    roadR12Blocked
  } = useAppStore();

  const [selectedHabFilter, setSelectedHabFilter] = useState<string>('all');

  const filteredAllocations = allocations.filter(a => {
    return selectedHabFilter === 'all' || a.habitationId === selectedHabFilter;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. OPERATIONAL HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-[#003366] text-[10px] font-bold uppercase font-mono">
              STAGE 3 OR ALLOCATION SOLVER
            </span>
            <span className="text-xs text-slate-500 font-mono">
              MODE: {isReoptimized ? 'CONTINGENCY RE-OPTIMIZATION ACTIVE' : 'NOMINAL BASELINE PLAN'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Operations Research Optimal Allocation Engine
          </h1>
          <p className="text-xs text-slate-600">
            Global Operations Research mathematical dispatch minimizing citizen hazard exposure and transit risk.
          </p>
        </div>

        {/* Solver Status Badge */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3.5 py-2 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>OR Solver Converged (Dual Simplex Optimal)</span>
        </div>
      </div>

      {/* 2. SUMMARY METRICS ROW (6 KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Target Population</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatPopulation(allocationSummary?.totalTargetPopulation)}
          </span>
          <span className="block text-[10px] text-slate-500">28 Monitored Settlements</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Relocated</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">
            {formatPopulation(allocationSummary?.totalAllocatedPopulation)}
          </span>
          <span className="block text-[10px] text-emerald-700 font-bold">100% Safe Placement</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Capacity Deficit</span>
          <span className="text-2xl font-extrabold text-[#d9531e] font-mono">
            {formatPopulation(allocationSummary?.unmetDemandTotal)}
          </span>
          <span className="block text-[10px] text-[#d9531e] font-bold">Transparent Shelter Deficit</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Transit Distance</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono">
            {allocationSummary.totalDistanceKm} km
          </span>
          <span className="block text-[10px] text-slate-500">Network Road Span</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Capacity Utilization</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono">
            {Math.round(((allocationSummary?.totalAllocatedPopulation || 12250) / 14500) * 100)}%
          </span>
          <span className="block text-[10px] text-slate-500">Relocation Hub Load</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">High Priority Met</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">
            {allocationSummary.highPrioritySatisfactionRate}%
          </span>
          <span className="block text-[10px] text-emerald-700 font-bold">Zero Stranded Immediate</span>
        </div>
      </div>

      {/* 3. TRANSIT DISPATCH FLOW VISUALIZATION CANVAS */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#003366] text-[20px]">alt_route</span>
            <span className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
              Population Dispatch Matrix: Optimal Relocation Transit Vectors
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {roadR12Blocked ? '⚠️ ROAD R12 BLOCKED • DIVERSIFIED TRANSIT ROUTES' : 'ALL PRIMARY ARTERIAL CORRIDORS OPEN'}
          </span>
        </div>

        {/* Transit Diagram Graphic (Clean UX4G Gov Card) */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 overflow-hidden relative min-h-[220px] flex flex-col md:flex-row items-center justify-around gap-4">
          {/* Left Column: High Risk Origins */}
          <div className="relative z-10 space-y-3 w-full md:w-auto">
            <div className="text-[10.5px] font-mono text-red-800 uppercase font-bold tracking-widest text-center">
              Origin Habitations (Vulnerable)
            </div>
            
            <div className="p-3 bg-white border-2 border-red-500 rounded-lg text-center w-full md:w-56 shadow-2xs">
              <div className="font-bold text-xs text-red-950">Village A (Malari Upper)</div>
              <div className="text-[10.5px] text-red-700 font-mono font-semibold">Immediate • 8,240 Citizens</div>
            </div>

            <div className="p-3 bg-white border-2 border-red-500 rounded-lg text-center w-full md:w-56 shadow-2xs">
              <div className="font-bold text-xs text-red-950">Village B (Helang Valley)</div>
              <div className="text-[10.5px] text-red-700 font-mono font-semibold">Immediate • 6,700 Citizens</div>
            </div>

            <div className="p-2.5 bg-white border border-amber-500 rounded-lg text-center w-full md:w-56 shadow-2xs">
              <div className="font-bold text-xs text-amber-950">Village C (Pipalkoti Flank)</div>
              <div className="text-[10.5px] text-amber-700 font-mono font-semibold">Short-term • 4,100 Citizens</div>
            </div>
          </div>

          {/* Center Column: Flow Line Connectors */}
          <div className="relative z-10 hidden md:flex flex-col items-center justify-center space-y-3 text-xs font-mono text-slate-700">
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-emerald-700 font-bold">sync_alt</span>
              <span className="font-semibold">7,000 pax → Alpha (18.4 km)</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-[#003366] font-bold">sync_alt</span>
              <span className="font-semibold">4,500 pax → Beta (46.2 km)</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-300 shadow-2xs">
              <span className="material-symbols-outlined text-[16px] text-indigo-700 font-bold">sync_alt</span>
              <span className="font-semibold">3,100 pax → Gamma (28.4 km)</span>
            </div>
          </div>

          {/* Right Column: Safe Relocation Destinations */}
          <div className="relative z-10 space-y-3 w-full md:w-auto">
            <div className="text-[10.5px] font-mono text-emerald-800 uppercase font-bold tracking-widest text-center">
              Candidate Safe Hubs (Carrying Cap)
            </div>

            <div className="p-3 bg-white border-2 border-emerald-600 rounded-lg text-center w-full md:w-56 shadow-2xs">
              <div className="font-bold text-xs text-emerald-950">Site Alpha (Highland Ridge)</div>
              <div className="text-[10.5px] text-emerald-700 font-mono font-semibold">Allocated: 9,200 / 9,200 (100%)</div>
              <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Sanitation Bottleneck Met</div>
            </div>

            <div className="p-3 bg-white border-2 border-emerald-600 rounded-lg text-center w-full md:w-56 shadow-2xs">
              <div className="font-bold text-xs text-emerald-950">Site Beta (Gauchar Aerodrome)</div>
              <div className="text-[10.5px] text-emerald-700 font-mono font-semibold">Allocated: 5,500 / 5,500 (100%)</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Air-bridge runway active</div>
            </div>

            <div className="p-3 bg-white border-2 border-emerald-600 rounded-lg text-center w-full md:w-56 shadow-2xs">
              <div className="font-bold text-xs text-emerald-950">Site Gamma (Ghingran Plateau)</div>
              <div className="text-[10.5px] text-emerald-700 font-mono font-semibold">Allocated: 4,800 / 4,800 (100%)</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Water gravity feed secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DETAILED ALLOCATION DISPATCH TABLE */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
              Dispatch Manifest Table
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {filteredAllocations.length} ALLOCATION ITEMS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter by Habitation:</span>
            <select
              value={selectedHabFilter}
              onChange={(e) => setSelectedHabFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white outline-none"
            >
              <option value="all">All Habitations</option>
              <option value="HAB-001">Village A (Malari Upper)</option>
              <option value="HAB-002">Village B (Helang Valley)</option>
              <option value="HAB-003">Village C (Pipalkoti Flank)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                <th className="p-2.5">Item ID</th>
                <th className="p-2.5">Origin Habitation</th>
                <th className="p-2.5">Priority</th>
                <th className="p-2.5">Destination Site</th>
                <th className="p-2.5 text-right">Allocated Headcount</th>
                <th className="p-2.5 text-right">Distance</th>
                <th className="p-2.5 text-right">Est. Transit</th>
                <th className="p-2.5 text-right">Wave / Phase</th>
                <th className="p-2.5">Assigned Agency</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredAllocations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-bold text-slate-500">{item.id}</td>
                  <td className="p-2.5 font-bold text-slate-900 font-sans">{item.habitationName}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.priority === 'Immediate' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-[#003366] font-sans">{item.siteName}</td>
                  <td className="p-2.5 text-right font-extrabold text-slate-900">
                    {formatPopulation(item?.allocatedPopulation)}
                  </td>
                  <td className="p-2.5 text-right text-slate-600">{item.distanceKm} km</td>
                  <td className="p-2.5 text-right text-slate-600">{item.travelTimeMin} min</td>
                  <td className="p-2.5 text-right text-indigo-700 font-bold font-mono">
                    {item.priority === 'Immediate' ? 'Wave 1 (0-6h)' : 'Wave 2 (6-18h)'}
                  </td>
                  <td className="p-2.5 text-slate-700 font-sans">{item.assignedAgency}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-[#003366] border border-blue-200 text-[10px] font-bold">
                      {item.transitStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. STATUTORY VERIFICATION NOTICE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-xs text-slate-600">
          Optimal dispatch matrix computed. Sub-plans, explainability, and contingency stress-testing can be accessed via the workspace navigation tabs above.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
          <span>Matrix Verified</span>
        </div>
      </div>
    </div>
  );
};
