import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';

export const DecisionHistory: React.FC = () => {
  const { decisions } = useAppStore();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(decisions[0]?.id || null);

  const activeDecision = decisions.find(d => d.id === selectedDecisionId) || decisions[0];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold uppercase font-mono">
              STAGE 4 STATUTORY AUDIT TRAIL
            </span>
            <span className="text-xs text-slate-500 font-mono">SECTION 31 DM ACT COMPLIANT</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            District Magistrate Official Decision History &amp; Audit Trail
          </h1>
          <p className="text-xs text-slate-600">
            Immutable log of all District Incident Commander directives, algorithmic overrides, and dispatch authorisations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded flex items-center gap-1 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Export Official Gazette</span>
          </button>
        </div>
      </div>

      {/* 2. STATUTORY COMPLIANCE METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Total Recorded Orders</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono">{decisions.length}</span>
          <span className="block text-[10px] text-slate-500">All Legally Timestamped</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Officer Endorsements</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono">
            {decisions.filter(d => d.action === 'ACCEPTED').length} Accepted
          </span>
          <span className="block text-[10px] text-emerald-700 font-semibold">100% Validated</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Executive Overrides</span>
          <span className="text-2xl font-extrabold text-amber-700 font-mono">
            {decisions.filter(d => d.action === 'MODIFIED').length} Modified
          </span>
          <span className="block text-[10px] text-amber-700 font-semibold">Ground Intelligence Dispatched</span>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold">Cryptographic Integrity</span>
          <span className="text-2xl font-extrabold text-[#003366] font-mono">SHA-256</span>
          <span className="block text-[10px] text-slate-500">Tamper-Proof Audit Lock</span>
        </div>
      </div>

      {/* 3. AUDIT LOG LEDGER TABLE + DETAIL VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Table of Decisions (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
              Chronological Decision Audit Records
            </h3>
            <span className="text-[10px] font-mono text-slate-500">CLICK TO INSPECT DETAIL</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                  <th className="p-2.5">Order Ref</th>
                  <th className="p-2.5">Date &amp; Time</th>
                  <th className="p-2.5">Officer &amp; Authority</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Plan ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {decisions.map((dec) => {
                  const isSelected = activeDecision?.id === dec.id;
                  return (
                    <tr
                      key={dec.id}
                      onClick={() => setSelectedDecisionId(dec.id)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-blue-50/80 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-2.5 font-bold text-slate-800">{dec.id}</td>
                      <td className="p-2.5 text-slate-600 text-[11px]">{dec.timestamp}</td>
                      <td className="p-2.5 text-slate-900 font-sans">{dec.officerName}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dec.action === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dec.action === 'MODIFIED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {dec.action}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{dec.planId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Decision Detail Card (4 cols) */}
        {activeDecision && (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3 font-sans">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">OFFICIAL DOSSIER VIEW</span>
              <h3 className="text-base font-bold text-[#003366] mt-0.5">{activeDecision.id}</h3>
              <p className="text-[11px] text-slate-500 font-mono">{activeDecision.timestamp}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase font-mono">Decision Authority</span>
                <span className="font-bold text-slate-900">{activeDecision.officerName}</span>
                <span className="block text-[11px] text-slate-600">{activeDecision.officerRole}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase font-mono">Recorded Rationale</span>
                <p className="text-slate-700 leading-relaxed text-[11px] mt-1">{activeDecision.rationale}</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase font-mono">Legal Citation</span>
                <span className="font-mono text-slate-800 text-[11px]">{activeDecision.statutoryReference}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[10px] text-slate-500 font-bold uppercase font-mono">Affected Entities</span>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  <strong>Habitations:</strong> {activeDecision.affectedHabitations.join(', ')}
                </div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  <strong>Safe Sites:</strong> {activeDecision.affectedSites.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
