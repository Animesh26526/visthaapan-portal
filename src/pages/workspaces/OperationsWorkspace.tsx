import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { RiskGIS } from '../RiskGIS';
import { CommandCenter } from '../CommandCenter';
import { HabitationDetail } from '../HabitationDetail';
import { useAppStore } from '../../stores/useAppStore';

export const OperationsWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { habitations, sites, roadR12Blocked, toggleRoadR12 } = useAppStore();
  const tabParam = searchParams.get('tab');
  const activeTab: 'gis' | 'command' | 'dossier' =
    tabParam === 'command' || tabParam === 'dossier' ? tabParam : 'gis';

  const handleTabChange = (tab: 'gis' | 'command' | 'dossier') => {
    setSearchParams({ tab });
  };

  const safeHabitations = Array.isArray(habitations) ? habitations : [];
  const safeSites = Array.isArray(sites) ? sites : [];
  const totalAtRisk = safeHabitations.reduce((acc, h) => acc + (h.population || 0), 0);
  const criticalWards = safeHabitations.filter(h => h.priority === 'Immediate').length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f8fafc]">
      {/* 1. UNIFIED WORKSPACE SUB-NAV BAR */}
      <div className="relative sm:sticky sm:top-14 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 space-y-2 shadow-xs shrink-0 w-full max-w-full">
        {/* Row 1: Title + Status (hidden on xs) */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">travel_explore</span>
            </span>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Link to="/" className="hover:text-[#003366] transition flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">home</span>
                  <span>PORTAL</span>
                </Link>
                <span>/</span>
                <span className="text-[#003366] font-bold">WORKSPACE 1</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 uppercase truncate">
                <span className="sm:hidden">Operations Command</span>
                <span className="hidden sm:inline">Operations Command &amp; GIS</span>
              </div>
            </div>
          </div>

          {/* Right Live Status Telemetry */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]">
              <span className="text-slate-500">At-Risk Citizens:</span>
              <strong className="text-red-700 font-bold">{totalAtRisk.toLocaleString()}</strong>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Safe Sites:</span>
              <strong className="text-emerald-700 font-bold">{safeSites.length} Active</strong>
            </div>

            <button
              onClick={toggleRoadR12}
              className={`h-7 sm:h-8 px-2 sm:px-3 rounded text-[11px] sm:text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                roadR12Blocked
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {roadR12Blocked ? 'block' : 'alt_route'}
              </span>
              <span className="hidden sm:inline">{roadR12Blocked ? 'Road R12: Blocked' : 'Road R12: Normal'}</span>
              <span className="sm:hidden">{roadR12Blocked ? 'R12 ✕' : 'R12'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Tab Selector (always full-width, scrollable) */}
        <div className="w-full max-w-full min-w-0 flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1.5 horizontal-scroll-tabs">
          <button
            onClick={() => handleTabChange('gis')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded transition shrink-0 ${
              activeTab === 'gis'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            <span>GIS Map</span>
          </button>

          <button
            onClick={() => handleTabChange('command')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded transition shrink-0 ${
              activeTab === 'command'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Command</span>
            <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded font-bold ${
              activeTab === 'command' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
            }`}>
              {criticalWards}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('dossier')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded transition shrink-0 ${
              activeTab === 'dossier'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">home_work</span>
            <span>Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT VIEW */}
      <div className="flex-1 w-full">
        {activeTab === 'gis' && <RiskGIS />}
        {activeTab === 'command' && <CommandCenter />}
        {activeTab === 'dossier' && <HabitationDetail />}
      </div>
    </div>
  );
};
