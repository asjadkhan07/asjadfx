import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../../services/storage';
import { LeaderboardEntry } from '../../types';
import { Trophy, Medal, Search, Crown, Sparkles, Coins } from 'lucide-react';

export const AdminLeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, []);

  const filtered = leaderboard.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.instagramUsername && u.instagramUsername.toLowerCase().includes(q))
    );
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <div id="admin-leaderboard-page" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
          <Trophy className="w-3.5 h-3.5" />
          <span>Automated Standing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Platform Leaderboard System
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time global rankings computed directly from verified database coin balances.
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* #2 Silver */}
          {top3[1] && (
            <div className="rounded-2xl bg-[#0F131C] border border-slate-400/20 p-5 flex flex-col items-center text-center space-y-2 relative">
              <div className="w-10 h-10 rounded-full bg-slate-300 text-black font-black flex items-center justify-center text-sm shadow-lg">
                #2
              </div>
              <div className="font-bold text-white text-base">{top3[1].fullName}</div>
              <div className="text-xs font-mono text-[#F2A900]">@{top3[1].username}</div>
              <div className="text-xl font-black text-slate-300 font-mono">🪙 {top3[1].coins}</div>
              <div className="text-[10px] text-slate-500 font-mono">Silver Rank</div>
            </div>
          )}

          {/* #1 Gold */}
          {top3[0] && (
            <div className="rounded-2xl bg-[#0F131C] border border-[#FFD700]/40 bg-gradient-to-b from-[#FFD700]/10 to-transparent p-6 flex flex-col items-center text-center space-y-2 relative -mt-2 shadow-[0_0_25px_rgba(255,215,0,0.15)]">
              <div className="absolute -top-3">
                <Crown className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFD700] to-amber-500 text-black font-black flex items-center justify-center text-base shadow-lg">
                #1
              </div>
              <div className="font-extrabold text-white text-lg">{top3[0].fullName}</div>
              <div className="text-xs font-mono text-[#FFD700]">@{top3[0].username}</div>
              <div className="text-2xl font-black text-[#FFD700] font-mono">🪙 {top3[0].coins}</div>
              <div className="text-[10px] text-amber-400 font-mono uppercase font-bold tracking-widest">
                Champion Rank
              </div>
            </div>
          )}

          {/* #3 Bronze */}
          {top3[2] && (
            <div className="rounded-2xl bg-[#0F131C] border border-amber-700/30 p-5 flex flex-col items-center text-center space-y-2 relative">
              <div className="w-10 h-10 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-sm shadow-lg">
                #3
              </div>
              <div className="font-bold text-white text-base">{top3[2].fullName}</div>
              <div className="text-xs font-mono text-[#F2A900]">@{top3[2].username}</div>
              <div className="text-xl font-black text-amber-600 font-mono">🪙 {top3[2].coins}</div>
              <div className="text-[10px] text-slate-500 font-mono">Bronze Rank</div>
            </div>
          )}
        </div>
      )}

      {/* Search Filter */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0F131C] border border-white/5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search ranked users..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#F2A900]"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
              <th className="py-3.5 px-4 w-16 text-center">Rank</th>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Instagram</th>
              <th className="py-3.5 px-4">Tasks Done</th>
              <th className="py-3.5 px-4 text-right">Coin Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                  No ranked users found.
                </td>
              </tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.userId} className="hover:bg-white/[0.02] transition-colors">
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
                    <div className="font-bold text-white">{entry.fullName}</div>
                    <div className="text-[11px] text-[#F2A900] font-mono">@{entry.username}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-purple-300">
                    {entry.instagramUsername ? `@${entry.instagramUsername}` : '—'}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {entry.approvedTasksCount} completed
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-sm text-[#F2A900] font-mono whitespace-nowrap">
                    🪙 {entry.coins}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
