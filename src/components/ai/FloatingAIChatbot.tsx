import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { callGeminiChatBot, type ChatMessage } from '../../services/geminiService';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

export const FloatingAIChatbot: React.FC = () => {
  const {
    isChatbotOpen,
    toggleChatbot,
    setChatbotOpen,
    chatbotInitialPrompt,
    openChatbotWithPrompt,
  } = useAppStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `Namaste! I am **VISTHAAPAN Sahayak**, your AI Disaster Operations Assistant powered by **Gemini 3.5 Flash Lite**.\n\nI can explain our mathematical evacuation algorithms (MILP), live satellite telemetry in Chamoli District, or guide you through the 5 operational workspaces. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasPromptedHelp, setHasPromptedHelp] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestionChips = [
    'How does the MILP relocation engine work?',
    'What happens when Road R12 is blocked?',
    'What are the 3 safe relocation hubs in Chamoli?',
    'Guide me through the 5 workspaces',
  ];

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isChatbotOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    }
  }, [isChatbotOpen]);

  useEffect(() => {
    if (messages.length > 1 || isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  // Handle initial prompt passed from outside (e.g. from Walkthrough or buttons)
  useEffect(() => {
    if (chatbotInitialPrompt) {
      handleSendMessage(chatbotInitialPrompt);
      openChatbotWithPrompt(''); // clear after sending
    }
  }, [chatbotInitialPrompt]);

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

    try {
      const response = await callGeminiChatBot(messages, messageText);
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
        text: `### 🛡️ VISTHAAPAN System Intelligence\n\nI am actively monitoring the **Chamoli Disaster Relocation Operation** (19,500 at-risk residents across Malari, Helang, Raini, and Joshimath).\n\nYou can launch the **Operations Dashboard** to view live evacuation rosters, audit shelter capacities, or trigger MILP re-optimization.\n\n*Crafted with precision for SIH by **KyuNahiHoRahiCoding**.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: `Namaste! I am **VISTHAAPAN Sahayak**, your AI Disaster Operations Assistant powered by **Gemini 3.5 Flash Lite**.\n\nI can explain our mathematical evacuation algorithms (MILP), live satellite telemetry in Chamoli District, or guide you through the 5 operational workspaces. How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON (When Minimized) ── */}
      {!isChatbotOpen && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[85] flex flex-col items-end gap-2 group">
          {/* Subtle invitation callout pill */}
          {hasPromptedHelp && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white text-slate-800 px-3 py-1.5 rounded-full shadow-lg border border-slate-200 text-xs font-semibold animate-bounce">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Need help? Ask <strong>Sahayak AI</strong></span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHasPromptedHelp(false);
                }}
                className="text-slate-400 hover:text-slate-600 ml-1"
                aria-label="Dismiss hint"
              >
                ×
              </button>
            </div>
          )}

          {/* Floating Action Button */}
          <button
            id="tour-floating-ai"
            onClick={toggleChatbot}
            className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#002244] via-[#003366] to-[#0b457f] hover:from-[#001830] hover:to-[#002244] text-white rounded-full shadow-2xl border-2 border-white/80 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Open VISTHAAPAN Sahayak AI Chatbot"
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#002244] rounded-full"></span>
            </div>
            <div className="text-left hidden xs:block">
              <div className="text-xs font-bold leading-none tracking-wide">Sahayak AI</div>
              <div className="text-[10px] text-emerald-300 font-mono leading-none mt-0.5">Gemini 3.5</div>
            </div>
          </button>
        </div>
      )}

      {/* ── EXPANDED FLOATING CHAT WINDOW ── */}
      {isChatbotOpen && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[95] w-[calc(100vw-32px)] sm:w-[410px] max-w-[430px] h-[580px] max-h-[calc(100vh-80px)] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 font-sans"
          role="dialog"
          aria-labelledby="chatbot-heading"
        >
          {/* Tricolor Stripe Accent */}
          <div className="h-1 bg-gradient-to-r from-[#d9531e] via-[#ffffff] to-[#1b7837] w-full shrink-0" />

          {/* Header */}
          <div className="bg-[#002244] text-white p-3 sm:p-3.5 flex items-center justify-between shrink-0 border-b border-[#003366]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-[#003366] flex items-center justify-center text-white shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[19px]">smart_toy</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 id="chatbot-heading" className="font-bold text-xs sm:text-sm tracking-wide truncate">
                    VISTHAAPAN Sahayak
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Gemini 3.5
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate">
                  Disaster Ops Assistant • District Chamoli
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleResetChat}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition"
                title="Reset conversation"
                aria-label="Reset conversation"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
              <button
                onClick={() => setChatbotOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition"
                title="Minimize chatbot"
                aria-label="Minimize chatbot"
              >
                <span className="material-symbols-outlined text-[20px]">expand_more</span>
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto horizontal-scroll-tabs shrink-0">
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase shrink-0 mr-0.5">
              Suggestions:
            </span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isTyping}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-full border border-slate-200 text-[10.5px] font-medium transition shrink-0 shadow-2xs whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#f8fafc]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-[#003366] text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-2xs ${
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
                    className={`text-[9px] mt-1 font-mono text-right ${
                      msg.role === 'user' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-slate-700 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2 justify-start">
                <div className="w-6 h-6 rounded-md bg-[#003366] text-white flex items-center justify-center shrink-0 text-xs shadow-2xs mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-2.5 shadow-2xs">
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#003366] animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#003366] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#003366] animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-1 text-[10px]">Gemini thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Chamoli, MILP, or Road R12..."
                disabled={isTyping}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003366] outline-none transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="h-8.5 px-3 bg-[#003366] hover:bg-[#002244] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
                aria-label="Send message"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[15px]">send</span>
              </button>
            </form>
            <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono mt-1 px-1">
              <span>NDMA / Uttarakhand Protocol</span>
              <span>Team KyuNahiHoRahiCoding</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
