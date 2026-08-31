import React, { useState, useEffect } from 'react';
import { getPlatformRules, updatePlatformRules } from '../../services/storage';
import { PlatformRulesConfig } from '../../types';
import {
  ScrollText,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  BookOpen,
} from 'lucide-react';

export const AdminRulesPage: React.FC = () => {
  const [rules, setRules] = useState<PlatformRulesConfig | null>(null);
  const [activeTab, setActiveTab] = useState<keyof PlatformRulesConfig>('generalRules');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRules(getPlatformRules());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;

    updatePlatformRules(rules);
    setNotice('Platform Rules and Guidelines updated successfully across all user pages.');
    setTimeout(() => setNotice(null), 3500);
  };

  const sections: { key: keyof PlatformRulesConfig; label: string; description: string }[] = [
    {
      key: 'generalRules',
      label: 'General Platform Rules',
      description: 'Foundational conduct, honest participation, and multi-account prohibition.',
    },
    {
      key: 'videoRules',
      label: 'Video & Watch Rules',
      description: 'Requirements for YouTube, TikTok, and video watch completion.',
    },
    {
      key: 'commentRules',
      label: 'Comment & Interaction Rules',
      description: 'Question relevance, prohibition of spam and emoji-only comments.',
    },
    {
      key: 'screenshotRules',
      label: 'Screenshot Proof Rules',
      description: 'Legibility, account visibility, and anti-reupload rules.',
    },
    {
      key: 'taskRules',
      label: 'Task Execution Guidelines',
      description: 'Task timeframes, verification turnaround, and legitimate actions.',
    },
    {
      key: 'giveawayRules',
      label: 'Giveaway & Prize Rules',
      description: 'Eligibility, coin criteria, and disbursement terms.',
    },
    {
      key: 'warningRules',
      label: 'Warning & Penalty System',
      description: 'Level 1-3 warnings, temporary submission blocks, and permanent ban terms.',
    },
  ];

  if (!rules) return null;

  return (
    <div id="admin-rules-page" className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
          <ScrollText className="w-3.5 h-3.5" />
          <span>Policy Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Rules & Guidelines Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Edit and maintain all platform compliance rules, comment policies, screenshot verification standards, and penalty tiers in real-time.
        </p>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Editor Layout */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation / Selection Tabs */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase font-mono px-1">
            Select Policy Section
          </div>
          <div className="space-y-1">
            {sections.map(sec => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveTab(sec.key)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  activeTab === sec.key
                    ? 'bg-gradient-to-r from-[#F2A900]/20 to-[#F2A900]/5 border-[#F2A900]/40 text-[#F2A900]'
                    : 'bg-[#0F131C] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="font-bold text-xs">{sec.label}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sec.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area Content (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0F131C] border border-white/5 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {sections.find(s => s.key === activeTab)?.label}
                </h3>
                <p className="text-xs text-slate-400">
                  {sections.find(s => s.key === activeTab)?.description}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                Policy Markdown / Text Content (Line breaks supported):
              </label>
              <textarea
                rows={14}
                required
                value={rules[activeTab]}
                onChange={e => setRules({ ...rules, [activeTab]: e.target.value })}
                className="w-full p-4 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-[#F2A900] font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Live updates propagate instantly to user /rules page.
            </span>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(242,169,0,0.2)] flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Policy Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
