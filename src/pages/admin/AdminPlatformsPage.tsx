import React, { useState, useEffect } from 'react';
import { getPlatforms, updatePlatformConfig } from '../../services/storage';
import { PlatformConfig } from '../../types';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  Save,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const AdminPlatformsPage: React.FC = () => {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [editingPlatform, setEditingPlatform] = useState<PlatformConfig | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setPlatforms(getPlatforms());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatform) return;

    updatePlatformConfig(editingPlatform);
    setPlatforms(getPlatforms());
    setEditingPlatform(null);
    setSuccessMessage(`Platform settings for ${editingPlatform.name} updated successfully.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const toggleStatus = (platform: PlatformConfig) => {
    const updated: PlatformConfig = {
      ...platform,
      status: platform.status === 'active' ? 'disabled' : 'active',
    };
    updatePlatformConfig(updated);
    setPlatforms(getPlatforms());
    setSuccessMessage(`${platform.name} is now ${updated.status}.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div id="admin-platforms-page" className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Platform Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure official social account URLs, default guidelines, and toggle visibility. When disabled, users cannot view or submit tasks for that network.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {platforms.map(plt => {
          const isActive = plt.status === 'active';
          return (
            <div
              key={plt.id}
              className={`rounded-2xl bg-[#0F131C] border transition-all flex flex-col justify-between p-5 space-y-4 shadow-lg ${
                isActive ? 'border-white/5' : 'border-rose-500/20 bg-rose-500/[0.02]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{plt.icon}</span>
                    <div>
                      <h2 className="text-base font-extrabold text-white">{plt.name}</h2>
                      <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        Key: {plt.key}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {plt.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                    Official Profile / Channel URL:
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#0A0D14] border border-white/5 text-slate-300 font-mono text-[11px] truncate">
                    <span className="truncate flex-1">{plt.officialUrl || 'Not configured'}</span>
                    {plt.officialUrl && (
                      <a
                        href={plt.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#F2A900] hover:text-[#FFD700] shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                    Default Task Instructions:
                  </div>
                  <p className="p-2.5 rounded-xl bg-[#0A0D14] border border-white/5 text-slate-400 text-xs leading-relaxed min-h-[52px]">
                    {plt.defaultInstructions || 'No default instructions set.'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleStatus(plt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {isActive ? 'Disable Platform' : 'Activate Platform'}
                </button>

                <button
                  onClick={() => setEditingPlatform(plt)}
                  className="px-3 py-1.5 rounded-xl bg-[#161B24] border border-white/10 hover:bg-[#1C232E] text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#F2A900]" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Platform Modal */}
      {editingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{editingPlatform.icon}</span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Configure {editingPlatform.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">Platform Key: {editingPlatform.key}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPlatform(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  Display Platform Name
                </label>
                <input
                  type="text"
                  required
                  value={editingPlatform.name}
                  onChange={e => setEditingPlatform({ ...editingPlatform, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  Icon / Emoji
                </label>
                <input
                  type="text"
                  required
                  value={editingPlatform.icon}
                  onChange={e => setEditingPlatform({ ...editingPlatform, icon: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  Official Account / Profile URL
                </label>
                <input
                  type="url"
                  required
                  value={editingPlatform.officialUrl}
                  onChange={e => setEditingPlatform({ ...editingPlatform, officialUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  Default Task Instructions
                </label>
                <textarea
                  rows={3}
                  value={editingPlatform.defaultInstructions}
                  onChange={e => setEditingPlatform({ ...editingPlatform, defaultInstructions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
                  Status
                </label>
                <select
                  value={editingPlatform.status}
                  onChange={e =>
                    setEditingPlatform({
                      ...editingPlatform,
                      status: e.target.value as 'active' | 'disabled',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                >
                  <option value="active">Active (Visible to users)</option>
                  <option value="disabled">Disabled (Hidden from users)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlatform(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(242,169,0,0.2)] cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
