import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [username, setUsername] = useState('ias-uk-sharma');
  const [password, setPassword] = useState('GovChamoli#2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login();
      setIsLoading(false);
      navigate('/');
    }, 400);
  };

  return (
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen flex flex-col font-sans">
      {/* Tier 1 National Sovereignty Bar */}
      <header className="h-8 bg-[#002244] text-white px-4 sm:px-8 flex items-center justify-between text-xs select-none z-20 flex-shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#d9531e] px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase text-white shadow-2xs">
            GOVT OF INDIA
          </span>
          <span className="text-slate-200 text-[11px] hidden sm:inline">
            National Disaster Management Authority (NDMA) • Govt of Uttarakhand
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-amber-300 font-mono text-[10px] hidden md:inline">EOC CHAMOLI NODE-04</span>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="hover:text-white cursor-pointer">English</span>
            <span className="text-slate-500">|</span>
            <span className="hover:text-white cursor-pointer">हिन्दी</span>
          </div>
        </div>
      </header>

      {/* Tricolor Stripe */}
      <div className="tricolor-stripe"></div>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
          <div className="flex flex-col lg:flex-row w-full">
            {/* LEFT COLUMN: VISTHAAPAN Identity & GIS Intelligence */}
            <div className="w-full lg:w-7/12 p-6 sm:p-8 bg-[#f8fafc] border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/branding/logo.jpeg"
                    alt="VISTHAAPAN Official Emblem"
                    className="w-14 h-14 rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#003366]">
                        VISTHAAPAN
                      </h1>
                      <span className="text-[10px] bg-blue-50 text-[#003366] border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">
                        GOV PORTAL
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      DDMA Chamoli Incident Command &amp; Relocation Network
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] font-mono font-bold uppercase text-[#d9531e] tracking-wider">
                    Official Sovereign Mandate
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5 font-medium leading-relaxed">
                    Mixed-Integer Linear Programming (MILP) solver and InSAR satellite subsidence radar for equitable, rapid, and verifiable Himalayan population relocation.
                  </p>
                </div>

                {/* Simulated GIS Spatial Telemetry Card (UX4G Clean Cartographic Standard) */}
                <div className="mt-5 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5 text-[#003366]">
                      <span className="material-symbols-outlined text-[16px]">layers</span>
                      <span className="uppercase tracking-wide text-[11px] font-mono font-bold">Chamoli Active Sector 4-B</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 font-mono text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> IN-SYNC
                      </span>
                    </div>
                  </div>

                  {/* Clean Cartographic Preview Frame */}
                  <div className="relative w-full h-44 bg-[#f8fafc] overflow-hidden flex flex-col justify-between p-4 border-b border-slate-200">
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 rounded text-[10.5px] font-bold font-mono">
                        SUBSIDENCE: -18.2mm/mo
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10.5px] font-bold font-mono">
                        SAFE SITE ALPHA: READY
                      </span>
                    </div>

                    <div className="relative z-10 text-center">
                      <div className="text-xs font-bold text-slate-900">Joshimath-Helang Emergency Corridor</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">Coordinates: 30°33&apos;21&quot;N 79°33&apos;46&quot;E • Elevation: 2,180m MSL</div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <span>Target: <strong className="text-slate-900">21,040 Citizens</strong></span>
                      <span>Safe Cap: <strong className="text-emerald-700">19,500 Beds</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 text-center py-2 text-xs">
                    <div className="px-2">
                      <span className="block text-[9px] font-semibold text-slate-500 uppercase">Monitored</span>
                      <span className="font-bold text-slate-900 font-mono">28 Villages</span>
                    </div>
                    <div className="px-2">
                      <span className="block text-[9px] font-semibold text-slate-500 uppercase">Capacity Deficit</span>
                      <span className="font-bold text-[#d9531e] font-mono">5,090 Unmet</span>
                    </div>
                    <div className="px-2">
                      <span className="block text-[9px] font-semibold text-slate-500 uppercase">MILP Solver</span>
                      <span className="font-bold text-emerald-700 font-mono">Converged</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span> DDMA NODE READY
                </span>
                <span>NIC SSL 256-BIT SECURED</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Officer Login Form */}
            <div className="w-full lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">OFFICIAL AUTHENTICATION</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">v2.4</span>
                </div>
                <h2 className="text-xl font-bold text-[#003366] mt-2">Government Officer Login</h2>
                <p className="text-xs text-slate-500 mt-1">Authorized personnel only. Access subject to statutory audit log under NDMA Act 2005.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Username / Employee ID
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. IAS-UK-2012-0941"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                      </span>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] focus:border-[#003366] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#003366] focus:ring-[#003366]"
                      />
                      <span>Remember Officer Session</span>
                    </label>
                    <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact the State Disaster Center IT cell for password reset.'); }} className="text-[#003366] hover:underline font-medium">
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded shadow transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <span>ENTER EMERGENCY OPERATIONS PORTAL</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Pre-fill Demo Hint */}
                <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                  <div className="font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    DEMO CREDENTIALS LOADED
                  </div>
                  <p className="mt-0.5 text-amber-800">
                    Logged in as <strong>Shri R. K. Sharma, IAS</strong> (Incident Commander & DM Chamoli). Click submit to proceed immediately.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
                <span>New Disaster Officer? </span>
                <Link to="/signup" className="text-[#D9531E] font-bold hover:underline">
                  Submit Official Registration Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
