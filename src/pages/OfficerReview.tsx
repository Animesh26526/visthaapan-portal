import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export const OfficerReview: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, recordOfficerDecision, isReoptimized, allocationSummary } = useAppStore();

  const [selectedAction, setSelectedAction] = useState<'ACCEPTED' | 'MODIFIED' | 'REJECTED'>('ACCEPTED');
  const [rationale, setRationale] = useState(
    'All algorithmic constraints verified against ground survey reports from Sub-Divisional Magistrate Joshimath. Approved immediate mobilization of NDRF 8th Bn and SDRF convoys under Section 30(2)(v) Disaster Management Act 2005.'
  );
  const [statutoryChecked, setStatutoryChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statutoryChecked) {
      alert('Please check the statutory declaration checkbox before signing the official record.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      recordOfficerDecision(selectedAction, rationale);
      setIsSubmitting(false);
      navigate('/adjudication?tab=audit');
    }, 400);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#003366] text-white text-[10px] font-bold uppercase font-mono">
              Statutory Adjudication Gate: Human-in-the-Loop Verification
            </span>
            <span className="text-xs text-slate-500 font-mono">NDMA DM-ACT-2005 COMPLIANCE</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Officer Review: Statutory Command Adjudication
          </h1>
          <p className="text-xs text-slate-600">
            VISTHAAPAN provides algorithmic decision-support. Final legal and executive authorization rests exclusively with the designated Government Officer.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Statutory Authority Active</span>
        </div>
      </div>

      {/* 2. OFFICER IDENTIFICATION CHIP */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#003366] text-amber-400 border-2 border-amber-400 flex items-center justify-center font-bold text-base shadow">
            DM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{currentUser?.name || 'Shri R. K. Sharma, IAS'}</span>
              <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                INCIDENT COMMANDER ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              {currentUser?.designation} • {currentUser?.department} • ID: {currentUser?.employeeId}
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-slate-500">
          <div>STATUTORY AUTHORITY: <strong>Sec. 30 &amp; 34 DM Act</strong></div>
          <div>JURISDICTION: <strong>District Chamoli, Uttarakhand</strong></div>
        </div>
      </div>

      {/* 3. ADJUDICATION FORM */}
      <form onSubmit={handleSubmitDecision} className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-2">
            1. Executive Decision Determination
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Option ACCEPT */}
            <div
              onClick={() => setSelectedAction('ACCEPTED')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition flex flex-col justify-between ${
                selectedAction === 'ACCEPTED'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-900">ACCEPT PLAN</span>
                <span className="material-symbols-outlined text-emerald-600 text-[22px]">check_circle</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Fully endorse algorithmic Linear Program dispatch matrix. Issue immediate mobilization orders to NDRF/SDRF.
              </p>
            </div>

            {/* Option MODIFY */}
            <div
              onClick={() => setSelectedAction('MODIFIED')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition flex flex-col justify-between ${
                selectedAction === 'MODIFIED'
                  ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-amber-900">MODIFY PLAN</span>
                <span className="material-symbols-outlined text-amber-600 text-[22px]">edit_note</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Override specific shelter assignments, routes, or capacities based on unmodeled ground reports.
              </p>
            </div>

            {/* Option REJECT */}
            <div
              onClick={() => setSelectedAction('REJECTED')}
              className={`p-4 rounded-lg border-2 cursor-pointer transition flex flex-col justify-between ${
                selectedAction === 'REJECTED'
                  ? 'border-red-600 bg-red-50/70 ring-1 ring-red-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-red-900">REJECT PLAN</span>
                <span className="material-symbols-outlined text-red-600 text-[22px]">cancel</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                Remand plan back to Joint Operations Planning Committee with statutory directions.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Summary Preview */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono space-y-1">
          <div className="text-slate-500 uppercase font-bold text-[10px]">CURRENT PLAN UNDER ADJUDICATION:</div>
          <div className="text-slate-900 font-bold">
            Plan ID: {isReoptimized ? 'PLAN-REOPT-2026-CHM' : 'PLAN-BASE-2026-CHM'} • Relocated Souls: {allocationSummary.totalAllocatedPopulation.toLocaleString()} • Deficit: {allocationSummary.unmetDemandTotal.toLocaleString()}
          </div>
        </div>

        {/* Mandatory Rationale Input */}
        <div>
          <label className="block text-xs font-bold text-[#003366] uppercase tracking-wider mb-1">
            2. Mandatory Administrative &amp; Ground Rationale
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            This justification is legally archived in the NDMA Statutory Decision Ledger for post-incident judicial review and parliamentary scrutiny.
          </p>
          <textarea
            rows={4}
            required
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Enter specific administrative reasons, bridge inspection results, or local SDRF intelligence justifying this executive action..."
            className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none font-sans"
          />
        </div>

        {/* Statutory Legal Declaration Checkbox */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={statutoryChecked}
            onChange={(e) => setStatutoryChecked(e.target.checked)}
            className="mt-0.5 rounded text-[#003366]"
          />
          <span>
            I hereby certify that I have exercised due executive oversight in accordance with powers vested under Section 30 of the Disaster Management Act 2005. This digital signature commits district emergency assets and executive dispatch orders.
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setRationale(''); setStatutoryChecked(false); }}
            className="h-10 px-4 text-xs text-slate-600 hover:text-slate-800 font-medium"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 bg-[#003366] hover:bg-[#002244] text-white text-xs font-semibold rounded shadow-sm transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-300">draw</span>
            <span>
              {isSubmitting ? 'Recording Statutory Order...' : 'Sign & Record Executive Order in Audit Ledger'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
