import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { useLanguage } from '../i18n';
import { formatPopulation, formatPercent } from '../utils/formatters';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    habitations,
    sites,
    roadR12Blocked,
    startWalkthrough,
  } = useAppStore();

  const totalAtRisk = (habitations || []).reduce((acc, h) => acc + (h?.population || 0), 0);
  const totalSafeCapacity = (sites || []).reduce(
    (acc, s) => acc + (s?.resourceCapacity?.effectiveCapacity || 0),
    0
  );
  const capacityUtilization = totalSafeCapacity > 0 ? (totalAtRisk / totalSafeCapacity) * 100 : 79.2;

  // 8-Stage System Workflow (From Hazard Intelligence to Officer Decision)
  const workflowSteps = [
    {
      id: 'hazard',
      title: 'HAZARD',
      subtitle: 'Spatial Monitoring',
      desc: 'InSAR satellite radar and moraine subsidence monitoring across vulnerable sectors.',
      icon: 'radar',
      color: '#dc2626',
    },
    {
      id: 'risk',
      title: 'RISK',
      subtitle: 'Risk Prioritization',
      desc: 'Explainable demographic vulnerability scoring and hazard exposure analysis.',
      icon: 'psychology',
      color: '#ea580c',
    },
    {
      id: 'need',
      title: 'RELOCATION NEED',
      subtitle: 'Demographics',
      desc: 'Target population quotas with prioritized routing for elderly, children, and persons with disabilities.',
      icon: 'groups',
      color: '#d97706',
    },
    {
      id: 'capacity',
      title: 'CAPACITY',
      subtitle: 'Bottleneck Audits',
      desc: 'Drinking water reserves, medical triage packs, and physical shelter limits.',
      icon: 'domain',
      color: '#0284c7',
    },
    {
      id: 'or',
      title: 'OR ALLOCATION',
      subtitle: 'Optimal Engine',
      desc: 'Deterministic mathematical allocation with guaranteed zero shelter capacity overflow.',
      icon: 'alt_route',
      color: '#2563eb',
    },
    {
      id: 'route',
      title: 'ROUTE',
      subtitle: 'Transit Corridors',
      desc: 'Mapped highway evacuation network with real-time detour bypasses around compromised segments.',
      icon: 'conversion_path',
      color: '#4f46e5',
    },
    {
      id: 'scenario',
      title: 'SCENARIO',
      subtitle: 'Stress Sandbox',
      desc: 'Contingency simulator testing road blockades, cloudburst surge demand, and shelter cuts.',
      icon: 'science',
      color: '#059669',
    },
    {
      id: 'decision',
      title: 'OFFICER DECISION',
      subtitle: 'Operational Review',
      desc: 'Incident Commander decision support, review gate, and recorded operational determinations.',
      icon: 'gavel',
      color: '#003366',
    },
  ];

  // Quick Access Modules (Clean government cards, no artificial AI side lines)
  const quickAccessModules = [
    {
      title: 'Operational GIS',
      subtitle: 'Satellite & Transit Corridors',
      desc: 'Map hazard zones, vulnerable habitations, relocation sites and transport routes across Chamoli.',
      icon: 'map',
      route: '/operations/gis',
    },
    {
      title: 'Risk Intelligence',
      subtitle: 'Explainable Risk Scoring',
      desc: 'Understand district and habitation-level hazard exposure, slope declivity, and relocation priority.',
      icon: 'insights',
      route: '/operations/risk-intelligence',
    },
    {
      title: 'Relocation Planning',
      subtitle: 'Capacity & OR Allocation',
      desc: 'Assess safe-site capacity bottlenecks and generate an optimized, deterministic population allocation.',
      icon: 'domain',
      route: '/planning/capacity',
    },
    {
      title: 'Scenario Planner',
      subtitle: 'What-If Perturbation Lab',
      desc: 'Test hazard, demand, capacity and route changes in an isolated sandbox before applying them.',
      icon: 'tune',
      route: '/scenario/planner',
    },
    {
      title: 'Officer Review',
      subtitle: 'Operational Decision Gate',
      desc: 'Review the proposed plan, listen to the executive audio brief, and record formal decisions.',
      icon: 'assignment_turned_in',
      route: '/decisions/review',
    },
  ];

  // 6 Core Platform Capabilities
  const coreCapabilities = [
    {
      title: 'Hazard Intelligence',
      desc: 'Automated satellite InSAR ground displacement tracking integrated with official geological and terrain surveys.',
      icon: 'satellite_alt',
      badge: 'Satellite Data',
    },
    {
      title: 'Explainable Risk Intelligence',
      desc: 'Transparent multi-criteria risk scoring attributing vulnerability to slope declivity, elderly/PwD density, and single-bridge access.',
      icon: 'psychology',
      badge: 'Transparent Scoring',
    },
    {
      title: 'Lifeline Capacity Audits',
      desc: 'Resource bottleneck analysis verifying true carrying capacity across drinking water reserves, medical triage kits, and physical shelter capacity.',
      icon: 'warehouse',
      badge: 'Capacity Audits',
    },
    {
      title: 'OR Optimization Engine',
      desc: 'High-speed deterministic Operations Research solver calculating evacuation dispatch schedules with mathematically guaranteed zero overflow.',
      icon: 'alt_route',
      badge: 'OR Solver',
    },
    {
      title: 'Contingency Scenario Lab',
      desc: 'Isolated sandbox allowing commanders to simulate critical road cuts (NH-07 / Link Road R12), cloudburst surges, and re-optimization.',
      icon: 'science',
      badge: 'Stress Testing',
    },
    {
      title: 'Operational Decision Support',
      desc: 'Human-in-the-loop governance providing Incident Commanders with situation briefs, speech playback, and verifiable decision logs.',
      icon: 'verified_user',
      badge: 'Decision Support',
    },
  ];

  // 5 Operational Pillars
  const operationalPillars = [
    {
      num: '01',
      title: 'Operations Command & GIS',
      route: '/operations/command-center',
      icon: 'travel_explore',
      desc: 'Command Center tactical overview, satellite deformation overlays, and ward field dossiers.',
    },
    {
      num: '02',
      title: 'Carrying Capacity & Planning',
      route: '/planning/capacity',
      icon: 'domain',
      desc: 'Shelter bottleneck audits and deterministic Operations Research allocation solver.',
    },
    {
      num: '03',
      title: 'Scenario Lab & Stress Test',
      route: '/scenario/planner',
      icon: 'science',
      desc: 'Isolated what-if simulator testing road blockades, surge demand, and shelter cuts.',
    },
    {
      num: '04',
      title: 'Officer Review & Decisions',
      route: '/decisions/review',
      icon: 'gavel',
      desc: 'Human-in-the-loop executive review, audio briefings, and verified decision ledger.',
    },
    {
      num: '05',
      title: 'System Intelligence & Data',
      route: '/intelligence/analytics',
      icon: 'insights',
      desc: 'Triangulated satellite, sensor, and census telemetry with data quality benchmarks.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20">
      {/* ── TOP TRICOLOR BAND ── */}
      <div className="tricolor-stripe w-full"></div>

      {/* ── HERO BANNER: PRODUCT-LEVEL PORTAL OVERVIEW ── */}
      <section
        id="tour-home-hero"
        data-tour="home-hero"
        className="relative bg-white border-b border-slate-200 pt-7 pb-9 sm:pt-9 sm:pb-11 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        <div className="relative max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
          {/* 1. VISTHAAPAN IMAGE / BRAND VISUAL ANCHOR */}
          <div className="flex justify-center">
            <img
              src="/assets/branding/logo.jpeg"
              alt="VISTHAAPAN National Disaster Relocation Platform"
              className="h-32 sm:h-40 md:h-44 w-auto max-w-full object-contain rounded-xl border border-slate-200 p-2 bg-white shadow-2xs"
            />
          </div>

          {/* Official Authority Strip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-[#003366]">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA)</span>
            <span className="text-slate-300">•</span>
            <span>GOVERNMENT OF UTTARAKHAND</span>
          </div>

          {/* 2. VISTHAAPAN & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#003366] tracking-tight">
              {t('home.hero.title', 'VISTHAAPAN')}
            </h1>
            <div className="text-sm sm:text-base font-bold tracking-wider text-[#d9531e] uppercase">
              {t('home.hero.subtitle', 'National Disaster Relocation Platform')}
            </div>
          </div>

          {/* 3. Concise Product Description */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t(
              'home.hero.description',
              'Decision support for hazard intelligence, relocation planning, safe-site capacity and optimized population allocation.'
            )}
          </p>

          {/* 4. The 8-Stage Operational Workflow Strip */}
          <div
            data-tour="home-workflow"
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md text-[10.5px] font-semibold text-slate-700 flex flex-wrap items-center justify-center gap-1.5 max-w-2xl mx-auto shadow-2xs"
          >
            <span className="text-red-700 font-bold">HAZARD</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-orange-700 font-bold">RISK</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-amber-700 font-bold">RELOCATION NEED</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-blue-700 font-bold">CAPACITY</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-indigo-700 font-bold">OR ALLOCATION</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-purple-700 font-bold">ROUTE</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-emerald-700 font-bold">SCENARIO</span>
            <span className="text-amber-500 text-[10px]">→</span>
            <span className="text-[#003366] font-bold underline decoration-amber-400">
              OFFICER DECISION
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={() => navigate('/operations/command-center')}
              className="w-full sm:w-auto px-4 py-2 bg-[#003366] hover:bg-[#002244] active:bg-[#001833] text-white font-bold text-xs sm:text-sm rounded-lg shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer h-10"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>{t('btnOpenCC', 'Open Operations Command Center')}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>

            <button
              onClick={startWalkthrough}
              className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer h-10"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-500">explore</span>
              <span>{t('btnTour', 'Website Tour')}</span>
            </button>
          </div>

          {/* High-Level Situation Telemetry Strip */}
          <div className="inline-flex items-center gap-3 sm:gap-5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono flex-wrap justify-center shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span className="font-bold text-red-700">{t('home.hero.sectorAlert', 'Chamoli Sector: Level 3 Alert')}</span>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500 font-sans">{t('home.hero.monitoredCitizens', 'Monitored Citizens')}:</span>{' '}
              <strong className="text-slate-900 font-bold">{formatPopulation(totalAtRisk || 15450)}</strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500 font-sans">{t('home.hero.safeCapacity', 'Safe Capacity')}:</span>{' '}
              <strong className="text-emerald-700 font-bold">
                {formatPopulation(totalSafeCapacity || 19500)} ({formatPercent(capacityUtilization / 100, 0)} Utilized)
              </strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500 font-sans">{t('home.hero.corridorStatus', 'Corridor R12')}:</span>{' '}
              <strong className={roadR12Blocked ? 'text-amber-700' : 'text-emerald-700'}>
                {roadR12Blocked ? t('home.hero.detourActive', 'Detour Active (Alt R12B)') : t('home.hero.passable', 'Passable')}
              </strong>
            </div>
          </div>

          {/* ── 3. HERO EXPANSION / ACRONYM SPECIFICATION SECTION ── */}
          <div
            data-tour="home-expansion"
            className="mt-4 pt-4 pb-4 px-4 sm:px-6 rounded-xl bg-white border border-slate-200 text-center max-w-3xl mx-auto shadow-2xs"
          >
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#003366] mb-2">
              NATIONAL PLATFORM &amp; ACRONYM SPECIFICATION
            </div>
            <p className="text-xs sm:text-sm text-slate-700 font-sans tracking-wide leading-relaxed">
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#d9531e]">V</span>
                <span className="font-medium text-slate-700">ulnerability</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#003366]">I</span>
                <span className="font-medium text-slate-700">ntelligence</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#1b7837]">A</span>
                <span className="font-medium text-slate-700">nd</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#003366]">S</span>
                <span className="font-medium text-slate-700">patial</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#d9531e]">T</span>
                <span className="font-medium text-slate-700">ransit</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#1b7837]">F</span>
                <span className="font-medium text-slate-700">or</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#003366]">H</span>
                <span className="font-medium text-slate-700">azard-</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#d9531e]">A</span>
                <span className="font-medium text-slate-700">ffected</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#1b7837]">P</span>
                <span className="font-medium text-slate-700">opulation</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#003366]">A</span>
                <span className="font-medium text-slate-700">llocation</span>
              </span>
              <span className="inline-block mr-1.5">
                <span className="font-black text-base sm:text-lg text-[#1b7837]">N</span>
                <span className="font-medium text-slate-700">etwork</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 mt-8">
        {/* ── 2. SYSTEM WORKFLOW: FROM HAZARD TO DECISION ── */}
        <section id="tour-home-workflow" data-tour="home-workflow" className="space-y-4">
          <div className="text-center space-y-1.5 max-w-3xl mx-auto">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#003366] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {t('home.workflow.tag', 'End-to-End Decision Pipeline')}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {t('home.workflow.title', 'The 8-Stage VISTHAAPAN Workflow')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-normal">
              {t('home.workflow.subtitle', 'Deterministic, auditable decision intelligence flowing from multi-source physical sensors to Incident Commander decision review.')}
            </p>
          </div>

          {/* Compact 8-stage workflow grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-[#003366] hover:shadow-xs transition flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      STAGE 0{idx + 1}
                    </span>
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: step.color }}
                    >
                      {step.icon}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                    {step.title}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    {step.subtitle}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug pt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. QUICK ACCESS WORKSPACES (Universal compact cards) ── */}
        <section id="tour-home-quickaccess" data-tour="home-quickaccess" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#003366] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                Direct Workspace Access
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#003366] text-[22px]">rocket_launch</span>
                <span>{t('home.quickAccess.title', 'Quick Access Workspaces')}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {t('home.quickAccess.subtitle', 'Direct tactical navigation to authoritative operational views.')}
              </p>
            </div>
            <button
              onClick={() => navigate('/operations/command-center')}
              className="text-xs font-bold text-[#003366] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Command Center</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickAccessModules.map((mod) => (
              <div
                key={mod.title}
                onClick={() => navigate(mod.route)}
                className="bg-white p-4 sm:p-4.5 rounded-xl border border-slate-200 shadow-2xs hover:border-[#003366] hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-blue-50 text-[#003366] group-hover:bg-[#003366] group-hover:text-white transition">
                      <span className="material-symbols-outlined text-[20px]">{mod.icon}</span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#003366] transition">
                      {mod.title}
                    </h3>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{mod.subtitle}</div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    {mod.desc}
                  </p>
                </div>
                <div className="pt-3 text-xs font-bold text-[#003366] flex items-center gap-1.5 border-t border-slate-100 mt-3">
                  <span>Enter Workspace</span>
                  <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. 6 CORE PLATFORM CAPABILITIES ── */}
        <section id="tour-home-capabilities" data-tour="home-capabilities" className="space-y-4">
          <div className="text-center space-y-1.5 max-w-3xl mx-auto">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#003366] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Core Capabilities
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Rigorous Mathematical &amp; Spatial Foundations
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-normal">
              Engineered for rigorous, auditable operational standards in disaster management planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {coreCapabilities.map((cap) => (
              <div
                key={cap.title}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#003366] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">{cap.icon}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. 5 OPERATIONAL PILLARS OVERVIEW ── */}
        <section id="tour-home-pillars" data-tour="home-pillars" className="space-y-4 bg-slate-50 p-5 sm:p-7 rounded-xl border border-slate-200">
          <div className="text-center space-y-1.5 max-w-3xl mx-auto mb-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#003366]">
              Consolidated Workspaces
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              The 5 Operational Pillars of VISTHAAPAN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-normal">
              Seamless operational continuity across real-time tactical overview, multi-resource shelter capacity, isolated simulation sandboxes, and executive audit ledgers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {operationalPillars.map((pillar) => (
              <div
                key={pillar.num}
                onClick={() => navigate(pillar.route)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#003366] transition cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#003366]">
                      {pillar.num}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">
                      {pillar.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
                <div className="pt-3 text-xs font-bold text-[#003366] flex items-center gap-1.5 border-t border-slate-100 mt-3">
                  <span>Open Pillar</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

