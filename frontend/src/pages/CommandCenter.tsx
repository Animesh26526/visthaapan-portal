import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatNumber, formatPercent, formatPopulation } from '../utils/formatters';

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const { habitations, sites, allocationSummary, roadR12Blocked, decisions } = useAppStore();

  const totalAtRisk = (habitations || []).reduce((s, h) => s + (h?.population || 0), 0);
  const totalCapacity = (sites || []).reduce((s, si) => s + (si?.resourceCapacity?.effectiveCapacity || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* ── INCIDENT BANNER ── */}
      <div id="tour-cc-incident" data-tour="cc-incident" className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-red-50 border border-red-200 px-3 sm:px-4 py-2.5 rounded-sm">
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
          <span className="font-bold text-red-900 font-mono uppercase tracking-wide">Level 3 Evacuation Directive</span>
          <span className="hidden md:inline text-slate-400">—</span>
          <span className="hidden md:inline text-slate-700 font-medium">Sector 4-B Joshimath &amp; Helang Active Ground Subsidence</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/decisions/review')}
            className="px-3 py-1.5 bg-[#003366] text-white hover:bg-[#002244] rounded text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-300">gavel</span>
            Officer Review
          </button>
          <button
            onClick={() => navigate('/decisions/review')}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 rounded text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] text-blue-600">record_voice_over</span>
            Audio Briefing
          </button>
        </div>
      </div>

      {/* ── OPERATIONAL KPI STRIP ── */}
      <div id="tour-cc-kpis" data-tour="cc-kpis" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="gov-card p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">Critical Habitations</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-mono font-extrabold text-[#d9531e]">
              {habitations.filter(h => h.priority === 'Immediate').length}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#d9531e] bg-amber-50 border border-amber-200 px-1.5 rounded-sm">URGENT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active risk zone</div>
        </div>

        <div className="gov-card p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">At-Risk Population</div>
          <div className="text-2xl font-mono font-extrabold text-[#003366] mt-1">{formatPopulation(totalAtRisk)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Immediate priority</div>
        </div>

        <div className="gov-card p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">Safe Capacity</div>
          <div className="text-2xl font-mono font-extrabold text-emerald-700 mt-1">{formatPopulation(totalCapacity)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across {sites.length} verified safe hubs</div>
        </div>

        <div className="gov-card p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">Unmet Demand</div>
          <div className="text-2xl font-mono font-extrabold text-[#d9531e] mt-1">{formatPopulation(allocationSummary?.unmetDemandTotal)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Capacity deficit</div>
        </div>

        <div className="gov-card p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">Officer Orders</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-mono font-extrabold text-slate-900">{decisions.length}</span>
            <span className="text-xs font-mono text-emerald-700 font-bold">Recorded</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Decision history</div>
        </div>

        <div className="gov-card p-3.5">
          <div className="text-[11px] font-semibold text-slate-500">Road Status</div>
          <div className={`text-sm font-bold mt-1.5 flex items-center gap-1.5 ${roadR12Blocked ? 'text-red-700' : 'text-emerald-700'}`}>
            <span className={`w-2 h-2 rounded-full ${roadR12Blocked ? 'bg-red-600' : 'bg-emerald-600'}`}></span>
            {roadR12Blocked ? 'R12 Blocked' : 'All Clear'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{roadR12Blocked ? 'Detour active' : 'Normal operations'}</div>
        </div>
      </div>

      {/* ── MAIN CONTENT: PRIORITY QUEUE + DIRECTIVES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Priority Habitations */}
        <div id="tour-cc-habitations" data-tour="cc-habitations" className="lg:col-span-8 gov-card overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#d9531e]">warning</span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Evacuation Priority Queue</span>
            </div>
            <button
              onClick={() => navigate('/operations?tab=gis')}
              className="text-[11px] font-bold text-[#003366] hover:text-[#d9531e] flex items-center gap-1 transition"
            >
              Open GIS Map
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {habitations.slice(0, 5).map((hab) => (
              <div key={hab.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/70 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                    (hab.riskScore || 0) >= 0.8 ? 'bg-red-600' : (hab.riskScore || 0) >= 0.6 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}>
                    {formatPercent(hab.riskScore, 0).replace('%', '')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{hab.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Pop: {formatPopulation(hab.population)} • {hab.primaryHazard || '—'} • Slope {formatNumber(hab.slopeDegrees, 1, '—')}°
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm ${
                    hab.priority === 'Immediate' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {hab.priority}
                  </span>

                  {/* Risk bar */}
                  <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (hab.riskScore || 0) * 100))}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Response Protocols */}
        <div className="lg:col-span-4 space-y-3">
          <div className="gov-card p-4">
            <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-3">Response Protocols</h3>
            <div className="space-y-2">
              {[
                { label: 'District EOC Level 1', sub: '24/7 Multi-Agency Joint Control (Gopeshwar)', status: 'ACTIVE', color: 'emerald' },
                { label: 'SDRF Emergency Unit', sub: 'Deployment Staging: Gauchar Base', status: 'STANDBY', color: 'blue' },
                { label: 'NDMA Telemetry', sub: 'Automated 15-min radar cycle', status: 'SYNCED', color: 'emerald' },
                { label: 'ITBP Air-Bridge', sub: 'Gauchar Aerodrome Helipad standby', status: 'READY', color: 'amber' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{item.label}</span>
                    <span className="text-[10px] text-slate-500">{item.sub}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-sm bg-${item.color}-100 text-${item.color}-800 text-[10px] font-bold font-mono`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="gov-card p-4 text-center text-xs text-slate-500 font-mono">
            {habitations.length} Settlements Monitored • Census 2011 Baseline Demographics
          </div>
        </div>
      </div>
    </div>
  );
};
