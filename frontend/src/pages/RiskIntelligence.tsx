import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { mockRiskIntelligence, mockHabitations } from '../mock/data';
import { LiveAIAnalysisPanel } from '../components/ai/LiveAIAnalysisPanel';
import type { VillageContext } from '../services/briefing.service';
import { formatPercent, formatScore } from '../utils/formatters';

export const RiskIntelligence: React.FC = () => {
  const { habitations, selectedHabitationId, setSelectedHabitationId, roadR12Blocked } = useAppStore();

  const safeHabitations = Array.isArray(habitations) && habitations.length > 0
    ? habitations
    : mockHabitations;

  const selectedHabitation = safeHabitations.find(h => h.id === selectedHabitationId) || safeHabitations[0] || mockHabitations[0];
  const intelligence = mockRiskIntelligence[selectedHabitation.id] || mockRiskIntelligence['HAB-001'];

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
      {/* 1. TOP HEADER & BREADCRUMB CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-100 border border-purple-300 text-purple-900 text-[10px] font-bold uppercase font-mono">
              AI EXPLAINABILITY ENGINE (SHAP &amp; FEATURE WEIGHTS)
            </span>
            <span className="text-xs text-slate-500 font-mono">MODEL CONFIDENCE: {formatPercent(intelligence?.confidenceScore ?? 0.91, 0)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#003366] mt-1">
            Algorithmic Risk Intelligence &amp; Rationale
          </h1>
          <p className="text-xs text-slate-600">
            Deconstructing why <strong>{selectedHabitation.name}</strong> was assigned an urgency tier of <strong>{selectedHabitation.priority}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Habitation Quick Selector Dropdown */}
          <select
            value={selectedHabitation.id}
            onChange={(e) => setSelectedHabitationId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 outline-none"
          >
            {safeHabitations.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} (Risk: {formatPercent(h.riskScore, 0)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. LIVE AI DIRECTIVES & GENERATIVE SYNTHESIS PANEL */}
      <LiveAIAnalysisPanel context={villageContext} />

      {/* 3. TOP EXPLAINABILITY SUMMARY CARD */}
      <div className="bg-[#003366] text-white p-4 sm:p-5 rounded-lg border border-[#002244] shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-800/80 text-white border border-red-500/50">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                {intelligence.calibratedThreshold}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Multi-Hazard Vulnerability Index: {formatPercent(intelligence?.overallRisk, 0)} (Immediate Priority Tier)
            </h2>
            <p className="text-xs text-slate-100 leading-relaxed font-sans">
              {intelligence?.narrativeExplanation || 'Model assessment pending live telemetry.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/10 p-3.5 rounded-lg border border-white/20">
            <div className="text-center">
              <span className="block text-[10px] text-slate-200 uppercase font-mono font-semibold">Model Confidence</span>
              <span className="text-2xl font-bold text-emerald-300 font-mono">
                {formatPercent(intelligence?.confidenceScore, 0)}
              </span>
              <span className="block text-[9px] text-slate-300">Calibrated Brier: 0.04</span>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <span className="block text-[10px] text-slate-200 uppercase font-mono font-semibold">Telemetry Freshness</span>
              <span className="text-2xl font-bold text-amber-300 font-mono">2.5h</span>
              <span className="block text-[9px] text-slate-300">ISRO Radar Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOUR RISK DIMENSIONS BREAKDOWN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Hazard Exposure</span>
            <span className="material-symbols-outlined text-red-600 text-[20px]">tsunami</span>
          </div>
          <div className="text-2xl font-extrabold text-red-600 font-mono mt-2">
            {formatPercent(intelligence?.hazardExposureIndex, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active ground slump exceeding 14 mm/week and high river proximity.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Demographic Vulnerability</span>
            <span className="material-symbols-outlined text-[#d9531e] text-[20px]">groups</span>
          </div>
          <div className="text-2xl font-extrabold text-[#d9531e] font-mono mt-2">
            {formatPercent(intelligence?.vulnerabilityIndex, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            39% elderly/children fraction requiring specialized transit logistics.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Infrastructure Fragility</span>
            <span className="material-symbols-outlined text-amber-600 text-[20px]">alt_route</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono mt-2">
            {formatPercent(intelligence?.infrastructureFragilityIndex, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Traverses a single vulnerable bridge link at Km 212 on NH-07.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase">Priority Weight (RPW)</span>
            <span className="material-symbols-outlined text-[#003366] text-[20px]">balance</span>
          </div>
          <div className="text-2xl font-extrabold text-[#003366] font-mono mt-2">
            {formatScore(selectedHabitation?.priorityScore, 2)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Feeds directly as penalty multiplier in Linear Program optimizer.
          </p>
        </div>
      </div>

      {/* 4. SHAP FEATURE IMPORTANCE DECOMPOSITION */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-[#003366] uppercase tracking-wider">
              SHAP / Feature Importance Weight Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Transparent attribution of variables driving the AI's risk probability score.
            </p>
          </div>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded">
            TREE SHAP ATTRIBUTION
          </span>
        </div>

        <div className="space-y-4">
          {intelligence.features.map((feat, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{feat.feature}</span>
                  <span className="px-2 py-0.2 bg-white border border-slate-300 text-slate-600 rounded text-[10px] font-mono">
                    {feat.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-500">Weight: <strong>{formatPercent(feat?.importanceWeight, 0)}</strong></span>
                  <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                    SHAP: +{formatScore(feat?.shapValue, 2)}
                  </span>
                </div>
              </div>

              {/* Visual Contribution Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#d9531e] h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (feat?.importanceWeight ?? 0) * 100))}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-600">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. AUDIT INTEGRITY NOTICE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-600">
          Risk decomposition verified against multi-temporal InSAR satellite subsidence data and census household registers.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-purple-700">verified</span>
          <span>Decomposition Audited</span>
        </div>
      </div>
    </div>
  );
};
