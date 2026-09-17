import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { OptimalAllocation } from '../OptimalAllocation';
import { AllocationExplainability } from '../AllocationExplainability';
import { ScenarioLab } from '../ScenarioLab';
import { useAppStore } from '../../stores/useAppStore';

export const AllocationEngineWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isReoptimized, activeScenarioName, roadR12Blocked, toggleRoadR12 } = useAppStore();
  const tabParam = searchParams.get('tab');
  const activeTab: 'solver' | 'why' | 'stress' =
    tabParam === 'why' || tabParam === 'stress' ? tabParam : 'solver';

  const handleTabChange = (tab: 'solver' | 'why' | 'stress') => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f8fafc]">
      {/* Workspace Header & Sub-Nav */}
      <div className="relative sm:sticky sm:top-14 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 space-y-2 shadow-xs shrink-0 w-full max-w-full">
        {/* Row 1: Title + Controls */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">alt_route</span>
            </span>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Link to="/" className="hover:text-[#003366] transition flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">home</span>
                  <span>PORTAL</span>
                </Link>
                <span>/</span>
                <span className="text-[#003366] font-bold">WORKSPACE 3</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 uppercase truncate">
                <span className="sm:hidden">Allocation Engine</span>
                <span className="hidden sm:inline">Optimal Allocation &amp; Stress Lab</span>
              </div>
            </div>
          </div>

          {/* Right Live Active Status */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] sm:text-[11px]">
              <span className="text-slate-500 hidden xs:inline">Scenario:</span>
              <strong className="text-slate-900 font-bold truncate max-w-[85px] sm:max-w-none">{activeScenarioName}</strong>
              {isReoptimized && (
                <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1 rounded">
                  OPT
                </span>
              )}
            </div>

            <button
              onClick={toggleRoadR12}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded text-[11px] sm:text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                roadR12Blocked
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
              title={roadR12Blocked ? 'Unblock Road R12' : 'Inject R12 Blockage'}
            >
              <span className="material-symbols-outlined text-[14px]">traffic</span>
              <span className="hidden sm:inline">{roadR12Blocked ? 'Unblock R12' : 'Inject R12 Block'}</span>
              <span className="sm:hidden">{roadR12Blocked ? 'R12 ✕' : 'R12'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Sub-Tabs (Full width, smooth horizontal scroll) */}
        <div className="w-full max-w-full min-w-0 flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1.5 horizontal-scroll-tabs">
          <button
            onClick={() => handleTabChange('solver')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'solver'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span className="sm:hidden">MILP Solver</span>
            <span className="hidden sm:inline">MILP Optimization Solver</span>
          </button>

          <button
            onClick={() => handleTabChange('why')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'why'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">live_help</span>
            <span className="sm:hidden">&ldquo;Why This Plan?&rdquo;</span>
            <span className="hidden sm:inline">&ldquo;Why This Plan?&rdquo; Explainer</span>
          </button>

          <button
            onClick={() => handleTabChange('stress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'stress'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span className="sm:hidden">Stress Lab</span>
            <span className="hidden sm:inline">Scenario Stress Lab</span>
            {roadR12Blocked && (
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
            )}
          </button>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 w-full">
        {activeTab === 'solver' && <OptimalAllocation />}
        {activeTab === 'why' && <AllocationExplainability />}
        {activeTab === 'stress' && <ScenarioLab />}
      </div>
    </div>
  );
};
