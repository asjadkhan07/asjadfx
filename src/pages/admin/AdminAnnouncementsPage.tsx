import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllAnnouncements,
  getAllUsers,
  createAnnouncement,
} from '../../services/storage';
import { Announcement, User } from '../../types';
import {
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AdminAnnouncementsPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setAnnouncements(getAllAnnouncements());
    const allUsers = getAllUsers();
    setUsers(allUsers);
    if (allUsers.length > 0 && !targetUserId) {
      setTargetUserId(allUsers[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || !currentAdmin) return;

    const res = createAnnouncement(
      title,
      message,
      targetType,
      targetType === 'specific' ? targetUserId : undefined,
      currentAdmin
    );

    if (res.success) {
      loadData();
      setTitle('');
      setMessage('');
      setNotice({
        type: 'success',
        message: `Announcement broadcast successfully to ${
          targetType === 'all' ? 'all registered users' : 'target user'
        }.`,
      });
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to publish announcement.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  return (
    <div id="admin-announcements-page" className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Platform Broadcasts</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Announcements & Notifications
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Publish urgent platform updates, system maintenance alerts, and task announcements directly into user notifications.
        </p>
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

      {/* Broadcast Form */}
      <div className="rounded-2xl bg-[#0F131C] border border-white/5 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 text-sm font-extrabold text-white">
          <Send className="w-4 h-4 text-[#F2A900]" />
          <span>Draft New Platform Announcement</span>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-bold text-slate-300 uppercase font-mono">
                Announcement Headline
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Weekend 2X Coin Multiplier Event Live Now!"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-300 uppercase font-mono">Target Audience</label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as 'all' | 'specific')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
              >
                <option value="all">All Registered Users ({users.length})</option>
                <option value="specific">Specific Single User</option>
              </select>
            </div>
          </div>

          {targetType === 'specific' && (
            <div className="space-y-1 p-3 rounded-xl bg-[#0A0D14] border border-white/5">
              <label className="block font-bold text-slate-300 uppercase font-mono">
                Select Recipient User
              </label>
              <select
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0F131C] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (@{u.username}) — {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-slate-300 uppercase font-mono">
              Announcement Message Body
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write the full announcement details..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold uppercase tracking-wider font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(242,169,0,0.2)] cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Announcement</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase font-mono">
          Past Dispatched Announcements ({announcements.length})
        </h2>

        {announcements.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#0F131C] border border-dashed border-white/10 text-xs text-slate-500 font-mono">
            No announcements broadcast yet.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(item => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#0F131C] border border-white/5 p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-white/5 uppercase text-slate-400">
                      {item.targetAudience === 'all' ? 'All Users' : 'Targeted'}
                    </span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
