import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Check,
  AlertTriangle,
  Settings,
  ArrowDownLeft,
  ExternalLink,
  Copy,
  Users,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAllWalletTransactions,
  approveWalletDeposit,
  rejectWalletDeposit,
  getWalletConfig,
  updateWalletConfig,
  getAllUsers,
} from '../../services/storage';
import { WalletTransaction, WalletConfig } from '../../types';

export const AdminWalletPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletConfig, setWalletConfig] = useState<WalletConfig>(getWalletConfig());
  const [totalUserBalance, setTotalUserBalance] = useState<number>(0);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'successful' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Interaction state
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingTx, setRejectingTx] = useState<WalletTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [approvingTx, setApprovingTx] = useState<WalletTransaction | null>(null);
  const [approvalNote, setApprovalNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Wallet Configuration Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configUpiId, setConfigUpiId] = useState<string>(walletConfig.upiId);
  const [configReceiverName, setConfigReceiverName] = useState<string>(walletConfig.receiverName);
  const [configMinDeposit, setConfigMinDeposit] = useState<number>(walletConfig.minDepositAmount);
  const [configQrUrl, setConfigQrUrl] = useState<string>(walletConfig.qrCodeUrl || '');
  const [configInstructions, setConfigInstructions] = useState<string>(walletConfig.instructions);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const loadData = () => {
    const allTxs = getAllWalletTransactions();
    setTransactions(allTxs);
    const cfg = getWalletConfig();
    setWalletConfig(cfg);

    const users = getAllUsers();
    const sum = users.reduce((acc, u) => acc + (Number(u.walletBalance ?? u.wallet_balance ?? 0)), 0);
    setTotalUserBalance(sum);
  };

  useEffect(() => {
    loadData();
    const handleDataChanged = () => loadData();
    window.addEventListener('asjadfx_data_changed', handleDataChanged);
    return () => window.removeEventListener('asjadfx_data_changed', handleDataChanged);
  }, []);

  const handleApprove = () => {
    if (!currentAdmin || !approvingTx) return;
    setIsProcessing(true);
    setActionError(null);

    const res = approveWalletDeposit(approvingTx.id, currentAdmin, approvalNote);
    if (!res.success) {
      setActionError(res.error || 'Failed to approve deposit.');
      setIsProcessing(false);
      return;
    }

    setActionSuccess(`✅ Approved ₹${approvingTx.amount} for @${approvingTx.username}. User wallet balance has been credited.`);
    setApprovingTx(null);
    setApprovalNote('');
    setIsProcessing(false);
    loadData();
  };

  const handleReject = () => {
    if (!currentAdmin || !rejectingTx) return;
    if (!rejectionReason.trim()) {
      setActionError('Please enter a rejection reason.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    const res = rejectWalletDeposit(rejectingTx.id, currentAdmin, rejectionReason);
    if (!res.success) {
      setActionError(res.error || 'Failed to reject deposit.');
      setIsProcessing(false);
      return;
    }

    setActionSuccess(`❌ Rejected deposit of ₹${rejectingTx.amount} (Ref: ${rejectingTx.referenceId}). User notified.`);
    setRejectingTx(null);
    setRejectionReason('');
    setIsProcessing(false);
    loadData();
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    updateWalletConfig({
      upiId: configUpiId.trim(),
      receiverName: configReceiverName.trim(),
      minDepositAmount: Math.max(1, Number(configMinDeposit) || 10),
      qrCodeUrl: configQrUrl.trim(),
      instructions: configInstructions.trim(),
    });
    setWalletConfig(getWalletConfig());
    setIsSavingConfig(false);
    setIsConfigModalOpen(false);
    setActionSuccess('Wallet payment settings updated successfully!');
  };

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tx.referenceId.toLowerCase().includes(q) ||
      (tx.userFullName && tx.userFullName.toLowerCase().includes(q)) ||
      (tx.username && tx.username.toLowerCase().includes(q)) ||
      (tx.userEmail && tx.userEmail.toLowerCase().includes(q)) ||
      tx.amount.toString().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const successfulCount = transactions.filter((t) => t.status === 'successful').length;
  const rejectedCount = transactions.filter((t) => t.status === 'rejected').length;
  const totalVolume = transactions
    .filter((t) => t.status === 'successful')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Stat Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👛</span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Wallet Deposits & <span className="text-[#00FF66]">Ledger Management</span>
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verify user UPI deposits, validate bank UTR transaction IDs, approve cash credits, and configure deposit settings.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            id="admin-wallet-config-btn"
            onClick={() => {
              const cfg = getWalletConfig();
              setConfigUpiId(cfg.upiId);
              setConfigReceiverName(cfg.receiverName);
              setConfigMinDeposit(cfg.minDepositAmount);
              setConfigQrUrl(cfg.qrCodeUrl || '');
              setConfigInstructions(cfg.instructions);
              setIsConfigModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] cursor-pointer"
          >
            <Settings className="w-4 h-4 text-black" />
            <span>UPI & Deposit Settings</span>
          </button>
        </div>
      </div>

      {/* Notifications / Feedback */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0A0D14] border border-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Requires admin review</p>
        </div>

        <div className="rounded-2xl bg-[#0A0D14] border border-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Deposits Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            ₹{totalVolume.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{successfulCount} successful transactions</p>
        </div>

        <div className="rounded-2xl bg-[#0A0D14] border border-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total User Balances</span>
            <Users className="w-4 h-4 text-[#00FF66]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            ₹{totalUserBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total platform balance liability</p>
        </div>

        <div className="rounded-2xl bg-[#0A0D14] border border-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active UPI Receiver</span>
            <CreditCard className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-sm font-bold text-cyan-300 font-mono truncate">{walletConfig.upiId}</p>
          <p className="text-[11px] text-slate-500 mt-1 truncate">Min: ₹{walletConfig.minDepositAmount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0A0D14] p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#00FF66] text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            All Submissions ({transactions.length})
          </button>

          <button
            onClick={() => setStatusFilter('successful')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'successful'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({successfulCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by UTR / User / Amount..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
          />
        </div>
      </div>

      {/* Deposits List */}
      <div className="rounded-3xl bg-[#0A0D14] border border-white/10 overflow-hidden shadow-2xl">
        {filteredTxs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
              👛
            </div>
            <h3 className="text-sm font-bold text-white">No deposit requests match this view</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'All pending deposits have been reviewed! New submissions will appear here.'
                : 'No transactions found with the active search and filter.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTxs.map((tx) => {
              const txDate = new Date(tx.date);
              const formattedDate = !isNaN(txDate.getTime())
                ? txDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : tx.date;

              return (
                <div
                  key={tx.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Left Column: User & Deposit Info */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        tx.status === 'successful'
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : tx.status === 'pending'
                          ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse'
                          : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {tx.status === 'successful' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : tx.status === 'pending' ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <XCircle className="w-6 h-6" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-white">
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            tx.status === 'successful'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{formattedDate}</span>
                      </div>

                      {/* User details */}
                      <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                        <span className="font-bold text-white">{tx.userFullName || 'User'}</span>
                        <span className="text-[#00FF66] font-mono">@{tx.username}</span>
                        {tx.userEmail && <span className="text-slate-400">• {tx.userEmail}</span>}
                      </div>

                      {/* UTR Reference ID Box */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">UTR / Reference ID:</span>
                        <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 select-all">
                          {tx.referenceId}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(tx.referenceId)}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Copy UTR"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* User Notes */}
                      {tx.notes && (
                        <p className="text-xs text-slate-400 italic">
                          User remark: "{tx.notes}"
                        </p>
                      )}

                      {/* Rejection / Admin Notes */}
                      {tx.rejectionReason && (
                        <p className="text-xs text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          Rejection Reason: {tx.rejectionReason}
                        </p>
                      )}

                      {tx.adminNotes && (
                        <p className="text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg">
                          Admin Note: {tx.adminNotes}
                        </p>
                      )}

                      {tx.reviewedByAdminName && (
                        <p className="text-[10px] text-slate-500">
                          Reviewed by {tx.reviewedByAdminName} on{' '}
                          {tx.reviewedAt ? new Date(tx.reviewedAt).toLocaleString('en-IN') : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Screenshot & Approval Actions */}
                  <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                    {/* Proof Button */}
                    {tx.screenshotUrl ? (
                      <button
                        onClick={() => setSelectedProofUrl(tx.screenshotUrl!)}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Proof</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No proof attached</span>
                    )}

                    {/* Pending Action Buttons */}
                    {tx.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setRejectingTx(tx);
                            setRejectionReason('');
                            setActionError(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => {
                            setApprovingTx(tx);
                            setApprovalNote('');
                            setActionError(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Approve & Credit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APPROVE CONFIRMATION MODAL */}
      <AnimatePresence>
        {approvingTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Approve Wallet Deposit</span>
                </h3>
                <button
                  onClick={() => setApprovingTx(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <span className="font-bold text-white">
                    {approvingTx.userFullName} (@{approvingTx.username})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount to Credit:</span>
                  <span className="font-bold text-emerald-400 text-base font-mono">
                    ₹{approvingTx.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UTR / Ref:</span>
                  <span className="font-mono text-slate-200">{approvingTx.referenceId}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Verification Note (Optional)
                </label>
                <input
                  type="text"
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="e.g. Bank credit confirmed on ICICI UPI"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setApprovingTx(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Crediting...' : 'Confirm & Credit Wallet'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REJECT CONFIRMATION MODAL */}
      <AnimatePresence>
        {rejectingTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Reject Deposit Request</span>
                </h3>
                <button
                  onClick={() => setRejectingTx(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
                <p className="text-slate-300">
                  You are rejecting the ₹{rejectingTx.amount} deposit from @{rejectingTx.username} (UTR: {rejectingTx.referenceId}).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR not reflected in bank account statement / Invalid screenshot"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingTx(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Reject Submission'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WALLET CONFIGURATION MODAL */}
      <AnimatePresence>
        {isConfigModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#00FF66]" />
                  <span>Configure UPI Payment Details</span>
                </h3>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Official Receiver UPI ID <span className="text-[#00FF66]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={configUpiId}
                    onChange={(e) => setConfigUpiId(e.target.value)}
                    placeholder="e.g. asjadfx@upi or trader@icici"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Receiver Display Name <span className="text-[#00FF66]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={configReceiverName}
                    onChange={(e) => setConfigReceiverName(e.target.value)}
                    placeholder="e.g. ASJADFX Official"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Minimum Deposit Amount (₹) <span className="text-[#00FF66]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={configMinDeposit}
                    onChange={(e) => setConfigMinDeposit(parseInt(e.target.value) || 10)}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    QR Code Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={configQrUrl}
                    onChange={(e) => setConfigQrUrl(e.target.value)}
                    placeholder="https://... or leave blank for UPI ID only"
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Payment Instructions (Shown on Add Money page)
                  </label>
                  <textarea
                    rows={4}
                    value={configInstructions}
                    onChange={(e) => setConfigInstructions(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-6 py-2.5 rounded-xl bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-extrabold text-xs shadow-lg cursor-pointer"
                  >
                    {isSavingConfig ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROOF VIEWER MODAL */}
      <AnimatePresence>
        {selectedProofUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedProofUrl(null)}
          >
            <div
              className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-2xl w-full p-4 relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  User Payment Slip Verification
                </h4>
                <button
                  onClick={() => setSelectedProofUrl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
                <img
                  src={selectedProofUrl}
                  alt="Payment Slip Proof"
                  className="max-w-full rounded-xl object-contain border border-white/10"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
