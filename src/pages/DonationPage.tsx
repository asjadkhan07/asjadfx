import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trophy,
  ShieldCheck,
  Eye,
  X,
  Info,
  QrCode,
  RefreshCw,
  UserCheck,
  UserX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getDonationConfig,
  getApprovedDonations,
  getUserDonations,
  submitDonation,
} from '../services/storage';
import { uploadScreenshotProofToSupabase } from '../services/supabase';
import { Donation, DonationConfig } from '../types';

export const DonationPage: React.FC = () => {
  const { user } = useAuth();

  const [config, setConfig] = useState<DonationConfig>(getDonationConfig());
  const [approvedLeaderboard, setApprovedLeaderboard] = useState<Donation[]>([]);
  const [userHistory, setUserHistory] = useState<Donation[]>([]);
  const [activeTab, setActiveTab] = useState<'donate' | 'leaderboard' | 'my_donations'>('donate');

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // UI state
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadData = () => {
    setConfig(getDonationConfig());
    setApprovedLeaderboard(getApprovedDonations());
    if (user) {
      setUserHistory(getUserDonations(user.id));
    }
  };

  useEffect(() => {
    reloadData();
    const handleDataChanged = () => reloadData();
    window.addEventListener('asjadfx_data_changed', handleDataChanged);
    return () => window.removeEventListener('asjadfx_data_changed', handleDataChanged);
  }, [user]);

  const handleCopyUpi = () => {
    if (!config.upiId) return;
    navigator.clipboard.writeText(config.upiId);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please log in to submit a donation.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 1) {
      setErrorMsg('Please enter a valid donation amount (minimum ₹1).');
      return;
    }

    const cleanRef = referenceId.trim();
    if (!cleanRef || cleanRef.length < 5) {
      setErrorMsg('Please enter a valid UPI / UTR Transaction ID (minimum 5 digits).');
      return;
    }

    if (!screenshotPreview && !screenshotFile) {
      setErrorMsg('Please attach your payment screenshot receipt so admin can verify your donation.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedUrl = screenshotPreview;
      if (screenshotFile) {
        uploadedUrl = await uploadScreenshotProofToSupabase(screenshotFile, user.id, 'donation_proof');
      }

      const res = submitDonation(user, {
        amount: numAmount,
        referenceId: cleanRef,
        screenshotUrl: uploadedUrl,
        isAnonymous,
        message,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to submit donation.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(
        `❤️ Thank you! Your donation request for ₹${numAmount} has been recorded (Ref: ${cleanRef}). Once verified by admin, your contribution will be featured on the Donation Leaderboard.`
      );
      setAmount('');
      setReferenceId('');
      setMessage('');
      setScreenshotPreview('');
      setScreenshotFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      reloadData();
      setActiveTab('my_donations');
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalDonationVolume = approvedLeaderboard.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/10 border border-rose-500/30 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                ❤️
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                ASJADFX <span className="text-rose-400">Donation</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400">
                ₹1+ Community Support
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Voluntary contributions to support trader education, platform welfare, and community initiatives.
              Donate any amount starting from ₹1 via UPI.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-[#0A0D14] p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('donate')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'donate'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Donate Now</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>Leaderboard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                {approvedLeaderboard.length}
              </span>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('my_donations')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'my_donations'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Donations ({userHistory.length})
              </button>
            )}
          </div>
        </div>

        {/* Success / Error Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1 text-xs sm:text-sm">
                <p className="font-bold text-white mb-0.5">Donation Received</p>
                <p>{successMsg}</p>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-rose-400 hover:text-white p-1">
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
              <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cause Banner Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16101E] via-[#0E0C16] to-[#07070C] border border-rose-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Verified Beneficiary Cause</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {config.causeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {config.causeDescription}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                <span>Beneficiary:</span>
                <span className="text-rose-300 font-semibold">{config.beneficiaryName}</span>
              </div>
            </div>

            {/* Total Raised & Supporter Counter */}
            <div className="rounded-2xl bg-black/40 border border-white/10 p-5 shrink-0 flex md:flex-col items-center justify-between md:justify-center gap-4 text-center min-w-[200px]">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                  Community Raised
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#00FF66] font-mono">
                  ₹{totalDonationVolume.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </div>
              </div>
              <div className="border-l md:border-l-0 md:border-t border-white/10 pl-4 md:pl-0 md:pt-3">
                <span className="text-xs text-slate-400 font-semibold">
                  {approvedLeaderboard.length} verified donors
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: DONATE FORM */}
        {activeTab === 'donate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Payment Receiver Info */}
            <div className="lg:col-span-1 rounded-3xl bg-[#0A0D14] border border-white/10 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>UPI Payment Details</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-mono">
                  Min ₹1
                </span>
              </div>

              {/* UPI ID */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Official UPI ID</label>
                  <div className="mt-1 flex items-center justify-between bg-[#0F131C] border border-white/10 rounded-2xl px-3.5 py-2.5">
                    <span className="text-xs sm:text-sm font-mono font-bold text-rose-300 truncate">
                      {config.upiId}
                    </span>
                    <button
                      onClick={handleCopyUpi}
                      className="ml-2 text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Receiver Name</label>
                  <p className="mt-0.5 text-xs text-slate-200 font-medium">{config.receiverName}</p>
                </div>

                {/* QR Code if present */}
                {config.qrCodeUrl ? (
                  <div className="mt-4 flex flex-col items-center p-3.5 bg-white rounded-2xl">
                    <img
                      src={config.qrCodeUrl}
                      alt="ASJADFX Donation UPI QR"
                      className="w-40 h-40 object-contain"
                    />
                    <span className="text-[10px] text-slate-700 font-semibold mt-1">
                      Scan with any UPI App (GPay / PhonePe / Paytm)
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center gap-3">
                    <QrCode className="w-8 h-8 text-rose-400 shrink-0" />
                    <div className="text-[11px] text-slate-300">
                      <p className="font-semibold text-white">Direct UPI Transfer</p>
                      <p className="text-slate-400">Copy the official UPI ID above to send payment.</p>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-[11px] text-slate-400 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    100% voluntary contribution. Every rupee goes directly to community welfare and educational operations.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Form */}
            <div className="lg:col-span-2 rounded-3xl bg-[#0A0D14] border border-white/10 p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Submit Donation Verification</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter the amount sent, 12-digit UPI UTR number, and receipt screenshot.
                  </p>
                </div>

                {/* Amount Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Donation Amount (₹) <span className="text-rose-400">*</span>
                  </label>

                  {/* Quick Amount Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[1, 10, 50, 100, 250, 500, 1000, 2500].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => handleQuickAmount(chip)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          amount === chip.toString()
                            ? 'bg-rose-500 text-white border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        ₹{chip}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-rose-400 font-mono font-black text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1}
                      step="any"
                      required
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder="Enter amount (Minimum ₹1)"
                      className="w-full pl-10 pr-4 py-3 bg-[#0F131C] border border-white/10 rounded-2xl text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-base"
                    />
                  </div>
                </div>

                {/* Reference ID / UTR */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    UTR / UPI Transaction ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={referenceId}
                    onChange={(e) => {
                      setReferenceId(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="e.g. 523918293012 (12-digit UTR from your bank/UPI slip)"
                    className="w-full px-4 py-3 bg-[#0F131C] border border-white/10 rounded-2xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Check your Google Pay / PhonePe / Paytm receipt for the 12-digit UPI transaction ID.
                  </p>
                </div>

                {/* Screenshot Receipt Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Payment Receipt Screenshot <span className="text-rose-400">*</span>
                  </label>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropFile}
                    className="border-2 border-dashed border-white/15 hover:border-rose-500/50 rounded-2xl p-4 sm:p-6 text-center bg-[#0F131C] transition-all cursor-pointer relative"
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
                            alt="Payment receipt preview"
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
                        <p className="text-xs text-rose-400 font-semibold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Receipt attached ready for review</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 py-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-200">
                          Click to upload or drag & drop payment slip
                        </p>
                        <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Anonymous Donation Toggle */}
                <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                      {isAnonymous ? <UserX className="w-5 h-5 text-rose-400" /> : <UserCheck className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Donate Anonymously</p>
                      <p className="text-[11px] text-slate-400">
                        {isAnonymous
                          ? 'Your name will be hidden on the public Donation Wall ("Anonymous Supporter").'
                          : 'Your name will be proudly credited on the public Leaderboard.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                      isAnonymous ? 'bg-rose-500' : 'bg-white/15'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        isAnonymous ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Message / Supportive Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Supportive Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Keep up the great work teaching traders! Proud to support."
                    className="w-full px-4 py-2.5 bg-[#0F131C] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Donation...</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 fill-white" />
                        <span>Confirm & Submit Donation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: LEADERBOARD (Approved donations only) */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Official Donation Wall & Leaderboard</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                    {approvedLeaderboard.length} Verified
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Honoring the benevolent traders supporting ASJADFX. Only admin-approved donations are displayed.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('donate')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Join Donors</span>
              </button>
            </div>

            {/* Leaderboard Table / Cards */}
            <div className="rounded-3xl bg-[#0A0D14] border border-white/10 overflow-hidden shadow-2xl">
              {approvedLeaderboard.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                    ❤️
                  </div>
                  <h3 className="text-sm font-bold text-white">No approved donations yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Be the very first community member to donate and get permanently recognized on the official ASJADFX Leaderboard!
                  </p>
                  <button
                    onClick={() => setActiveTab('donate')}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 transition-colors inline-block mt-2 cursor-pointer"
                  >
                    Donate ₹1+ Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {approvedLeaderboard.map((don, idx) => {
                    const isTop3 = idx < 3;
                    const rankBadge =
                      idx === 0
                        ? '🥇'
                        : idx === 1
                        ? '🥈'
                        : idx === 2
                        ? '🥉'
                        : `#${idx + 1}`;

                    const donorName = don.isAnonymous
                      ? 'Anonymous Supporter'
                      : don.userFullName || don.username || 'Generous Trader';

                    const donDate = new Date(don.date);
                    const formattedDate = !isNaN(donDate.getTime())
                      ? donDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : don.date;

                    return (
                      <div
                        key={don.id}
                        className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                          idx === 0
                            ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Rank Badge */}
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-mono font-black shrink-0 ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 text-lg shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : idx === 1
                                ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40 text-lg'
                                : idx === 2
                                ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40 text-lg'
                                : 'bg-white/5 text-slate-400 border border-white/5'
                            }`}
                          >
                            {rankBadge}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-bold text-white">
                                {donorName}
                              </span>
                              {don.isAnonymous && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                                  Anonymous
                                </span>
                              )}
                              {isTop3 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black uppercase">
                                  Top Pillar
                                </span>
                              )}
                            </div>

                            {don.message && (
                              <p className="text-xs text-rose-300/90 italic mt-0.5">
                                "{don.message}"
                              </p>
                            )}

                            <p className="text-[11px] text-slate-500 mt-1">
                              Contributed on {formattedDate}
                            </p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <span className="text-lg sm:text-xl font-black text-[#00FF66] font-mono">
                            ₹{don.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            Verified INR
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER DONATION HISTORY */}
        {activeTab === 'my_donations' && user && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Your Donation History</h2>
                <p className="text-xs text-slate-400">
                  Track the verification status of your voluntary contributions.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('donate')}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition-colors cursor-pointer"
              >
                + Donate Again
              </button>
            </div>

            <div className="rounded-3xl bg-[#0A0D14] border border-white/10 overflow-hidden shadow-xl">
              {userHistory.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                    ❤️
                  </div>
                  <h3 className="text-sm font-bold text-white">You have not made any donations yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Support the community with ₹1 or more and help young traders succeed.
                  </p>
                  <button
                    onClick={() => setActiveTab('donate')}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-400 transition-colors inline-block mt-2 cursor-pointer"
                  >
                    Make Your First Contribution
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {userHistory.map((d) => {
                    const dDate = new Date(d.date);
                    const formattedDate = !isNaN(dDate.getTime())
                      ? dDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : d.date;

                    return (
                      <div
                        key={d.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              d.status === 'approved'
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : d.status === 'pending'
                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                            }`}
                          >
                            {d.status === 'approved' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : d.status === 'pending' ? (
                              <Clock className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">
                                ₹{d.amount.toLocaleString('en-IN')}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  d.status === 'approved'
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                    : d.status === 'pending'
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                }`}
                              >
                                {d.status}
                              </span>
                              {d.isAnonymous && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-400">
                                  Anonymous
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                              <span>UTR:</span>
                              <span className="font-mono text-slate-200 font-semibold">{d.referenceId}</span>
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </div>

                            {d.status === 'rejected' && d.rejectionReason && (
                              <div className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
                                Reason: {d.rejectionReason}
                              </div>
                            )}

                            {d.status === 'approved' && (
                              <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified & Featured on Donation Wall</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {d.screenshotUrl && (
                          <button
                            onClick={() => setSelectedProofUrl(d.screenshotUrl!)}
                            className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span>View Receipt</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Screenshot Preview */}
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
                    Payment Receipt Proof
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
