import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [formData, setFormData] = useState({
    fullName: '',
    officialEmail: '',
    mobileNumber: '',
    department: 'Revenue & Disaster Management Dept',
    designation: 'Sub-Divisional Magistrate (SDM)',
    state: 'Uttarakhand',
    district: 'Chamoli',
    office: 'Joshimath Tehsil HQ',
    employeeId: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
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
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
          OFFICER ONBOARDING PORTAL • VERIFIED GOV.IN
        </div>
      </header>

      {/* Tricolor Stripe */}
      <div className="tricolor-stripe"></div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/branding/logo.jpeg"
                  alt="VISTHAAPAN"
                  className="w-14 h-14 rounded-lg object-contain bg-white p-1 border border-slate-200 shadow-2xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[#003366] text-[10px] font-bold tracking-wider uppercase font-mono">
                      FORM DM-01A
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Statutory Officer Enrolment</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#003366] mt-0.5">Create Government Officer Account</h1>
                  <p className="text-xs text-slate-600">Register as an accredited Incident Commander or Relocation Planning Officer under NDMA guidelines.</p>
                </div>
              </div>

              <Link to="/login" className="text-xs text-[#003366] font-semibold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Login</span>
              </Link>
            </div>

            {isSubmitted ? (
              <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[32px]">verified</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Registration Submitted For Verification</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your credentials have been routed to the State Disaster Management Authority (SDMA Dehradun) for employee identity verification and administrative clearance.
                </p>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-700">
                  Tracking Application Ref: <strong>UK-DDMA-2026-CHM-9912</strong>
                </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => navigate('/login')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-50 shadow-2xs"
                    >
                      Return to Officer Login
                    </button>
                    <button
                      onClick={() => {
                        login();
                        navigate('/');
                      }}
                      className="px-5 py-2 bg-[#003366] text-white text-xs font-bold rounded hover:bg-[#002244] shadow transition"
                    >
                      Proceed to Home Portal →
                    </button>
                  </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal & Official Identification */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Personal & Contact Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (as per Govt ID)</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Vikramaditya Singh"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email (.gov.in / .nic.in)</label>
                      <input
                        type="email"
                        required
                        value={formData.officialEmail}
                        onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                        placeholder="v.singh@uk.gov.in"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Administrative Jurisdiction */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Departmental Jurisdiction</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none bg-white"
                      >
                        <option>Revenue & Disaster Management Dept</option>
                        <option>National Disaster Response Force (NDRF)</option>
                        <option>State Disaster Response Force (SDRF)</option>
                        <option>District Administration / Collectorate</option>
                        <option>Public Works Department (PWD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Employee / Service ID</label>
                      <input
                        type="text"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="e.g. UK-PCS-2018-401"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State / UT</label>
                      <input
                        type="text"
                        readOnly
                        value={formData.state}
                        className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-600 rounded cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                      <input
                        type="text"
                        readOnly
                        value={formData.district}
                        className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-600 rounded cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Office / EOC Location</label>
                      <input
                        type="text"
                        required
                        value={formData.office}
                        onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Credentials */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Security Access Credentials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Username</label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="officer.vsingh"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-[#003366] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#003366] shrink-0 mt-0.5">gavel</span>
                  <span>
                    By registering, you declare under penalty of law that all provided credentials are accurate and represent an authorized civil servant or designated disaster emergency authority.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <Link to="/login" className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium">
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded shadow transition flex items-center gap-2"
                  >
                    <span>SUBMIT CREDENTIALS FOR VERIFICATION</span>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
