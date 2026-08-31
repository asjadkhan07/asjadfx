import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Video,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Gift,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPlatformRules } from '../services/storage';
import { PlatformRulesConfig } from '../types';

export const RulesPage: React.FC = () => {
  const [rulesConfig, setRulesConfig] = useState<PlatformRulesConfig | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    video: true,
    comments: true,
    screenshots: true,
    process: true,
    giveaway: true,
    warnings: true,
  });

  useEffect(() => {
    setRulesConfig(getPlatformRules());
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpandedSections({
      general: true,
      video: true,
      comments: true,
      screenshots: true,
      process: true,
      giveaway: true,
      warnings: true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      general: false,
      video: false,
      comments: false,
      screenshots: false,
      process: false,
      giveaway: false,
      warnings: false,
    });
  };

  // Helper to split stored markdown text into list items
  const parseLines = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*•0-9.]+\s*/, ''));
  };

  const generalRules = parseLines(rulesConfig?.generalRules);
  const videoRules = parseLines(rulesConfig?.videoRules);
  const commentRules = parseLines(rulesConfig?.commentRules);
  const screenshotRules = parseLines(rulesConfig?.screenshotRules);
  const taskRules = parseLines(rulesConfig?.taskRules);
  const giveawayRules = parseLines(rulesConfig?.giveawayRules);
  const warningRules = parseLines(rulesConfig?.warningRules);

  const submissionSteps = [
    { step: 1, title: 'Open Task', desc: 'Browse and select an active verified task.' },
    { step: 2, title: 'Read Rules', desc: 'Understand all platform-specific guidelines.' },
    { step: 3, title: 'Complete Required Actions', desc: 'Perform the actions carefully without shortcuts.' },
    { step: 4, title: 'Take Screenshot Proof', desc: 'Capture clear unedited visual confirmation.' },
    { step: 5, title: 'Upload Proof', desc: 'Attach your screenshot and details in the form.' },
    { step: 6, title: 'Submit For Review', desc: 'Your submission enters the admin verification queue.' },
    { step: 7, title: 'Wait For Admin Approval', desc: 'Administrators verify proof validity manually.' },
    { step: 8, title: 'Receive Coins After Approval', desc: 'Approved coins are automatically credited.' },
  ];

  return (
    <div id="asjadfx-rules-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left sm:flex items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Shield className="w-3.5 h-3.5" />
              <span>Official Guidelines</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              ASJADFX Rules & Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Carefully review the standards to ensure 100% submission approval and fair reward distribution.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center justify-center sm:justify-end gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-xl bg-[#0F131C] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-xl bg-[#0F131C] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Highlight Banner on Approval Mechanism */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F2A900]/10 border border-[#F2A900]/30 text-amber-200 flex items-start gap-3.5 shadow-[0_0_15px_rgba(242,169,0,0.08)]">
          <AlertTriangle className="w-5 h-5 text-[#F2A900] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="text-[#F2A900] font-bold block mb-0.5">Important Approval Policy:</strong>
            Coins must <strong className="underline underline-offset-2">NOT</strong> be added immediately. All submissions undergo manual admin verification. Coins are credited only after your proof meets all verification criteria.
          </div>
        </div>

        {/* 1. GENERAL RULES */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('general')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  GENERAL RULES
                </h2>
                <span className="text-xs text-slate-400 font-mono">Foundational account & platform conduct policies</span>
              </div>
            </div>
            {expandedSections.general ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.general && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-3"
              >
                {generalRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. VIDEO RULES */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('video')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  VIDEO RULES
                </h2>
                <span className="text-xs text-slate-400 font-mono">Watch time and instruction fidelity</span>
              </div>
            </div>
            {expandedSections.video ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.video && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-3"
              >
                {videoRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. COMMENT RULES */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('comments')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  COMMENT RULES
                </h2>
                <span className="text-xs text-slate-400 font-mono">Meaningful questions & high effort standards</span>
              </div>
            </div>
            {expandedSections.comments ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.comments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-3"
              >
                {commentRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#F2A900]/15 text-[#F2A900] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. SCREENSHOT PROOF RULES */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('screenshots')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  SCREENSHOT PROOF RULES
                </h2>
                <span className="text-xs text-slate-400 font-mono">Authenticity, clarity, and unedited image standards</span>
              </div>
            </div>
            {expandedSections.screenshots ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.screenshots && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-3"
              >
                {screenshotRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. TASK SUBMISSION PROCESS (8 STEPS) */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('process')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  TASK SUBMISSION PROCESS
                </h2>
                <span className="text-xs text-slate-400 font-mono">8 sequential steps to earn approved coins</span>
              </div>
            </div>
            {expandedSections.process ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.process && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {submissionSteps.map(step => (
                    <div
                      key={step.step}
                      className="p-3.5 rounded-xl bg-[#0A0D14] border border-white/5 flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 font-mono">
                        {step.step}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{step.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs">
                  <strong>Notice:</strong> Coins are only added to your balance after explicit admin approval.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6. GIVEAWAY RULES */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('giveaway')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900]">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  GIVEAWAY RULES
                </h2>
                <span className="text-xs text-slate-400 font-mono">Eligibility, claims, and verified ranking rules</span>
              </div>
            </div>
            {expandedSections.giveaway ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.giveaway && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-3"
              >
                {giveawayRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#F2A900]/15 text-[#F2A900] flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 7. WARNINGS & PENALTY TIERS */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-lg">
          <button
            onClick={() => toggleSection('warnings')}
            className="w-full px-5 py-4 flex items-center justify-between bg-[#161B24]/60 hover:bg-[#161B24] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-['Space_Grotesk']">
                  WARNING & PENALTY TIERS
                </h2>
                <span className="text-xs text-slate-400 font-mono">Three-strike enforcement guidelines</span>
              </div>
            </div>
            {expandedSections.warnings ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.warnings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-5 border-t border-white/5 space-y-3"
              >
                {warningRules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
