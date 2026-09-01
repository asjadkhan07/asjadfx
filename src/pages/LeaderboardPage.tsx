import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, findUserById } from '../services/storage';
import { LeaderboardEntry } from '../types';
import {
  Trophy,
  Crown,
  Search,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

export const LeaderboardPage: React.FC = () => {
  const { user, navigateTo } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncTick, setSyncTick] = useState(0);

  const loadData = () => {
    setLeaderboard(getLeaderboard());
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
      setSyncTick(t => t + 1);
    };

    window.addEventListener('asjadfx_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('asjadfx_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const freshUser = useMemo(() => {
    if (!user) return null;
    return findUserById(user.id) || user;
  }, [user, syncTick]);

  const top3 = leaderboard.slice(0, 3);
  const myStanding = leaderboard.find(u => u.userId === freshUser?.id || u.id === freshUser?.id);

  const filtered = leaderboard.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.instagramUsername && u.instagramUsername.toLowerCase().includes(q))
    );
  });

  return (
    <div id="asjadfx-leaderboard-page" className="min-h-screen bg-[#05070A] pb-24 pt-6 sm:pt-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] text-xs font-bold uppercase tracking-wider font-mono">
            <Trophy className="w-3.5 h-3.5" />
            <span>Global Standings</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            Leaderboard Rankings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Rankings are automated by total coins earned. Standings update in real-time as tasks are verified.
          </p>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 max-w-4xl mx-auto">
            {/* Rank 2 - Silver */}
            {top3[1] ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-[#0F131C] border border-slate-400/30 p-6 flex flex-col items-center text-center space-y-3 relative shadow-xl order-2 md:order-1"
              >
                <div className="w-12 h-12 rounded-full bg-slate-300 text-black font-black flex items-center justify-center text-lg shadow-md">
                  🥈 #2
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#161B24] border border-white/10 flex items-center justify-center text-lg font-bold text-slate-200">
                  {top3[1].fullName ? top3[1].fullName[0] : 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base truncate max-w-[200px]">{top3[1].username}</h3>
                  <p className="text-xs font-mono text-[#00FF66]">
                    {top3[1].instagramUsername ? `@${top3[1].instagramUsername}` : '@trader'}
                  </p>
                </div>
                <div className="w-full py-2.5 px-4 rounded-xl bg-[#161B24] border border-white/5">
                  <div className="text-2xl font-black text-slate-200 font-mono">
                    🪙 {top3[1].coins}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Coins</div>
                </div>
              </motion.div>
            ) : (
              <div className="hidden md:block" />
            )}

            {/* Rank 1 - Champion Gold */}
            {top3[0] && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl bg-[#0F131C] border-2 border-[#FFD700] bg-gradient-to-b from-[#FFD700]/15 to-transparent p-8 flex flex-col items-center text-center space-y-3 relative shadow-[0_0_40px_rgba(255,215,0,0.25)] order-1 md:order-2 md:-translate-y-4"
              >
                <div className="absolute top-3 right-3">
                  <Crown className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" />
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FFD700] via-amber-400 to-amber-600 text-black font-black flex items-center justify-center text-xl shadow-xl">
                  🥇 #1
                </div>
                <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-[#FFD700] to-amber-500 p-0.5 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                  <div className="w-full h-full rounded-2xl bg-[#0F131C] flex items-center justify-center text-xl font-bold text-[#FFD700]">
                    {top3[0].fullName ? top3[0].fullName[0] : 'U'}
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg truncate max-w-[200px]">{top3[0].username}</h3>
                  <p className="text-xs font-mono text-[#FFD700]">
                    {top3[0].instagramUsername ? `@${top3[0].instagramUsername}` : '@champion'}
                  </p>
                </div>
                <div className="w-full py-3 px-4 rounded-xl bg-[#161B24] border border-[#FFD700]/30 shadow-inner">
                  <div className="text-3xl font-black text-[#FFD700] font-mono">
                    🪙 {top3[0].coins}
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FFD700]/80">
                    Grand Champion
                  </span>
                </div>
              </motion.div>
            )}

            {/* Rank 3 - Bronze */}
            {top3[2] ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl bg-[#0F131C] border border-amber-700/30 p-6 flex flex-col items-center text-center space-y-3 relative shadow-xl order-3"
              >
                <div className="w-12 h-12 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-lg shadow-md">
                  🥉 #3
                </div>
                <div className="w-14 h-14 rounded-2xl bg-[#161B24] border border-white/10 flex items-center justify-center text-lg font-bold text-amber-400">
                  {top3[2].fullName ? top3[2].fullName[0] : 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base truncate max-w-[200px]">{top3[2].username}</h3>
                  <p className="text-xs font-mono text-amber-500">
                    {top3[2].instagramUsername ? `@${top3[2].instagramUsername}` : '@trader'}
                  </p>
                </div>
                <div className="w-full py-2.5 px-4 rounded-xl bg-[#161B24] border border-white/5">
                  <div className="text-2xl font-black text-amber-500 font-mono">
                    🪙 {top3[2].coins}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Coins</div>
                </div>
              </motion.div>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        )}

        {/* Current User Rank Card if logged in */}
        {freshUser && myStanding && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#00FF66]/15 via-[#0F131C] to-[#0F131C] border border-[#00FF66]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#00FF66] text-black font-black text-lg flex items-center justify-center font-mono">
                #{myStanding.rank}
              </div>
              <div>
                <div className="text-xs font-mono text-[#00FF66] uppercase font-bold tracking-wider">
                  Your Current Standing
                </div>
                <div className="text-base font-extrabold text-white">@{freshUser.username}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Tasks Done</div>
                <div className="text-base font-bold text-white">{myStanding.approvedTasksCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Your Balance</div>
                <div className="text-lg font-black text-[#FFD700]">🪙 {freshUser.coins ?? 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0F131C] border border-white/5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search leaderboard by username or instagram..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#00FF66]"
            />
          </div>
        </div>

        {/* Full Rankings List */}
        <div className="rounded-3xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#0A0D14]/80 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-4 px-6 w-20 text-center">Rank</th>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Instagram</th>
                  <th className="py-4 px-6 text-center">Tasks Completed</th>
                  <th className="py-4 px-6 text-right">Coins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                      No ranked members found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(entry => {
                    const isMe = freshUser && (entry.userId === freshUser.id || entry.id === freshUser.id);
                    return (
                      <tr
                        key={entry.userId || entry.id}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          isMe ? 'bg-[#00FF66]/5' : ''
                        }`}
                      >
                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {entry.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFD700] text-black font-black text-xs shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                              1
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-black font-black text-xs shadow-md">
                              2
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-sm">#{entry.rank}</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              entry.membership_type === 'premium' && entry.premium_status === 'active'
                                ? 'bg-gradient-to-tr from-[#FFD700] to-amber-500 text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                                : 'bg-slate-800 text-white'
                            }`}>
                              {entry.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{entry.username}</span>
                                {entry.membership_type === 'premium' && entry.premium_status === 'active' && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] text-[9px] font-black font-mono flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5 fill-[#FFD700]" />
                                    <span>VIP</span>
                                  </span>
                                )}
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#00FF66]/20 text-[#00FF66] font-bold">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{entry.fullName}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-mono text-[#00FF66]">
                          {entry.instagramUsername ? `@${entry.instagramUsername}` : '—'}
                        </td>

                        <td className="py-4 px-6 text-center font-mono text-slate-300">
                          {entry.approvedTasksCount}
                        </td>

                        <td className="py-4 px-6 text-right font-black text-base text-[#FFD700] font-mono whitespace-nowrap">
                          🪙 {entry.coins}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="sm:hidden divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                No ranked members found.
              </div>
            ) : (
              filtered.map(entry => {
                const isMe = freshUser && (entry.userId === freshUser.id || entry.id === freshUser.id);
                return (
                  <div
                    key={entry.userId || entry.id}
                    className={`p-4 flex items-center justify-between gap-3 ${
                      isMe ? 'bg-[#00FF66]/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#161B24] border border-white/10 font-mono font-bold text-slate-300 flex items-center justify-center text-xs shrink-0">
                        #{entry.rank}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                          <span>{entry.username}</span>
                          {isMe && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-[#00FF66]/20 text-[#00FF66] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#00FF66] font-mono truncate">
                          {entry.instagramUsername ? `@${entry.instagramUsername}` : 'Trader'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-[#FFD700] font-mono">
                        🪙 {entry.coins}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {entry.approvedTasksCount} tasks
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
