import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, findUserById } from '../services/storage';
import { LeaderboardEntry } from '../types';
import {
  Trophy,
  Crown,
  Medal,
  Coins,
  Search,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
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
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.instagramUsername && u.instagramUsername.toLowerCase().includes(q))
    );
  });

  return (
    <div id="asjadfx-leaderboard-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-white/5 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider font-mono">
            <Trophy className="w-3.5 h-3.5" />
            <span>Global Rankings</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            Top Coin Earners Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Rankings are updated in real-time as administrators approve verified task completions.
          </p>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4">
            {/* Rank 2 - Silver */}
            {top3[1] ? (
              <div className="rounded-3xl bg-[#0F131C] border border-slate-400/20 p-6 flex flex-col items-center text-center space-y-2.5 relative shadow-lg order-2 sm:order-1">
                <div className="w-12 h-12 rounded-full bg-slate-300 text-black font-black flex items-center justify-center text-base shadow-md">
                  #2
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{top3[1].fullName}</h3>
                  <p className="text-xs font-mono text-[#F2A900]">@{top3[1].username}</p>
                </div>
                <div className="text-2xl font-black text-slate-200 font-mono">
                  🪙 {top3[1].coins}
                </div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {top3[1].approvedTasksCount} Tasks Done
                </div>
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}

            {/* Rank 1 - Champion Gold */}
            {top3[0] && (
              <div className="rounded-3xl bg-[#0F131C] border border-[#FFD700]/40 bg-gradient-to-b from-[#FFD700]/10 to-transparent p-7 flex flex-col items-center text-center space-y-3 relative shadow-[0_0_30px_rgba(255,215,0,0.15)] order-1 sm:order-2 sm:-translate-y-2">
                <div className="absolute -top-4">
                  <Crown className="w-8 h-8 text-[#FFD700] fill-[#FFD700]" />
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FFD700] via-amber-400 to-amber-600 text-black font-black flex items-center justify-center text-xl shadow-xl">
                  #1
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">{top3[0].fullName}</h3>
                  <p className="text-xs font-mono text-[#FFD700]">@{top3[0].username}</p>
                </div>
                <div className="text-3xl font-black text-[#FFD700] font-mono">
                  🪙 {top3[0].coins}
                </div>
                <span className="px-3 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-mono font-bold uppercase tracking-widest">
                  Grand Champion
                </span>
              </div>
            )}

            {/* Rank 3 - Bronze */}
            {top3[2] ? (
              <div className="rounded-3xl bg-[#0F131C] border border-amber-700/30 p-6 flex flex-col items-center text-center space-y-2.5 relative shadow-lg order-3">
                <div className="w-12 h-12 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-base shadow-md">
                  #3
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{top3[2].fullName}</h3>
                  <p className="text-xs font-mono text-[#F2A900]">@{top3[2].username}</p>
                </div>
                <div className="text-2xl font-black text-amber-500 font-mono">
                  🪙 {top3[2].coins}
                </div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  {top3[2].approvedTasksCount} Tasks Done
                </div>
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
        )}

        {/* Current User Rank Card */}
        {user && myStanding && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#F2A900]/15 via-[#0F131C] to-[#0F131C] border border-[#F2A900]/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#F2A900] text-black font-black text-base flex items-center justify-center font-mono">
                #{myStanding.rank}
              </div>
              <div>
                <div className="text-xs font-mono text-[#F2A900] uppercase font-bold tracking-wider">
                  Your Current Standing
                </div>
                <div className="text-base font-extrabold text-white">{user.fullName}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Tasks Approved</div>
                <div className="text-base font-bold text-white">{myStanding.approvedTasksCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Your Balance</div>
                <div className="text-lg font-black text-[#FFD700]">🪙 {user.coins ?? 0}</div>
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
              placeholder="Search leaderboard by name, username, or instagram..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
            />
          </div>
        </div>

        {/* Rankings Table */}
        <div className="rounded-3xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Instagram</th>
                <th className="py-3.5 px-4">Completed Tasks</th>
                <th className="py-3.5 px-4 text-right">Coins Balance</th>
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
                  const isMe = (entry.userId || entry.id) === user?.id;
                  return (
                    <tr
                      key={entry.userId || entry.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isMe ? 'bg-[#F2A900]/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FFD700] text-black font-black text-xs">
                            1
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black font-black text-xs">
                            2
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">#{entry.rank}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{entry.fullName}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#F2A900]/20 text-[#F2A900] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#F2A900] font-mono">@{entry.username}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-purple-300">
                        {entry.instagramUsername ? `@${entry.instagramUsername}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {entry.approvedTasksCount} approved
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-sm text-[#F2A900] font-mono whitespace-nowrap">
                        🪙 {entry.coins}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
