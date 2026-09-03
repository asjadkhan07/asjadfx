import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminDashboardStats,
  getAllSubmissions,
  getAllTasks,
  getPlatforms,
  getAllWalletTransactions,
  getAllDonations,
} from '../../services/storage';
import { TaskSubmission, Task, PlatformConfig } from '../../types';
import {
  Users,
  Target,
  Camera,
  Coins,
  Gift,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Heart,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { navigateTo } = useAuth();
  const [stats, setStats] = useState(getAdminDashboardStats());
  const [recentSubmissions, setRecentSubmissions] = useState<TaskSubmission[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [pendingWalletCount, setPendingWalletCount] = useState<number>(0);
  const [pendingDonationsCount, setPendingDonationsCount] = useState<number>(0);

  useEffect(() => {
    setStats(getAdminDashboardStats());
    setRecentSubmissions(getAllSubmissions().slice(0, 5));
    setTasks(getAllTasks());
    setPlatforms(getPlatforms());
    const allTxs = getAllWalletTransactions();
    setPendingWalletCount(allTxs.filter((t) => t.status === 'pending').length);
    const allDon = getAllDonations();
    setPendingDonationsCount(allDon.filter((d) => d.status === 'pending').length);
  }, []);

  return (
    <div id="admin-dashboard-page" className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Real Database Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Administrator Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time platform metrics, task orchestration, user governance, and submission auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigateTo('/admin/wallet')}
            className="px-4 py-2.5 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 hover:bg-[#00FF66]/20 text-[#00FF66] text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,255,102,0.15)]"
          >
            <Wallet className="w-4 h-4 text-[#00FF66]" />
            <span>Wallet Deposits</span>
            {pendingWalletCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#00FF66] text-black text-[10px] font-mono font-black ml-1">
                {pendingWalletCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigateTo('/admin/donations')}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)]"
          >
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
            <span>Donations</span>
            {pendingDonationsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-black ml-1">
                {pendingDonationsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigateTo('/admin/tasks')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(242,169,0,0.2)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Target className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
          <button
            onClick={() => navigateTo('/admin/submissions')}
            className="px-4 py-2.5 rounded-xl bg-[#161B24] border border-white/10 hover:bg-[#1C232E] text-slate-200 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4 text-[#F2A900]" />
            <span>Review Submissions</span>
          </button>
        </div>
      </div>

      {/* Real Statistics Grid (10 Required Real Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">{stats.totalUsers}</div>
          <div className="text-[10px] text-slate-500 font-mono">Registered accounts</div>
        </div>

        {/* Active Users */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Active Users</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-['Space_Grotesk']">{stats.activeUsers}</div>
          <div className="text-[10px] text-slate-500 font-mono">Good standing</div>
        </div>

        {/* Banned Users */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Banned Users</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-['Space_Grotesk']">{stats.bannedUsers}</div>
          <div className="text-[10px] text-slate-500 font-mono">Policy violators</div>
        </div>

        {/* Total Tasks */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Tasks</span>
            <Target className="w-4 h-4 text-[#F2A900]" />
          </div>
          <div className="text-2xl font-black text-white font-['Space_Grotesk']">{stats.totalTasks}</div>
          <div className="text-[10px] text-slate-500 font-mono">Across platforms</div>
        </div>

        {/* Active Tasks */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Active Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[#F2A900] font-['Space_Grotesk']">{stats.activeTasks}</div>
          <div className="text-[10px] text-slate-500 font-mono">Live for users</div>
        </div>

        {/* Pending Submissions */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-[#F2A900]">Pending Review</span>
            <Clock className="w-4 h-4 text-[#F2A900]" />
          </div>
          <div className="text-2xl font-black text-[#F2A900] font-['Space_Grotesk']">{stats.pendingSubmissions}</div>
          <div className="text-[10px] text-slate-500 font-mono">Awaiting verification</div>
        </div>

        {/* Approved Submissions */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-['Space_Grotesk']">{stats.approvedSubmissions}</div>
          <div className="text-[10px] text-slate-500 font-mono">Coins credited</div>
        </div>

        {/* Rejected Submissions */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-['Space_Grotesk']">{stats.rejectedSubmissions}</div>
          <div className="text-[10px] text-slate-500 font-mono">Invalid proofs</div>
        </div>

        {/* Total Coins Distributed */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Coins Distributed</span>
            <Coins className="w-4 h-4 text-[#F2A900]" />
          </div>
          <div className="text-2xl font-black text-[#FFD700] font-['Space_Grotesk']">🪙 {stats.totalCoinsDistributed}</div>
          <div className="text-[10px] text-slate-500 font-mono">Net approved payout</div>
        </div>

        {/* Active Giveaways */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Active Giveaways</span>
            <Gift className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-['Space_Grotesk']">{stats.activeGiveawaysCount}</div>
          <div className="text-[10px] text-slate-500 font-mono">Current events</div>
        </div>
      </div>

      {/* Platform Status Overview & Pending Submissions Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Submissions Queue (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0F131C] border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#F2A900]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Recent Submissions Queue
              </h2>
            </div>
            <button
              onClick={() => navigateTo('/admin/submissions')}
              className="text-xs font-semibold text-[#F2A900] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/5 rounded-xl">
              <Camera className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No submissions pending.</p>
              <p className="text-[11px] text-slate-600">User task submissions will appear here for review.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-[#0A0D14] border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{sub.fullName}</span>
                      <span className="text-[11px] text-[#F2A900] font-mono">@{sub.username}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-slate-300 font-mono">
                        {sub.platform}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{sub.taskTitle}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                        sub.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sub.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {sub.status}
                    </span>
                    <button
                      onClick={() => navigateTo('/admin/submissions')}
                      className="px-2.5 py-1 rounded-lg bg-[#161B24] border border-white/10 hover:bg-[#1C232E] text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platforms Status Quick Summary (1 Col) */}
        <div className="rounded-2xl bg-[#0F131C] border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#F2A900]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Platform Routing
              </h2>
            </div>
            <button
              onClick={() => navigateTo('/admin/platforms')}
              className="text-xs font-semibold text-[#F2A900] hover:underline cursor-pointer"
            >
              Configure
            </button>
          </div>

          <div className="space-y-2">
            {platforms.map(plt => {
              const platformTasksCount = tasks.filter(t => t.platform === plt.key).length;
              return (
                <div
                  key={plt.id}
                  className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{plt.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{plt.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {platformTasksCount} {platformTasksCount === 1 ? 'task' : 'tasks'} created
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono ${
                      plt.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {plt.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
