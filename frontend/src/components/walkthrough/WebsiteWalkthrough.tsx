import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';

interface FeatureStep {
  id: string;
  targetId: string;
  title: string;
  badge: string;
  icon: string;
  whatItMeans: string;
  howToUse: string;
  pointerPosition: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

const FEATURE_STEPS: FeatureStep[] = [
  {
    id: 'step-telemetry',
    targetId: 'tour-telemetry',
    title: 'Live Multi-Hazard Telemetry Strip',
    badge: 'FEATURE 1 OF 5 • REAL-TIME SENSING',
    icon: 'sensors',
    whatItMeans:
      'Provides instantaneous situational awareness across Chamoli District. "Level 3 Subsidence Advisory" indicates active ground creep in Joshimath (>14 mm/week). "Monitored Citizens" (19,500) tracks the at-risk population across Malari, Helang, Raini, and Joshimath, while "R12 Status" shows if the primary mountain transport corridor is passable.',
    howToUse:
      'Watch this strip for real-time hazard condition changes, active shelter capacities, and sudden road blockage alerts.',
    pointerPosition: 'bottom',
  },
  {
    id: 'step-pillars',
    targetId: 'tour-pillars',
    title: 'Core Engineering Pillars',
    badge: 'FEATURE 2 OF 5 • SYSTEM ARCHITECTURE',
    icon: 'foundation',
    whatItMeans:
      'VISTHAAPAN eliminates chaotic emergency guesswork through 4 scientific capabilities: 1) MILP mathematical optimization solving 19,500 citizen assignments in sub-second time; 2) Satellite InSAR radar telemetry from ISRO Bhuvan; 3) Verified shelter carrying capacity audits for drinking water and ICU triage; 4) Offline PWA resilience for field marshals without internet.',
    howToUse:
      'Review these pillars to understand the multi-disciplinary algorithms backing every operational recommendation.',
    pointerPosition: 'top',
  },
  {
    id: 'step-workspaces',
    targetId: 'tour-workspaces',
    title: '5 Consolidated Mission Workspaces',
    badge: 'FEATURE 3 OF 5 • OPERATIONAL MODULES',
    icon: 'workspaces',
    whatItMeans:
      'The entire disaster lifecycle is organized into 5 specialized modules: 1) Operations & GIS for satellite red-zone mapping; 2) Capacity & Risk for shelter audits; 3) Allocation Engine for MILP route optimization; 4) Adjudication for District Magistrate statutory sign-off; 5) Evidence Atlas for national data provenance.',
    howToUse:
      'Click through the tabs (WS-01 to WS-05) to preview each workspace, or click "Launch Workspace" to jump directly into action.',
    pointerPosition: 'top',
  },
  {
    id: 'step-cta',
    targetId: 'tour-cta',
    title: 'Command Operations Cockpit',
    badge: 'FEATURE 4 OF 5 • EXECUTIVE ACCESS',
    icon: 'dashboard',
    whatItMeans:
      'The central incident coordination dashboard where tactical officers execute phased evacuations (Wave 1 Urgent vs Wave 2 Secondary), trigger real-time road blockage injections (Road R12), and review live shelter influx.',
    howToUse:
      'Click "Launch Operations Dashboard" at any time to enter the live tactical coordination environment.',
    pointerPosition: 'top',
  },
  {
    id: 'step-ai',
    targetId: 'tour-floating-ai',
    title: 'Floating Sahayak AI Assistant',
    badge: 'FEATURE 5 OF 5 • 24/7 AI CO-PILOT',
    icon: 'smart_toy',
    whatItMeans:
      'Your conversational disaster operations companion powered by Google Gemini 3.5 Flash Lite. Completely decoupled from the page content, it floats persistently in the bottom-right corner across every single screen in VISTHAAPAN.',
    howToUse:
      'Click this floating bubble at any time to ask about mathematical models, road blockage detours, shelter capacities, or NDMA legal protocols.',
    pointerPosition: 'left',
  },
];

export const WebsiteWalkthrough: React.FC = () => {
  const { isWalkthroughOpen, startWalkthrough, closeWalkthrough } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-launch walkthrough for first-time visitors
  useEffect(() => {
    const hasSeen = localStorage.getItem('visthaapan_feature_walkthrough_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        startWalkthrough();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startWalkthrough]);

  const activeStep = FEATURE_STEPS[currentStep];

  // Calculate coordinates of target element and scroll it smoothly into view
  const updateTargetPosition = useCallback(() => {
    if (!isWalkthroughOpen || !activeStep) return;

    const el = document.getElementById(activeStep.targetId);
    if (el) {
      // Scroll into view with margin
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

      // Update bounding rect after scroll settles
      const updateRect = () => {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      };

      updateRect();
      const interval = setInterval(updateRect, 100);
      const timer = setTimeout(() => clearInterval(interval), 500);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    } else {
      setCoords(null);
    }
  }, [isWalkthroughOpen, activeStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  const handleClose = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem('visthaapan_feature_walkthrough_seen', 'true');
    }
    closeWalkthrough();
  }, [closeWalkthrough, dontShowAgain]);

  const handleNext = () => {
    if (currentStep < FEATURE_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isWalkthroughOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWalkthroughOpen, currentStep, handleClose]);

  // When walkthrough is closed, render a subtle floating "Feature Guide" pill so user can reopen anytime
  if (!isWalkthroughOpen) {
    return (
      <div className="fixed bottom-5 left-5 z-[70] hidden sm:block">
        <button
          onClick={() => {
            setCurrentStep(0);
            startWalkthrough();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002244] hover:bg-[#001830] text-amber-300 hover:text-white rounded-full shadow-lg border border-amber-400/30 text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
          title="Explore what each feature on this platform means"
        >
          <span className="material-symbols-outlined text-[16px] text-amber-300">help</span>
          <span>Feature Guide</span>
        </button>
      </div>
    );
  }

  // Calculate card positioning ensuring it NEVER goes out of scope on laptop or mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isStepAI = activeStep?.id === 'step-ai';

  let cardStyle: React.CSSProperties = {};

  if (isMobile) {
    cardStyle = {
      position: 'fixed',
      bottom: '16px',
      left: '12px',
      right: '12px',
      zIndex: 100,
      maxWidth: 'calc(100vw - 24px)',
    };
  } else if (isStepAI) {
    // When highlighting the bottom-right AI button on laptop, dock comfortably on bottom-left so both are in full view
    cardStyle = {
      position: 'fixed',
      bottom: '28px',
      left: '36px',
      width: '460px',
      maxWidth: 'calc(100vw - 140px)',
      zIndex: 100,
    };
  } else {
    // For all other steps on laptop: clean, perfectly centered bottom floating dock
    cardStyle = {
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '520px',
      maxWidth: 'calc(100vw - 64px)',
      zIndex: 100,
    };
  }

  return (
    <>
      {/* ── SUBTLE SPOTLIGHT OVERLAY ── */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[1px] transition-all duration-300 pointer-events-auto"
        aria-hidden="true"
      />

      {/* ── TARGET ELEMENT SPOTLIGHT HIGHLIGHT RING ── */}
      {coords && (
        <div
          className="fixed pointer-events-none z-[92] rounded-2xl ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900/60 shadow-[0_0_40px_rgba(251,191,36,0.5)] transition-all duration-300"
          style={{
            top: `${coords.top - 6}px`,
            left: `${coords.left - 6}px`,
            width: `${coords.width + 12}px`,
            height: `${coords.height + 12}px`,
          }}
        >
          {/* Pulsing Beacon Dot */}
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
          </span>
        </div>
      )}

      {/* ── FLOATING FEATURE EXPLAINER CARD ── */}
      <div
        ref={cardRef}
        style={cardStyle}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="walkthrough-step-title"
      >
        {/* Tricolor Micro-Stripe */}
        <div className="h-1 bg-gradient-to-r from-[#d9531e] 0% via-[#ffffff] 50% to-[#1b7837] 100% w-full shrink-0" />

        {/* Card Header */}
        <div className="bg-[#002244] text-white px-4 py-3 flex items-center justify-between border-b border-[#003366] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 shrink-0 border border-white/20">
              <span className="material-symbols-outlined text-[18px]">{activeStep.icon}</span>
            </div>
            <div className="min-w-0">
              <span className="text-[9.5px] font-mono font-bold tracking-wider uppercase text-amber-300 block leading-tight">
                {activeStep.badge}
              </span>
              <h3 id="walkthrough-step-title" className="text-xs sm:text-sm font-bold text-white tracking-wide truncate leading-tight mt-0.5">
                {activeStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
            title="Dismiss walkthrough"
            aria-label="Dismiss walkthrough"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Card Body — The Meaning of the Feature */}
        <div className="p-3.5 sm:p-4 space-y-2.5 bg-[#f8fafc] text-xs text-slate-700 max-h-[220px] sm:max-h-[250px] overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-mono font-bold text-[#003366] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">lightbulb</span>
              <span>What this feature means:</span>
            </div>
            <span className="text-[9.5px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Highlighted on screen
            </span>
          </div>
          <p className="leading-relaxed text-slate-800 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            {activeStep.whatItMeans}
          </p>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">touch_app</span>
              <span>How to use it:</span>
            </div>
            <p className="leading-snug text-slate-600 text-[11.5px]">
              {activeStep.howToUse}
            </p>
          </div>
        </div>

        {/* Footer with Controls */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {/* Step Dots & Startup Checkbox */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {FEATURE_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-4 bg-[#003366]'
                      : idx < currentStep
                      ? 'w-1.5 bg-slate-400'
                      : 'w-1.5 bg-slate-200'
                  }`}
                  aria-label={`Go to feature ${idx + 1}`}
                />
              ))}
            </div>

            <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer select-none ml-1">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 text-[#003366] h-3 w-3"
              />
              <span className="hidden xs:inline">Don&apos;t show again</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-30 transition flex items-center"
            >
              <span className="material-symbols-outlined text-[15px]">chevron_left</span>
              <span className="hidden xs:inline">Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] active:bg-[#001830] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>{currentStep === FEATURE_STEPS.length - 1 ? 'Got it' : 'Next'}</span>
              <span className="material-symbols-outlined text-[14px]">
                {currentStep === FEATURE_STEPS.length - 1 ? 'check' : 'chevron_right'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
