import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserRank,
  getActiveTasks,
  getUserPendingTasksCount,
  getActiveGiveaway,
  getTopLeaderboard,
  findUserById,
} from '../services/storage';
import {
  Coins,
  Trophy,
  Target,
  Clock,
  ArrowRight,
  Gift,
  FileText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

export const HomePage: React.FC = () => {
  const { user, navigateTo } = useAuth();
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncTick(t => t + 1);
    window.addEventListener('asjadfx_data_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('asjadfx_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Fetch real values from database with sync listener
  const freshUser = useMemo(() => {
    if (!user) return null;
    return findUserById(user.id) || user;
  }, [user, syncTick]);

  const userRankInfo = useMemo(() => {
    return freshUser ? getUserRank(freshUser.id) : { rank: null, totalRanked: 0 };
  }, [freshUser, syncTick]);

  const activeTasks = useMemo(() => {
    return getActiveTasks();
  }, [syncTick]);

  const pendingCount = useMemo(() => {
    return freshUser ? getUserPendingTasksCount(freshUser.id) : 0;
  }, [freshUser, syncTick]);

  const currentGiveaway = useMemo(() => {
    return getActiveGiveaway();
  }, [syncTick]);

  const topLeaderboard = useMemo(() => {
    return getTopLeaderboard(3);
  }, [syncTick]);

  return (
    <div id="asjadfx-home-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8 bg-gradient-to-br from-[#05070A] via-[#0A0D14] to-[#05070A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Space_Grotesk']">
            Welcome back, <span className="text-[#F2A900]">@{freshUser?.username}</span> 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 uppercase tracking-[0.2em] font-medium opacity-60">
            Trade. Earn. Rise.
          </p>
        </div>

        {/* 4 USER DASHBOARD STAT CARDS */}
        <section id="user-dashboard-cards">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* 1. CURRENT BALANCE */}
            <motion.div
              id="card-my-coins"
              whileHover={{ y: -2 }}
              onClick={() => navigateTo('/coins')}
              className="p-6 rounded-2xl bg-[#0F131C] border border-white/5 hover:border-[#F2A900]/30 transition-all relative overflow-hidden group cursor-pointer shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-5 group-hover:opacity-10 transition-opacity select-none">
                🪙
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 text-slate-300 font-mono">
                Current Balance
              </p>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-[#F2A900]">
                {freshUser?.coins ?? 0}{' '}
                <span className="text-xs opacity-40 font-sans uppercase text-slate-300 ml-1">
                  Coins
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Real approved coin balance</p>
            </motion.div>

            {/* 2. LEADERBOARD RANK */}
            <motion.div
              id="card-my-rank"
              whileHover={{ y: -2 }}
              onClick={() => navigateTo('/leaderboard')}
              className="p-6 rounded-2xl bg-[#0F131C] border border-white/5 hover:border-[#F2A900]/30 transition-all relative overflow-hidden group cursor-pointer shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-5 group-hover:opacity-10 transition-opacity select-none">
                🏆
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 text-slate-300 font-mono">
                Leaderboard Rank
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk']">
                {userRankInfo.rank !== null ? `#${userRankInfo.rank}` : 'Not Ranked Yet'}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                {userRankInfo.rank !== null
                  ? `Among ${userRankInfo.totalRanked} ranked traders`
                  : 'Earn approved coins to rank'}
              </p>
            </motion.div>

            {/* 3. AVAILABLE TASKS */}
            <motion.div
              id="card-available-tasks"
              whileHover={{ y: -2 }}
              onClick={() => navigateTo('/tasks')}
              className="p-6 rounded-2xl bg-[#0F131C] border border-white/5 hover:border-[#F2A900]/30 transition-all relative overflow-hidden group cursor-pointer shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-5 group-hover:opacity-10 transition-opacity select-none">
                🎯
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 text-slate-300 font-mono">
                Available Tasks
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Space_Grotesk']">
                {activeTasks.length > 0 ? `${activeTasks.length} Available` : '0 Available'}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Real tasks ready to complete</p>
            </motion.div>

            {/* 4. PENDING REVIEW */}
            <motion.div
              id="card-pending-review"
              whileHover={{ y: -2 }}
              onClick={() => navigateTo('/coins')}
              className="p-6 rounded-2xl bg-[#0F131C] border border-white/5 hover:border-[#F2A900]/30 transition-all relative overflow-hidden group cursor-pointer shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-5 group-hover:opacity-10 transition-opacity select-none">
                🕒
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 text-slate-300 font-mono">
                Pending Review
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk']">
                {pendingCount > 0 ? `${pendingCount} Pending` : '0 Pending'}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Awaiting admin verification</p>
            </motion.div>
          </div>
        </section>

        {/* MAIN 2-COLUMN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LATEST TASKS (Col 8) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk'] uppercase tracking-wider">
                <span className="text-[#F2A900]">✦</span> Latest Tasks
              </h3>
              <button
                id="btn-view-all-tasks-link"
                onClick={() => navigateTo('/tasks')}
                className="text-xs font-bold text-[#F2A900] opacity-80 hover:opacity-100 uppercase tracking-wider transition-opacity flex items-center gap-1 cursor-pointer"
              >
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              id="latest-tasks-container"
              className="bg-[#0A0D14]/60 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-8 sm:p-12 min-h-[220px]"
            >
              {activeTasks.length === 0 ? (
                <div id="latest-tasks-empty" className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4 grayscale opacity-40 select-none">
                    🎯
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white/60">No tasks available yet</h4>
                  <p className="text-xs sm:text-sm text-white/30 mt-2 max-w-[280px]">
                    Check back later for new trading and social media missions.
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  {activeTasks.map(task => (
                    <div
                      key={task.id}
                      id={`task-item-${task.id}`}
                      className="p-4 rounded-xl bg-[#0F131C] border border-white/5 flex items-center justify-between gap-4 text-left"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-[#F2A900] uppercase tracking-wider bg-[#F2A900]/10 px-2 py-0.5 rounded">
                          {task.platform}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1 truncate">{task.title}</h4>
                        <span className="text-xs text-emerald-400 font-bold">+{task.reward} Coins</span>
                      </div>
                      <button
                        onClick={() => navigateTo('/tasks')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F2A900] hover:bg-[#FFD700] text-[#05070A] font-bold text-xs shrink-0 cursor-pointer transition-all"
                      >
                        View Task
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Quick Actions & Active Giveaway (Col 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk'] uppercase tracking-wider">
                <span className="text-[#F2A900]">✦</span> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-quick-view-tasks"
                  onClick={() => navigateTo('/tasks')}
                  className="bg-[#161B24] hover:bg-[#1C232E] border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 transition-colors cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🎯</span>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-slate-200">View Tasks</span>
                </button>

                <button
                  id="btn-quick-leaderboard"
                  onClick={() => navigateTo('/leaderboard')}
                  className="bg-[#161B24] hover:bg-[#1C232E] border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 transition-colors cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🏆</span>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-slate-200">Leaderboard</span>
                </button>

                <button
                  id="btn-quick-giveaway"
                  onClick={() => navigateTo('/giveaway')}
                  className="bg-[#161B24] hover:bg-[#1C232E] border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 transition-colors cursor-pointer group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">🎁</span>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-slate-200">Giveaway</span>
                </button>

                <button
                  id="btn-quick-premium"
                  onClick={() => navigateTo('/premium')}
                  className="bg-gradient-to-b from-[#1E2330] to-[#121620] hover:border-[#FFD700]/50 border border-[#FFD700]/30 p-4 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer group shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">👑</span>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-[#FFD700]">VIP Premium</span>
                </button>

                <button
                  id="btn-quick-rules"
                  onClick={() => navigateTo('/rules')}
                  className="bg-[#161B24] hover:bg-[#1C232E] border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 transition-colors cursor-pointer group col-span-2"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">📜</span>
                  <span className="text-[11px] font-bold uppercase tracking-tight text-slate-200">Rules & Guidelines</span>
                </button>
              </div>
            </div>

            {/* Active Giveaway */}
            <div className="flex-1 flex flex-col gap-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk'] uppercase tracking-wider">
                <span className="text-[#F2A900]">✦</span> Active Giveaway
              </h3>
              <div
                id="current-giveaway-container"
                className="flex-1 bg-gradient-to-br from-[#161B24] to-[#0A0D14] border border-[#F2A900]/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center group min-h-[160px]"
              >
                {currentGiveaway === null ? (
                  <>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F2A900]/10 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform select-none">
                      🎁
                    </div>
                    <h4 className="text-xs font-bold text-white/40 mb-1 uppercase tracking-widest">Status</h4>
                    <p className="text-xs sm:text-sm text-white/30 italic">No active giveaway right now</p>
                  </>
                ) : (
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#F2A900] uppercase">
                      <Sparkles className="w-4 h-4" />
                      <span>Official Giveaway</span>
                    </div>
                    <h4 className="text-base font-extrabold text-white">{currentGiveaway.title}</h4>
                    <div className="p-3 rounded-xl bg-[#0F131C] border border-[#F2A900]/30">
                      <span className="text-xs text-slate-400 block">Prize:</span>
                      <span className="text-sm font-bold text-[#F2A900]">{currentGiveaway.prize}</span>
                    </div>
                    <button
                      onClick={() => navigateTo('/giveaway')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] to-[#FFD700] text-[#05070A] font-bold text-xs uppercase tracking-wider cursor-pointer"
                    >
                      View Giveaway
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TOP LEADERBOARD SECTION */}
        <section id="top-leaderboard-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk'] uppercase tracking-wider">
              <span className="text-[#F2A900]">✦</span> Top Leaderboard
            </h3>
            <button
              id="btn-view-full-leaderboard"
              onClick={() => navigateTo('/leaderboard')}
              className="text-xs font-bold text-[#F2A900] opacity-80 hover:opacity-100 uppercase tracking-wider transition-opacity flex items-center gap-1 cursor-pointer"
            >
              <span>Full Standings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            id="top-leaderboard-container"
            className="bg-[#0F131C] border border-white/5 rounded-2xl p-6 shadow-lg"
          >
            {topLeaderboard.length === 0 ? (
              <div id="leaderboard-empty" className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center text-2xl grayscale opacity-40 select-none">
                  🏆
                </div>
                <p className="text-sm font-semibold text-slate-300">No leaderboard data available yet.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Complete tasks to earn approved coins and claim the top positions on the global leaderboard.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topLeaderboard.map(item => {
                  const rankIcons = ['🥇 Rank 1', '🥈 Rank 2', '🥉 Rank 3'];
                  return (
                    <div
                      key={item.username}
                      id={`leaderboard-top-${item.rank}`}
                      className="p-4 rounded-xl bg-[#161B24] border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#F2A900]">
                          {rankIcons[item.rank - 1] || `Rank ${item.rank}`}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">@{item.username}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-[#F2A900]">
                          🪙 {item.coins}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase">Coins</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Fair Play & Verification Notice */}
        <div className="p-4 rounded-2xl bg-[#0A0D14]/80 border border-white/5 flex items-center gap-3 text-slate-400 text-xs">
          <ShieldCheck className="w-5 h-5 text-[#F2A900] shrink-0" />
          <span>
            ASJADFX strictly enforces fair task verification. All proofs are reviewed manually by administrators before coins are credited.
          </span>
        </div>
      </div>
    </div>
  );
};

