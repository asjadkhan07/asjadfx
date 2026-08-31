import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AiChatMessage,
  INITIAL_AI_WELCOME,
  QUICK_SUGGESTIONS,
  generateAsjadAiResponse,
  ContactFlowState,
  SupportedLanguage,
} from '../services/asjadAi';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Trash2,
  ChevronDown,
  ArrowRight,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AsjadAiChatbot: React.FC = () => {
  const { user, navigateTo } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [sessionLang, setSessionLang] = useState<SupportedLanguage>('en');
  const [contactState, setContactState] = useState<ContactFlowState>({ step: 'idle' });

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: INITIAL_AI_WELCOME,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isTyping) return;

    const userMessage: AiChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsTyping(true);

    // Build recent conversation snippet for contact escalation context
    const recentSnippet = updatedMessages
      .slice(-4)
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join('\n');

    try {
      const response = await generateAsjadAiResponse(
        query,
        user,
        contactState,
        sessionLang,
        recentSnippet
      );

      // Update state machine & session language
      setContactState(response.newContactState);
      setSessionLang(response.detectedLang);

      const aiMessage: AiChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButton: response.actionButton,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const fallbackMsg: AiChatMessage = {
        id: 'ai-err-' + Date.now(),
        sender: 'ai',
        text:
          sessionLang === 'hinglish'
            ? 'ASJADFX network ke sath sync karne me thoda samay lag raha hai. Aap navigation menu se seedha tasks ya leaderboard dekh sakte hain!'
            : "I'm experiencing a brief synchronization delay with the ASJADFX network. You can explore the tasks or leaderboard directly using the navigation menu!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setContactState({ step: 'idle' });
    setSessionLang('en');
    setMessages([
      {
        id: 'welcome-fresh',
        sender: 'ai',
        text: INITIAL_AI_WELCOME,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleActionButtonClick = (route: string) => {
    navigateTo(route as any);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <div id="asjad-ai-assistant-root" className="fixed z-[60] right-4 sm:right-6 bottom-20 lg:bottom-6">
      {/* Floating Launcher Button */}
      <div className="relative flex items-center gap-2.5">
        {/* Floating Label Pill on Desktop / Mobile */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0F131C]/95 border border-[#00FF66]/40 text-[#00FF66] text-xs font-black font-mono shadow-[0_0_20px_rgba(0,255,102,0.25)] backdrop-blur-md cursor-pointer select-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700] animate-spin" />
            <span className="tracking-wide">ASJAD AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
          </motion.div>
        )}

        <motion.button
          id="asjad-ai-toggle-btn"
          aria-label="Open ASJAD AI Assistant"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-2xl ${
            isOpen
              ? 'bg-[#0F131C] border-2 border-[#00FF66] text-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.5)]'
              : 'bg-gradient-to-tr from-[#0F131C] via-[#161F2E] to-[#0A0D14] border-2 border-[#00FF66] text-white shadow-[0_0_35px_rgba(0,255,102,0.45)] hover:border-[#FFD700]'
          }`}
        >
          {/* Subtle Outer Glowing Pulse Ring */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full border-2 border-[#00FF66]/40 animate-ping opacity-40 pointer-events-none" />
          )}

          {isOpen ? (
            <X className="w-6 h-6 text-[#00FF66]" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="w-7 h-7 text-[#00FF66]" />
              <Sparkles className="w-4 h-4 text-[#FFD700] absolute -top-1.5 -right-1.5 animate-pulse" />
            </div>
          )}

          {/* Online green indicator dot */}
          {!isOpen && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00FF66] border-2 border-[#05070A] rounded-full shadow-[0_0_8px_#00FF66]" />
          )}
        </motion.button>
      </div>

      {/* Floating Chat Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="asjad-ai-chatbox"
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute right-0 bottom-16 sm:bottom-18 w-[calc(100vw-2rem)] sm:w-[420px] h-[540px] max-h-[82vh] rounded-3xl bg-[#0A0D14]/95 border border-[#00FF66]/35 shadow-[0_10px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(0,255,102,0.2)] backdrop-blur-2xl flex flex-col overflow-hidden z-[70] font-sans"
          >
            {/* Header */}
            <div className="p-4 bg-[#0F131C] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00FF66]/20 to-[#FFD700]/20 border border-[#00FF66]/40 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[#00FF66]" />
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] border-2 border-[#0F131C] absolute -bottom-0.5 -right-0.5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-white text-sm font-['Space_Grotesk'] tracking-tight">
                      ASJAD AI
                    </h3>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#00FF66]/20 text-[#00FF66] font-bold">
                      SMART
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Community Assistant & Guide
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close assistant"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-[#00FF66] text-black font-semibold rounded-tr-sm shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                        : 'bg-[#141923] text-slate-200 border border-white/10 rounded-tl-sm shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.text.split('\n').map((line, idx) => {
                        // Bold markdown parsing for clean display
                        const formatted = line.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-white font-bold">$1</strong>'
                        );
                        return (
                          <span
                            key={idx}
                            className="block"
                            dangerouslySetInnerHTML={{ __html: formatted }}
                          />
                        );
                      })}
                    </div>

                    {/* Optional Embedded Action Button */}
                    {msg.actionButton && (
                      <button
                        onClick={() => handleActionButtonClick(msg.actionButton!.route)}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-[#00FF66]/15 hover:bg-[#00FF66]/25 border border-[#00FF66]/40 text-[#00FF66] font-bold font-mono text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                      >
                        <span>{msg.actionButton.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#141923] border border-white/5 w-16">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-[#0F131C]/60 border-t border-white/5 overflow-x-auto flex items-center gap-2 no-scrollbar">
              {QUICK_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.query)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-xl bg-[#161B24] hover:bg-[#00FF66]/10 border border-white/10 hover:border-[#00FF66]/30 text-slate-300 hover:text-[#00FF66] text-[11px] font-mono transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Footer Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-[#0F131C] border-t border-white/10 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask ASJAD AI anything..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#05070A] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#00FF66] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00FF66] to-emerald-400 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black flex items-center justify-center cursor-pointer transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] shrink-0 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
