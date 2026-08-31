import React, { useState, useEffect } from 'react';
import { getAllGiveaways, saveGiveaway, deleteGiveaway } from '../../services/storage';
import { Giveaway } from '../../types';
import {
  Gift,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Trophy,
  CheckCircle2,
  X,
  Save,
  Clock,
} from 'lucide-react';

export const AdminGiveawaysPage: React.FC = () => {
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState<Partial<Giveaway> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = () => {
    setGiveaways(getAllGiveaways());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingGiveaway({
      id: `giveaway_${Date.now()}`,
      title: '',
      description: '',
      prize: '$500 USDT / Funded Account',
      firstPrize: '$250 USDT',
      secondPrize: '$150 USDT',
      thirdPrize: '$100 USDT',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minCoinsRequired: 100,
      status: 'active',
      eligibilityRules: 'Must be an active member with verified task completions and no policy warnings.',
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGiveaway || !editingGiveaway.title) return;

    const toSave: Giveaway = {
      ...(editingGiveaway as Giveaway),
      minCoinsRequired: Math.max(0, editingGiveaway.minCoinsRequired || 0),
    };

    saveGiveaway(toSave);
    loadData();
    setIsModalOpen(false);
    setEditingGiveaway(null);
    setNotice('Giveaway saved successfully.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteGiveaway(id);
    loadData();
    setNotice('Giveaway deleted.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div id="admin-giveaways-page" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Gift className="w-3.5 h-3.5" />
            <span>Community Events</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Giveaways & Reward Pools
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create verified giveaway drawings with defined coin entry requirements and cash prize distribution.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(242,169,0,0.2)] transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>CREATE GIVEAWAY</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Giveaways Grid */}
      {giveaways.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-[#0F131C] border border-dashed border-white/10 space-y-3">
          <Gift className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">No giveaways configured yet.</h3>
          <p className="text-xs text-slate-500">
            Click &quot;CREATE GIVEAWAY&quot; to set up your first prize pool for top coin earners.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {giveaways.map(g => (
            <div
              key={g.id}
              className="rounded-2xl bg-[#0F131C] border border-white/5 p-5 flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Gift className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase font-mono tracking-wider">
                      Prize Pool
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                      g.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : g.status === 'upcoming'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {g.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">{g.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{g.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Total Prize:</span>
                    <span className="font-extrabold text-[#FFD700] text-sm">{g.prize}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5 text-[10px] text-center font-mono">
                    <div className="p-1 rounded bg-[#FFD700]/10 text-[#FFD700]">
                      <div>1st Place</div>
                      <div className="font-bold truncate">{g.firstPrize}</div>
                    </div>
                    <div className="p-1 rounded bg-slate-300/10 text-slate-300">
                      <div>2nd Place</div>
                      <div className="font-bold truncate">{g.secondPrize}</div>
                    </div>
                    <div className="p-1 rounded bg-amber-700/10 text-amber-500">
                      <div>3rd Place</div>
                      <div className="font-bold truncate">{g.thirdPrize}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-mono text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Min Coins:</span>
                    <span className="text-white font-bold">🪙 {g.minCoinsRequired}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ends:</span>
                    <span className="text-slate-300">{new Date(g.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => {
                    setEditingGiveaway(g);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(g.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && editingGiveaway && (
        <div
          id="modal-giveaway-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            id="modal-giveaway-frame"
            className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                    {giveaways.some(g => g.id === editingGiveaway.id) ? 'Edit Giveaway' : 'Configure Giveaway'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Set prizes, entry threshold, and active duration</p>
                </div>
              </div>
              <button
                id="btn-close-giveaway-modal"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs flex-1 overscroll-contain">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 uppercase font-mono">Giveaway Title</label>
                  <input
                    type="text"
                    required
                    value={editingGiveaway.title || ''}
                    onChange={e => setEditingGiveaway({ ...editingGiveaway, title: e.target.value })}
                    placeholder="e.g. Monthly $500 Trading Capital Pool"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 uppercase font-mono">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={editingGiveaway.description || ''}
                    onChange={e => setEditingGiveaway({ ...editingGiveaway, description: e.target.value })}
                    placeholder="Details on reward disbursement..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Total Prize Value</label>
                    <input
                      type="text"
                      required
                      value={editingGiveaway.prize || ''}
                      onChange={e => setEditingGiveaway({ ...editingGiveaway, prize: e.target.value })}
                      placeholder="$500 USDT"
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Min Coins Required</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={
                        editingGiveaway.minCoinsRequired === 0
                          ? ''
                          : (editingGiveaway.minCoinsRequired ?? 0)
                      }
                      onFocus={e => e.target.select()}
                      onClick={e => (e.target as HTMLInputElement).select()}
                      onKeyDown={e => {
                        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') {
                          setEditingGiveaway({ ...editingGiveaway, minCoinsRequired: 0 });
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num) && num >= 0) {
                            setEditingGiveaway({ ...editingGiveaway, minCoinsRequired: num });
                          }
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">1st Place</label>
                    <input
                      type="text"
                      required
                      value={editingGiveaway.firstPrize || ''}
                      onChange={e => setEditingGiveaway({ ...editingGiveaway, firstPrize: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">2nd Place</label>
                    <input
                      type="text"
                      required
                      value={editingGiveaway.secondPrize || ''}
                      onChange={e => setEditingGiveaway({ ...editingGiveaway, secondPrize: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">3rd Place</label>
                    <input
                      type="text"
                      required
                      value={editingGiveaway.thirdPrize || ''}
                      onChange={e => setEditingGiveaway({ ...editingGiveaway, thirdPrize: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">Start Date</label>
                    <input
                      type="date"
                      required
                      value={editingGiveaway.startDate || ''}
                      onChange={e => setEditingGiveaway({ ...editingGiveaway, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300 uppercase font-mono">End Date</label>
                    <input
                      type="date"
                      required
                      value={editingGiveaway.endDate || ''}
                      onChange={e => setEditingGiveaway({ ...editingGiveaway, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-300 uppercase font-mono">Status</label>
                  <select
                    value={editingGiveaway.status || 'active'}
                    onChange={e =>
                      setEditingGiveaway({
                        ...editingGiveaway,
                        status: e.target.value as 'active' | 'completed' | 'upcoming',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-4 sm:px-6 sm:py-4 border-t border-white/10 flex items-center justify-end gap-2 shadow-md">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#F2A900] hover:bg-amber-400 text-black font-extrabold uppercase font-mono flex items-center gap-1.5 text-xs shadow-[0_0_15px_rgba(242,169,0,0.2)] cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Giveaway</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
