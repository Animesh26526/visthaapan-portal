import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';
import { useLanguage } from '../i18n';
import { speechTextNormalizer, getPreferredVoice, splitIntoSentenceChunks } from '../utils/speechNormalizer';
import { BriefingService, generateDeterministicBriefing, type VillageContext } from '../services/briefing.service';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';

export const OfficerReview: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage, t } = useLanguage();
  const {
    currentUser,
    recordOfficerDecision,
    allocationSummary,
    activePlanId,
    sites,
    roadR12Blocked,
  } = useAppStore();

  const [selectedAction, setSelectedAction] = useState<'ACCEPTED' | 'MODIFIED' | 'REJECTED'>('ACCEPTED');
  const [rationale, setRationale] = useState(
    'All algorithmic constraints verified against ground survey reports from Sub-Divisional Magistrate Joshimath. Approved immediate mobilization of NDRF 8th Bn and SDRF convoys in accordance with district operational relocation protocols.'
  );
  const [statutoryChecked, setStatutoryChecked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Web Speech API Text-to-Speech & Localized Brief State
  const [ttsState, setTtsState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [briefText, setBriefText] = useState<string>('');
  const [isLoadingBrief, setIsLoadingBrief] = useState<boolean>(false);
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const chunksRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  const villageContext: VillageContext = {
    id: 'HAB-001',
    name: 'Joshimath Wards 4-7',
    code: 'JSM-04',
    population: allocationSummary?.totalTargetPopulation || 12250,
    priority: 'Immediate',
    riskScore: 0.94,
    vulnerabilityScore: 0.89,
    slopeDegrees: 34.2,
    primaryHazard: 'Subsidence & Moraine Slump',
    roadR12Blocked: !!roadR12Blocked,
  };

  const localizedFallbackBrief = generateDeterministicBriefing(villageContext, 'dossier', currentLanguage);

  // Fetch or regenerate the localized situation brief whenever language, plan, or road status changes
  useEffect(() => {
    let isCancelled = false;
    // Immediately set localized brief for snappy instant transition when language changes
    setBriefText(localizedFallbackBrief);

    const fetchBrief = async () => {
      setIsLoadingBrief(true);
      try {
        const brief = await BriefingService.generateCommandBrief(
          villageContext,
          'dossier',
          `Plan ${activePlanId} with ${allocationSummary?.totalTargetPopulation || 12250} evacuees across Chamoli sector.`,
          currentLanguage
        );
        if (!isCancelled && brief) {
          setBriefText(brief);
        }
      } catch {
        if (!isCancelled) {
          setBriefText(localizedFallbackBrief);
        }
      } finally {
        if (!isCancelled) setIsLoadingBrief(false);
      }
    };

    fetchBrief();
    return () => {
      isCancelled = true;
    };
  }, [currentLanguage, activePlanId, allocationSummary?.totalTargetPopulation, roadR12Blocked]);

  // Speech synthesis voice loader & cleanup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      window.speechSynthesis.getVoices();
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        isPlayingRef.current = false;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playChunk = (index: number, voiceResult: ReturnType<typeof getPreferredVoice>) => {
    if (!isPlayingRef.current) return;
    if (index >= chunksRef.current.length) {
      isPlayingRef.current = false;
      setTtsState('idle');
      return;
    }

    const chunkText = chunksRef.current[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    if (voiceResult.voice) {
      utterance.voice = voiceResult.voice;
    }
    utterance.lang = voiceResult.langCode;

    // Retain global reference to avoid Chromium garbage collection dropping audio mid-playback
    (window as any).__currentUtterance = utterance;
    speechUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      chunkIndexRef.current = index + 1;
      playChunk(index + 1, voiceResult);
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback chunk error, advancing to next sentence:', e);
      if (!isPlayingRef.current) return;
      chunkIndexRef.current = index + 1;
      playChunk(index + 1, voiceResult);
    };

    window.speechSynthesis.speak(utterance);
  };

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

    // Prepare and normalize spoken text: strip document metadata headers & format spoken units
    const textToSpeak = briefText || localizedFallbackBrief;
    const spokenContent = speechTextNormalizer(textToSpeak, currentLanguage);
    const chunks = splitIntoSentenceChunks(spokenContent, currentLanguage);

    if (chunks.length === 0) {
      return;
    }

    // Detect and assign preferred voice for currentLanguage
    const voiceResult = getPreferredVoice(currentLanguage);
    if (!voiceResult.isNative && currentLanguage !== 'en') {
      setVoiceWarning('Speech voice unavailable for this language on this device.');
      setTtsState('idle');
      return;
    }

    setVoiceWarning(null);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    isPlayingRef.current = true;
    setTtsState('playing');

    playChunk(0, voiceResult);
  };

  const handlePauseBrief = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && ttsState === 'playing') {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  };

  const handleStopBrief = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      isPlayingRef.current = false;
      chunksRef.current = [];
      chunkIndexRef.current = 0;
      window.speechSynthesis.cancel();
      setTtsState('idle');
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statutoryChecked) {
      alert('Please check the confirmation checkbox before recording the decision.');
      return;
    }
    if (!rationale.trim()) {
      alert('A detailed operational rationale is mandatory for all officer determinations.');
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
              Planning Review: Human-in-the-Loop
            </span>
            <span className="text-xs text-slate-500 font-mono">
              OPERATIONAL DECISION AUDIT
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
              PLAN VERSION {activePlanId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] mt-1 tracking-tight">
            Officer Review &amp; Planning Decision
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mt-0.5">
            Algorithmic recommendations provide mathematical decision-support. Final planning and operational
            review rests with designated emergency response officers.
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
      <div
        id="tour-review-authority"
        data-tour="review-authority"
        className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#003366] text-amber-400 border-2 border-amber-400 flex items-center justify-center font-bold text-base shadow shrink-0">
            DM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{currentUser?.name || 'Shri R. K. Sharma, IAS'}</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
                INCIDENT COMMANDER REVIEW
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {currentUser?.designation} • {currentUser?.department} • Emp ID: {currentUser?.employeeId}
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono text-slate-600 space-y-0.5">
          <div>OPERATIONAL ROLE: <strong className="text-slate-800">Incident Commander</strong></div>
          <div>JURISDICTION: <strong className="text-slate-800">District Chamoli, Uttarakhand</strong></div>
        </div>
      </div>

      {/* ── 3. AI SITUATION BRIEF WITH SPEECH SYNTHESIS (TTS) ── */}
      <div
        id="tour-review-brief"
        data-tour="review-brief"
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-[#003366]">
              <span className="material-symbols-outlined text-[22px]">record_voice_over</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#003366] tracking-wide uppercase font-mono">
                {t('decisions.briefTitle', 'AI OPERATIONAL SITUATION BRIEF')}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                {t('sahayak.subtitle', 'Disaster Operations Assistant • Groq (openai/gpt-oss-20b)')}
              </p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            {ttsState === 'playing' ? (
              <button
                onClick={handlePauseBrief}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">pause</span>
                <span>{t('btnPause', 'Pause')}</span>
              </button>
            ) : (
              <button
                onClick={handlePlayBrief}
                className="px-4 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>{ttsState === 'paused' ? t('btnResume', 'Resume Brief') : t('btnListenBrief', 'Listen Audio Brief')}</span>
              </button>
            )}

            {ttsState !== 'idle' && (
              <button
                onClick={handleStopBrief}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer border border-red-200"
              >
                <span className="material-symbols-outlined text-[16px]">stop</span>
                <span>{t('btnStop', 'Stop')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Runtime Voice Fallback Warning Banner */}
        {voiceWarning && (
          <div className="flex items-center gap-2 py-2 px-3.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-sans">
            <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">info</span>
            <span>{t('decisions.voiceUnavailable', voiceWarning)}</span>
          </div>
        )}

        {/* Audio Waveform State Indicator */}
        {ttsState === 'playing' && (
          <div className="flex items-center gap-2 py-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            <span>{t('decisions.speechActive', 'VOICE PLAYBACK ACTIVE (WEB SPEECH TTS)')}</span>
          </div>
        )}

        {/* Briefing Narrative Display (Crisp Light Surface for High Contrast) */}
        <div className="text-xs sm:text-sm text-slate-900 leading-relaxed font-sans bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
          {isLoadingBrief ? (
            <div className="flex items-center gap-2.5 text-slate-500 font-mono py-4 justify-center">
              <span className="w-4 h-4 rounded-full border-2 border-[#003366] border-t-transparent animate-spin"></span>
              <span>{t('sahayak.thinking', 'Generating operational situation brief...')} ({currentLanguage.toUpperCase()})</span>
            </div>
          ) : (
            <div className="text-slate-900">
              <MarkdownRenderer content={briefText || localizedFallbackBrief} />
            </div>
          )}
        </div>
      </div>

      {/* ── 4. OPERATIONAL DECISION FORM ── */}
      <form
        id="tour-review-actions"
        data-tour="review-actions"
        onSubmit={handleSubmitDecision}
        className="bg-white border border-slate-200 rounded-lg shadow-xs p-5 space-y-5"
      >
        <div>
          <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-2 font-mono">
            1. Operational Decision Selection
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
                <span className="font-bold text-sm text-emerald-900">{t('decisions.actionAccept', 'ACCEPT PLAN')}</span>
                <span className="material-symbols-outlined text-emerald-600 text-[24px]">check_circle</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-normal">
                Endorse Operations Research dispatch matrix as operational baseline. Direct immediate mobilization of emergency response teams.
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
                <span className="font-bold text-sm text-amber-900">{t('decisions.actionModify', 'MODIFY IN SCENARIO LAB')}</span>
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
                <span className="font-bold text-sm text-red-900">{t('decisions.actionReject', 'REJECT PLAN')}</span>
                <span className="material-symbols-outlined text-red-600 text-[24px]">cancel</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 leading-normal">
                Remand plan back to the planning team with ground observations and requested adjustments.
              </p>
            </div>
          </div>
        </div>

        {/* Plan Summary Preview */}
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
          <div className="text-slate-500 uppercase font-bold text-[10px]">
            ACTIVE OPERATIONAL PLAN UNDER REVIEW:
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
            This justification is archived in the Decision History &amp; Audit Ledger for review and operational transparency.
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

        {/* Officer Review Confirmation Checkbox */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={statutoryChecked}
            onChange={(e) => setStatutoryChecked(e.target.checked)}
            className="mt-0.5 rounded text-[#003366]"
          />
          <span>
            I hereby confirm that I have reviewed the allocation recommendations, resource constraints, and route
            conditions. Recording this action logs a verified administrative entry in the operational decision ledger.
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
                : 'Record Operational Decision in Audit Ledger'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
