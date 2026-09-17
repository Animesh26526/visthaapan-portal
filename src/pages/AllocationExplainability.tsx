import React from 'react';
import { mockAllocationExplanation, mockHabitations } from '../mock/data';
import { useAppStore } from '../stores/useAppStore';
import { LiveAIAnalysisPanel } from '../components/ai/LiveAIAnalysisPanel';
import type { VillageContext } from '../services/geminiService';

export const AllocationExplainability: React.FC = () => {
  const explanation = mockAllocationExplanation;
  const { habitations, selectedHabitationId, roadR12Blocked } = useAppStore();

  const safeHabitations = Array.isArray(habitations) && habitations.length > 0
    ? habitations
    : mockHabitations;

  const selectedHabitation = safeHabitations.find(h => h.id === selectedHabitationId) || safeHabitations[0] || mockHabitations[0];

  const villageContext: VillageContext = {
    id: selectedHabitation.id,
    name: selectedHabitation.name,
    code: selectedHabitation.code,
    population: selectedHabitation.population || 8240,
    priority: selectedHabitation.priority || 'Immediate',
    riskScore: selectedHabitation.riskScore || 0.94,
    vulnerabilityScore: selectedHabitation.vulnerabilityScore || 0.89,
    slopeDegrees: selectedHabitation.slopeDegrees || 34.2,
    primaryHazard: selectedHabitation.primaryHazard || 'Subsidence',
    roadR12Blocked,
    vulnerableGroups: selectedHabitation.vulnerableGroups,
    infrastructure: selectedHabitation.infrastructure,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-[#003366] text-[10px] font-bold uppercase font-mono">
              OPTIMIZATION AUDITABILITY &amp; EXPLAINABILITY
            </span>
            <span className="text-xs text-slate-500 font-mono">PLAN REF: {explanation.allocationId}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#003366] mt-1">
            Why This Plan? Algorithmic Allocation Justification
          </h1>
          <p className="text-xs text-slate-600">
            Transparent rationale explaining why specific habitations were prioritized, why safe sites were selected, and why rejected alternatives were disqualified.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
          <span>Decision Audit Trail Verified</span>
        </div>
      </div>

      {/* 2. LIVE AI EXPLAINABILITY COPILOT */}
      <LiveAIAnalysisPanel context={villageContext} />

      {/* 3. THREE-PANEL EXPLAINABILITY DOSSIER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* PANEL 1: WHY WERE THESE HABITATIONS PRIORITIZED? */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="material-symbols-outlined text-red-600 text-[20px]">priority_high</span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Prioritization Rationale</h3>
              <p className="text-[10px] text-slate-500">Why did these villages receive priority?</p>
            </div>
          </div>

          <div className="space-y-3">
            {explanation.prioritizedHabitations.map((item, idx) => (
              <div key={idx} className="p-3 bg-red-50/60 rounded border border-red-200 space-y-1.5 text-xs">
                <div className="font-bold text-red-950 flex items-center justify-between">
                  <span>{item.name}</span>
                  <span className="text-[9px] bg-red-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">TIER 1</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{item.rationale}</p>
                <div className="space-y-1 pt-1 border-t border-red-200/60">
                  {item.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] text-red-800 font-medium">
                      <span className="w-1 h-1 rounded-full bg-red-600"></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2: WHY WERE THESE SAFE SITES SELECTED? */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Safe Destination Rationale</h3>
              <p className="text-[10px] text-slate-500">Why were these shelters selected?</p>
            </div>
          </div>

          <div className="space-y-3">
            {explanation.selectedSites.map((item, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/60 rounded border border-emerald-200 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>{item.name}</span>
                  <span className="text-[9px] bg-emerald-700 text-white font-mono px-1.5 py-0.2 rounded font-bold">OPTIMAL</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">{item.advantage}</p>
                <div className="p-2 bg-white rounded border border-emerald-300 text-[10px] text-slate-600">
                  <strong className="text-amber-800 font-bold block mb-0.5">Bottleneck Mitigation:</strong>
                  {item.bottleneckMitigation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 3: WHY WERE ALTERNATIVES REJECTED? */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="material-symbols-outlined text-slate-600 text-[20px]">block</span>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">3. Disqualified Alternatives</h3>
              <p className="text-[10px] text-slate-500">Why were these options ruled out?</p>
            </div>
          </div>

          <div className="space-y-3">
            {explanation.rejectedAlternatives.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{item.alternative}</span>
                  <span className="text-[9px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.2 rounded font-bold">REJECTED</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {item.rejectionReason}
                </p>
                <div className="text-[10px] text-red-700 font-bold flex items-center gap-1 font-mono pt-1">
                  <span className="material-symbols-outlined text-[13px]">gavel</span>
                  <span>Violates NDMA Spatial Constraint</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. AUDIT NOTICE FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="text-xs text-slate-600">
          Algorithmic decisions are fully auditable under Section 31 of the Disaster Management Act, 2005.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
          <span>Statutory Audit Cleared</span>
        </div>
      </div>
    </div>
  );
};
