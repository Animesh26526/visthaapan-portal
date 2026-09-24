import React from 'react';
import { AnnouncementTicker } from './AnnouncementTicker';
import { TopNavbar } from './TopNavbar';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../pwa/PWAInstallModal';
import { FloatingAIChatbot } from '../ai/FloatingAIChatbot';
import { WebsiteWalkthrough } from '../walkthrough/WebsiteWalkthrough';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { isIOS, showInstructionsModal, setShowInstructionsModal } = usePWAInstall();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans w-full max-w-full overflow-x-hidden">
      {/* ── 1. SINGLE-LINE CONTINUOUS ANNOUNCEMENT TICKER ── */}
      <AnnouncementTicker />

      {/* ── 2. INDIAN GOV DIGITAL PORTAL TOP NAVBAR WITH DIRECT DROPDOWNS ── */}
      <TopNavbar />

      {/* ── 3. MAIN FULL-WIDTH WORKSPACE CONTENT ── */}
      <main className="flex-1 w-full max-w-full min-w-0 bg-[#f8fafc] flex flex-col overflow-x-hidden">
        <div className="flex-1 w-full max-w-full min-w-0">{children}</div>

        {/* ── 4. OFFICIAL GOVERNMENT FOOTER ── */}
        <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-xs px-4 py-3 w-full flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs mt-auto">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-bold text-slate-700">VISTHAAPAN v2.6-CHM</span>
            <span className="text-slate-300">•</span>
            <span>National Disaster Management Authority (NDMA)</span>
            <span className="text-slate-300">•</span>
            <span>District Disaster Management Authority Chamoli, Uttarakhand</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>Plan: <strong>#VST-2026-CHM-014</strong></span>
            <span className="text-slate-300">•</span>
            <span>SCIP MILP 0-Gap</span>
          </div>
        </footer>
      </main>

      {/* PWA Install Instructions Modal */}
      <PWAInstallModal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        isIOS={isIOS}
      />

      {/* Floating 24/7 AI Chatbot Companion */}
      <FloatingAIChatbot />

      {/* Interactive Website Walkthrough */}
      <WebsiteWalkthrough />
    </div>
  );
};
