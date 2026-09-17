import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { mockRelocationPhases } from '../mock/data';

export const RelocationPlan: React.FC = () => {
  const { allocationSummary } = useAppStore();
  const phase1Population = mockRelocationPhases[0]?.items.reduce((sum, item) => sum + item.headcount, 0) || 10440;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase font-mono">
              STAGE 3 STATUTORY OUTPUT
            </span>
            <span className="text-xs text-slate-500 font-mono">EXECUTION ROSTER</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#003366] mt-1">
            Phased Evacuation &amp; Relocation Master Plan
          </h1>
          <p className="text-xs text-slate-600">
            Chronological multi-wave evacuation orders with designated transport, security escorts, and reception camps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="h-8 sm:h-9 px-3 sm:px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print Official Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. STATUTORY DEPLOYMENT SUMMARY BANNER */}
      <div className="bg-white p-3.5 sm:p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Citizens Scheduled</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
            {allocationSummary.totalAllocatedPopulation.toLocaleString()}
          </span>
          <span className="block text-[10px] text-emerald-700 font-semibold">100% Verified Movement</span>
        </div>

        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Assigned Agencies</span>
          <span className="text-2xl font-bold font-mono text-[#003366] mt-0.5">04</span>
          <span className="block text-[10px] text-slate-500">NDRF, SDRF, BRO, ITBP</span>
        </div>

        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Immediate Phase (0-24h)</span>
          <span className="text-2xl font-bold font-mono text-red-700 mt-0.5">
            {phase1Population.toLocaleString()}
          </span>
          <span className="block text-[10px] text-red-700 font-semibold">Highest Hazard Priority</span>
        </div>

        <div>
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Transit Budget</span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
            ₹{allocationSummary.totalEstimatedCostLakhs} L
          </span>
          <span className="block text-[10px] text-slate-500">SDRF Emergency Outlay</span>
        </div>
      </div>

      {/* 3. PHASED RELOCATION SCHEDULE ACCORDIONS */}
      <div className="space-y-4">
        {mockRelocationPhases.map((phaseGroup, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-amber-500' : 'bg-[#003366]'
                }`}></span>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
                  PHASE {idx + 1}: {phaseGroup.phase}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {phaseGroup.items.reduce((s, i) => s + i.headcount, 0).toLocaleString()} Persons
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {phaseGroup.items.map((item, iIdx) => (
                <div key={iIdx} className="p-3.5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.habitation}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-[#003366]">{item.destination}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Agency: <strong className="text-slate-700">{item.agency}</strong></span>
                      <span>•</span>
                      <span>Critical Need: <span className="text-slate-600 italic">{item.criticalNeed}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">{item.headcount.toLocaleString()}</span>
                      <span className="block text-[9px] text-slate-400 uppercase">Headcount</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Active Transit'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Convoy Staged'
                        ? 'bg-blue-100 text-[#003366]'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 4. EXECUTIVE ADJUDICATION STATUS NOTICE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-600">
          The operational plan is compiled. Statutory authorization is conducted under the <strong>Officer Adjudication</strong> tab above.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-[#003366]">verified</span>
          <span>Orders Pending Sign-off</span>
        </div>
      </div>
    </div>
  );
};
