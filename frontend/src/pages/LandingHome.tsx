import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

export const LandingHome: React.FC = () => {
  const navigate = useNavigate();
  const {
    habitations,
    sites,
    roadR12Blocked,
    toggleRoadR12,
    startWalkthrough,
  } = useAppStore();
  const [activeTourTab, setActiveTourTab] = useState<number>(0);

  const totalAtRisk = (habitations || []).reduce((acc, h) => acc + (h?.population || 0), 0);
  const totalSafeCap = (sites || []).reduce((acc, s) => acc + (s?.resourceCapacity?.effectiveCapacity || 0), 0);

  const tourPillars = [
    {
      num: '01',
      title: 'Operations Command & GIS Spatial Engine',
      route: '/operations',
      icon: 'travel_explore',
      badge: 'REAL-TIME GIS',
      color: '#003366',
      summary: 'Dynamic multi-hazard geospatial mapping with live satellite deformation overlays, road corridor status, and field inspection dossiers.',
      features: [
        'Interactive Leaflet GIS map with ISRO-Bhuvan radar subsidence layers',
        'Real-time red-zone hazard boundary demarcation & village pin markers',
        'Instant inspection dossiers detailing households, PwD, and infrastructure status',
        'Field-verified ground-truth census telemetry updated continuously',
      ],
    },
    {
      num: '02',
      title: 'Carrying Capacity & AI SHAP Intelligence',
      route: '/capacity-intelligence',
      icon: 'psychology',
      badge: 'EXPLAINABLE AI',
      color: '#4338ca',
      summary: 'Transparent demographic vulnerability deconstruction and rigorous shelter carrying capacity audits across water, power, and medical triage.',
      features: [
        'Rigorous resource bottleneck audits across water, power, and medical packs',
        'SHAP feature importance breakdown explaining algorithmic risk scores',
        'Demographic immobility profiling for elderly, children, and disabled citizens',
        'OR vs Greedy heuristic empirical benchmark demonstrating 40% transit efficiency gain',
      ],
    },
    {
      num: '03',
      title: 'Mathematical Allocation Engine (OR Solver)',
      route: '/allocation-engine',
      icon: 'alt_route',
      badge: 'OPERATIONS RESEARCH',
      color: '#0f766e',
      summary: 'Deterministic Operations Research optimization solver computing optimal, multi-wave evacuation assignments with zero shelter capacity overflows.',
      features: [
        'Sub-second mathematical optimization solving 19,500 citizen assignments',
        'Dynamic Road R12 obstruction simulation & immediate automated rerouting',
        'Interactive "Why This Plan?" explainer justifying destination choices',
        'Multi-scenario stress lab (Cloudburst +50%, Rainfall +25%, Fleet shortages)',
      ],
    },
    {
      num: '04',
      title: 'Statutory Adjudication & Evacuation Master Plan',
      route: '/adjudication',
      icon: 'gavel',
      badge: 'INCIDENT COMMAND',
      color: '#b45309',
      summary: 'Official chronological 0–24h evacuation master plan with formal District Magistrate review gate and immutable statutory audit ledgers.',
      features: [
        'Chronological multi-wave evacuation roster with agency assignments (NDRF, SDRF, BRO)',
        'Section 34 Disaster Management Act 2005 statutory authorization review gate',
        'Official printable executive dossier for on-ground convoy marshals',
        'Tamper-evident administrative decision history and rationale log',
      ],
    },
    {
      num: '05',
      title: 'System Intelligence & Multi-Source Evidence Atlas',
      route: '/system-intelligence',
      icon: 'menu_book',
      badge: 'PROVENANCE ATLAS',
      color: '#166534',
      summary: 'Comprehensive data provenance tracking triangulating ISRO Bhuvan, Survey of India, Central Water Commission, and National Census registries.',
      features: [
        'Immutable data lineage tracking with verified sync timestamps and confidence ratings',
        'Historical time-series trend analysis of rainfall vs ground displacement',
        'Automated data quality verification scores across all telemetry feeds',
        'Technical architectural blue-prints detailing OR mathematical formulations and REST pipelines',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* ── TOP TRICOLOR ACCENT ── */}
      <div className="tricolor-stripe w-full"></div>

      {/* ── SOBER HERO SECTION ── */}
      <section className="relative bg-white text-slate-800 pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 overflow-hidden">
        {/* Background Subtle Geometry */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#003366_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Logo Card Image from docs/VISTHAAPAN text.jpeg */}
          <div className="inline-block p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto hover:shadow-md transition">
            <img
              src="/assets/branding/text.jpeg"
              alt="VISTHAAPAN - Vulnerability Intelligence and Spatial Transit for Hazard-Affected Population Allocation Network"
              className="h-12 sm:h-16 md:h-20 w-auto object-contain mx-auto"
            />
          </div>

          {/* Subtitle */}
          <div className="text-xs sm:text-sm font-extrabold tracking-[0.2em] text-[#d9531e] uppercase">
            NATIONAL SPATIAL DECISION-SUPPORT &amp; RELOCATION PLATFORM
          </div>

          {/* Headline with highlighted acronym letters */}
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#003366] leading-snug sm:leading-tight max-w-4xl mx-auto">
            <span className="text-[#d9531e]">V</span>ulnerability{' '}
            <span className="text-[#d9531e]">I</span>ntelligence &amp;{' '}
            <span className="text-[#d9531e]">S</span>patial{' '}
            <span className="text-[#d9531e]">T</span>ransit for<br className="hidden sm:inline" />{' '}
            <span className="text-[#d9531e]">H</span>azard-
            <span className="text-[#d9531e]">A</span>ffected{' '}
            <span className="text-[#d9531e]">P</span>opulation{' '}
            <span className="text-[#d9531e]">A</span>llocation{' '}
            <span className="text-[#d9531e]">N</span>etwork
          </h1>

          {/* Description Paragraph */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-3xl mx-auto">
            India&apos;s authoritative spatial decision-support system engineered for Himalayan multi-hazard emergencies under the Disaster Management Act 2005. Powered by Operations Research (OR) mathematical solvers, InSAR satellite subsidence radar, and dynamic road perturbation models to ensure equitable, rapid, and verifiable population relocation.
          </p>

          {/* Live District Telemetry Strip */}
          <div id="tour-telemetry" className="inline-flex items-center gap-3 sm:gap-6 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono flex-wrap justify-center shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-bold text-red-600">Level 3 Subsidence Advisory</span>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">Monitored Citizens:</span>{' '}
              <strong className="text-slate-800 font-semibold">{formatPopulation(totalAtRisk)}</strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">Safe Sites:</span>{' '}
              <strong className="text-emerald-700 font-semibold">{sites.length} Active ({formatPopulation(totalSafeCap)} Cap)</strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">R12 Status:</span>{' '}
              <strong className={roadR12Blocked ? 'text-red-600' : 'text-emerald-700'}>
                {roadR12Blocked ? 'BLOCKED' : 'NORMAL'}
              </strong>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto h-12 px-7 bg-[#003366] hover:bg-[#002244] active:bg-[#001833] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Launch Operations Dashboard</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <button
              onClick={startWalkthrough}
              className="w-full sm:w-auto h-12 px-6 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-500">explore</span>
              <span>Website Walkthrough</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 4 CAPABILITIES PILLARS BANNER ── */}
      <section id="tour-pillars" className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="gov-card p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#003366] mb-2">
              <span className="material-symbols-outlined text-[24px]">alt_route</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#003366]">OR</span>
            </div>
            <div className="font-extrabold text-slate-900 text-base">Mathematical Solvers</div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              Sub-second linear optimization balancing convoy delays, site limits &amp; zero deficits.
            </p>
          </div>

          <div className="gov-card p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-700 mb-2">
              <span className="material-symbols-outlined text-[24px]">satellite_alt</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">InSAR</span>
            </div>
            <div className="font-extrabold text-slate-900 text-base">Satellite Radar Telemetry</div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              14 mm/week ground creep detection integrated with ISRO-Bhuvan &amp; SOI topographic maps.
            </p>
          </div>

          <div className="gov-card p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="material-symbols-outlined text-[24px]">warehouse</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">AUDITED</span>
            </div>
            <div className="font-extrabold text-slate-900 text-base">Carrying Capacity Audits</div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              Verified water bowsers, medical triage tents, and high-gradient transit feasibility checks.
            </p>
          </div>

          <div className="gov-card p-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-700 mb-2">
              <span className="material-symbols-outlined text-[24px]">install_mobile</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">OFFLINE PWA</span>
            </div>
            <div className="font-extrabold text-slate-900 text-base">Offline PWA Architecture</div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              Installable app on Android, iOS, &amp; Desktop with resilient offline local storage cache.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLATFORM TOUR SECTION ── */}
      <section id="tour-workspaces" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-[#003366] uppercase">
            <span className="material-symbols-outlined text-[15px]">home</span>
            Home Page Overview
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            The 5 Operational Pillars of VISTHAAPAN
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A comprehensive, end-to-end command ecosystem spanning spatial hazard detection, resource audits, mathematical solvers, legal adjudication, and data provenance.
          </p>
        </div>

        {/* Tour Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto horizontal-scroll-tabs p-1.5 bg-slate-200/70 rounded-xl border border-slate-200">
          {tourPillars.map((pillar, idx) => (
            <button
              key={pillar.num}
              onClick={() => setActiveTourTab(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTourTab === idx
                  ? 'bg-white text-[#003366] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="font-mono text-[11px] text-slate-400">WS-{pillar.num}</span>
              <span className="hidden md:inline">{pillar.title.split('&')[0]}</span>
              <span className="md:hidden">Pillar {pillar.num}</span>
            </button>
          ))}
        </div>

        {/* Active Tour Detail Card */}
        {(() => {
          const p = tourPillars[activeTourTab];
          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black font-mono shadow-xs"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.num}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {p.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {p.summary}
                </p>
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Core Technical Specifications
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                          check_circle
                        </span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0 flex flex-col items-center md:items-end justify-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => navigate(p.route)}
                  className="w-full md:w-auto px-6 py-3 bg-[#003366] hover:bg-[#002244] active:bg-[#001830] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Launch WS-{p.num}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── CALL TO ACTION BANNER ── */}
      <section id="tour-cta" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-[#002244] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Access the Operational Command Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Experience the full telemetry suite with live habitations data, interactive Road R12 injection, and statutory officer adjudication gates.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto h-11 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Open Operations Dashboard</span>
              </button>

              <button
                onClick={toggleRoadR12}
                className="w-full sm:w-auto h-11 px-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">alt_route</span>
                <span>{roadR12Blocked ? 'Road R12: Blocked' : 'Toggle Road R12 Block'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom spacing before global AppShell bar */}
      <div className="pb-8"></div>
    </div>
  );
};
