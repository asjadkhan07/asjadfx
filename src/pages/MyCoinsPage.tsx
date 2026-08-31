import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserCoinTransactions, getUserSubmissions, findUserById } from '../services/storage';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  TrendingUp,
  Sparkles,
  Award,
} from 'lucide-react';
import { motion } from 'motion/react';

export const MyCoinsPage: React.FC = () => {
  const { user, navigateTo } = useAuth();
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
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

  const freshUser = useMemo(() => {
    if (!user) return null;
    return findUserById(user.id) || user;
  }, [user, syncTick]);

  const transactions = useMemo(() => {
    return freshUser ? getUserCoinTransactions(freshUser.id) : [];
  }, [freshUser, syncTick]);

  const totalEarned = useMemo(() => {
    return transactions
      .filter(tx => (tx.type === 'credit' || (tx.amount && tx.amount > 0)) && (tx.status === 'approved' || tx.status === 'completed'))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [transactions]);

  const totalTasksApproved = useMemo(() => {
    if (!freshUser) return 0;
    const subs = getUserSubmissions(freshUser.id);
    return subs.filter(s => s.status === 'approved').length;
  }, [freshUser, syncTick]);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div id="asjadfx-my-coins-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Coins className="w-3.5 h-3.5" />
            <span>Wallet & Coin Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            My Coins & Transaction History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your verified earnings, approved task rewards, and ledger transaction history.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            id="current-balance-card"
            className="p-6 rounded-3xl bg-gradient-to-br from-[#0F131C] via-[#0A0D14] to-[#0F131C] border border-[#F2A900]/40 shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F2A900]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#F2A900] font-mono">
                CURRENT BALANCE
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span
                  id="user-current-balance"
                  className="text-3xl sm:text-4xl font-black text-white font-['Space_Grotesk'] tracking-tight"
                >
                  🪙 {freshUser?.coins ?? 0}
                </span>
                <span className="text-xs font-bold text-[#F2A900] uppercase">
                  Coins
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              Usable for giveaways & community rewards.
            </p>
          </motion.div>

          {/* Total Earned */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-3xl bg-[#0F131C] border border-emerald-500/20 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                  TOTAL EARNED
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-['Space_Grotesk'] tracking-tight">
                  +{totalEarned}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Lifetime
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              Cumulative coins credited from verified tasks.
            </p>
          </motion.div>

          {/* Tasks Approved */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-[#0F131C] border border-white/5 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-mono">
                  TASKS REWARDED
                </span>
                <Award className="w-4 h-4 text-[#F2A900]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                  {totalTasksApproved}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Approved
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => navigateTo('/tasks')}
                className="text-xs font-bold text-[#F2A900] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Earn more coins</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* COIN HISTORY SECTION */}
        <section id="coin-history-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk'] uppercase tracking-wider">
                TRANSACTION HISTORY
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400">
                {filteredTransactions.length} records
              </span>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0F131C] rounded-xl border border-white/5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                  filter === 'all' ? 'bg-[#F2A900] text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setFilter('credit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                  filter === 'credit' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                EARNED (+)
              </button>
              <button
                onClick={() => setFilter('debit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                  filter === 'debit' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                SPENT (-)
              </button>
            </div>
          </div>

          <div
            id="coin-history-container"
            className="bg-[#0F131C] border border-white/5 rounded-3xl overflow-hidden shadow-xl p-5 sm:p-6"
          >
            {filteredTransactions.length === 0 ? (
              <div id="coin-transactions-empty" className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                  <Coins className="w-7 h-7 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-slate-300">No transactions found.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  When your submitted tasks are reviewed and approved by administrators, your coin credits will appear here.
                </p>
                <button
                  onClick={() => navigateTo('/tasks')}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#161B24] hover:bg-[#1C232E] border border-white/10 text-[#F2A900] text-xs font-bold transition-colors cursor-pointer"
                >
                  Browse Available Tasks
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-[11px] uppercase tracking-wider font-mono">
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Reason</th>
                      <th className="pb-3 font-semibold">Task / Action</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} id={`tx-row-${tx.id}`} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 font-bold font-['Space_Grotesk']">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-sm ${
                              tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {tx.amount > 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Coins
                          </span>
                        </td>
                        <td className="py-4 text-slate-200 font-medium">{tx.reason}</td>
                        <td className="py-4 text-slate-400 font-mono text-xs">
                          {tx.taskTitle || tx.source || 'General'}
                        </td>
                        <td className="py-4 text-slate-400 text-xs font-mono">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                              tx.status === 'approved' || tx.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : tx.status === 'pending'
                                ? 'bg-[#F2A900]/10 text-[#F2A900] border border-[#F2A900]/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Security / Verification Disclaimer */}
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 flex items-center gap-3 text-slate-400 text-xs">
          <Shield className="w-5 h-5 text-[#F2A900] shrink-0" />
          <span>
            Every coin transaction is cryptographically ledgered and tied to verified proof submissions and admin auditing.
          </span>
        </div>
      </div>
    </div>
  );
};
