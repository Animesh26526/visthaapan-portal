import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { useLanguage } from '../../i18n';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface NavSection {
  id: string;
  labelKey: 'navOperations' | 'navPlanning' | 'navScenario' | 'navDecisions' | 'navIntelligence';
  icon: string;
  defaultPath: string;
  items: {
    to: string;
    labelKey: string;
    desc: string;
    icon: string;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'operations',
    labelKey: 'navOperations',
    icon: 'travel_explore',
    defaultPath: '/operations/command-center',
    items: [
      {
        to: '/operations/command-center',
        labelKey: 'opCommandCenter',
        desc: 'District emergency operations center & tactical overview',
        icon: 'dashboard',
        badge: 'LIVE',
      },
      {
        to: '/operations/gis',
        labelKey: 'opGis',
        desc: 'Satellite deformation, hazard boundaries & transit corridors',
        icon: 'map',
      },
      {
        to: '/operations/habitations',
        labelKey: 'opHabitations',
        desc: 'Ward census, demographic vulnerability & field dossiers',
        icon: 'location_city',
      },
      {
        to: '/operations/risk-intelligence',
        labelKey: 'opRiskIntel',
        desc: 'Explainable AI risk scoring & hazard multi-criteria indices',
        icon: 'psychology',
      },
    ],
  },
  {
    id: 'planning',
    labelKey: 'navPlanning',
    icon: 'alt_route',
    defaultPath: '/planning/capacity',
    items: [
      {
        to: '/planning/capacity',
        labelKey: 'planCapacity',
        desc: 'Resource bottleneck audits (water, medical, shelter)',
        icon: 'domain',
      },
      {
        to: '/planning/allocation',
        labelKey: 'planAllocation',
        desc: 'Deterministic OR solver dispatch matrix',
        icon: 'timeline',
        badge: 'OR',
      },
      {
        to: '/planning/why-this-plan',
        labelKey: 'planWhy',
        desc: 'Mathematical rationale, distance metrics & safety proof',
        icon: 'help_outline',
      },
      {
        to: '/planning/relocation-plan',
        labelKey: 'planRelocation',
        desc: 'Chronological 0–24h multi-wave convoy roster',
        icon: 'departure_board',
      },
    ],
  },
  {
    id: 'scenario',
    labelKey: 'navScenario',
    icon: 'science',
    defaultPath: '/scenario/planner',
    items: [
      {
        to: '/scenario/planner',
        labelKey: 'scenPlanner',
        desc: 'Perturbation simulator: road cuts, surge demand, capacity loss',
        icon: 'tune',
      },
      {
        to: '/scenario/gis',
        labelKey: 'scenGis',
        desc: 'Isolated scenario spatial map with dynamic bypass routes',
        icon: 'share_location',
        badge: 'SANDBOX',
      },
      {
        to: '/scenario/results',
        labelKey: 'scenResults',
        desc: 'Before vs after re-optimization solver comparison delta',
        icon: 'compare_arrows',
      },
    ],
  },
  {
    id: 'decisions',
    labelKey: 'navDecisions',
    icon: 'gavel',
    defaultPath: '/decisions/review',
    items: [
      {
        to: '/decisions/current-plan',
        labelKey: 'decCurrentPlan',
        desc: 'Active operational baseline #VST-2026-CHM-014',
        icon: 'verified',
        badge: 'ACTIVE',
      },
      {
        to: '/decisions/review',
        labelKey: 'decReview',
        desc: 'Formal officer review and decision recording gate',
        icon: 'assignment_turned_in',
      },
      {
        to: '/decisions/previous-plans',
        labelKey: 'decPreviousPlans',
        desc: 'Archived plan versions and side-by-side diff comparison',
        icon: 'history_toggle_off',
      },
      {
        to: '/decisions/audit',
        labelKey: 'decAudit',
        desc: 'Tamper-evident administrative decision history & hash ledger',
        icon: 'receipt_long',
      },
    ],
  },
  {
    id: 'intelligence',
    labelKey: 'navIntelligence',
    icon: 'insights',
    defaultPath: '/intelligence/analytics',
    items: [
      {
        to: '/intelligence/analytics',
        labelKey: 'intelAnalytics',
        desc: 'Executive summaries, demographic distributions & charts',
        icon: 'bar_chart',
      },
      {
        to: '/intelligence/evidence',
        labelKey: 'intelEvidence',
        desc: 'Triangulated satellite, sensor & administrative telemetry',
        icon: 'folder_open',
      },
      {
        to: '/intelligence/quality',
        labelKey: 'intelQuality',
        desc: 'Survey of India, ISRO, CWC and Census benchmark ratings',
        icon: 'fact_check',
      },
      {
        to: '/intelligence/system-overview',
        labelKey: 'intelOverview',
        desc: 'System architecture, SCIP formulation & technical explainer',
        icon: 'architecture',
      },
    ],
  },
];

export const TopNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAuthenticated } = useAppStore();

  const { currentLanguage, setLanguage, supportedLanguages, currentLanguageMeta, t } = useLanguage();
  const { isInstalled, installApp } = usePWAInstall();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOfficerMenuOpen, setIsOfficerMenuOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setIsLangMenuOpen(false);
        setIsOfficerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    setIsLangMenuOpen(false);
    setIsOfficerMenuOpen(false);
  }, [location.pathname]);

  const isSectionActive = (section: NavSection) => {
    return section.items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to));
  };

  const isHomeActive = location.pathname === '/';

  return (
    <nav ref={navRef} className="sticky top-0 z-[2500] bg-[#003366] text-white shadow-md border-b border-[#002244] w-full select-none font-sans">
      {/* ── TRICOLOR STRIPE ── */}
      <div className="h-1 bg-gradient-to-r from-[#d9531e] via-[#ffffff] to-[#1b7837] w-full shrink-0" />

      {/* ── MAIN NAVBAR BAR ── */}
      <div className="max-w-[1720px] mx-auto px-2.5 sm:px-4 flex items-center justify-between h-14">
        {/* LEFT: BRANDING & LOGO */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
            title="Go to VISTHAAPAN Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-white p-1 flex items-center justify-center shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-amber-400 transition">
              <img
                src="/assets/branding/logo.jpeg"
                alt="Emblem"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-[#003366] text-[20px] hidden font-black">
                shield
              </span>
            </div>

            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-wider text-white text-sm sm:text-base font-sans drop-shadow-xs">
                  {t('portalTitle')}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/90 text-[#002244] text-[9px] font-black uppercase font-mono tracking-wider">
                  UK-DM
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium hidden sm:block truncate max-w-[210px] xl:max-w-[260px]">
                {t('portalSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* CENTER: DESKTOP WORKSPACE NAVIGATION */}
        <div className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 h-full">
          {/* 5 Operational Workspaces */}
          {NAV_SECTIONS.map((section) => {
            const active = isSectionActive(section);
            const isOpen = activeDropdown === section.id;

            return (
              <div
                key={section.id}
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveDropdown(section.id)}
              >
                <button
                  onClick={() => {
                    navigate(section.defaultPath);
                    setActiveDropdown(null);
                  }}
                  className={`flex items-center gap-1 px-2 xl:px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition ${
                    active
                      ? 'bg-white/15 text-white font-extrabold border-b-2 border-amber-400'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                  aria-expanded={isOpen}
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-300">
                    {section.icon}
                  </span>
                  <span>{t(section.labelKey)}</span>
                  <span
                    className={`material-symbols-outlined text-[14px] text-slate-400 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-amber-400' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div
                    className="absolute top-[52px] left-0 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 py-2 z-[2600] animate-fadeIn"
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase font-mono">
                      <span>{t(section.labelKey)} WORKSPACE</span>
                      <span className="text-[10px] text-[#003366]">DIRECT ACCESS</span>
                    </div>

                    <div className="py-1">
                      {section.items.map((item) => {
                        const isItemActive = location.pathname === item.to;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setActiveDropdown(null)}
                            className={`flex items-start gap-2.5 px-3 py-2 hover:bg-blue-50/80 transition group ${
                              isItemActive ? 'bg-blue-50/90 border-l-4 border-[#003366]' : ''
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${
                                isItemActive
                                  ? 'text-[#003366]'
                                  : 'text-slate-400 group-hover:text-[#003366]'
                              }`}
                            >
                              {item.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold leading-tight ${
                                    isItemActive
                                      ? 'text-[#003366]'
                                      : 'text-slate-800 group-hover:text-[#003366]'
                                  }`}
                                >
                                  {t(item.labelKey as any, item.to.split('/').pop())}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-amber-100 text-amber-900 border border-amber-300">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: CONTROLS, COMPACT MULTILINGUAL SELECTOR, OFFICER BADGE */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PWA Install Button (Compact) */}
          {!isInstalled && (
            <button
              onClick={installApp}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow-xs transition"
              title="Install VISTHAAPAN PWA"
            >
              <span className="material-symbols-outlined text-[15px]">install_mobile</span>
              <span className="hidden xl:inline">{t('btnInstall')}</span>
            </button>
          )}

          {/* Indian Multilingual Selector Dropdown (Prominent & Visible) */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#002244] hover:bg-black/30 border border-white/20 rounded text-xs font-semibold text-white transition shadow-xs"
              title="Select Indian Language (13 Languages)"
              aria-label="Language Switcher"
              aria-expanded={isLangMenuOpen}
            >
              <span className="material-symbols-outlined text-[16px] text-amber-400">translate</span>
              <span className="text-xs font-bold hidden sm:inline">{currentLanguageMeta.nativeName}</span>
              <span className="text-xs font-bold sm:hidden uppercase font-mono">{currentLanguage}</span>
              <span className="material-symbols-outlined text-[14px] text-slate-400">
                {isLangMenuOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 py-1 z-[2600] max-h-80 overflow-y-auto font-sans">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase font-mono">
                  <span>INDIAN LANGUAGES</span>
                  <span className="text-[#003366] font-bold">13 AVAILABLE</span>
                </div>
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                      currentLanguage === lang.code
                        ? 'bg-blue-50 text-[#003366] font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Officer Context / Profile */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsOfficerMenuOpen(!isOfficerMenuOpen)}
                className="flex items-center gap-1.5 p-1 pl-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition"
                aria-label="Officer Profile Menu"
              >
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white leading-none">
                    {currentUser.name.split(',')[0]}
                  </div>
                  <div className="text-[10px] text-slate-300 leading-none mt-1">DM Chamoli</div>
                </div>
                <div className="w-7 h-7 rounded bg-amber-400 text-[#002244] font-black text-xs flex items-center justify-center shadow-xs">
                  DM
                </div>
              </button>

              {isOfficerMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 p-3 z-[2600] font-sans">
                  <div className="border-b border-slate-100 pb-2 mb-2">
                    <div className="font-bold text-sm text-[#003366]">{currentUser.name}</div>
                    <div className="text-xs text-slate-600">{currentUser.designation}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Emp ID: {currentUser.employeeId}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Sector:</span>
                      <strong className="text-slate-800">Chamoli District</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Jurisdiction:</span>
                      <strong className="text-slate-800">Incident Command</strong>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        navigate('/decisions/review');
                        setIsOfficerMenuOpen(false);
                      }}
                      className="text-xs font-bold text-[#003366] hover:underline"
                    >
                      Officer Portal
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded transition"
                    >
                      {t('btnLogout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className="px-3 py-1 bg-white text-[#003366] hover:bg-slate-100 text-xs font-bold rounded shadow-xs transition"
            >
              {t('btnLogin')}
            </NavLink>
          )}
        </div>
      </div>

      {/* ── MOBILE ACCORDION MENU DRAWER ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#002244] border-t border-[#001c38] px-4 py-3 max-h-[80vh] overflow-y-auto z-[2600]">
          {/* Mobile Home Link */}
          <NavLink
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2 py-2 text-sm font-bold border-b border-white/10 ${
              isHomeActive ? 'text-amber-400 font-black' : 'text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>{t('navHome' as any, 'Home')}</span>
          </NavLink>

          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="py-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 py-1">
                <span className="material-symbols-outlined text-[16px]">{section.icon}</span>
                <span>{t(section.labelKey)}</span>
              </div>
              <div className="pl-6 space-y-1 mt-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-1 text-xs text-slate-300 hover:text-white"
                  >
                    {t(item.labelKey as any, item.to.split('/').pop())}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile Language Switcher */}
          <div className="py-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              Select Language (13 Indian Languages)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-2 py-1 text-xs text-left rounded ${
                    currentLanguage === lang.code
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  {lang.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
