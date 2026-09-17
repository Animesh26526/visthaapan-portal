import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../pwa/PWAInstallModal';
import { FloatingAIChatbot } from '../ai/FloatingAIChatbot';
import { WebsiteWalkthrough } from '../walkthrough/WebsiteWalkthrough';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Home Page', icon: 'home' },
  { to: '/dashboard', label: 'Command Dashboard', icon: 'dashboard' },
  { section: 'WORKSPACES' },
  { to: '/operations', label: 'Operations & GIS', icon: 'map' },
  { to: '/capacity-intelligence', label: 'Capacity & Risk', icon: 'monitoring' },
  { to: '/allocation-engine', label: 'Allocation Engine', icon: 'alt_route' },
  { to: '/adjudication', label: 'Adjudication', icon: 'gavel' },
  { to: '/system-intelligence', label: 'Evidence & Data', icon: 'folder_open' },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { currentUser, logout, isAuthenticated, startWalkthrough } = useAppStore();
  const {
    isInstalled,
    installApp,
    isIOS,
    showInstructionsModal,
    setShowInstructionsModal,
  } = usePWAInstall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);

  // Auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans w-full max-w-full overflow-x-hidden">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#003366] z-[60] flex items-center justify-between px-2.5 sm:px-4 md:px-5 border-b border-[#002244] w-full max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-200 hover:text-white p-2 rounded-md hover:bg-white/10 transition flex items-center justify-center shrink-0 w-9 h-9"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-[24px] md:text-[22px]">
              {isSidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer min-w-0" onClick={() => navigate('/')}>
            <img
              src="/assets/branding/logo.jpeg"
              alt="VISTHAAPAN"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded object-contain bg-white p-0.5 shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <span className="font-extrabold tracking-wider text-white text-sm sm:text-base leading-none block truncate">VISTHAAPAN</span>
              <p className="text-[10px] text-slate-300 leading-tight hidden sm:block mt-0.5 truncate">
                National Disaster Relocation Platform
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Website Walkthrough Tour Button */}
          <button
            onClick={startWalkthrough}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-md text-xs font-semibold shadow-xs transition shrink-0 border border-white/20"
            title="Take an interactive platform walkthrough"
            aria-label="Platform Tour"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-300">explore</span>
            <span className="hidden xs:inline">Tour</span>
          </button>

          {/* PWA Install Button */}
          {!isInstalled ? (
            <button
              onClick={installApp}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs transition shrink-0"
              title="Install VISTHAAPAN App on device"
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[16px]">install_mobile</span>
              <span className="hidden xs:inline">Install App</span>
              <span className="xs:hidden">Install</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
              <span className="material-symbols-outlined text-[13px] text-emerald-400">check_circle</span>
              <span>Installed</span>
            </div>
          )}

          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <div className="text-xs font-semibold text-white leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{currentUser.role}</div>
              </div>
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[#003366] font-bold text-xs shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-slate-300 hover:text-red-300 p-1.5 rounded hover:bg-white/10 transition flex items-center justify-center shrink-0"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <NavLink to="/login" className="px-2.5 sm:px-3 py-1 text-xs bg-white text-[#003366] rounded font-bold transition hover:bg-slate-100">
                Login
              </NavLink>
              <NavLink to="/signup" className="px-2.5 sm:px-3 py-1 text-xs text-slate-200 rounded font-medium transition hover:text-white hidden xs:block">
                Register
              </NavLink>
            </div>
          )}
        </div>
      </header>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[45] lg:hidden"
        />
      )}

      {/* SIDEBAR + CONTENT */}
      <div className="flex pt-14 min-h-screen w-full max-w-full min-w-0">
        <aside
          className={`fixed left-0 top-14 bottom-0 w-56 max-w-[80vw] bg-[#002244] text-slate-300 z-[50] border-r border-[#003366] flex flex-col overflow-y-auto transition-transform duration-200 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-2.5 space-y-0.5 text-xs flex-1">
            {navItems.map((item, idx) => {
              if ('section' in item && !('to' in item)) {
                return (
                  <div key={idx} className="pt-4 pb-1.5 px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    {item.section}
                  </div>
                );
              }

              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to!);

              return (
                <NavLink
                  key={idx}
                  to={item.to!}
                  className={`flex items-center gap-2.5 px-3 py-2 transition-all border-l-3 ${
                    isActive
                      ? 'bg-[#003366] text-white font-semibold border-l-[3px] border-white'
                      : 'border-l-[3px] border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom: simple sector label */}
          <div className="p-3 border-t border-white/10 text-[10px] text-slate-500 font-mono">
            District Chamoli • Uttarakhand
          </div>
        </aside>

        {/* MAIN */}
        <main className={`flex-1 w-full max-w-full min-w-0 transition-all duration-200 ${isSidebarOpen ? 'lg:pl-56' : 'pl-0'} bg-[#f8fafc] min-h-[calc(100vh-56px)] flex flex-col overflow-x-hidden`}>
          <div className="flex-1 w-full max-w-full min-w-0">{children}</div>
          <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-xs px-4 py-2.5 w-full flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Chamoli Relocation Protocol</span>
              <span className="text-slate-300">•</span>
              <span>© 2026 NDMA &amp; Govt of Uttarakhand</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <span className="material-symbols-outlined text-[15px] text-[#d9531e]">code</span>
              <span>
                Made by <strong className="font-bold text-[#003366]">KyuNahiHoRahiCoding</strong> for <strong className="font-bold text-[#d9531e]">SIH</strong>
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* PWA Install Instructions Modal */}
      <PWAInstallModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        isIOS={isIOS}
      />

      {/* Floating 24/7 AI Chatbot Companion */}
      <FloatingAIChatbot />

      {/* First-Time & On-Demand Interactive Website Walkthrough */}
      <WebsiteWalkthrough />
    </div>
  );
};
