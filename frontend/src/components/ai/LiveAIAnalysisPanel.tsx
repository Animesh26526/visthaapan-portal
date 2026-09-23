import React, { useState, useEffect } from 'react';
import {
  type VillageContext,
  BriefingService,
  getNearestSafeSites,
} from '../../services/briefing.service';
import { USE_MOCK_API } from '../../services/config';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { formatPercent } from '../../utils/formatters';

interface LiveAIAnalysisPanelProps {
  context: VillageContext;
}

export const LiveAIAnalysisPanel: React.FC<LiveAIAnalysisPanelProps> = ({ context }) => {
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<string>('dossier');
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const nearestSites = getNearestSafeSites(
    context.coordinates?.lat || 30.556,
    context.coordinates?.lng || 79.563,
    !!context.roadR12Blocked
  );

  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);
    BriefingService.generateCommandBrief(context, 'dossier')
      .then((brief) => {
        if (!isCancelled) {
          setAnalysisText(brief);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsGenerating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [context.id, context.roadR12Blocked]);

  const handleGenerate = async (topic: string, customQuery?: string) => {
    setActiveTopic(topic);
    setIsGenerating(true);
    setApiError(null);

    const query = customQuery || (
      topic === 'routing'
        ? 'Analyze emergency route alternatives and transportation delay for Road R12 blockage, citing nearest safe sites and capacities.'
        : topic === 'vulnerability'
        ? 'Deconstruct demographic immobility and specialized transit requirements for vulnerable groups, matching to nearest safe site facilities.'
        : 'Generate comprehensive multi-hazard executive evacuation advisory with nearest safe site routing.'
    );

    try {
      const result = await BriefingService.generateCommandBrief(context, topic, query);
      setAnalysisText(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Briefing generation failed';
      setApiError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden font-sans">
      {/* ── TOP BAR ── */}
      <div className="bg-[#002244] text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <span className="material-symbols-outlined text-[20px]">psychology</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-xs sm:text-sm tracking-wide">
                Live AI Tactical Briefing &amp; Recommendations
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                {USE_MOCK_API ? 'Tactical Scenario Engine (Deterministic)' : 'Central AI Service (Active)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Target: <strong className="text-white">{context.name}</strong> • Risk Level: {formatPercent(context?.riskScore ?? 0.9, 0)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="material-symbols-outlined text-[16px] text-indigo-400">verified</span>
          <span className="font-mono text-[11px]">NDMA Protocol §34</span>
        </div>
      </div>

      {/* ── NEAREST SAFE SITES TELEMETRY STRIP ── */}
      <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px] horizontal-scroll-tabs">
        <span className="text-slate-500 font-bold uppercase font-mono text-[10px] shrink-0">Nearest Hubs:</span>
        {nearestSites.map((site) => (
          <span
            key={site.id}
            className={`px-2 py-0.5 rounded font-mono text-[10px] shrink-0 flex items-center gap-1 ${
              site.isRecommended
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            <span>{site.name.split('(')[0]}</span>
            <strong className="text-slate-900">({site.distanceKm} km)</strong>
            {site.isRecommended && <span className="text-emerald-700 font-bold">★ Primary</span>}
          </span>
        ))}
      </div>

      {/* ── ERROR NOTICE IF LIVE API FAILED ── */}
      {apiError && (
        <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-700 text-[16px]">info</span>
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError(null)} className="text-amber-700 hover:text-amber-900 font-bold">✕</button>
        </div>
      )}

      {/* ── QUICK DIRECTIVE CHIPS ── */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs horizontal-scroll-tabs">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0 mr-1">Directives:</span>
        <button
          onClick={() => handleGenerate('dossier')}
          disabled={isGenerating}
          className={`h-7 px-2.5 rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            activeTopic === 'dossier'
              ? 'bg-[#003366] text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">assignment</span>
          <span>Full Tactical Dossier</span>
        </button>

        <button
          onClick={() => handleGenerate('routing')}
          disabled={isGenerating}
          className={`h-7 px-2.5 rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            activeTopic === 'routing'
              ? 'bg-[#003366] text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">alt_route</span>
          <span>Route Detour &amp; R12</span>
        </button>

        <button
          onClick={() => handleGenerate('vulnerability')}
          disabled={isGenerating}
          className={`h-7 px-2.5 rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            activeTopic === 'vulnerability'
              ? 'bg-[#003366] text-white shadow-2xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">groups</span>
          <span>Vulnerable Citizens</span>
        </button>
      </div>

      {/* ── BRIEFING CONTENT DISPLAY ── */}
      <div className="p-4 sm:p-5 relative min-h-[220px]">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-[#003366] border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs font-mono font-medium text-slate-600 animate-pulse">
              Generating multi-hazard tactical synthesis...
            </div>
            <p className="text-[11px] text-slate-400 text-center max-w-sm">
              Cross-referencing InSAR radar deformation with slope declivity ({context.slopeDegrees}°) and census registers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <MarkdownRenderer content={analysisText} />

            {/* Actions Bottom Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-mono">
                  {USE_MOCK_API ? 'Simulated Chamoli Command Telemetry' : 'Live Central Intelligence Backend'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-xs transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copied' : 'Copy Briefing'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CUSTOM INQUIRY BAR ── */}
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customPrompt.trim()) {
              handleGenerate('custom', customPrompt);
            }
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[16px]">chat</span>
            </span>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ask AI: e.g., 'What if rainfall increases by 50%?' or 'Recommend medical airlift'..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#003366] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !customPrompt.trim()}
            className="h-8 px-3 bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-[14px]">send</span>
            <span className="hidden xs:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
