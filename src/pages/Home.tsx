import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    habitations,
    sites,
    allocationSummary,
    roadR12Blocked,
    toggleRoadR12,
    setSelectedHabitationId
  } = useAppStore();

  const totalAtRisk = habitations.reduce((acc, h) => acc + h.population, 0);
  const totalSafeCapacity = sites.reduce((acc, s) => acc + s.resourceCapacity.effectiveCapacity, 0);
  const immediatePriorityCount = habitations.filter(h => h.priority === 'Immediate').length;
  const avgEvacTime = roadR12Blocked ? 36.4 : 28.2;

  const workspaces = [
    { num: '01', title: 'Operations & GIS', icon: 'travel_explore', desc: 'Live spatial hazard map with satellite overlays', route: '/operations', accent: '#003366' },
    { num: '02', title: 'Capacity & Risk', icon: 'psychology', desc: 'Site audits, bottleneck analysis, AI explainers', route: '/capacity-intelligence', accent: '#4338ca' },
    { num: '03', title: 'Allocation Engine', icon: 'alt_route', desc: 'MILP solver, stress testing, scenario lab', route: '/allocation-engine', accent: '#0f766e' },
    { num: '04', title: 'Adjudication', icon: 'gavel', desc: 'Officer review gate, statutory decisions', route: '/adjudication', accent: '#b45309' },
    { num: '05', title: 'Evidence & Data', icon: 'menu_book', desc: 'Data provenance, quality benchmarks', route: '/system-intelligence', accent: '#166534' },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 font-sans min-w-0">

      {/* ── INCIDENT BANNER ── */}
      <div className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 mt-1 sm:mt-0 animate-pulse"></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono uppercase font-bold text-xs text-red-900 tracking-wide">
                Level 3 Advisory
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="text-xs font-semibold text-red-800">
                Joshimath Sub-Division
              </span>
            </div>
            <p className="text-xs text-red-700 font-medium mt-0.5 leading-snug">
              Active Relocation Directive — Priority evacuation for unstable ground subsidence zones.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/operations')}
          className="w-full sm:w-auto h-9 px-4 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition shrink-0 shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">dashboard</span>
          Launch Operations
        </button>
      </div>

      {/* ── KPI METRICS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5 w-full">
        <div className="gov-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">At-Risk Citizens</div>
          <div className="text-xl sm:text-2xl font-black text-red-700 font-mono my-1 tracking-tight truncate">
            {totalAtRisk.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 min-w-0">
            <span className="material-symbols-outlined text-[14px] text-red-600 shrink-0">warning</span>
            <span className="truncate font-medium">{immediatePriorityCount} immediate wards</span>
          </div>
        </div>

        <div className="gov-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">Safe Capacity</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono my-1 tracking-tight truncate">
            {totalSafeCapacity.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 min-w-0">
            <span className="material-symbols-outlined text-[14px] shrink-0">verified</span>
            <span className="truncate font-medium">Across {sites.length} hubs</span>
          </div>
        </div>

        <div className="gov-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">Avg Evac Time</div>
          <div className="text-xl sm:text-2xl font-black text-[#003366] font-mono my-1 tracking-tight truncate">
            {avgEvacTime} <span className="text-xs font-normal text-slate-500">min</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">
            {roadR12Blocked ? '+8.2 min R12 detour' : 'Optimal gradient'}
          </div>
        </div>

        <div className="gov-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">Unmet Demand</div>
          <div className="text-xl sm:text-2xl font-black text-[#d9531e] font-mono my-1 tracking-tight truncate">
            {allocationSummary.unmetDemandTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">Capacity deficit</div>
        </div>

        <div className="gov-card p-3 sm:p-4 flex flex-col justify-between col-span-2 lg:col-span-1 min-w-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">Estimated Outlay</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono my-1 tracking-tight truncate">
            ₹{allocationSummary.totalEstimatedCostLakhs} <span className="text-xs font-normal text-slate-500">Lakhs</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate font-medium">{sites.length} site deployments</div>
        </div>
      </div>

      {/* ── ROAD R12 CONTROL ── */}
      <div className="gov-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${
            roadR12Blocked ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
          }`}>
            <span className="material-symbols-outlined text-[20px]">alt_route</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-2">
              <span>Road R12 Simulation</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                roadR12Blocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {roadR12Blocked ? 'BLOCKED' : 'OPEN'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Test MILP re-routing on corridor obstruction &amp; calculate transit delay
            </div>
          </div>
        </div>
        <button
          onClick={toggleRoadR12}
          className={`w-full sm:w-auto h-9 px-4 rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs ${
            roadR12Blocked
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">{roadR12Blocked ? 'lock_open' : 'block'}</span>
          {roadR12Blocked ? 'Restore Road R12' : 'Simulate Block R12'}
        </button>
      </div>

      {/* ── WORKSPACE QUICK-ACCESS TILES ── */}
      <div className="w-full">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 font-mono">
          Operational Workspaces
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 w-full">
          {workspaces.map((ws) => (
            <div
              key={ws.num}
              onClick={() => navigate(ws.route)}
              className="gov-card-interactive p-3.5 sm:p-4 flex flex-col justify-between group cursor-pointer min-w-0"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className="w-9 h-9 rounded flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: ws.accent }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{ws.icon}</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    WS-{ws.num}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#003366] transition truncate">
                  {ws.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {ws.desc}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs font-bold text-[#003366] flex items-center justify-between">
                <span>Enter Workspace</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition shrink-0">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRIORITY HABITATIONS SECTION ── */}
      <div className="gov-card overflow-hidden w-full min-w-0">
        {/* Header */}
        <div className="px-3.5 sm:px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-[#d9531e] shrink-0">warning</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
              At-Risk Habitations
            </span>
            <span className="text-[10px] font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold shrink-0">
              {habitations.length} Active
            </span>
          </div>
          <button
            onClick={() => navigate('/operations?tab=command')}
            className="text-[11px] font-bold text-[#003366] hover:text-[#d9531e] flex items-center gap-1 transition shrink-0"
          >
            <span className="hidden sm:inline">View All in Command</span>
            <span className="sm:hidden">All</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* MOBILE VIEW (CARDS): Shown only on mobile < md */}
        <div className="block md:hidden divide-y divide-slate-100">
          {habitations.slice(0, 5).map((hab) => (
            <div key={hab.id} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">{hab.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{hab.code} • {hab.subDistrict}</div>
                </div>
                <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                  hab.priority === 'Immediate'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : hab.priority === 'Short-term'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {hab.priority}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border border-slate-100 text-center">
                <div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Population</div>
                  <div className="font-mono font-bold text-xs text-slate-800 mt-0.5">{hab.population.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Risk Score</div>
                  <div className="font-mono font-bold text-xs text-red-700 mt-0.5">{(hab.riskScore * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase">Hazard</div>
                  <div className="font-medium text-xs text-slate-700 mt-0.5 truncate">{hab.primaryHazard}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Status: <strong className="text-slate-700">{hab.evacuationStatus}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedHabitationId(hab.id);
                    navigate(`/operations?tab=dossier&hab=${hab.id}`);
                  }}
                  className="h-7 px-3 bg-[#003366] text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                >
                  Inspect
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP VIEW (TABLE): Shown only on >= md */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] font-mono uppercase">
              <tr>
                <th className="px-4 py-2.5">Habitation</th>
                <th className="px-4 py-2.5">Population</th>
                <th className="px-4 py-2.5">Risk</th>
                <th className="px-4 py-2.5">Hazard</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {habitations.map((hab) => (
                <tr key={hab.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-2.5">
                    <div className="font-bold text-slate-900">{hab.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{hab.code}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-800">{hab.population.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold font-mono text-[11px] ${
                      hab.riskScore >= 0.8
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : hab.riskScore >= 0.6
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {(hab.riskScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{hab.primaryHazard}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded-sm ${
                      hab.priority === 'Immediate'
                        ? 'bg-red-100 text-red-800'
                        : hab.priority === 'Short-term'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {hab.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] font-medium text-slate-500">{hab.evacuationStatus}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedHabitationId(hab.id);
                        navigate(`/operations?tab=dossier&hab=${hab.id}`);
                      }}
                      className="h-7 px-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-sm font-bold text-[10px] transition inline-flex items-center gap-1"
                    >
                      Inspect
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SAFE SITES ROW ── */}
      <div className="w-full">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 font-mono">
          Safe Relocation Hubs &amp; Capacities
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {sites.map((site) => (
            <div key={site.id} className="gov-card p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between mb-2 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">{site.code}</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded shrink-0">TIER-1 SAFE</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 truncate">{site.name}</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{site.location}</p>

                <div className="mt-3 space-y-1.5 text-xs bg-slate-50 p-2.5 rounded border border-slate-100 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 truncate">Effective Capacity</span>
                    <strong className="font-mono text-slate-900 shrink-0">{site.resourceCapacity.effectiveCapacity.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 truncate">Allocated</span>
                    <strong className="font-mono text-emerald-700 shrink-0">{site.totalAllocated.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500 truncate">Bottleneck</span>
                    <strong className="font-mono text-amber-700 truncate">{site.resourceCapacity.bottleneck}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/capacity-intelligence?tab=capacity')}
                className="mt-3 w-full h-8 bg-slate-100 hover:bg-[#003366] hover:text-white rounded text-xs font-bold transition text-slate-700 flex items-center justify-center gap-1 shrink-0"
              >
                <span>Audit Resources</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
