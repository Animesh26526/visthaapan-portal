import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPercent, formatPopulation } from '../utils/formatters';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    habitations,
    sites,
    allocationSummary,
    activePlanId,
    setSelectedHabitationId,
  } = useAppStore();

  const totalAtRisk = (habitations || []).reduce((acc, h) => acc + (h?.population || 0), 0);
  const totalSafeCapacity = (sites || []).reduce(
    (acc, s) => acc + (s?.resourceCapacity?.effectiveCapacity || 0),
    0
  );
  const immediatePriorityCount = (habitations || []).filter((h) => h?.priority === 'Immediate').length;

  const operationalPillars = [
    {
      num: '01',
      title: 'Operations Command & GIS',
      icon: 'travel_explore',
      desc: 'Real-time tactical status, satellite InSAR subsidence overlays, and field dossiers.',
      route: '/operations/command-center',
      accent: '#003366',
    },
    {
      num: '02',
      title: 'Carrying Capacity & Planning',
      icon: 'domain',
      desc: 'Shelter bottleneck audits (water, medical, space) and deterministic MILP solver.',
      route: '/planning/capacity',
      accent: '#4338ca',
    },
    {
      num: '03',
      title: 'Scenario Lab & Stress Test',
      icon: 'science',
      desc: 'Isolated what-if simulator testing road blockades, surge demand, and shelter cuts.',
      route: '/scenario/planner',
      accent: '#0f766e',
    },
    {
      num: '04',
      title: 'Statutory Adjudication Gate',
      icon: 'gavel',
      desc: 'Human-in-the-loop executive review under Section 34 Disaster Management Act 2005.',
      route: '/decisions/review',
      accent: '#b45309',
    },
    {
      num: '05',
      title: 'System Intelligence & Provenance',
      icon: 'menu_book',
      desc: 'Triangulated satellite, sensor, and census telemetry with data quality benchmarks.',
      route: '/intelligence/analytics',
      accent: '#166534',
    },
  ];

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* ── 1. ACTIVE BASELINE OPERATIONS BANNER ── */}
      <div className="bg-[#003366] text-white p-4 sm:p-6 rounded-xl border border-[#002244] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-blue-500/25 border border-blue-400/40 text-blue-200 text-[10px] font-bold uppercase font-mono tracking-wider">
              OPERATIONAL COMMAND • DISTRICT CHAMOLI
            </span>
            <span className="text-[11px] text-emerald-300 font-mono flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE BASELINE: {activePlanId}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Joshimath Disaster Relocation &amp; Transit Portal
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Multi-hazard geospatial intelligence, safe relocation capacity auditing, and deterministic
            Mixed-Integer Linear Programming (MILP) dispatch network for habitational transit in District Chamoli.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/operations/command-center')}
            className="gov-btn-primary bg-[#d9531e] hover:bg-[#b84314] text-xs py-2 px-4 flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Command Center</span>
          </button>

          <button
            onClick={() => navigate('/decisions/review')}
            className="gov-btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-300">gavel</span>
            <span>Review Active Plan</span>
          </button>

          <button
            onClick={() => navigate('/scenario/planner')}
            className="gov-btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Scenario Lab</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI METRICS STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 w-full">
        <div className="gov-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate font-mono">
            At-Risk Population
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-700 font-mono my-1 tracking-tight truncate">
            {formatPopulation(totalAtRisk)}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-red-600 shrink-0">warning</span>
            <span className="truncate font-medium">{immediatePriorityCount} immediate wards</span>
          </div>
        </div>

        <div className="gov-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate font-mono">
            Audited Safe Capacity
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono my-1 tracking-tight truncate">
            {formatPopulation(totalSafeCapacity)}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[14px] shrink-0">verified</span>
            <span className="truncate">Across {sites.length} shelter hubs</span>
          </div>
        </div>

        <div className="gov-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate font-mono">
            Avg Evac Time
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#003366] font-mono my-1 tracking-tight truncate">
            124 <span className="text-xs font-normal text-slate-500">min</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">
            Optimal gradient (NH-07)
          </div>
        </div>

        <div className="gov-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate font-mono">
            Unmet Deficit
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono my-1 tracking-tight truncate">
            0 Deficit
          </div>
          <div className="text-[11px] text-emerald-700 truncate font-medium">
            100% Demand Feasible
          </div>
        </div>

        <div className="gov-card p-3.5 sm:p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate font-mono">
            Estimated Outlay
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono my-1 tracking-tight truncate">
            ₹{allocationSummary?.totalEstimatedCostLakhs ?? 58.4} <span className="text-xs font-normal text-slate-500">Lakhs</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">
            Fleet &amp; shelter operations
          </div>
        </div>
      </div>

      {/* ── 3. WORKSPACE PILLARS NAVIGATION ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#003366] uppercase tracking-wider font-mono">
            Operational Workspaces
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Direct access to specialized intelligence engines
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {operationalPillars.map((ws) => (
            <div
              key={ws.num}
              onClick={() => navigate(ws.route)}
              className="gov-card-interactive p-4 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: ws.accent }}
                  >
                    <span className="material-symbols-outlined text-[22px]">{ws.icon}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    WS-{ws.num}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#003366] transition">
                  {ws.title}
                </h3>

                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2">
                  {ws.desc}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 text-xs font-bold text-[#003366] flex items-center justify-between">
                <span>Open Workspace</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. CANONICAL CHAMOLI HABITATIONS & VULNERABILITY ── */}
      <div className="gov-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#d9531e]">warning</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
              High-Risk Chamoli Habitations
            </span>
            <span className="text-[10px] font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
              {habitations.length} Active Wards
            </span>
          </div>

          <button
            onClick={() => navigate('/operations/habitations')}
            className="text-[11px] font-bold text-[#003366] hover:text-[#d9531e] flex items-center gap-1 transition"
          >
            <span>View Full Ward Dossiers</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Habitation</th>
                <th className="py-2.5 px-3">Primary Hazard</th>
                <th className="py-2.5 px-3">Population</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Risk Index</th>
                <th className="py-2.5 px-3">Road Access</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {habitations.map((hab) => (
                <tr key={hab.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{hab.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {hab.code} • {hab.subDistrict}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="text-slate-700 font-medium">{hab.primaryHazard}</span>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    {formatPopulation(hab.population)}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        hab.priority === 'Immediate'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {hab.priority}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-red-600 h-full"
                          style={{ width: `${Math.round(hab.riskScore * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-red-700">
                        {formatPercent(hab.riskScore, 0)}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    {hab.infrastructure?.roads || 'Single-Lane Passable'}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedHabitationId(hab.id);
                        navigate('/operations/habitations');
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#003366] hover:bg-blue-50 rounded border border-slate-200 transition"
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. SAFE RELOCATION HUBS OVERVIEW ── */}
      <div className="gov-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-700">verified</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">
              Audited Relocation Hubs &amp; Carrying Capacity
            </span>
          </div>

          <button
            onClick={() => navigate('/planning/capacity')}
            className="text-[11px] font-bold text-[#003366] hover:text-[#d9531e] flex items-center gap-1 transition"
          >
            <span>View Bottleneck Audits</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {sites.map((site) => {
            const isExcluded = site.id === 'site-pipalkoti';
            return (
              <div
                key={site.id}
                className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                  isExcluded
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <div className="font-bold text-slate-900">{site.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{site.district}</div>
                  </div>
                  {isExcluded ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono bg-red-600 text-white">
                      EXCLUDED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Effective Cap:</span>
                    <strong>{formatPopulation(site.resourceCapacity.effectiveCapacity)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Limiting Factor:</span>
                    <strong className={isExcluded ? 'text-red-700' : 'text-slate-800'}>
                      {site.resourceCapacity.bottleneck}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distance from Red Zone:</span>
                    <strong>{site.routeDistanceKm} km</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
