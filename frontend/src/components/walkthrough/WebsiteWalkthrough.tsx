import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { getFeatureGuideForPath } from '../../config/featureGuideConfig';

interface TourStep {
  targetId?: string;
  title: string;
  badge: string;
  description: string;
  officerTip?: string;
}

export const WebsiteWalkthrough: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isWalkthroughOpen, startWalkthrough, closeWalkthrough } = useAppStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'tour' | 'dossier'>('tour');
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const guide = getFeatureGuideForPath(location.pathname);

  // Define page-specific interactive steps
  const steps: TourStep[] = useMemo(() => {
    const path = location.pathname;

    if (path === '/') {
      return [
        {
          targetId: 'tour-home-hero',
          title: 'National Platform Mandate & Acronym',
          badge: 'SOVEREIGN MANDATE',
          description:
            'VISTHAAPAN (विस्थापन) is India\'s authoritative spatial decision-support platform for Himalayan multi-hazard emergencies under the Disaster Management Act 2005. It bridges satellite hazard intelligence to legally binding officer adjudication.',
          officerTip: 'The brand logo in the top bar serves as your persistent one-click return to this sovereign home view.',
        },
        {
          targetId: 'tour-home-workflow',
          title: '8-Stage Operational Relocation Pipeline',
          badge: 'DECISION CHAIN',
          description:
            'Follows a deterministic, transparent 8-stage sequence: HAZARD → RISK → RELOCATION NEED → CAPACITY → OR ALLOCATION → ROUTE → SCENARIO → OFFICER DECISION. Zero unverified algorithmic jumps.',
          officerTip: 'Every stage maintains continuous data provenance and evidentiary standards for post-disaster audits.',
        },
        {
          targetId: 'tour-home-quickaccess',
          title: 'Quick Access Workspaces',
          badge: 'RAPID DISPATCH',
          description:
            'Direct access to the 5 specialized operational workbenches: Real-Time GIS, Explainable Risk Intelligence, Capacity & OR Planning, Scenario Simulator, and Incident Commander Review Gate.',
          officerTip: 'Clicking any workspace tile transports you directly into the tactical operational view.',
        },
        {
          targetId: 'tour-home-capabilities',
          title: 'Core Capabilities & Operations Research',
          badge: 'SCIP SOLVER',
          description:
            'Powered by Google OR-Tools SCIP mathematical solver for sub-second deterministic allocation with mathematically proven zero capacity overflows and minimized convoy transit delays.',
          officerTip: 'Evaluates Leontief resource bottlenecks across water, medical packs, and physical shelter square footage.',
        },
        {
          targetId: 'tour-home-pillars',
          title: '5 Operational Workspaces Architecture',
          badge: 'CONSOLIDATED SUITE',
          description:
            'Organized into Operations, Planning, Scenario, Decisions, and Intelligence. Designed specifically for District Magistrates, Incident Commanders, and NDRF/SDRF convoy marshals.',
          officerTip: 'Use the top navigation bar dropdown menus for immediate direct access to any sub-view.',
        },
      ];
    }

    if (path.startsWith('/operations/command-center')) {
      return [
        {
          targetId: 'tour-cc-incident',
          title: 'Level 3 Emergency Evacuation Directive',
          badge: 'INCIDENT ADVISORY',
          description:
            'Active operational incident banner signaling active ground subsidence in Sector 4-B Joshimath and Helang. Provides immediate shortcuts to Officer Review and AI Situation Dossier.',
          officerTip: 'Status is actively synchronized with InSAR radar deformation sensors and district disaster management orders.',
        },
        {
          targetId: 'tour-cc-database',
          title: 'Live PostGIS Sovereign Informatics Strip',
          badge: 'REAL DATABASE',
          description:
            'Live telemetry summary of the authoritative PostgreSQL 16 + PostGIS informatics repository: 785 canonical districts, 28 surveyed habitations, and 30 official DDMP 2026–27 evidentiary records.',
          officerTip: 'Demonstrates authentic data provenance conforming to the National Data Sharing and Accessibility Policy (NDSAP).',
        },
        {
          targetId: 'tour-cc-kpis',
          title: 'District Operational KPI Strip',
          badge: 'LIVE BENCHMARKS',
          description:
            'High-level summary metrics tracking critical habitations (Immediate priority), at-risk citizen count, audited shelter safe capacity, capacity deficit, recorded officer orders, and corridor transit status.',
          officerTip: 'Monitors Road R12 and NH-07 status continuously to guarantee safe convoy transit.',
        },
        {
          targetId: 'tour-cc-habitations',
          title: 'Evacuation Priority Queue',
          badge: 'HABITATIONS DOSSIER',
          description:
            'Prioritized roster of monitored settlements ranked by composite TreeSHAP risk score, slope declivity, and vulnerable populations (elderly, infants, PwD).',
          officerTip: 'Click on any habitation row to inspect detailed household census data and specific shelter assignment vectors.',
        },
      ];
    }

    if (path.startsWith('/operations/gis')) {
      return [
        {
          targetId: 'tour-gis-toolbar',
          title: 'Cartographic Scope & Phase Filters',
          badge: 'GIS TOOLBAR',
          description:
            'Toggle between National, State Macro, and Chamoli Sector geographic scopes. Filter habitations by statutory Relocation Phase: Immediate (0-24h), Short Term, Medium Term, or Long Term.',
          officerTip: 'Switch map tiles between OpenStreetMap and High-Resolution CartoDB Satellite views.',
        },
        {
          targetId: 'tour-gis-map',
          title: 'Interactive Leaflet Operations Canvas',
          badge: 'SPATIAL INTELLIGENCE',
          description:
            'Full GIS viewport displaying satellite InSAR deformation points, surveyed ward boundaries, reception hubs, and dynamic highway evacuation corridors with real-time detour bypasses.',
          officerTip: 'Click on any safe hub marker to audit real-time carrying capacity, drinking water reserves, and medical packs.',
        },
      ];
    }

    if (path.startsWith('/scenario/planner')) {
      return [
        {
          targetId: 'tour-scen-presets',
          title: 'Quick Contingency Perturbation Templates',
          badge: 'WHAT-IF STRESS LAB',
          description:
            'Instant pre-fills for realistic Himalayan emergency conditions: NH-07 Helang Cut at Km 44, Raini Cloudburst (+50% surge demand), and Joshimath Accelerated Subsidence.',
          officerTip: 'Select a template or manually toggle individual road links and ward demand multipliers in the tables below.',
        },
        {
          targetId: 'tour-scen-run',
          title: 'Google OR-Tools Re-optimization Engine',
          badge: 'OR SOLVER RE-RUN',
          description:
            'Triggers the Google OR-Tools SCIP solver in real-time to compute alternative convoy dispatch vectors, bypassing compromised routes while guaranteeing 100% capacity feasibility.',
          officerTip: 'Compare before-and-after re-optimization metrics before deciding to apply changes to the active master plan.',
        },
      ];
    }

    if (path.startsWith('/decisions/review')) {
      return [
        {
          targetId: 'tour-review-authority',
          title: 'Statutory Authority & Officer Credentials',
          badge: 'DM ACT 2005',
          description:
            'Establishes legal authority under Sections 30 and 34 of the Disaster Management Act 2005. Binds algorithmic recommendations to the designated Statutory Incident Commander.',
          officerTip: 'Every formal determination is permanently signed into an immutable SHA-256 decision ledger.',
        },
        {
          targetId: 'tour-review-brief',
          title: 'AI Operational Situation Brief & Speech Playback',
          badge: 'SAHAYAK AUDIO BRIEF',
          description:
            'Comprehensive executive situation brief synthesized from live planning telemetry. Includes built-in Web Speech API text-to-speech for hands-free audio briefing in the operations room.',
          officerTip: 'Click "Listen Audio Brief" to hear the spoken operational briefing with real-time pause/resume controls.',
        },
        {
          targetId: 'tour-review-actions',
          title: 'Human-in-the-Loop Determination Gate',
          badge: 'ADJUDICATION GATE',
          description:
            'Officer action portal: ACCEPT PLAN (issue immediate NDRF/SDRF mobilization orders), MODIFY IN SCENARIO LAB (inject field overrides), or REJECT PLAN (remand with statutory objections).',
          officerTip: 'Requires entering officer name and formal rationale before the order can be signed and dispatched.',
        },
      ];
    }

    // Default 3-step feature walkthrough for other pages
    return [
      {
        title: guide.title,
        badge: guide.badge,
        description: guide.summary,
        officerTip: guide.technicalNote,
      },
      {
        title: 'Primary Data Inputs & Telemetry',
        badge: 'DATA LINEAGE',
        description: guide.keyInputs.join(' • '),
        officerTip: 'Continuously validated against official Census, ISRO-Bhuvan, and Survey of India benchmarks.',
      },
      {
        title: 'Incident Commander Key Actions',
        badge: 'OFFICER ACTIONS',
        description: guide.officerActions.join(' • '),
        officerTip: 'All operational actions adhere to sovereign Uttarakhand disaster management standard operating procedures.',
      },
    ];
  }, [location.pathname, guide]);

  // Reset step index when route changes or tour opens
  useEffect(() => {
    setCurrentStepIndex(0);
    setViewMode('tour');
  }, [location.pathname, isWalkthroughOpen]);

  // Update highlight bounding box whenever step changes or window resizes
  useEffect(() => {
    if (!isWalkthroughOpen || viewMode !== 'tour') {
      setHighlightRect(null);
      return;
    }

    const currentStep = steps[currentStepIndex];
    if (currentStep?.targetId) {
      const el = document.getElementById(currentStep.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const updateRect = () => {
          const rect = el.getBoundingClientRect();
          setHighlightRect(rect);
        };
        updateRect();
        const timer = setTimeout(updateRect, 300);
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('resize', updateRect);
          window.removeEventListener('scroll', updateRect);
        };
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [isWalkthroughOpen, currentStepIndex, steps, viewMode]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isWalkthroughOpen) return;

      if (e.key === 'Escape') {
        closeWalkthrough();
      } else if (e.key === 'ArrowRight' && viewMode === 'tour') {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          closeWalkthrough();
        }
      } else if (e.key === 'ArrowLeft' && viewMode === 'tour') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWalkthroughOpen, currentStepIndex, steps.length, viewMode, closeWalkthrough]);

  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      closeWalkthrough();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <>
      {/* ── FLOATING PAGE GUIDE TRIGGER (Bottom Left) ── */}
      <button
        onClick={startWalkthrough}
        className="fixed bottom-5 left-5 z-[80] flex items-center gap-2 px-3.5 py-2 bg-white/95 hover:bg-white text-[#003366] rounded-full shadow-lg border border-slate-300 hover:border-[#003366] text-xs font-bold transition hover:scale-105 select-none cursor-pointer group"
        title="Start Interactive Page Tour"
        aria-label="Start Interactive Page Tour"
      >
        <span className="material-symbols-outlined text-[18px] text-amber-500 group-hover:rotate-12 transition-transform">
          explore
        </span>
        <span className="font-extrabold">Website Tour</span>
        <span className="px-1.5 py-0.2 bg-blue-50 text-[#003366] font-mono text-[9px] rounded font-bold uppercase">
          {steps.length} Steps
        </span>
      </button>

      {/* ── INTERACTIVE SPOTLIGHT TOUR OVERLAY ── */}
      {isWalkthroughOpen && viewMode === 'tour' && (
        <div className="fixed inset-0 z-[2900] pointer-events-auto">
          {/* Dimmed backdrop overlay */}
          <div
            onClick={closeWalkthrough}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px] transition-opacity duration-300"
          />

          {/* Dynamic Element Spotlight Outline Box */}
          {highlightRect && (
            <div
              style={{
                position: 'fixed',
                top: `${Math.max(0, highlightRect.top - 8)}px`,
                left: `${Math.max(0, highlightRect.left - 8)}px`,
                width: `${highlightRect.width + 16}px`,
                height: `${highlightRect.height + 16}px`,
              }}
              className="pointer-events-none rounded-xl border-2 border-amber-400 ring-4 ring-amber-400/40 shadow-2xl transition-all duration-300 z-[2950] animate-pulse"
            />
          )}

          {/* Floating Spotlight Tour Card */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100vw-32px)] sm:w-[540px] max-w-[580px] z-[3000] font-sans">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
              {/* Top Accent Strip */}
              <div className="h-1.5 bg-gradient-to-r from-[#d9531e] via-[#ffffff] to-[#1b7837] w-full" />

              {/* Card Header */}
              <div className="bg-[#002244] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#002244] flex items-center justify-center font-black text-sm shrink-0">
                    <span className="material-symbols-outlined text-[20px]">explore</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.2 rounded bg-white/20 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider">
                        {currentStep.badge}
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono">
                        STEP {currentStepIndex + 1} OF {steps.length}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('dossier')}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition text-xs flex items-center gap-1 font-semibold"
                    title="View Full Technical Dossier"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    <span className="hidden sm:inline text-[11px]">Dossier</span>
                  </button>
                  <button
                    onClick={closeWalkthrough}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition"
                    title="Close Tour (Esc)"
                    aria-label="Close Tour"
                  >
                    <span className="material-symbols-outlined text-[19px]">close</span>
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {currentStep.description}
                </p>

                {currentStep.officerTip && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">
                      tips_and_updates
                    </span>
                    <div className="text-[11px] text-amber-900 leading-snug">
                      <strong className="font-bold">Officer Note:</strong> {currentStep.officerTip}
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>TOUR PROGRESS</span>
                    <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Controls */}
              <div className="px-4 py-3 sm:px-5 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={closeWalkthrough}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={isFirstStep}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                    <span>Back</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 text-xs font-black rounded-lg bg-[#003366] hover:bg-[#002244] active:bg-[#001833] text-white shadow-xs hover:shadow transition flex items-center gap-1"
                  >
                    <span>{isLastStep ? 'Finish Tour' : 'Next'}</span>
                    <span className="material-symbols-outlined text-[15px]">
                      {isLastStep ? 'done' : 'arrow_forward'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL FEATURE DOSSIER MODAL MODE ── */}
      {isWalkthroughOpen && viewMode === 'dossier' && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-[#002244] text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400 text-[#002244] flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[24px]">{guide.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-white/15 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                      {guide.badge}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">
                      ROUTE: {guide.route}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                    {guide.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('tour')}
                  className="px-2.5 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1 transition"
                  title="Switch back to interactive tour"
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>Tour Mode</span>
                </button>
                <button
                  onClick={closeWalkthrough}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close Guide"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="text-[11px] font-bold text-[#003366] uppercase font-mono mb-1">
                  Operational Purpose
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {guide.summary}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px] font-mono">
                  <span className="material-symbols-outlined text-[15px] text-[#003366]">database</span>
                  <span>Primary Telemetry &amp; Data Inputs</span>
                </div>
                <ul className="space-y-1.5 pl-2">
                  {guide.keyInputs.map((input, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#003366] font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-snug text-slate-700">{input}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold uppercase tracking-wider text-[11px] font-mono">
                  <span className="material-symbols-outlined text-[15px] text-emerald-700">task_alt</span>
                  <span>Incident Commander / Officer Actions</span>
                </div>
                <ul className="space-y-1.5 pl-2">
                  {guide.officerActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
                      <span className="leading-snug text-slate-700 font-medium">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0 mt-0.5">
                  info
                </span>
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    Technical &amp; Governance Note
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    {guide.technicalNote}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setViewMode('tour')}
                className="text-xs font-bold text-[#003366] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Return to Step-by-Step Tour</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    closeWalkthrough();
                    navigate('/intelligence/system-overview');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#003366] hover:bg-slate-200 rounded transition"
                >
                  System Architecture
                </button>
                <button
                  onClick={closeWalkthrough}
                  className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded shadow-xs transition"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
