import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { BriefingService, type ChatMessage } from '../../services/briefing.service';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { useLanguage } from '../../i18n';

export const HomeAIChatbot: React.FC = () => {
  const { currentLanguage, t } = useLanguage();
  const {
    habitations,
    sites,
    allocationSummary,
    activePlanId,
    scenario,
    roadR12Blocked,
  } = useAppStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: t(
        'sahayak.welcome',
        `Namaste! I am **VISTHAAPAN Sahayak**, your AI Disaster Operations Assistant powered by Groq (openai/gpt-oss-20b).\n\nI can explain our Operations Research (OR) evacuation algorithms, live satellite telemetry in Chamoli District, or guide you through the 5 operational workspaces. How can I assist you today?`
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'What is VISTHAAPAN and how does it work?',
    'How does the OR mathematical relocation engine work?',
    'What happens when Road R12 is blocked?',
    'What are the audited safe relocation hubs in Chamoli?',
  ];

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Only scroll inner container when there are multiple messages or user sends a query
    if (messages.length > 1 || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const planningContext = {
      activePlanId,
      totalTargetPopulation: allocationSummary?.totalTargetPopulation || 12250,
      totalAllocatedPopulation: allocationSummary?.totalAllocatedPopulation || 12250,
      unmetDemandTotal: allocationSummary?.unmetDemandTotal || 0,
      activeScenario: scenario?.isScenarioActive ? scenario.scenarioName : 'Nominal Baseline',
      roadR12Blocked: !!roadR12Blocked,
      monitoredHabitations: habitations.map((h) => ({
        name: h.name,
        priority: h.priority,
        population: h.population,
      })),
      safeShelters: sites.map((s) => ({
        name: s.name,
        effectiveCapacity: s.resourceCapacity?.effectiveCapacity,
        bottleneck: s.resourceCapacity?.bottleneck,
      })),
    };

    try {
      const response = await BriefingService.callAssistant(
        messages,
        messageText,
        currentLanguage,
        planningContext
      );
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: `### 🛡️ VISTHAAPAN System Intelligence\n\nI am actively monitoring the **Chamoli Disaster Relocation Operation** (12,250 at-risk residents across Joshimath, Raini, Tapovan, Helang, and Pandukeshwar).\n\nYou can launch the **Operations Dashboard** to view live evacuation rosters, audit shelter capacities, or review the deterministic OR relocation plan.\n\n*Powered by Groq Cloud (openai/gpt-oss-20b).*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      id="tour-home-ai-chat"
      data-tour="home-ai-chat"
      className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[560px] max-w-4xl mx-auto font-sans"
    >
      {/* ── CHATBOT HEADER ── */}
      <div className="bg-[#002244] text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 border-b border-[#003366]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-[#003366] flex items-center justify-center text-white shadow-xs">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide">{t('sahayak.title', 'VISTHAAPAN Sahayak')}</h3>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('sahayak.statusReady', 'Groq GPT-OSS-20B')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {t('sahayak.subtitle', 'Conversational Disaster Relocation Intelligence • Groq Cloud AI Assistant')}
            </p>
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-1 rounded hidden sm:block">
          District Chamoli Operations
        </div>
      </div>

      {/* ── SUGGESTION CHIPS ── */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto horizontal-scroll-tabs shrink-0">
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0 mr-1">
          Suggestions:
        </span>
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={isTyping}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-full border border-slate-200 text-[11px] font-medium transition shrink-0 shadow-2xs whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ── CHAT MESSAGES AREA ── */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#003366] text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-1">
                <span className="material-symbols-outlined text-[15px]">psychology</span>
              </div>
            )}

            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-[#003366] text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
              ) : (
                <MarkdownRenderer content={msg.text} />
              )}
              <div
                className={`text-[9px] mt-1.5 font-mono text-right ${
                  msg.role === 'user' ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-1">
                <span className="material-symbols-outlined text-[15px]">person</span>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-[#003366] text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-1">
              <span className="material-symbols-outlined text-[15px]">psychology</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-[#003366] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#003366] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#003366] animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-[11px]">{t('sahayak.thinking', 'Sahayak AI thinking...')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CHAT INPUT ── */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('sahayak.placeholder', 'Ask anything about VISTHAAPAN, Chamoli evacuations, or OR models...')}
            disabled={isTyping}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366] outline-none transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="h-10 px-4 bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
