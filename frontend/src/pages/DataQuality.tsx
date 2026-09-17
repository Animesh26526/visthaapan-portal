import React from 'react';
import { mockDataQualityBenchmarks } from '../mock/data';

export const DataQuality: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold uppercase font-mono">
              SYSTEM INTEGRITY BENCHMARK
            </span>
            <span className="text-xs text-slate-500 font-mono">ISO 19157 GEOGRAPHIC INFORMATION STANDARDS</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Data Quality, Validation &amp; Reliability Dashboard
          </h1>
          <p className="text-xs text-slate-600">
            Monitoring missing value rates, sensor freshness latency, positional error bounds, and ground verification statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>ISO 19157 Compliant</span>
        </div>
      </div>

      {/* 2. QUALITY BENCHMARKS TABLE */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
            Core Data Quality Metrics &amp; Targets
          </h3>
          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
            GRID STATUS: OPERATIONAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                <th className="p-2.5">Quality Benchmark</th>
                <th className="p-2.5">Dimension Category</th>
                <th className="p-2.5 text-right">Current Score</th>
                <th className="p-2.5 text-right">Target Benchmark</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Validation Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {mockDataQualityBenchmarks.map((bench, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 font-bold text-slate-900 font-sans">{bench.metric}</td>
                  <td className="p-2.5 text-slate-600">{bench.category}</td>
                  <td className="p-2.5 text-right font-extrabold text-emerald-700">{bench.score}%</td>
                  <td className="p-2.5 text-right text-slate-500">≥ {bench.benchmarkTarget}%</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      bench.status === 'OPTIMAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {bench.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600 font-sans text-[11px]">{bench.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. CONFIDENCE STATEMENT */}
      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-300 text-xs text-emerald-950 flex items-start gap-3">
        <span className="material-symbols-outlined text-emerald-700 text-[24px] shrink-0">verified_user</span>
        <div>
          <h4 className="font-bold text-sm">Authoritative Certification Notice</h4>
          <p className="text-[11px] text-emerald-900 mt-1 leading-relaxed">
            All satellite and hydrological datasets ingested by VISTHAAPAN are signed cryptographically by accredited nodal agencies. Algorithmic uncertainty is explicitly bounded and exposed to prevent false assurances during life-critical evacuation operations.
          </p>
        </div>
      </div>
    </div>
  );
};
