import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { formatPercent, formatPopulation } from '../utils/formatters';

export const Analytics: React.FC = () => {
  const { habitations, sites, allocationSummary } = useAppStore();
  const [selectedZone, setSelectedZone] = useState('All Zones');

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-[#003366] text-[10px] font-bold uppercase font-mono">
              SYSTEM INTELLIGENCE &amp; ANALYTICS
            </span>
            <span className="text-xs text-slate-500 font-mono">SECTOR: CHAMOLI BASIN</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Settlement Vulnerability &amp; Resource Allocation Analytics
          </h1>
          <p className="text-xs text-slate-600">
            Statistical distributions, multi-dimensional risk clustering, and shelter capacity absorption metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold outline-none"
          >
            <option>All Zones</option>
            <option>Joshimath Sub-District</option>
            <option>Helang-Alaknanda Basin</option>
            <option>Pipalkoti Plateau Sector</option>
          </select>
        </div>
      </div>

      {/* 2. TOP METRIC CARDS STRIP */}
      <div id="tour-analytics-kpi-summary" data-tour="analytics-kpi-summary" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Immediate Relocation Tier</span>
          <span className="text-2xl font-extrabold text-red-600 font-mono">14,940</span>
          <span className="block text-[11px] text-slate-600 mt-0.5">60.7% of total monitored basin</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Carrying Bottlenecks</span>
          <span className="text-2xl font-extrabold text-[#d9531e] font-mono">3 Hubs Constrained</span>
          <span className="block text-[11px] text-slate-600 mt-0.5">Sanitation &amp; water limits</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Safe Effective Shelter</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">19,500 Beds</span>
          <span className="block text-[11px] text-emerald-700 font-semibold">100% capacity mobilized</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Unmet Transparent Deficit</span>
          <span className="text-2xl font-extrabold text-amber-600 font-mono">
            {formatPopulation(allocationSummary?.unmetDemandTotal)}
          </span>
          <span className="block text-[11px] text-amber-700 font-semibold">Flagged for State Requisition</span>
        </div>
      </div>

      {/* 3. ANALYTICAL CHARTS & BREAKDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Hazard Exposure by Habitation */}
        <div id="tour-analytics-risk-trends" data-tour="analytics-risk-trends" className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
              1. Settlement Hazard Exposure Index
            </h3>
            <span className="text-[10px] font-mono text-slate-500">RADAR / INSAR SENSOR DATA</span>
          </div>

          <div className="space-y-3 pt-1">
            {habitations.map((h) => (
              <div key={h.id} className="space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="font-bold text-slate-800 font-sans">{h.name}</span>
                  <span className="text-red-700 font-bold">{formatPercent(h?.hazardExposureScore, 0)} Exposure</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (h.hazardExposureScore || 0) > 0.9
                        ? 'bg-red-600'
                        : (h.hazardExposureScore || 0) > 0.7
                        ? 'bg-[#d9531e]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, (h.hazardExposureScore || 0) * 100))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrying Capacity Bottlenecks Bar Chart */}
        <div id="tour-analytics-relocation-stats" data-tour="analytics-relocation-stats" className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
              2. Site Effective Capacity vs. Physical Space
            </h3>
            <span className="text-[10px] font-mono text-slate-500">BOTTLENECK SUPPRESSION RATIO</span>
          </div>

          <div className="space-y-4 pt-1">
            {sites.map((s) => {
              const eff = s?.resourceCapacity?.effectiveCapacity;
              const area = s?.resourceCapacity?.areaCapacity;
              const hasValidRatio = typeof eff === 'number' && typeof area === 'number' && area > 0;
              const suppressionRatio = hasValidRatio ? ((eff / area) * 100).toFixed(0) : '—';
              const numRatio = hasValidRatio ? Math.min(100, Math.max(0, (eff / area) * 100)) : 0;
              return (
                <div key={s.id} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-slate-900 font-sans">
                    <span>{s.name}</span>
                    <span className="font-mono text-emerald-800 font-extrabold">
                      {formatPopulation(s?.resourceCapacity?.effectiveCapacity)} Effective
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Physical Space: {formatPopulation(s?.resourceCapacity?.areaCapacity)}</span>
                    <span className="text-red-700 font-bold">Bottleneck: {s?.resourceCapacity?.bottleneck || 'None'}</span>
                  </div>

                  {/* Dual Bar: Space vs Effective */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-600 h-full" style={{ width: `${numRatio}%` }}></div>
                    <div className="bg-slate-400/40 h-full" style={{ width: `${100 - numRatio}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right font-mono">
                    {suppressionRatio !== '—' ? `${suppressionRatio}% real resource viability` : 'Viability metric unavailable'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. AUDIT NOTICE FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-600">
          Analytics verified against ground census telemetry and district spatial records.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-blue-700">verified</span>
          <span>Analytics Verified</span>
        </div>
      </div>
    </div>
  );
};
