import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllTransactions,
  getAllUsers,
  adjustUserCoins,
} from '../../services/storage';
import { CoinTransaction, User } from '../../types';
import {
  Coins,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  TrendingUp,
  X,
} from 'lucide-react';

export const AdminCoinsPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<number>(100);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [reason, setReason] = useState<string>('Administrative manual adjustment');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setTransactions(getAllTransactions());
    const allUsers = getAllUsers();
    setUsers(allUsers);
    if (allUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(allUsers[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustCoins = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !currentAdmin) return;

    if (!amount || amount <= 0) {
      setNotice({ type: 'error', message: 'Please enter a valid positive coin amount.' });
      setTimeout(() => setNotice(null), 3000);
      return;
    }

    const delta = adjustmentType === 'credit' ? Math.abs(amount) : -Math.abs(amount);
    const res = adjustUserCoins(selectedUserId, delta, reason, currentAdmin);

    if (res.success) {
      loadData();
      setIsModalOpen(false);
      const target = users.find(u => u.id === selectedUserId);
      setNotice({
        type: 'success',
        message: `Successfully recorded ${adjustmentType === 'credit' ? '+' : '-'}${Math.abs(amount)} coins for ${
          target?.fullName || 'user'
        }.`,
      });
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice({ type: 'error', message: res.error || 'Adjustment failed.' });
      setTimeout(() => setNotice(null), 4000);
    }
  };

  // Stats
  const totalCirculation = users.reduce((acc, u) => acc + (u.coins ?? u.coinBalance ?? 0), 0);
  const totalCredited = transactions
    .filter(t => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);
  const totalDebited = Math.abs(
    transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0)
  );

  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const user = users.find(u => u.id === tx.userId);
      const name = user?.fullName.toLowerCase() || '';
      const username = user?.username.toLowerCase() || '';
      const desc = tx.description.toLowerCase();
      return name.includes(q) || username.includes(q) || desc.includes(q);
    }
    return true;
  });

  return (
    <div id="admin-coins-page" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Coins className="w-3.5 h-3.5" />
            <span>Treasury & Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Coin Management & Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete immutable ledger of task payouts, admin adjustments, and platform rewards.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(242,169,0,0.2)] transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Coins className="w-4 h-4" />
          <span>Manual Coin Adjustment</span>
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

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Total Coins in Circulation</div>
          <div className="text-2xl font-black text-[#FFD700] font-['Space_Grotesk']">🪙 {totalCirculation}</div>
          <div className="text-[10px] text-slate-500 font-mono">Sum of all current user balances</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Total Historical Inflows</div>
          <div className="text-2xl font-black text-emerald-400 font-['Space_Grotesk']">+{totalCredited}</div>
          <div className="text-[10px] text-slate-500 font-mono">Tasks & credits granted</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/5 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">Total Historical Outflows</div>
          <div className="text-2xl font-black text-rose-400 font-['Space_Grotesk']">-{totalDebited}</div>
          <div className="text-[10px] text-slate-500 font-mono">Penalties & manual debits</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#0F131C] border border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: 'all', label: 'All Transactions' },
            { key: 'task_reward', label: 'Task Rewards' },
            { key: 'admin_credit', label: 'Admin Credits' },
            { key: 'admin_debit', label: 'Admin Debits' },
            { key: 'giveaway_win', label: 'Giveaways' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                filterType === tab.key
                  ? 'bg-[#F2A900] text-black font-extrabold'
                  : 'text-slate-400 hover:text-white bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-[#F2A900]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#0F131C] border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#0A0D14]/60 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Description / Reference</th>
                <th className="py-3.5 px-4 text-right">Delta Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const targetUser = users.find(u => u.id === tx.userId);
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{targetUser?.fullName || 'User'}</div>
                        <div className="text-[11px] text-[#F2A900] font-mono">
                          @{targetUser?.username || 'user'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-white/5 text-slate-300">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 max-w-sm">{tx.description}</td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-black text-sm">
                        <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} Coins
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Coin Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#F2A900]" />
                <h3 className="text-lg font-extrabold text-white">Manual Coin Adjustment</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustCoins} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Target User</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (@{u.username}) — Balance: {u.coins ?? u.coinBalance ?? 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('credit')}
                  className={`py-2 rounded-xl font-bold font-mono uppercase text-xs border ${
                    adjustmentType === 'credit'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#0A0D14] border-white/5 text-slate-400'
                  }`}
                >
                  + Credit Coins
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('debit')}
                  className={`py-2 rounded-xl font-bold font-mono uppercase text-xs border ${
                    adjustmentType === 'debit'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-[#0A0D14] border-white/5 text-slate-400'
                  }`}
                >
                  - Deduct Coins
                </button>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">Amount</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={amount === 0 ? '' : amount}
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
                      setAmount(0);
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num >= 0) {
                        setAmount(num);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-[#F2A900]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-300 uppercase font-mono">
                  Reason for Ledger Record
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. Special community reward"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F2A900]"
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
                  className="px-5 py-2.5 rounded-xl bg-[#F2A900] text-black font-extrabold uppercase font-mono cursor-pointer shadow-[0_0_15px_rgba(242,169,0,0.2)]"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
