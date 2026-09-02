import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPremiumSettings,
  getUserPremiumRequests,
  createPremiumPaymentRequest,
  findUserById,
  DEFAULT_VIP_PLANS,
} from '../services/storage';
import { uploadScreenshotProofToSupabase } from '../services/supabase';
import { PremiumSettings, PremiumPaymentRequest, VIPPlanTierConfig } from '../types';
import {
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Upload,
  ArrowRight,
  ShieldCheck,
  Gift,
  Coins,
  Trophy,
  Camera,
  AlertCircle,
  X,
  RefreshCw,
  Star,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PremiumPage: React.FC = () => {
  const { user, refreshUser, navigateTo } = useAuth();
  const [settings, setSettings] = useState<PremiumSettings>(getPremiumSettings());
  const [userRequests, setUserRequests] = useState<PremiumPaymentRequest[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<VIPPlanTierConfig>(DEFAULT_VIP_PLANS[1]); // Default to Lifetime
  const [transactionId, setTransactionId] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    setSettings(getPremiumSettings());
    if (user) {
      setUserRequests(getUserPremiumRequests(user.id));
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('asjadfx_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('asjadfx_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [user]);

  const freshUser = user ? findUserById(user.id) || user : null;
  const isPremiumActive =
    freshUser?.membership_type === 'premium' && freshUser?.premium_status === 'active';

  const isLifetime =
    isPremiumActive &&
    (freshUser?.vip_tier === 'vip_lifetime' || !freshUser?.premium_expires_at);

  const pendingRequest = userRequests.find((r) => r.payment_status === 'pending');

  // Calculate days remaining if active
  let daysRemaining: number | null = null;
  if (isPremiumActive && freshUser?.premium_expires_at && !isLifetime) {
    const expTime = new Date(freshUser.premium_expires_at).getTime();
    const diff = expTime - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const handleCopyUpi = () => {
    if (settings.upiId) {
      navigator.clipboard.writeText(settings.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', message: 'Please select a valid image file (PNG, JPG, JPEG).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', message: 'Image size must be under 5MB.' });
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPaymentModal = (plan?: VIPPlanTierConfig) => {
    if (!user) {
      navigateTo('/login');
      return;
    }
    if (plan) {
      setSelectedPlan(plan);
    }
    setNotice(null);
    setTransactionId('');
    setScreenshotPreview(null);
    setScreenshotFile(null);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freshUser) return;

    if (!transactionId.trim()) {
      setNotice({ type: 'error', message: 'Please enter your Transaction / UTR ID.' });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    let screenshotUrl = '';
    if (screenshotFile && freshUser) {
      try {
        screenshotUrl = await uploadScreenshotProofToSupabase(
          screenshotFile,
          freshUser.id,
          `premium_${Date.now()}`
        );
      } catch {
        screenshotUrl = screenshotPreview || '';
      }
    } else if (screenshotPreview) {
      screenshotUrl = screenshotPreview;
    }

    const res = createPremiumPaymentRequest(freshUser, {
      transaction_id: transactionId.trim(),
      payment_screenshot_url: screenshotUrl,
      amount: selectedPlan.price,
      plan_tier: selectedPlan.id,
    });

    setIsSubmitting(false);

    if (res.success) {
      loadData();
      refreshUser();
      setIsPaymentModalOpen(false);
      setNotice({
        type: 'success',
        message: `Payment Request of ₹${selectedPlan.price} Submitted! Your request for ${selectedPlan.name} is under review and will be activated after Admin verification.`,
      });
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to submit payment request.' });
    }
  };

  return (
    <div id="asjadfx-premium-page" className="min-h-screen bg-[#05070A] pb-24 pt-6 sm:pt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header / Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FFD700]/20 via-amber-500/20 to-[#00FF66]/20 border border-[#FFD700]/40 text-[#FFD700] text-xs font-black uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <Crown className="w-3.5 h-3.5 fill-[#FFD700]" />
            <span>ASJADFX VIP TIERS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            Elevate Your Experience with <span className="text-[#FFD700]">ASJADFX VIP</span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Unlock exclusive Daily VIP Spins, coin multipliers, permanent identity badges, and priority
            giveaway access across the platform.
          </p>
        </div>

        {/* Global Notice Banner */}
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 font-semibold ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Active VIP Status Card (If active) */}
        {isPremiumActive && freshUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-6 sm:p-8 relative overflow-hidden border-2 shadow-2xl ${
              isLifetime
                ? 'bg-gradient-to-br from-[#0F131C] via-[#15231B] to-[#0A0D14] border-[#00FF66] shadow-[0_0_50px_rgba(0,255,102,0.2)]'
                : 'bg-gradient-to-br from-[#0F131C] via-[#1E1A11] to-[#0A0D14] border-[#FFD700] shadow-[0_0_50px_rgba(255,215,0,0.2)]'
            }`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl text-black font-black flex items-center justify-center text-2xl shadow-xl shrink-0 ${
                    isLifetime
                      ? 'bg-gradient-to-tr from-[#00FF66] via-emerald-400 to-[#FFD700]'
                      : 'bg-gradient-to-tr from-[#FFD700] via-amber-400 to-amber-600'
                  }`}
                >
                  {isLifetime ? <Star className="w-8 h-8 fill-black" /> : <Crown className="w-8 h-8 fill-black" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider border ${
                        isLifetime
                          ? 'bg-[#00FF66]/20 border-[#00FF66]/40 text-[#00FF66]'
                          : 'bg-[#FFD700]/20 border-[#FFD700]/40 text-[#FFD700]'
                      }`}
                    >
                      {isLifetime ? '⭐ VIP LIFETIME MEMBER' : '👑 VIP BASIC ACTIVE'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                    <span>@{freshUser.username}</span>
                    <span>{isLifetime ? '⭐' : '👑'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLifetime
                      ? 'You have permanent VIP privileges with the high-reward VIP Pro Daily Spin.'
                      : 'Your 2-Month VIP pass is active with daily spins and coin multiplier.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto font-mono text-center">
                <div className="p-3 rounded-2xl bg-[#0A0D14] border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Duration</div>
                  <div
                    className={`text-base sm:text-lg font-black ${
                      isLifetime ? 'text-[#00FF66]' : 'text-[#FFD700]'
                    }`}
                  >
                    {isLifetime ? 'LIFETIME' : `${daysRemaining ?? 0} Days`}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#0A0D14] border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Daily Spin</div>
                  <div className="text-base sm:text-lg font-black text-[#00FF66]">
                    {isLifetime ? 'Pro (500 max)' : 'Basic (100 max)'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#0A0D14] border border-white/5 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500 uppercase">Task Multiplier</div>
                  <div className="text-base sm:text-lg font-black text-[#FFD700]">+25% Coins</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Verification Banner */}
        {!isPremiumActive && pendingRequest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-[#0F131C] border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                  Verification Pending
                </div>
                <h3 className="text-base font-bold text-white">Payment Under Verification</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Plan: <span className="text-white font-bold">{pendingRequest.plan_name}</span> (₹
                  {pendingRequest.amount}) • Ref: <span className="text-amber-300 font-bold">{pendingRequest.transaction_id}</span>
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-xs font-mono text-slate-300">
              Submitted {new Date(pendingRequest.request_created_at).toLocaleDateString()}
            </div>
          </motion.div>
        )}

        {/* Two-Tier Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Plan 1: VIP BASIC (₹49 • 2 Months) */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl bg-gradient-to-b from-[#0F131C] via-[#121622] to-[#0A0D14] border-2 border-[#FFD700]/40 p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:border-[#FFD700] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-xs font-black font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>VIP BASIC</span>
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">2 MONTHS PASS</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                ASJADFX VIP
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Essential 2-month VIP access to boost daily earnings and unlock verified rewards.
              </p>

              {/* Price Display */}
              <div className="py-5 border-y border-white/5 my-5 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono">₹49</span>
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono">/ 2 Months (60 Days)</span>
                </div>
                <div className="text-xs text-[#00FF66] font-mono font-bold">
                  ⚡ Just ₹24.5 / month
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">👑 Exclusive Gold Crown Badge</strong> on profile &amp; leaderboard
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">🪙 +25% Extra Coins</strong> on all completed tasks
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">🎰 VIP Basic Daily Spin</strong> (10 to 100 Coins Daily)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">🏆 Leaderboard Highlight</strong> with custom profile avatar
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">🎁 Priority Access</strong> to high-value trading giveaways
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-6 mt-6 border-t border-white/5">
              <button
                disabled={isPremiumActive || !!pendingRequest}
                onClick={() => handleOpenPaymentModal(DEFAULT_VIP_PLANS[0])}
                className="w-full py-3.5 rounded-2xl bg-[#1A1F2C] hover:bg-[#252C3D] border border-[#FFD700]/40 text-[#FFD700] font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>CHOOSE VIP BASIC (₹49)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Plan 2: VIP LIFETIME (₹99 • Lifetime Access - RECOMMENDED) */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl bg-gradient-to-b from-[#131B15] via-[#101915] to-[#0A0D14] border-2 border-[#00FF66] p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(0,255,102,0.2)] hover:border-[#00FF66] transition-all"
          >
            {/* Best Value Highlight Pill */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00FF66] via-emerald-400 to-[#FFD700] text-black font-black text-[11px] uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(0,255,102,0.6)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>MOST POPULAR • BEST VALUE</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 pt-1">
                <span className="px-3 py-1 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 text-[#00FF66] text-xs font-black font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-[#00FF66]" />
                  <span>VIP LIFETIME</span>
                </span>
                <span className="text-xs font-mono text-[#00FF66] font-black">NO RENEWAL • FOREVER</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                ASJADFX VIP LIFETIME
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Permanent VIP status with the highest-tier Pro daily spin and zero expiration.
              </p>

              {/* Price Display */}
              <div className="py-5 border-y border-white/5 my-5 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono text-[#00FF66]">
                    ₹99
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono">/ One-Time Lifetime</span>
                </div>
                <div className="text-xs text-[#FFD700] font-mono font-bold">
                  ⭐ Pay Once • Enjoy Permanent VIP Privileges
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">⭐ Everything in VIP Basic</strong> with ZERO expiry date
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-[#00FF66]">🎰 VIP PRO DAILY SPIN</strong> (25 to 500 Coins Daily Jackpot)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">🚀 Priority Task Review</strong> &amp; boosted coin approvals
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">🏆 Elite Permanent Status</strong> in leaderboard rankings
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00FF66]/20 text-[#00FF66] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong className="text-white">⚡ Priority 24/7 VIP Support</strong> &amp; early feature testing
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-6 mt-6 border-t border-white/5">
              <button
                disabled={isLifetime || !!pendingRequest}
                onClick={() => handleOpenPaymentModal(DEFAULT_VIP_PLANS[1])}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00FF66] via-emerald-400 to-[#00FF66] text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:shadow-[0_0_35px_rgba(0,255,102,0.6)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star className="w-4 h-4 fill-black" />
                <span>UPGRADE TO VIP LIFETIME (₹99)</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="rounded-3xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2.5 rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">VIP Tier Privileges Breakdown</h3>
              <p className="text-xs text-slate-400">Compare all advantages side-by-side</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">Benefit / Feature</th>
                  <th className="pb-3 font-semibold text-center">Free Member</th>
                  <th className="pb-3 font-semibold text-center text-[#FFD700]">VIP Basic (₹49)</th>
                  <th className="pb-3 font-semibold text-center text-[#00FF66]">VIP Lifetime (₹99)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-3 font-medium text-white">Membership Duration</td>
                  <td className="py-3 text-center text-slate-500">Standard</td>
                  <td className="py-3 text-center font-mono font-bold text-[#FFD700]">2 Months (60 Days)</td>
                  <td className="py-3 text-center font-mono font-bold text-[#00FF66]">Lifetime (Permanent)</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Daily Fortune Spin</td>
                  <td className="py-3 text-center text-slate-500">Locked 🔒</td>
                  <td className="py-3 text-center font-mono text-[#FFD700]">10 to 100 Coins Pool</td>
                  <td className="py-3 text-center font-mono font-bold text-[#00FF66]">25 to 500 Coins Pro Pool</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Task Reward Boost</td>
                  <td className="py-3 text-center text-slate-500">Base (100%)</td>
                  <td className="py-3 text-center font-mono text-[#FFD700]">+25% Bonus</td>
                  <td className="py-3 text-center font-mono font-bold text-[#00FF66]">+25% + Priority Review</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Profile Crown Badge</td>
                  <td className="py-3 text-center text-slate-500">—</td>
                  <td className="py-3 text-center text-[#FFD700]">👑 60-Day Badge</td>
                  <td className="py-3 text-center text-[#00FF66]">⭐ Permanent Elite Badge</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Custom Profile Avatar</td>
                  <td className="py-3 text-center text-slate-500">Default Only</td>
                  <td className="py-3 text-center text-[#00FF66]">✓ Included</td>
                  <td className="py-3 text-center text-[#00FF66]">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Funded Account Giveaways</td>
                  <td className="py-3 text-center text-slate-500">Standard</td>
                  <td className="py-3 text-center text-[#FFD700]">Priority Entries</td>
                  <td className="py-3 text-center text-[#00FF66]">Guaranteed VIP Raffles</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* User's Payment Request History */}
        {userRequests.length > 0 && (
          <div className="rounded-3xl bg-[#0F131C] border border-white/5 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 text-slate-300">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Your Payment Requests History</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">{userRequests.length} Total</span>
            </div>

            <div className="space-y-3">
              {userRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{req.plan_name}</span>
                      <span className="font-mono text-slate-400">₹{req.amount}</span>
                      {req.payment_status === 'approved' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono">
                          ✓ APPROVED
                        </span>
                      ) : req.payment_status === 'pending' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono">
                          ⏳ PENDING REVIEW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold font-mono">
                          ✕ REJECTED
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-slate-400 text-[11px]">
                      UTR / TxID: <span className="text-slate-200 font-bold">{req.transaction_id}</span> •{' '}
                      {new Date(req.request_created_at).toLocaleDateString()}
                    </div>
                    {req.rejection_reason && (
                      <p className="text-rose-400 text-[11px] font-semibold">
                        Rejection reason: "{req.rejection_reason}"
                      </p>
                    )}
                  </div>

                  {req.payment_status === 'rejected' && (
                    <button
                      onClick={() => handleOpenPaymentModal(DEFAULT_VIP_PLANS[1])}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Payment QR Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div
            id="modal-payment-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsPaymentModalOpen(false);
            }}
          >
            <motion.div
              id="modal-payment-frame"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-lg w-full max-h-[92vh] flex flex-col rounded-3xl bg-[#0F131C] border border-[#FFD700]/30 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="sticky top-0 z-20 bg-[#0F131C] px-5 py-4 border-b border-white/10 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]">
                    <Crown className="w-5 h-5 fill-[#FFD700]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Upgrade to {selectedPlan.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ₹{selectedPlan.price} for {selectedPlan.durationLabel} Access
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmitPayment} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
                  {/* Plan Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_VIP_PLANS.map((plan) => {
                      const isSelected = selectedPlan.id === plan.id;
                      return (
                        <button
                          type="button"
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? plan.id === 'vip_lifetime'
                                ? 'bg-[#00FF66]/15 border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                                : 'bg-[#FFD700]/15 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{plan.badge}</span>
                            <span className="font-mono font-bold text-sm text-[#FFD700]">
                              ₹{plan.price}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {plan.durationLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Step 1: Scan QR & UPI Transfer */}
                  <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD700] font-mono">
                        Step 1: Scan &amp; Pay ₹{selectedPlan.price}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">UPI / GPay / PhonePe / Paytm</span>
                    </div>

                    {/* Dynamic QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `upi://pay?pa=${settings.upiId || 'asjadfx@upi'}&pn=${encodeURIComponent(
                            settings.receiverName || 'ASJADFX Official'
                          )}&am=${selectedPlan.price}&cu=INR`
                        )}`}
                        alt="ASJADFX UPI Payment QR"
                        className="w-44 h-44 object-contain rounded-xl bg-white p-2 shadow-md"
                      />

                      <div className="text-center font-mono space-y-0.5">
                        <div className="text-white font-bold text-xs">{settings.receiverName}</div>
                        <div className="text-slate-400 text-[11px]">{settings.upiId}</div>
                        <div className="text-[10px] text-[#00FF66] font-bold">Amount: ₹{selectedPlan.price}</div>
                      </div>
                    </div>

                    {/* UPI Copy Button */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#161B24] border border-white/10 font-mono">
                      <div className="truncate mr-2">
                        <span className="text-slate-500 text-[10px] block">UPI ID</span>
                        <span className="text-white font-bold text-xs">{settings.upiId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-3 py-1.5 rounded-lg bg-[#00FF66]/10 hover:bg-[#00FF66]/20 border border-[#00FF66]/30 text-[#00FF66] font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>COPY UPI</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Instructions Text */}
                    <div className="text-[11px] text-slate-400 whitespace-pre-line leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                      {settings.instructions}
                    </div>
                  </div>

                  {/* Step 2: Enter Transaction Details */}
                  <div className="space-y-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD700] font-mono block">
                      Step 2: Enter Payment Details
                    </span>

                    {/* UTR Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-slate-300">
                        Transaction ID / 12-Digit UTR Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 423589123456 or T240101..."
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D14] border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-[#FFD700] font-mono"
                      />
                    </div>

                    {/* Screenshot Upload */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-slate-300">
                        Payment Screenshot <span className="text-slate-500">(Recommended for quick review)</span>
                      </label>

                      {screenshotPreview ? (
                        <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-black/40 p-2 flex items-center justify-between">
                          <img
                            src={screenshotPreview}
                            alt="Receipt Preview"
                            className="h-20 w-20 object-cover rounded-xl"
                          />
                          <div className="flex-1 px-3">
                            <p className="text-xs text-white font-bold truncate">Screenshot Attached</p>
                            <p className="text-[10px] text-[#00FF66] font-mono">Ready to upload</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotPreview(null);
                              setScreenshotFile(null);
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-white/10 hover:border-[#FFD700]/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#0A0D14]/60 hover:bg-white/[0.02] transition-colors">
                          <Upload className="w-5 h-5 text-slate-400" />
                          <div className="text-center">
                            <span className="text-xs text-slate-300 font-semibold">
                              Click to select payment screenshot
                            </span>
                            <span className="text-[10px] text-slate-500 block">PNG, JPG, WebP up to 5MB</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Submit */}
                <div className="sticky bottom-0 z-20 bg-[#0F131C] px-5 py-3.5 border-t border-white/10 flex items-center justify-end gap-3 shadow-md">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black text-xs font-black uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-40 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-3.5 h-3.5 fill-black" />
                        <span>SUBMIT ₹{selectedPlan.price} REQUEST</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
