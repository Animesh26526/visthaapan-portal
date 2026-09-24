import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

export const OfficerReview: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    recordOfficerDecision,
    allocationSummary,
    activePlanId,
    sites,
  } = useAppStore();


  const [selectedAction, setSelectedAction] = useState<'ACCEPTED' | 'MODIFIED' | 'REJECTED'>('ACCEPTED');
  const [rationale, setRationale] = useState(
    'All algorithmic constraints verified against ground survey reports from Sub-Divisional Magistrate Joshimath. Approved immediate mobilization of NDRF 8th Bn and SDRF convoys under Section 30(2)(v) and Section 34 of Disaster Management Act 2005.'
  );
  const [statutoryChecked, setStatutoryChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Web Speech API Text-to-Speech State
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const situationBriefText = `Attention District Emergency Operations Center Chamoli. This is the automated AI Situation Brief for Operational Plan ${activePlanId}. Priority wards in Joshimath and Raini remain under active surveillance due to measured ground deformation and IMD precipitation advisories. Total target relocation demand stands at ${formatPopulation(
    allocationSummary.totalTargetPopulation
  )} citizens across high-risk habitations. Deterministic Mixed-Integer Linear Programming has assigned evacuees across safe hubs in Gauchar, Karnaprayag, and Rudraprayag, with Pipalkoti transit hub excluded due to slope hazard. NH-07 Rishikesh-Badrinath highway is open with single-lane monitoring at Helang. All resource feasibility constraints are satisfied with zero deficit. Section 30 and 34 statutory authorizations are awaiting District Magistrate digital review.`;

  // Speech synthesis cleanup
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayBrief = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(situationBriefText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding an Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const inVoice = voices.find(
      (v) => v.lang.includes('en-IN') || v.lang.includes('hi-IN') || v.name.includes('India')
    );
    if (inVoice) {
      utterance.voice = inVoice;
    }

    utterance.onend = () => setTtsState('idle');
    utterance.onerror = () => setTtsState('idle');

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setTtsState('playing');
  };

  const handlePauseBrief = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  };

  const handleStopBrief = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsState('idle');
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statutoryChecked) {
      alert('Please check the statutory declaration checkbox before signing the official record.');
      return;
    }
    if (!rationale.trim()) {
      alert('A detailed operational rationale is mandatory for all officer adjudications.');
      return;
    }

    if (selectedAction === 'MODIFIED') {
      navigate('/scenario/planner');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordOfficerDecision(selectedAction, rationale.trim());
      setIsSubmitting(false);
      navigate('/decisions/audit');
    } catch (err: any) {
      setIsSubmitting(false);
      alert(`Failed to record decision: ${err?.message || 'Server error'}`);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* ── 1. TOP HEADER & STATUTORY CHIP ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#003366] text-white text-[10px] font-bold uppercase font-mono tracking-wider">
              Statutory Adjudication Gate: Human-in-the-Loop
            </span>
            <span className="text-xs text-slate-500 font-mono">
              NDMA DM-ACT-2005 COMPLIANCE
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
              PLAN VERSION {activePlanId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] mt-1 tracking-tight">
            Officer Review: Statutory Command Adjudication
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mt-0.5">
            Algorithmic recommendations provide mathematical decision-support. Final legal and executive
            authorization rests exclusively with the designated District Magistrate &amp; Incident Commander.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/decisions/previous-plans')}
            className="gov-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            title="Compare with archived plans"
          >
            <span className="material-symbols-outlined text-[16px]">compare</span>
            <span>Plan Comparison</span>
          </button>
        </div>
      </div>

      {/* ── 2. OFFICER IDENTIFICATION CARD ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#003366] text-amber-400 border-2 border-amber-400 flex items-center justify-center font-bold text-base shadow shrink-0">
            DM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{currentUser?.name || 'Shri R. K. Sharma, IAS'}</span>
              <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                STATUTORY INCIDENT COMMANDER
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {currentUser?.designation} • {currentUser?.department} • Emp ID: {currentUser?.employeeId}
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-slate-600 space-y-0.5">
          <div>STATUTORY AUTHORITY: <strong className="text-slate-800">Sec. 30 &amp; 34 DM Act 2005</strong></div>
          <div>JURISDICTION: <strong className="text-slate-800">District Chamoli, Uttarakhand</strong></div>
        </div>
      </div>

      {/* ── 3. AI SITUATION BRIEF WITH SPEECH SYNTHESIS (TTS) ── */}
      <div className="bg-gradient-to-r from-blue-900 to-[#002244] text-white rounded-lg p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                AI OPERATIONAL SITUATION BRIEF
              </h3>
              <p className="text-xs text-slate-300">
                Generated from active planning state • Web Speech API Text-to-Speech
              </p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            {ttsState === 'playing' ? (
              <button
                onClick={handlePauseBrief}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs flex items-center gap-1 shadow-xs transition"
              >
                <span className="material-symbols-outlined text-[16px]">pause</span>
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handlePlayBrief}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs flex items-center gap-1 shadow-xs transition"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>{ttsState === 'paused' ? 'Resume Brief' : 'Listen Audio Brief'}</span>
              </button>
            )}

            {ttsState !== 'idle' && (
              <button
                onClick={handleStopBrief}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded text-xs flex items-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-[16px]">stop</span>
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Audio Waveform State Indicator */}
        {ttsState === 'playing' && (
          <div className="flex items-center gap-2 py-1 px-3 bg-white/10 rounded text-xs text-emerald-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>VOICE PLAYBACK ACTIVE (WEB SPEECH TTS)</span>
          </div>
        )}

        <div className="text-xs text-slate-200 leading-relaxed font-sans bg-black/20 p-3 rounded border border-white/10">
          "{situationBriefText}"
        </div>
      </div>

      {/* ── 4. ADJUDICATION FORM ── */}
      <form onSubmit={handleSubmitDecision} className="bg-white border border-slate-200 rounded-lg shadow-xs p-5 space-y-5">
        <div>
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-2 font-mono">
            1. Executive Determination Selection
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
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
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">check_circle</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-normal">
                Endorse algorithmic linear programming dispatch matrix as authoritative. Issue immediate mobilization orders to NDRF/SDRF under Section 34 DMA 2005.
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
                <span className="font-bold text-sm text-amber-900">MODIFY IN SCENARIO LAB</span>
                <span className="material-symbols-outlined text-amber-600 text-[24px]">tune</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-normal">
                Inject manual field overrides, road corridor closures, or shelter capacity adjustments before re-optimizing with Google OR-Tools.
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
                <span className="material-symbols-outlined text-red-600 text-[24px]">cancel</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-normal">
                Remand plan back to the Incident Management Team with statutory directions and ground safety objections.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Summary Preview */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
          <div className="text-slate-500 uppercase font-bold text-[10px]">
            ACTIVE OPERATIONAL PLAN UNDER ADJUDICATION:
          </div>
          <div className="text-slate-900 font-bold flex flex-wrap items-center gap-3">
            <span>Plan ID: {activePlanId}</span>
            <span>•</span>
            <span>Evacuees: {formatPopulation(allocationSummary?.totalAllocatedPopulation)}</span>
            <span>•</span>
            <span>Deficit: {formatPopulation(allocationSummary?.unmetDemandTotal)}</span>
            <span>•</span>
            <span>Shelters Active: {sites.filter(s => s.resourceCapacity.effectiveCapacity > 0).length}</span>
          </div>
        </div>

        {/* Mandatory Rationale Input */}
        <div>
          <label className="block text-xs font-bold text-[#003366] uppercase tracking-wider mb-1 font-mono">
            2. Mandatory Administrative &amp; Ground Rationale
          </label>
          <p className="text-[11px] text-slate-500 mb-2">
            This justification is archived in the Statutory Decision History Ledger for audit review and executive scrutiny.
          </p>
          <textarea
            rows={4}
            required
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Enter administrative reasons, road inspection results, or tactical orders..."
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
            I hereby certify that I have exercised due executive oversight in accordance with powers vested under
            Section 30 and Section 34 of the Disaster Management Act 2005. This digital signature commits district
            emergency assets and operational dispatch orders.
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setRationale('');
              setStatutoryChecked(false);
            }}
            className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded shadow-sm transition flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-300">draw</span>
            <span>
              {selectedAction === 'MODIFIED'
                ? 'Proceed to Scenario Planner'
                : isSubmitting
                ? 'Recording Order...'
                : 'Sign & Record Executive Order in Audit Ledger'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
