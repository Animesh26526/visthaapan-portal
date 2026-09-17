import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { RelocationCapacity } from '../RelocationCapacity';
import { RiskIntelligence } from '../RiskIntelligence';
import { OperationsResearch } from '../OperationsResearch';
import { useAppStore } from '../../stores/useAppStore';

export const CapacityIntelligenceWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sites, habitations } = useAppStore();
  const tabParam = searchParams.get('tab');
  const activeTab: 'capacity' | 'risk' | 'benchmark' =
    tabParam === 'risk' || tabParam === 'benchmark' ? tabParam : 'capacity';

  const handleTabChange = (tab: 'capacity' | 'risk' | 'benchmark') => {
    setSearchParams({ tab });
  };

  const totalEffectiveCapacity = sites.reduce((sum, s) => sum + s.resourceCapacity.effectiveCapacity, 0);
  const totalTargetPopulation = habitations.reduce((sum, h) => sum + h.population, 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f8fafc]">
      {/* Workspace Header & Sub-Nav */}
      <div className="relative sm:sticky sm:top-14 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 space-y-2 shadow-xs shrink-0 w-full max-w-full">
        {/* Row 1: Title + Quick Stat */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">psychology</span>
            </span>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Link to="/" className="hover:text-[#003366] transition flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">home</span>
                  <span>PORTAL</span>
                </Link>
                <span>/</span>
                <span className="text-[#003366] font-bold">WORKSPACE 2</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 uppercase truncate">
                <span className="sm:hidden">Capacity &amp; Risk</span>
                <span className="hidden sm:inline">Capacity &amp; Risk Intelligence</span>
              </div>
            </div>
          </div>

          {/* Quick Stat */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] sm:text-[11px] shrink-0">
            <span className="text-slate-500 hidden xs:inline">Capacity:</span>
            <strong className="text-emerald-700 font-bold">{totalEffectiveCapacity.toLocaleString()}</strong>
            <span className="text-slate-300">/</span>
            <strong className="text-slate-900 font-bold">{totalTargetPopulation.toLocaleString()}</strong>
          </div>
        </div>

        {/* Row 2: Sub-Tabs (Full width, smooth horizontal scroll) */}
        <div className="w-full max-w-full min-w-0 flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1.5 horizontal-scroll-tabs">
          <button
            onClick={() => handleTabChange('capacity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'capacity'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">warehouse</span>
            <span className="sm:hidden">Shelter Capacity</span>
            <span className="hidden sm:inline">Shelter Capacity &amp; Bottlenecks</span>
          </button>

          <button
            onClick={() => handleTabChange('risk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'risk'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">psychology_alt</span>
            <span className="sm:hidden">AI Risk &amp; SHAP</span>
            <span className="hidden sm:inline">AI Risk &amp; SHAP Explainer</span>
          </button>

          <button
            onClick={() => handleTabChange('benchmark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'benchmark'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">analytics</span>
            <span className="sm:hidden">OR Benchmark</span>
            <span className="hidden sm:inline">OR vs Greedy Benchmark</span>
          </button>
        </div>
      </div>

      {/* Workspace Tab Content */}
      <div className="flex-1 w-full">
        {activeTab === 'capacity' && <RelocationCapacity />}
        {activeTab === 'risk' && <RiskIntelligence />}
        {activeTab === 'benchmark' && <OperationsResearch />}
      </div>
    </div>
  );
};
