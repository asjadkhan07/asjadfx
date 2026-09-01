import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPremiumSettings,
  getUserPremiumRequests,
  createPremiumPaymentRequest,
  findUserById,
} from '../services/storage';
import { uploadScreenshotProofToSupabase } from '../services/supabase';
import { PremiumSettings, PremiumPaymentRequest } from '../types';
import {
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
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
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PremiumPage: React.FC = () => {
  const { user, refreshUser, navigateTo } = useAuth();
  const [settings, setSettings] = useState<PremiumSettings>(getPremiumSettings());
  const [userRequests, setUserRequests] = useState<PremiumPaymentRequest[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
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

  const pendingRequest = userRequests.find((r) => r.payment_status === 'pending');

  // Calculate days remaining if active
  let daysRemaining = 0;
  if (isPremiumActive && freshUser?.premium_expires_at) {
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

  const handleOpenPaymentModal = () => {
    if (!user) {
      navigateTo('/login');
      return;
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
      amount: settings.price,
    });

    setIsSubmitting(false);

    if (res.success) {
      loadData();
      refreshUser();
      setIsPaymentModalOpen(false);
      setNotice({
        type: 'success',
        message:
          'Payment Request Submitted! Your payment is currently under verification. Premium will activate after Admin approval.',
      });
    } else {
      setNotice({ type: 'error', message: res.error || 'Failed to submit payment request.' });
    }
  };

  return (
    <div id="asjadfx-premium-page" className="min-h-screen bg-[#05070A] pb-24 pt-6 sm:pt-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header / Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FFD700]/20 to-amber-500/20 border border-[#FFD700]/40 text-[#FFD700] text-xs font-black uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <Crown className="w-3.5 h-3.5 fill-[#FFD700]" />
            <span>ASJADFX VIP CLUB</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            Upgrade Your ASJADFX Experience <span className="text-[#FFD700]">👑</span>
          </h1>

          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Become a Premium member and unlock high-yield coin boosts, custom identity personalization,
            and exclusive perks across the ASJADFX ecosystem.
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
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Active Premium Status Card (If already active) */}
        {isPremiumActive && freshUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-gradient-to-br from-[#0F131C] via-[#161B24] to-[#0F131C] border-2 border-[#FFD700] p-6 sm:p-8 shadow-[0_0_40px_rgba(255,215,0,0.2)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFD700] via-amber-400 to-amber-600 text-black font-black flex items-center justify-center text-2xl shadow-xl shrink-0">
                  <Crown className="w-8 h-8 fill-black text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] text-[11px] font-bold font-mono uppercase tracking-wider">
                      Active VIP Membership
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                    <span>@{freshUser.username}</span>
                    <span className="text-[#FFD700]">👑</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your account is enjoying +25% extra coin earnings and full Premium privileges.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto font-mono text-center">
                <div className="p-3 rounded-2xl bg-[#0A0D14] border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Days Left</div>
                  <div className="text-lg font-black text-[#FFD700]">{daysRemaining} Days</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#0A0D14] border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Bonus Rate</div>
                  <div className="text-lg font-black text-[#00FF66]">+25% Coins</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#0A0D14] border border-white/5 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500 uppercase">Expires On</div>
                  <div className="text-xs font-bold text-slate-300 truncate">
                    {freshUser.premium_expires_at
                      ? new Date(freshUser.premium_expires_at).toLocaleDateString()
                      : 'Active'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Verification Banner (If request pending) */}
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
                <h3 className="text-base font-bold text-white">Payment Under Review by Admin</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Ref ID: <span className="text-amber-300 font-bold">{pendingRequest.transaction_id}</span> •
                  Amount: ₹{pendingRequest.amount}
                </p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-[#0A0D14] border border-white/10 text-xs font-mono text-slate-300">
              Submitted {new Date(pendingRequest.request_created_at).toLocaleDateString()}
            </div>
          </motion.div>
        )}

        {/* Pricing Card & Main Promotion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Premium Membership Pricing Box */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex-1 rounded-3xl bg-gradient-to-b from-[#0F131C] to-[#0A0D14] border-2 border-[#FFD700]/50 p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_40px_rgba(255,215,0,0.15)] group hover:border-[#FFD700] transition-all">
              {/* Early Supporter Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] text-[11px] font-black font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EARLY SUPPORTER OFFER</span>
                </span>
                <span className="text-xl">👑</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight">
                  {settings.planName || 'ASJADFX PREMIUM'}
                </h2>
                <p className="text-xs text-slate-400">
                  Full 4-month VIP pass to maximize your earnings, reputation, and platform rewards.
                </p>

                {/* Price Display */}
                <div className="py-4 border-y border-white/5 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                      ₹{settings.price || 49}
                    </span>
                    <span className="text-sm font-bold text-slate-400 uppercase font-mono">
                      / 4 Months
                    </span>
                  </div>
                  <div className="text-xs text-[#00FF66] font-mono font-bold flex items-center gap-1">
                    <span>⚡ That's only ₹12.25/month</span>
                  </div>
                </div>

                {/* Quick Highlights List */}
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <strong className="text-white">🪙 +25% Extra Coins</strong> on all eligible tasks
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <strong className="text-white">👑 Gold VIP Crown Badge</strong> on profile & chat
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <strong className="text-white">🏆 Leaderboard Glow</strong> & custom avatar upload
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#FFD700]/10 text-[#FFD700] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      <strong className="text-white">🎁 Priority Access</strong> to high-value giveaways
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-white/5">
                {isPremiumActive ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-[#161B24] border border-[#FFD700]/40 text-[#FFD700] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-default shadow-lg"
                  >
                    <Crown className="w-4 h-4 fill-[#FFD700]" />
                    <span>👑 ACTIVE PREMIUM MEMBER</span>
                  </button>
                ) : pendingRequest ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-default"
                  >
                    <Clock className="w-4 h-4" />
                    <span>🟡 PAYMENT UNDER REVIEW</span>
                  </button>
                ) : (
                  <motion.button
                    id="btn-upgrade-premium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenPaymentModal}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFD700] via-amber-400 to-[#F2A900] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,215,0,0.4)] hover:shadow-[0_0_35px_rgba(255,215,0,0.6)] transition-all cursor-pointer"
                  >
                    <span>UPGRADE NOW 👑</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
                <p className="text-[10px] text-center text-slate-500 font-mono mt-2">
                  Manual UPI QR Transfer • Verified by Admin
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Benefits Matrix */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0F131C] border border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Exclusive Member Privileges</h3>
                  <p className="text-xs text-slate-400">Everything included in your 4-month VIP access</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Benefit 1: Extra Task Coins */}
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 hover:border-[#00FF66]/30 transition-all">
                  <div className="flex items-center gap-2 text-[#00FF66] font-bold">
                    <Coins className="w-4 h-4" />
                    <span>+25% Extra Task Coins</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Earn 25% extra coins on every verified social task.
                  </p>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-0.5">
                    <div className="text-slate-500 flex justify-between">
                      <span>Normal User:</span>
                      <span>100 Coins</span>
                    </div>
                    <div className="text-[#00FF66] font-bold flex justify-between">
                      <span>👑 Premium User:</span>
                      <span>125 Coins</span>
                    </div>
                  </div>
                </div>

                {/* Benefit 2: Special Giveaway Alerts */}
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 hover:border-[#FFD700]/30 transition-all">
                  <div className="flex items-center gap-2 text-[#FFD700] font-bold">
                    <Gift className="w-4 h-4" />
                    <span>Special Giveaway Alerts</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Get priority alerts and elevated entry tier for exclusive giveaways and live trading rewards.
                  </p>
                </div>

                {/* Benefit 3: Leaderboard Profile Highlight */}
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 hover:border-[#FFD700]/30 transition-all">
                  <div className="flex items-center gap-2 text-[#FFD700] font-bold">
                    <Trophy className="w-4 h-4" />
                    <span>Leaderboard Highlight</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Stand out with a distinct gold border, crown badge 👑, and subtle glow in global rankings.
                  </p>
                </div>

                {/* Benefit 4: Custom Profile Picture */}
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 hover:border-[#00FF66]/30 transition-all">
                  <div className="flex items-center gap-2 text-[#00FF66] font-bold">
                    <Camera className="w-4 h-4" />
                    <span>Custom Profile Picture</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Upload your own custom image avatar and personalize your trader profile card.
                  </p>
                </div>

                {/* Benefit 5: VIP Profile Badge */}
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 hover:border-[#FFD700]/30 transition-all">
                  <div className="flex items-center gap-2 text-[#FFD700] font-bold">
                    <Crown className="w-4 h-4" />
                    <span>VIP Profile Badge</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Permanent gold crown next to your username across profile, leaderboard, and activity feeds.
                  </p>
                </div>

                {/* Benefit 6: Early Feature Access */}
                <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-2 hover:border-[#00FF66]/30 transition-all">
                  <div className="flex items-center gap-2 text-[#00FF66] font-bold">
                    <Zap className="w-4 h-4" />
                    <span>Early Feature Access</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Be the first to test new platform features, daily streak boosts, and special trading events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Payment Request History (If any) */}
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
                          ⏳ PENDING
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
                      onClick={handleOpenPaymentModal}
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
                      Upgrade to ASJADFX Premium
                    </h3>
                    <p className="text-[11px] text-slate-400">₹{settings.price} for 4 Months Access</p>
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
                  {/* Step 1: Scan QR & UPI Transfer */}
                  <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFD700] font-mono">
                        Step 1: Scan & Pay ₹{settings.price}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">UPI / GPay / PhonePe / Paytm</span>
                    </div>

                    {/* QR Code Container */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      {settings.qrCodeUrl ? (
                        <img
                          src={settings.qrCodeUrl}
                          alt="Official ASJADFX UPI QR"
                          className="w-44 h-44 object-contain rounded-xl bg-white p-2 shadow-md"
                        />
                      ) : (
                        /* Default Dynamic QR Generator Fallback */
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                            `upi://pay?pa=${settings.upiId || 'asjadfx@upi'}&pn=${encodeURIComponent(
                              settings.receiverName || 'ASJADFX Official'
                            )}&am=${settings.price || 49}&cu=INR`
                          )}`}
                          alt="ASJADFX UPI Payment QR"
                          className="w-44 h-44 object-contain rounded-xl bg-white p-2 shadow-md"
                        />
                      )}

                      <div className="text-center font-mono space-y-0.5">
                        <div className="text-white font-bold text-xs">{settings.receiverName}</div>
                        <div className="text-slate-400 text-[11px]">{settings.upiId}</div>
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

                    {/* Screenshot Upload (Optional / Recommended) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-slate-300">
                        Payment Screenshot <span className="text-slate-500">(Optional for faster approval)</span>
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
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
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
                        <span>SUBMIT PAYMENT REQUEST</span>
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
