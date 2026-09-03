import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Upload,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  QrCode,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getUserWalletBalance,
  getUserWalletTransactions,
  getWalletConfig,
  submitWalletDeposit,
} from '../services/storage';
import { uploadScreenshotProofToSupabase } from '../services/supabase';
import { WalletTransaction, WalletConfig } from '../types';

export const WalletPage: React.FC = () => {
  const { user, navigateTo } = useAuth();

  const [walletConfig, setWalletConfig] = useState<WalletConfig>(getWalletConfig());
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Money Form State
  const [activeTab, setActiveTab] = useState<'overview' | 'add_money'>('overview');
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // UI helpers
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'successful' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load fresh user wallet data
  const refreshWalletData = () => {
    if (!user) return;
    const currentConfig = getWalletConfig();
    setWalletConfig(currentConfig);
    const userBal = getUserWalletBalance(user.id);
    setBalance(userBal);
    const userTxs = getUserWalletTransactions(user.id);
    setTransactions(userTxs);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshWalletData();

    // Listen for cross-tab or background data change updates
    const handleDataChanged = () => {
      refreshWalletData();
    };
    window.addEventListener('asjadfx_data_changed', handleDataChanged);
    return () => window.removeEventListener('asjadfx_data_changed', handleDataChanged);
  }, [user]);

  const handleCopyUpi = () => {
    if (!walletConfig.upiId) return;
    navigator.clipboard.writeText(walletConfig.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB. Please upload a compressed screenshot.');
      return;
    }

    setErrorMsg(null);
    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDropFile = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please drop a valid image file.');
      return;
    }

    setErrorMsg(null);
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    setErrorMsg(null);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < walletConfig.minDepositAmount) {
      setErrorMsg(`Minimum Add Money amount is ₹${walletConfig.minDepositAmount}.`);
      return;
    }

    const cleanRef = referenceId.trim();
    if (!cleanRef || cleanRef.length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI / UTR Transaction ID (min 6 characters).');
      return;
    }

    if (!screenshotPreview && !screenshotFile) {
      setErrorMsg('Please attach your payment screenshot proof so admin can verify your deposit.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload proof to Supabase storage if file present, fallback to base64
      let uploadedUrl = screenshotPreview;
      if (screenshotFile) {
        uploadedUrl = await uploadScreenshotProofToSupabase(screenshotFile, user.id, 'wallet_deposit');
      }

      const result = submitWalletDeposit(user, {
        amount: numAmount,
        referenceId: cleanRef,
        screenshotUrl: uploadedUrl,
        notes: userNotes,
      });

      if (!result.success) {
        setErrorMsg(result.error || 'Failed to submit deposit request. Please verify details.');
        setIsSubmitting(false);
        return;
      }

      // Success
      setSuccessMsg(
        `🎉 Deposit request for ₹${numAmount} submitted successfully! Your reference ID is "${cleanRef}". Admin will verify and credit your wallet shortly.`
      );
      setAmount('');
      setReferenceId('');
      setUserNotes('');
      setScreenshotPreview('');
      setScreenshotFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      refreshWalletData();
      setActiveTab('overview');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTxs = transactions.filter((tx) => {
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;
  const successfulCount = transactions.filter((t) => t.status === 'successful').length;

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 pb-28">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                👛
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ASJADFX <span className="text-emerald-400">Wallet</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                INR Ledger
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xl">
              Official Indian Rupee (₹) balance and transaction ledger. Add money securely via UPI,
              track payment verification status, and audit your complete ledger.
            </p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-2 bg-[#0A0D14] p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <button
              id="wallet-tab-overview"
              onClick={() => {
                setActiveTab('overview');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview & Ledger
            </button>
            <button
              id="wallet-tab-add-money"
              onClick={() => {
                setActiveTab('add_money');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add_money'
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>+ Add Money</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">Min ₹10</span>
            </button>
          </div>
        </div>

        {/* Success / Info Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold text-white mb-0.5">Submission Received</p>
                <p>{successMsg}</p>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 shadow-lg"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold text-white mb-0.5">Attention Required</p>
                <p>{errorMsg}</p>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance & Action Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Balance Card */}
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1420] via-[#0A0D14] to-[#05070A] border border-white/10 p-6 sm:p-8 shadow-2xl">
            {/* Background Glow Accents */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                    Live Available Balance
                  </span>
                </div>
                <button
                  onClick={refreshWalletData}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Ledger</span>
                </button>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">₹</span>
                  <span className="text-4xl sm:text-6xl font-black text-white tracking-tight font-mono">
                    {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span>Owner:</span>
                  <span className="text-slate-200 font-semibold">{user?.fullName || user?.username}</span>
                  <span>•</span>
                  <span>Currency:</span>
                  <span className="text-slate-200 font-semibold">Indian Rupee (INR)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  id="wallet-add-money-btn"
                  onClick={() => setActiveTab('add_money')}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Add Money (UPI)</span>
                </button>

                {/* Withdrawal button (Strictly Coming Soon as per instructions) */}
                <div className="relative group">
                  <button
                    disabled
                    id="wallet-withdraw-btn"
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm flex items-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                    <span>Withdraw Funds</span>
                    <span className="ml-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Coming Soon
                    </span>
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-[#0D111A] border border-white/15 rounded-xl shadow-2xl text-[11px] text-slate-300 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-30">
                    Real-money automatic payouts & bank withdrawals are in final compliance integration and will unlock soon.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats & Security Card */}
          <div className="rounded-3xl bg-[#0A0D14] border border-white/10 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security & Deposit Policy</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Minimum Deposit</span>
                  <span className="font-mono font-bold text-emerald-400">₹{walletConfig.minDepositAmount}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Pending Verifications</span>
                  <span className="font-mono font-bold text-amber-400">{pendingCount} request(s)</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">Completed Credits</span>
                  <span className="font-mono font-bold text-white">{successfulCount}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                All deposit payments are validated by bank UTR numbers. Duplicate transactions are
                permanently blocked.
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: ADD MONEY FORM */}
        {activeTab === 'add_money' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-[#0A0D14] border border-white/10 p-6 sm:p-8 space-y-8"
          >
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Add Money via UPI / QR</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono font-normal">
                    Min ₹{walletConfig.minDepositAmount}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pay to the official ASJADFX UPI account, then submit your 12-digit UTR reference ID and screenshot proof.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5"
              >
                Back to Ledger
              </button>
            </div>

            {/* Step 1: Admin-Configured UPI Details & Instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Payment Details Box */}
              <div className="lg:col-span-1 rounded-2xl bg-[#0F131C] border border-white/10 p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Step 1: Send Payment
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    Instant UPI
                  </span>
                </div>

                {/* Receiver Info */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">Official UPI ID</label>
                    <div className="mt-1 flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                      <span className="text-xs sm:text-sm font-mono font-bold text-[#00FF66] truncate">
                        {walletConfig.upiId}
                      </span>
                      <button
                        onClick={handleCopyUpi}
                        className="ml-2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">Receiver Name</label>
                    <p className="mt-0.5 text-xs text-slate-200 font-medium">{walletConfig.receiverName}</p>
                  </div>

                  {/* QR Code if configured */}
                  {walletConfig.qrCodeUrl ? (
                    <div className="mt-3 flex flex-col items-center p-3 bg-white rounded-xl">
                      <img
                        src={walletConfig.qrCodeUrl}
                        alt="ASJADFX UPI QR"
                        className="w-40 h-40 object-contain"
                      />
                      <span className="text-[10px] text-slate-700 font-semibold mt-1">
                        Scan with Google Pay / PhonePe / Paytm
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center gap-3">
                      <QrCode className="w-8 h-8 text-emerald-400 shrink-0" />
                      <div className="text-[11px] text-slate-300">
                        <p className="font-semibold text-white">Direct UPI Transfer</p>
                        <p className="text-slate-400">Copy the UPI ID above and pay in any app.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Form */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSubmitDeposit} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Step 2: Enter Amount Paid (₹) <span className="text-emerald-400">*</span>
                    </label>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[10, 50, 100, 200, 500, 1000].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleQuickAmount(chip)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                            amount === chip.toString()
                              ? 'bg-emerald-500 text-black border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          }`}
                        >
                          ₹{chip}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-emerald-400 font-mono font-black text-lg">
                        ₹
                      </span>
                      <input
                        id="wallet-deposit-amount"
                        type="number"
                        min={walletConfig.minDepositAmount}
                        step="any"
                        required
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder={`Enter amount (Minimum ₹${walletConfig.minDepositAmount})`}
                        className="w-full pl-10 pr-4 py-3 bg-[#0F131C] border border-white/10 rounded-2xl text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-base"
                      />
                    </div>
                  </div>

                  {/* UTR / Transaction ID */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Step 3: UTR / UPI Transaction Reference Number <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      id="wallet-deposit-utr"
                      type="text"
                      required
                      value={referenceId}
                      onChange={(e) => {
                        setReferenceId(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="e.g. 423981729012 (12-digit UTR from your UPI payment slip)"
                      className="w-full px-4 py-3 bg-[#0F131C] border border-white/10 rounded-2xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Found in Google Pay / PhonePe / Paytm under "UPI transaction ID" or "UTR". Duplicate IDs will be rejected.
                    </p>
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Step 4: Payment Screenshot Proof <span className="text-emerald-400">*</span>
                    </label>

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropFile}
                      className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-6 text-center bg-[#0F131C] transition-all cursor-pointer relative"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      {screenshotPreview ? (
                        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block max-w-full">
                            <img
                              src={screenshotPreview}
                              alt="Payment proof preview"
                              className="max-h-56 rounded-xl border border-white/20 shadow-lg object-contain mx-auto"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setScreenshotPreview('');
                                setScreenshotFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="absolute -top-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Screenshot attached ready for submission</span>
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-200">
                            Click to upload or drag and drop payment screenshot
                          </p>
                          <p className="text-[11px] text-slate-400">
                            PNG, JPG, or WEBP (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Optional Remarks
                    </label>
                    <input
                      type="text"
                      value={userNotes}
                      onChange={(e) => setUserNotes(e.target.value)}
                      placeholder="e.g. Paid via Google Pay from account ending in 4102"
                      className="w-full px-4 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>

                    <button
                      id="wallet-submit-deposit-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-black" />
                          <span>Submit Deposit Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: TRANSACTION LEDGER & HISTORY */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>Wallet Transaction Ledger</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  {transactions.length} total
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verified history of deposits, credits, and review notes.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search UTR / Amount..."
                  className="pl-8 pr-3 py-1.5 bg-[#0A0D14] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 bg-[#0A0D14] p-1 rounded-xl border border-white/10">
                {(['all', 'successful', 'pending', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ledger Table / List */}
          <div className="rounded-3xl bg-[#0A0D14] border border-white/10 overflow-hidden shadow-xl">
            {filteredTxs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                  👛
                </div>
                <h3 className="text-sm font-bold text-white">No transactions found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No records match your selected search or filter criteria.'
                    : 'You have not made any deposits yet. Click "+ Add Money" above to credit your wallet.'}
                </p>
                {activeTab !== 'add_money' && (
                  <button
                    onClick={() => setActiveTab('add_money')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors inline-block mt-2 cursor-pointer"
                  >
                    + Add Money Now
                  </button>
                )}
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
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            tx.status === 'successful'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {tx.status === 'successful' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : tx.status === 'pending' ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Deposit via {tx.paymentMethod || 'UPI'}
                            </span>
                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                tx.status === 'successful'
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                  : tx.status === 'pending'
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
                                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                            <span>Ref / UTR:</span>
                            <span className="font-mono text-slate-200 font-semibold">{tx.referenceId}</span>
                            <span>•</span>
                            <span>{formattedDate}</span>
                          </div>

                          {/* Rejection reason or Admin notes */}
                          {tx.status === 'rejected' && tx.rejectionReason && (
                            <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                              Reason: {tx.rejectionReason}
                            </div>
                          )}

                          {tx.adminNotes && (
                            <div className="mt-1 text-xs text-slate-400 italic">
                              Note: {tx.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Amount and Proof */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                        {tx.screenshotUrl && (
                          <button
                            onClick={() => setSelectedProofUrl(tx.screenshotUrl!)}
                            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 transition-colors cursor-pointer"
                            title="View Payment Screenshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Proof</span>
                          </button>
                        )}

                        <div className="text-right">
                          <span
                            className={`text-base sm:text-lg font-black font-mono ${
                              tx.status === 'successful'
                                ? 'text-emerald-400'
                                : tx.status === 'pending'
                                ? 'text-amber-300'
                                : 'text-slate-500 line-through'
                            }`}
                          >
                            +{Number(tx.amount).toLocaleString('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          {tx.balanceAfter !== undefined && tx.status === 'successful' && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              Bal: ₹{tx.balanceAfter.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Screenshot Modal Viewer */}
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
                className="bg-[#0D111A] border border-white/20 rounded-3xl max-w-xl w-full p-4 relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Payment Screenshot Proof
                  </h4>
                  <button
                    onClick={() => setSelectedProofUrl(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-auto flex items-center justify-center">
                  <img
                    src={selectedProofUrl}
                    alt="Payment Screenshot"
                    className="max-w-full rounded-xl object-contain border border-white/10"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
