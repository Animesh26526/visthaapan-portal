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
  const capacityUtilization = totalSafeCapacity > 0 ? (totalAtRisk / totalSafeCapacity) * 100 : 80.1;

  // 8-Stage System Workflow (From Hazard Intelligence to Officer Decision)
  const workflowSteps = [
    {
      id: 'hazard',
      title: 'HAZARD',
      subtitle: 'Spatial Monitoring',
      desc: 'InSAR satellite radar & moraine subsidence detection',
      icon: 'radar',
      color: '#dc2626',
    },
    {
      id: 'risk',
      title: 'RISK',
      subtitle: 'AI Prioritization',
      desc: 'TreeSHAP explainable demographic vulnerability index',
      icon: 'psychology',
      color: '#ea580c',
    },
    {
      id: 'need',
      title: 'RELOCATION NEED',
      subtitle: 'Demographics',
      desc: 'Elderly, children & PwD specialized transit quotas',
      icon: 'groups',
      color: '#d97706',
    },
    {
      id: 'capacity',
      title: 'CAPACITY',
      subtitle: 'Bottleneck Audits',
      desc: 'Drinking water, medical triage & shelter floor limits',
      icon: 'domain',
      color: '#0284c7',
    },
    {
      id: 'or',
      title: 'OR ALLOCATION',
      subtitle: 'Optimal Engine',
      desc: 'Deterministic OR solver with zero shelter overflow',
      icon: 'alt_route',
      color: '#2563eb',
    },
    {
      id: 'route',
      title: 'ROUTE',
      subtitle: 'Transit Corridors',
      desc: 'OSM mapped highway network & dynamic detour bypass',
      icon: 'conversion_path',
      color: '#4f46e5',
    },
    {
      id: 'scenario',
      title: 'SCENARIO',
      subtitle: 'Stress Sandbox',
      desc: 'Cloudburst surge & road blockade perturbation lab',
      icon: 'science',
      color: '#059669',
    },
    {
      id: 'decision',
      title: 'OFFICER DECISION',
      subtitle: 'Statutory Review',
      desc: 'DM Act 2005 Sec 30 executive adjudication & orders',
      icon: 'gavel',
      color: '#003366',
    },
  ];

  // Quick Access Modules
  const quickAccessModules = [
    {
      title: 'Operational GIS',
      subtitle: 'Satellite & Transit Corridors',
      desc: 'Interactive multi-layer geospatial map Demarcating hazard zones, habitations, and safe sites.',
      icon: 'map',
      route: '/operations/gis',
      accent: 'border-l-4 border-blue-600',
      tag: 'REAL-TIME GIS',
    },
    {
      title: 'Risk Intelligence',
      subtitle: 'Explainable AI Scoring',
      desc: 'Transparent demographic vulnerability deconstruction and feature attribution metrics.',
      icon: 'insights',
      route: '/operations/risk-intelligence',
      accent: 'border-l-4 border-indigo-600',
      tag: 'AI SHAP',
    },
    {
      title: 'Relocation Planning',
      subtitle: 'Capacity & OR Allocation',
      desc: 'Rigorous shelter bottleneck audits and deterministic operations research solver.',
      icon: 'domain',
      route: '/planning/capacity',
      accent: 'border-l-4 border-teal-600',
      tag: 'OR SOLVER',
    },
    {
      title: 'Scenario Planner',
      subtitle: 'What-If Perturbation Lab',
      desc: 'Stress-test plans against road severance, +50% surge demand, and shelter cuts.',
      icon: 'tune',
      route: '/scenario/planner',
      accent: 'border-l-4 border-amber-600',
      tag: 'SIMULATOR',
    },
    {
      title: 'Officer Review',
      subtitle: 'Statutory Adjudication',
      desc: 'Incident Commander formal review gate, AI situation brief, and statutory audit trail.',
      icon: 'assignment_turned_in',
      route: '/decisions/review',
      accent: 'border-l-4 border-emerald-600',
      tag: 'DECISION GATE',
    },
  ];

  // 6 Core Platform Capabilities
  const coreCapabilities = [
    {
      title: 'Hazard Intelligence',
      desc: 'Automated satellite InSAR ground displacement tracking (14 mm/week threshold) integrated with ISRO-Bhuvan and Geological Survey of India inventories.',
      icon: 'satellite_alt',
      badge: 'ISRO Bhuvan',
    },
    {
      title: 'AI Risk Intelligence',
      desc: 'Transparent multi-criteria risk scoring attributing vulnerability to slope declivity, elderly/PwD density, and single-bridge access without black-box opacity.',
      icon: 'psychology',
      badge: 'Explainable AI',
    },
    {
      title: 'Capacity Intelligence',
      desc: 'Leontief multi-resource audits verifying true carrying capacity across drinking water bowsers, medical triage kits, and physical shelter square footage.',
      icon: 'warehouse',
      badge: 'Resource Audits',
    },
    {
      title: 'OR Optimization',
      desc: 'High-speed deterministic Operations Research solver calculating global cost-optimal evacuation dispatch schedules with mathematically guaranteed zero overflow.',
      icon: 'alt_route',
      badge: 'OR Solver',
    },
    {
      title: 'Scenario Planning',
      desc: 'Isolated sandbox allowing commanders to simulate critical road cuts (Link Road R12 / NH-07), cloudburst surges, and evaluate re-optimization impact.',
      icon: 'science',
      badge: 'Stress Testing',
    },
    {
      title: 'Decision Support',
      desc: 'Human-in-the-loop statutory governance providing Incident Commanders with multilingual AI briefs, speech playback, and tamper-evident decision logs.',
      icon: 'verified_user',
      badge: 'DM Act 2005',
    },
  ];

  // 5 Operational Pillars
  const operationalPillars = [
    {
      num: '01',
      title: 'Operations Command & GIS',
      route: '/operations/command-center',
      icon: 'travel_explore',
      desc: 'Command Center tactical workbench, satellite deformation overlays, and ward field dossiers.',
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
      title: 'Officer Review & Decision Roster',
      route: '/decisions/review',
      icon: 'gavel',
      desc: 'Human-in-the-loop executive review, audio briefings, and verified decision ledger.',
    },
    {
      num: '05',
      title: 'System Intelligence & Provenance',
      route: '/intelligence/analytics',
      icon: 'insights',
      desc: 'Triangulated satellite, sensor, and census telemetry with data quality benchmarks.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      {/* ── TOP TRICOLOR BAND ── */}
      <div className="tricolor-stripe w-full"></div>

      {/* ── HERO BANNER: PRODUCT-LEVEL PORTAL OVERVIEW ── */}
      <section id="tour-home-hero" className="relative bg-white border-b border-slate-200/80 pt-8 pb-10 sm:pt-12 sm:pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#003366_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-5">
          {/* Official Emblem & Acronym Card */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-[#003366] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA)</span>
            <span className="text-slate-300">•</span>
            <span>GOVERNMENT OF UTTARAKHAND</span>
          </div>

          {/* Portal Title & Acronym */}
          <div className="space-y-1">
            <div className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-[#d9531e] uppercase">
              {t('portalSubtitle', 'NATIONAL DISASTER RELOCATION PLATFORM')}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#003366]">
              {t('portalTitle', 'VISTHAAPAN')}
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-500 max-w-2xl mx-auto">
              Vulnerability Intelligence and Spatial Transit for Hazard-Affected Population Allocation Network
            </p>
          </div>

          {/* Master Tagline */}
          <div className="py-1">
            <span className="inline-block px-4 py-1.5 rounded-lg bg-blue-50 text-[#003366] text-sm sm:text-base font-extrabold border border-blue-200 shadow-2xs">
              &ldquo;From Hazard Intelligence to Officer Decision&rdquo;
            </span>
          </div>

          {/* Introduction Paragraph */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl mx-auto">
            India&apos;s authoritative spatial decision-support platform engineered for Himalayan multi-hazard emergencies under the Disaster Management Act 2005. Synthesizes satellite InSAR ground displacement, demographic vulnerability profiling, humanitarian shelter carrying capacity, and deterministic Operations Research optimization into verifiable, executive relocation directives.
          </p>

          {/* High-Level Current Situation Telemetry Strip */}
          <div className="inline-flex items-center gap-3 sm:gap-6 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono flex-wrap justify-center shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span className="font-bold text-red-700">Chamoli Sector: Level 3 Alert</span>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">Monitored Citizens:</span>{' '}
              <strong className="text-slate-800">{formatPopulation(totalAtRisk || 12250)}</strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">Safe Capacity:</span>{' '}
              <strong className="text-emerald-700">{formatPopulation(totalSafeCapacity || 14800)} ({formatPercent(capacityUtilization / 100, 0)} Utilized)</strong>
            </div>
            <div className="hidden sm:block text-slate-300">|</div>
            <div>
              <span className="text-slate-500">Corridor R12:</span>{' '}
              <strong className={roadR12Blocked ? 'text-amber-700' : 'text-emerald-700'}>
                {roadR12Blocked ? 'Detour Active (Alt R12B)' : 'Passable'}
              </strong>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={() => navigate('/operations/command-center')}
              className="w-full sm:w-auto h-11 px-6 bg-[#003366] hover:bg-[#002244] active:bg-[#001833] text-white font-extrabold text-sm rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">dashboard</span>
              <span>Open Operations Command Center</span>
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </button>

            <button
              onClick={startWalkthrough}
              className="w-full sm:w-auto h-11 px-5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px] text-amber-500">explore</span>
              <span>Website Tour</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12 mt-10">
        {/* ── 2. SYSTEM WORKFLOW: FROM HAZARD TO DECISION ── */}
        <section id="tour-home-workflow" className="space-y-4">
          <div className="text-center space-y-1 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#003366] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              End-to-End Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              The 8-Stage VISTHAAPAN Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Deterministic, auditable decision intelligence flowing from multi-source physical sensors to statutory Incident Commander adjudication.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
            {workflowSteps.map((step, idx) => (
              <div
                key={step.id}
                className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-sm hover:border-[#003366] transition relative group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black text-slate-400">
                      0{idx + 1}
                    </span>
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: step.color }}
                    >
                      {step.icon}
                    </span>
                  </div>
                  <div className="font-extrabold text-slate-900 text-xs tracking-tight">
                    {step.title}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    {step.subtitle}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. QUICK ACCESS MODULES ── */}
        <section id="tour-home-quickaccess" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[#003366] text-[24px]">rocket_launch</span>
                <span>Quick Access Workspaces</span>
              </h2>
              <p className="text-xs text-slate-500">Direct tactical navigation to authoritative operational views.</p>
            </div>
            <button
              onClick={() => navigate('/operations/command-center')}
              className="text-xs font-bold text-[#003366] hover:underline flex items-center gap-1"
            >
              <span>Command Center</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {quickAccessModules.map((mod) => (
              <div
                key={mod.title}
                onClick={() => navigate(mod.route)}
                className={`bg-white p-4 rounded-xl shadow-xs border border-slate-200 ${mod.accent} hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex flex-col justify-between group`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-slate-50 text-[#003366] group-hover:bg-[#003366] group-hover:text-white transition">
                      <span className="material-symbols-outlined text-[20px]">{mod.icon}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600">
                      {mod.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#003366] transition">
                      {mod.title}
                    </h3>
                    <div className="text-[11px] font-medium text-slate-500">{mod.subtitle}</div>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">
                    {mod.desc}
                  </p>
                </div>
                <div className="pt-3 text-[11px] font-bold text-[#003366] flex items-center gap-1">
                  <span>Enter View</span>
                  <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. 6 CORE PLATFORM CAPABILITIES ── */}
        <section id="tour-home-capabilities" className="space-y-4">
          <div className="text-center space-y-1 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#003366] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Rigorous Mathematical &amp; Spatial Foundations
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Engineered to meet statutory evidentiary standards under the National Disaster Management Act 2005.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {coreCapabilities.map((cap) => (
              <div
                key={cap.title}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#003366] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">{cap.icon}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. 5 OPERATIONAL PILLARS OVERVIEW ── */}
        <section id="tour-home-pillars" className="space-y-4 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
          <div className="text-center space-y-1 max-w-2xl mx-auto mb-6">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#003366]">
              Consolidated Workspaces
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              The 5 Operational Pillars of VISTHAAPAN
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Seamless operational continuity across real-time tactical overview, multi-resource shelter capacity, isolated simulation sandboxes, and executive audit ledgers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {operationalPillars.map((pillar) => (
              <div
                key={pillar.num}
                onClick={() => navigate(pillar.route)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm hover:border-[#003366] transition cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-[#003366]">
                      {pillar.num}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">
                      {pillar.icon}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">
                    {pillar.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {pillar.desc}
                  </p>
                </div>
                <div className="pt-3 text-[10px] font-bold text-[#003366] flex items-center gap-1">
                  <span>Open Pillar</span>
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
