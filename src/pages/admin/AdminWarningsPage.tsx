import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsers,
  issueWarningToUser,
  unbanUserByAdmin,
} from '../../services/storage';
import { User, UserWarning } from '../../types';
import {
  AlertTriangle,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Ban,
  Clock,
  X,
  Send,
} from 'lucide-react';

export const AdminWarningsPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [warningReason, setWarningReason] = useState<string>('');
  const [warningLevel, setWarningLevel] = useState<1 | 2 | 3>(1);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    const allUsers = getAllUsers();
    setUsers(allUsers);
    if (allUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !currentAdmin || !warningReason) return;

    const res = issueWarningToUser(selectedUserId, warningReason, warningLevel, currentAdmin);
    if (res.success) {
      loadData();
      setIsModalOpen(false);
      setWarningReason('');
      const target = users.find(u => u.id === selectedUserId);
      setNotice({
        type: 'success',
        message: `Disciplinary sanction (Level ${warningLevel}) successfully applied to ${
          target?.fullName || 'user'
        }.`,
      });
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to issue warning.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // Aggregate all warnings from all users
  const allWarnings: { warning: UserWarning; user: User }[] = [];
  users.forEach(u => {
    if (u.warnings && u.warnings.length > 0) {
      u.warnings.forEach(w => {
        allWarnings.push({ warning: w, user: u });
      });
    }
  });

  // Sort descending by timestamp
  allWarnings.sort((a, b) => new Date(b.warning.date || b.warning.createdAt || 0).getTime() - new Date(a.warning.date || a.warning.createdAt || 0).getTime());

  return (
    <div id="admin-warnings-page" className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Compliance & Discipline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reports & Warning Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit historical policy infractions, automated strikes, and administrative sanctions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider font-mono flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ISSUE SANCTION</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 font-semibold ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Warning Tier Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono">LEVEL 1: WARNING</span>
            <span className="text-[10px] text-slate-500 font-mono">Strike 1</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Formal policy notice sent to user notifications. Task permissions remain active.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F131C] border border-orange-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-400 font-mono">LEVEL 2: RESTRICTION</span>
            <span className="text-[10px] text-slate-500 font-mono">Strike 2</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Task submission privileges temporarily revoked. Cannot claim or submit tasks.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F131C] border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 font-mono">LEVEL 3: PERMANENT BAN</span>
            <span className="text-[10px] text-slate-500 font-mono">Strike 3</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Account permanently suspended. Immediate session termination and login block.
          </p>
        </div>
      </div>

      {/* Warnings Audit Table */}
      <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 uppercase font-mono">
            Active Warning Records ({allWarnings.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Sanction Level</th>
                <th className="py-3.5 px-4">Reason / Infraction Details</th>
                <th className="py-3.5 px-4">Issued By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allWarnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                    No warnings or sanctions recorded. All members in good standing.
                  </td>
                </tr>
              ) : (
                allWarnings.map(({ warning, user }) => (
                  <tr key={warning.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(warning.date || warning.createdAt || Date.now()).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{user.fullName}</div>
                      <div className="text-[11px] text-[#F2A900] font-mono">@{user.username}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          warning.level === 3
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : warning.level === 2
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        Level {warning.level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-md">{warning.reason}</td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {warning.adminName || warning.issuedBy || 'Administrator'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Issue Sanction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-amber-500/30 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-extrabold text-white">Issue Sanction</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueWarning} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Target User</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) — Warnings: {u.warningCount}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Sanction Tier</label>
                <select
                  value={warningLevel}
                  onChange={e => setWarningLevel(parseInt(e.target.value) as 1 | 2 | 3)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>Level 1: Official Policy Warning</option>
                  <option value={2}>Level 2: Task Submission Restriction</option>
                  <option value={3}>Level 3: Permanent Ban / Suspension</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">
                  Violation Explanation
                </label>
                <textarea
                  rows={3}
                  required
                  value={warningReason}
                  onChange={e => setWarningReason(e.target.value)}
                  placeholder="Explain why this penalty was issued..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase font-mono cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Issue Sanction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
