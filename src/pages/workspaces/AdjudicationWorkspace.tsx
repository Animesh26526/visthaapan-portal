import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { RelocationPlan } from '../RelocationPlan';
import { OfficerReview } from '../OfficerReview';
import { DecisionHistory } from '../DecisionHistory';
import { useAppStore } from '../../stores/useAppStore';

export const AdjudicationWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { decisions, currentUser } = useAppStore();
  const tabParam = searchParams.get('tab');
  const activeTab: 'phased' | 'review' | 'audit' =
    tabParam === 'review' || tabParam === 'audit' ? tabParam : 'phased';

  const handleTabChange = (tab: 'phased' | 'review' | 'audit') => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f8fafc]">
      {/* Workspace Header & Sub-Nav */}
      <div className="relative sm:sticky sm:top-14 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 space-y-2 shadow-xs shrink-0 w-full max-w-full">
        {/* Row 1: Title + Officer Badge */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">gavel</span>
            </span>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Link to="/" className="hover:text-[#003366] transition flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">home</span>
                  <span>PORTAL</span>
                </Link>
                <span>/</span>
                <span className="text-[#003366] font-bold">WORKSPACE 4</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 uppercase truncate">
                <span className="sm:hidden">Adjudication</span>
                <span className="hidden sm:inline">Statutory Adjudication &amp; Plan</span>
              </div>
            </div>
          </div>

          {/* Officer Status Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] sm:text-[11px] font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-semibold truncate max-w-[85px] sm:max-w-none">{currentUser.name.split(' ').slice(0, 2).join(' ')}</span>
                <span className="text-slate-400 font-mono text-[9px] hidden md:inline">({currentUser.role})</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Sub-Tabs (Full width, smooth horizontal scroll) */}
        <div className="w-full max-w-full min-w-0 flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1.5 horizontal-scroll-tabs">
          <button
            onClick={() => handleTabChange('phased')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'phased'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">assignment</span>
            <span className="sm:hidden">0–24h Plan</span>
            <span className="hidden sm:inline">0–24h Phased Plan</span>
          </button>

          <button
            onClick={() => handleTabChange('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'review'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="sm:hidden">Review Gate</span>
            <span className="hidden sm:inline">Officer Review Gate</span>
            <span className="px-1 py-0.2 bg-amber-100 text-amber-900 text-[9px] font-mono rounded font-bold sm:hidden">
              Req
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] font-mono rounded font-bold">
              Required
            </span>
          </button>

          <button
            onClick={() => handleTabChange('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'audit'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            <span className="sm:hidden">Audit ({decisions.length})</span>
            <span className="hidden sm:inline">Audit Ledger ({decisions.length})</span>
          </button>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 w-full">
        {activeTab === 'phased' && <RelocationPlan />}
        {activeTab === 'review' && <OfficerReview />}
        {activeTab === 'audit' && <DecisionHistory />}
      </div>
    </div>
  );
};
