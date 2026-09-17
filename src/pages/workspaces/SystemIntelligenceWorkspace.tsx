import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Analytics } from '../Analytics';
import { DataEvidence } from '../DataEvidence';
import { DataQuality } from '../DataQuality';
import { TechnicalExplainer } from '../TechnicalExplainer';

export const SystemIntelligenceWorkspace: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: 'analytics' | 'evidence' | 'quality' | 'architecture' =
    tabParam === 'evidence' || tabParam === 'quality' || tabParam === 'architecture'
      ? tabParam
      : 'analytics';

  const handleTabChange = (tab: 'analytics' | 'evidence' | 'quality' | 'architecture') => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f8fafc]">
      {/* Workspace Header & Sub-Nav */}
      <div className="relative sm:sticky sm:top-14 z-30 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 space-y-2 shadow-xs shrink-0 w-full max-w-full">
        {/* Row 1: Title + Sync Status */}
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">menu_book</span>
            </span>
            <div className="min-w-0">
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Link to="/" className="hover:text-[#003366] transition flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[12px]">home</span>
                  <span>PORTAL</span>
                </Link>
                <span>/</span>
                <span className="text-[#003366] font-bold">WORKSPACE 5</span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold tracking-wide text-slate-900 uppercase truncate">
                <span className="sm:hidden">System Intelligence</span>
                <span className="hidden sm:inline">System Intelligence &amp; Evidence</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 font-mono shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="hidden sm:inline">4 Datasets Synced (ISRO, SOI, CWC, Census)</span>
            <span className="sm:hidden">ISRO/SOI Synced</span>
          </div>
        </div>

        {/* Row 2: Sub-Tabs (Full width, smooth horizontal scroll) */}
        <div className="w-full max-w-full min-w-0 flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold gap-1.5 horizontal-scroll-tabs">
          <button
            onClick={() => handleTabChange('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">insights</span>
            <span className="sm:hidden">Analytics</span>
            <span className="hidden sm:inline">Analytics Trends</span>
          </button>

          <button
            onClick={() => handleTabChange('evidence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'evidence'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">source</span>
            <span className="sm:hidden">Data Provenance</span>
            <span className="hidden sm:inline">Data Provenance Atlas</span>
          </button>

          <button
            onClick={() => handleTabChange('quality')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'quality'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span className="sm:hidden">Data Quality</span>
            <span className="hidden sm:inline">Data Quality Benchmarks</span>
          </button>

          <button
            onClick={() => handleTabChange('architecture')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-[#003366] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">architecture</span>
            <span className="sm:hidden">Architecture &amp; MILP</span>
            <span className="hidden sm:inline">System Architecture &amp; MILP</span>
          </button>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 w-full">
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'evidence' && <DataEvidence />}
        {activeTab === 'quality' && <DataQuality />}
        {activeTab === 'architecture' && <TechnicalExplainer />}
      </div>
    </div>
  );
};
