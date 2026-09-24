import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

interface ArchivedPlan {
  id: string;
  version: number;
  date: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'REJECTED' | 'ARCHIVED';
  approvingOfficer: string;
  totalTarget: number;
  totalAllocated: number;
  unmetDemand: number;
  totalDistanceKm: number;
  avgEvacMinutes: number;
  fleetOutlayLakhs: number;
  rationale: string;
  allocations: Array<{
    habitation: string;
    site: string;
    pax: number;
  }>;
}

const ARCHIVED_PLANS: ArchivedPlan[] = [
  {
    id: '#VST-2026-CHM-014',
    version: 14,
    date: '2026-09-24 06:00 IST',
    status: 'ACTIVE',
    approvingOfficer: 'Shri R. K. Sharma, IAS (DM Chamoli)',
    totalTarget: 19500,
    totalAllocated: 19500,
    unmetDemand: 0,
    totalDistanceKm: 442.1,
    avgEvacMinutes: 124,
    fleetOutlayLakhs: 58.4,
    rationale:
      'Baseline operations order utilizing optimal Google OR-Tools SCIP solver formulation with Gauchar, Karnaprayag, and Rudraprayag primary hubs. Pipalkoti transit shelter excluded due to slope instability.',
    allocations: [
      { habitation: 'Joshimath', site: 'Gauchar Relocation Site', pax: 4500 },
      { habitation: 'Raini', site: 'Karnaprayag Relocation Site', pax: 1800 },
      { habitation: 'Tapovan', site: 'Rudraprayag Relocation Site', pax: 3150 },
      { habitation: 'Helang', site: 'Gauchar Relocation Site', pax: 1000 },
      { habitation: 'Helang', site: 'Karnaprayag Relocation Site', pax: 1800 },
      { habitation: 'Pandukeshwar', site: 'Srinagar Relocation Site', pax: 3200 },
    ],
  },
  {
    id: '#VST-2026-CHM-013',
    version: 13,
    date: '2026-09-23 18:30 IST',
    status: 'SUPERSEDED',
    approvingOfficer: 'Shri R. K. Sharma, IAS (DM Chamoli)',
    totalTarget: 18200,
    totalAllocated: 18200,
    unmetDemand: 0,
    totalDistanceKm: 418.5,
    avgEvacMinutes: 118,
    fleetOutlayLakhs: 54.2,
    rationale:
      'Pre-monsoon preparedness iteration prior to InSAR telemetry update. Gauchar and Karnaprayag hubs at standard capacity.',
    allocations: [
      { habitation: 'Joshimath', site: 'Gauchar Relocation Site', pax: 4200 },
      { habitation: 'Raini', site: 'Karnaprayag Relocation Site', pax: 1600 },
      { habitation: 'Tapovan', site: 'Rudraprayag Relocation Site', pax: 3100 },
      { habitation: 'Helang', site: 'Gauchar Relocation Site', pax: 2600 },
      { habitation: 'Pandukeshwar', site: 'Srinagar Relocation Site', pax: 3100 },
    ],
  },
  {
    id: '#VST-2026-CHM-012',
    version: 12,
    date: '2026-09-22 10:15 IST',
    status: 'ARCHIVED',
    approvingOfficer: 'Dr. Anita Rawat, PCS (ADM Chamoli)',
    totalTarget: 15400,
    totalAllocated: 15100,
    unmetDemand: 300,
    totalDistanceKm: 385.0,
    avgEvacMinutes: 108,
    fleetOutlayLakhs: 48.0,
    rationale:
      'Initial rapid assessment following preliminary crack detection in Upper Joshimath. Deficit resolved in revision #013.',
    allocations: [
      { habitation: 'Joshimath', site: 'Gauchar Relocation Site', pax: 3800 },
      { habitation: 'Raini', site: 'Karnaprayag Relocation Site', pax: 1400 },
      { habitation: 'Tapovan', site: 'Rudraprayag Relocation Site', pax: 2900 },
      { habitation: 'Helang', site: 'Gauchar Relocation Site', pax: 2500 },
      { habitation: 'Pandukeshwar', site: 'Srinagar Relocation Site', pax: 2800 },
    ],
  },
];

export const PreviousPlans: React.FC = () => {
  const navigate = useNavigate();
  const { activePlanId } = useAppStore();

  const [selectedPlanIdA, setSelectedPlanIdA] = useState<string>('#VST-2026-CHM-014');
  const [selectedPlanIdB, setSelectedPlanIdB] = useState<string>('#VST-2026-CHM-013');

  const planA = ARCHIVED_PLANS.find((p) => p.id === selectedPlanIdA) || ARCHIVED_PLANS[0];
  const planB = ARCHIVED_PLANS.find((p) => p.id === selectedPlanIdB) || ARCHIVED_PLANS[1];

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* ── 1. TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#003366] text-white text-[10px] font-bold uppercase font-mono tracking-wider">
              Statutory Plan Registry &amp; Comparison Tool
            </span>
            <span className="text-xs text-slate-500 font-mono">
              TAMPER-EVIDENT VERSION CHAIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] mt-1 tracking-tight">
            Previous Plans &amp; Side-by-Side Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mt-0.5">
            Audit historical operational plans, inspect chronological shifts in citizen dispatch matrices,
            and perform side-by-side comparative analysis between plan revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/decisions/review')}
            className="gov-btn-primary py-2 px-3 sm:px-4 text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
            <span>Officer Review Gate</span>
          </button>
        </div>
      </div>

      {/* ── 2. ARCHIVED PLANS DIRECTORY ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
            HISTORICAL PLAN VERSIONS RECORDED
          </span>
          <span className="text-[11px] text-slate-500 font-mono">3 Registered Orders</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ARCHIVED_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border transition ${
                plan.id === activePlanId
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 font-mono">{plan.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    plan.status === 'ACTIVE'
                      ? 'bg-emerald-600 text-white'
                      : plan.status === 'SUPERSEDED'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 font-mono mt-1">{plan.date}</div>

              <div className="mt-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Demand:</span>
                  <strong>{formatPopulation(plan.totalTarget)} pax</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allocated:</span>
                  <strong className="text-emerald-800">{formatPopulation(plan.totalAllocated)} pax</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unmet Deficit:</span>
                  <strong>{plan.unmetDemand} pax</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Transit:</span>
                  <strong>{plan.avgEvacMinutes} min</strong>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  {plan.approvingOfficer}
                </span>
                <button
                  onClick={() => {
                    setSelectedPlanIdA(plan.id);
                  }}
                  className="text-xs font-bold text-[#003366] hover:underline"
                >
                  Set as Diff A
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. SIDE-BY-SIDE PLAN COMPARISON TOOL ── */}
      <div className="bg-white border-2 border-blue-900/30 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#003366] text-[24px]">compare</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#003366] uppercase tracking-wider font-mono">
                SIDE-BY-SIDE PLAN DIFF VIEWER
              </h3>
              <p className="text-xs text-slate-500">
                Compare two statutory plans to understand shifts in resource allocation &amp; routing
              </p>
            </div>
          </div>

          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Plan A:</span>
              <select
                value={selectedPlanIdA}
                onChange={(e) => setSelectedPlanIdA(e.target.value)}
                className="p-1.5 border border-slate-300 rounded font-mono font-bold bg-white text-xs outline-none"
              >
                {ARCHIVED_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} ({p.status})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-bold">vs</span>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Plan B:</span>
              <select
                value={selectedPlanIdB}
                onChange={(e) => setSelectedPlanIdB(e.target.value)}
                className="p-1.5 border border-slate-300 rounded font-mono font-bold bg-white text-xs outline-none"
              >
                {ARCHIVED_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} ({p.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* High-Level Metric Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan A Column */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div>
                <span className="font-black text-sm text-[#003366]">{planA.id}</span>
                <span className="text-[11px] text-slate-500 block">{planA.date}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                {planA.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Target Evacuees:</span>
                <strong>{formatPopulation(planA.totalTarget)} pax</strong>
              </div>
              <div className="flex justify-between">
                <span>Allocated Capacity:</span>
                <strong className="text-emerald-800">{formatPopulation(planA.totalAllocated)} pax</strong>
              </div>
              <div className="flex justify-between">
                <span>Unmet Deficit:</span>
                <strong className={planA.unmetDemand > 0 ? 'text-red-600' : 'text-slate-800'}>
                  {planA.unmetDemand} pax
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Total Transit Road KM:</span>
                <strong>{planA.totalDistanceKm} km</strong>
              </div>
              <div className="flex justify-between">
                <span>Avg Transit Duration:</span>
                <strong>{planA.avgEvacMinutes} min</strong>
              </div>
              <div className="flex justify-between">
                <span>Fleet Outlay Budget:</span>
                <strong>₹{planA.fleetOutlayLakhs} Lakhs</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-sans">
              <strong>Approved By:</strong> {planA.approvingOfficer}
            </div>
            <div className="text-[11px] text-slate-500 font-sans italic">
              "{planA.rationale}"
            </div>
          </div>

          {/* Plan B Column */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div>
                <span className="font-black text-sm text-[#003366]">{planB.id}</span>
                <span className="text-[11px] text-slate-500 block">{planB.date}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900">
                {planB.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>Target Evacuees:</span>
                <strong>{formatPopulation(planB.totalTarget)} pax</strong>
              </div>
              <div className="flex justify-between">
                <span>Allocated Capacity:</span>
                <strong className="text-emerald-800">{formatPopulation(planB.totalAllocated)} pax</strong>
              </div>
              <div className="flex justify-between">
                <span>Unmet Deficit:</span>
                <strong className={planB.unmetDemand > 0 ? 'text-red-600' : 'text-slate-800'}>
                  {planB.unmetDemand} pax
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Total Transit Road KM:</span>
                <strong>{planB.totalDistanceKm} km</strong>
              </div>
              <div className="flex justify-between">
                <span>Avg Transit Duration:</span>
                <strong>{planB.avgEvacMinutes} min</strong>
              </div>
              <div className="flex justify-between">
                <span>Fleet Outlay Budget:</span>
                <strong>₹{planB.fleetOutlayLakhs} Lakhs</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-sans">
              <strong>Approved By:</strong> {planB.approvingOfficer}
            </div>
            <div className="text-[11px] text-slate-500 font-sans italic">
              "{planB.rationale}"
            </div>
          </div>
        </div>

        {/* Delta Summary Callout */}
        <div className="p-3.5 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-700 text-[20px]">info</span>
            <span>
              Comparing <strong className="font-mono">{planA.id}</strong> vs <strong className="font-mono">{planB.id}</strong>:{' '}
              Target delta is <strong>{Math.abs(planA.totalTarget - planB.totalTarget).toLocaleString()} pax</strong>.{' '}
              Transit distance differs by <strong>{Math.abs(Math.round((planA.totalDistanceKm - planB.totalDistanceKm) * 10) / 10)} km</strong>.
            </span>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-1 bg-white hover:bg-slate-100 text-[#003366] rounded border border-blue-300 font-bold text-xs transition"
          >
            Export Comparison PDF
          </button>
        </div>
      </div>
    </div>
  );
};
