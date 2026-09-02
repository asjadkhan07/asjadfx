import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserStreakStatus,
  claimDailyStreakReward,
  redeemCouponCode,
  getUserRedemptionLogs,
  getAllRedeemCodes,
  UserStreakStatus,
} from '../services/rewards';
import { DailySpinWheel } from '../components/DailySpinWheel';
import {
  Gift,
  Flame,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Ticket,
  ArrowRight,
  Coins,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  History,
  Award,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RewardsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [streakStatus, setStreakStatus] = useState<UserStreakStatus | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Redeem code states
  const [couponCode, setCouponCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{
    type: 'success' | 'error';
    message: string;
    coins?: number;
    code?: string;
  } | null>(null);

  // User redemption logs
  const [userRedemptions, setUserRedemptions] = useState(
    user ? getUserRedemptionLogs(user.id) : []
  );

  // Quick active codes preview
  const activeSampleCodes = getAllRedeemCodes()
    .filter((c) => c.status === 'active')
    .slice(0, 3);

  // Real-time countdown state
  const [countdownText, setCountdownText] = useState<string>('Calculating...');

  const updateStatus = () => {
    if (!user) return;
    const status = getUserStreakStatus(user.id);
    setStreakStatus(status);
    setCountdownText(status.formattedCountdown);
    setUserRedemptions(getUserRedemptionLogs(user.id));
  };

  useEffect(() => {
    updateStatus();

    // Listen for cross-tab or background data updates
    const handleSync = () => {
      updateStatus();
    };
    window.addEventListener('asjadfx_data_updated', handleSync);
    return () => window.removeEventListener('asjadfx_data_updated', handleSync);
  }, [user]);

  // Live 1-second countdown interval
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const status = getUserStreakStatus(user.id);
      setCountdownText(status.formattedCountdown);
      if (status.canClaimToday && streakStatus && !streakStatus.canClaimToday) {
        setStreakStatus(status);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, streakStatus?.canClaimToday]);

  const handleClaimDailyStreak = () => {
    if (!user) return;
    setIsClaiming(true);
    setClaimMessage(null);

    try {
      const result = claimDailyStreakReward(user);
      if (result.success) {
        setClaimMessage({
          type: 'success',
          text: `Awesome! You claimed +${result.coinsAwarded} ASJADFX Coins! Streak is now ${result.newStreak} Days! 🔥`,
        });
        updateStatus();
        refreshUser();
      } else {
        setClaimMessage({
          type: 'error',
          text: result.error || 'Unable to claim daily reward.',
        });
      }
    } catch (err: any) {
      setClaimMessage({
        type: 'error',
        text: err?.message || 'Failed to process streak claim.',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRedeemCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    if (!couponCode.trim()) {
      setRedeemResult({
        type: 'error',
        message: 'Please enter a valid reward code.',
      });
      return;
    }

    setIsRedeeming(true);
    setRedeemResult(null);

    setTimeout(() => {
      try {
        const result = redeemCouponCode(user, couponCode);
        if (result.success) {
          setRedeemResult({
            type: 'success',
            message: `Congratulations! Code [${result.code}] redeemed successfully!`,
            coins: result.coinsAwarded,
            code: result.code,
          });
          setCouponCode('');
          updateStatus();
          refreshUser();
        } else {
          setRedeemResult({
            type: 'error',
            message: result.error || 'Failed to redeem coupon code.',
          });
        }
      } catch (err: any) {
        setRedeemResult({
          type: 'error',
          message: err?.message || 'An error occurred during redemption.',
        });
      } finally {
        setIsRedeeming(false);
      }
    }, 500);
  };

  const rewardsList = streakStatus?.config.rewards || [10, 15, 20, 25, 30, 40, 100];
  const currentStreak = streakStatus?.currentStreak || 0;
  const nextDayToClaim = streakStatus?.nextDayToClaim || 1;
  const canClaim = streakStatus?.canClaimToday ?? false;

  return (
    <div id="rewards-page-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F131C] via-[#161B24] to-[#0F131C] border border-[#00FF66]/20 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,255,102,0.08)]"
      >
        {/* Glow ambient circle */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#00FF66]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-bold font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ASJADFX Reward Vault</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Daily Streak & <span className="text-[#00FF66]">Redeem Codes</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Check-in every 24 hours to build your streak multiplier, and redeem exclusive live promo codes to boost your ASJADFX coin balance.
            </p>
          </div>

          {/* Quick Balance Pill */}
          <div className="flex items-center gap-3 bg-[#05070A]/80 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFD700] to-amber-500 flex items-center justify-center text-black font-black shadow-[0_0_15px_rgba(255,215,0,0.4)]">
              <Coins className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Current Balance</div>
              <div className="text-lg sm:text-xl font-black font-mono text-[#FFD700]">
                {user?.coins ?? 0} <span className="text-xs font-bold text-slate-300">Coins</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. 🎰 DAILY VIP FORTUNE WHEEL */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <DailySpinWheel user={user} onSpinSuccess={() => updateStatus()} />
      </motion.div>

      {/* Main Grid: Daily Streak & Redeem Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* 1. 🔥 DAILY STREAK SECTION (Col span 7) */}
        {/* ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          id="daily-streak-section"
          className="lg:col-span-7 bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative"
        >
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Daily Streak Tracker</span>
                  {currentStreak > 0 && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono font-bold animate-pulse">
                      🔥 {currentStreak} Day Streak
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Claim daily to level up rewards. Miss a full day (&gt;48h) and your streak resets!
                </p>
              </div>
            </div>

            {/* Streak Counter Badge */}
            <div className="px-4 py-2 rounded-2xl bg-[#05070A] border border-orange-500/30 text-center">
              <div className="text-[10px] font-mono uppercase text-orange-400 font-bold">Active Streak</div>
              <div className="text-xl font-black font-mono text-white">
                {currentStreak} <span className="text-xs font-normal text-slate-400">/ 7 Days</span>
              </div>
            </div>
          </div>

          {/* 7-Day Reward Cards Carousel / Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span>7-DAY REWARD CYCLE</span>
              <span className="text-[#00FF66]">Day 7: Special Jackpot</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
              {rewardsList.map((coins, index) => {
                const dayNumber = index + 1;
                const isSpecial = dayNumber === 7;
                // Determine card status:
                // Claimed: If user currently completed this day in current cycle
                const isClaimed = currentStreak >= dayNumber;
                // Ready to claim: If this day is the next one up and user CAN claim today
                const isTodayReady = nextDayToClaim === dayNumber && canClaim;
                // Next locked: It's the next day to claim, but user already claimed today (waiting for cooldown)
                const isNextWaiting = nextDayToClaim === dayNumber && !canClaim;
                // Future locked
                const isFuture = dayNumber > nextDayToClaim;

                return (
                  <motion.div
                    key={`day-${dayNumber}`}
                    whileHover={{ scale: 1.03 }}
                    className={`relative rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-between text-center transition-all duration-200 ${
                      isSpecial
                        ? isClaimed
                          ? 'bg-amber-950/40 border border-[#FFD700]/30'
                          : isTodayReady
                          ? 'bg-gradient-to-b from-amber-500/20 to-[#FFD700]/10 border-2 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-pulse'
                          : 'bg-[#161B24] border border-[#FFD700]/30'
                        : isClaimed
                        ? 'bg-[#00FF66]/5 border border-[#00FF66]/30 text-slate-300'
                        : isTodayReady
                        ? 'bg-gradient-to-b from-[#00FF66]/20 to-[#0F131C] border-2 border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                        : isNextWaiting
                        ? 'bg-[#161B24] border border-orange-500/30'
                        : 'bg-[#0A0D14] border border-white/5 opacity-60'
                    }`}
                  >
                    {/* Top status indicator */}
                    <div className="w-full flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                      <span className={isSpecial ? 'text-[#FFD700]' : 'text-slate-400'}>
                        D{dayNumber}
                      </span>
                      {isClaimed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF66]" />
                      ) : isTodayReady ? (
                        <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-500" />
                      )}
                    </div>

                    {/* Center Icon */}
                    <div className="my-1.5">
                      {isSpecial ? (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FFD700] to-amber-500 flex items-center justify-center text-black font-black text-xs shadow-md">
                          👑
                        </div>
                      ) : isClaimed ? (
                        <div className="w-7 h-7 rounded-lg bg-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : isTodayReady ? (
                        <div className="w-7 h-7 rounded-lg bg-[#00FF66]/20 flex items-center justify-center text-[#00FF66] animate-bounce">
                          <Flame className="w-4 h-4 fill-[#00FF66]" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                          <Coins className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Bottom Coins Text */}
                    <div className="mt-1">
                      <div
                        className={`text-xs sm:text-sm font-black font-mono ${
                          isSpecial
                            ? 'text-[#FFD700]'
                            : isTodayReady
                            ? 'text-[#00FF66]'
                            : isClaimed
                            ? 'text-slate-300'
                            : 'text-slate-400'
                        }`}
                      >
                        +{coins}
                      </div>
                      <div className="text-[9px] uppercase font-bold text-slate-500 font-mono">
                        {isSpecial ? 'Grand' : 'Coins'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Action Button & Countdown Alert */}
          <div className="space-y-4 pt-2">
            {claimMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  claimMessage.type === 'success'
                    ? 'bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66]'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {claimMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{claimMessage.text}</span>
              </motion.div>
            )}

            {canClaim ? (
              <motion.button
                id="btn-claim-daily-streak"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isClaiming}
                onClick={handleClaimDailyStreak}
                className="w-full py-4 rounded-2xl font-black text-sm sm:text-base text-[#05070A] bg-gradient-to-r from-[#00FF66] via-[#05DF72] to-[#00FF66] shadow-[0_0_30px_rgba(0,255,102,0.4)] hover:shadow-[0_0_40px_rgba(0,255,102,0.6)] flex items-center justify-center gap-2.5 cursor-pointer transition-all"
              >
                {isClaiming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Claiming Day {nextDayToClaim} Reward...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 fill-black" />
                    <span>
                      CLAIM DAY {nextDayToClaim} REWARD (+{streakStatus?.todayRewardCoins} COINS)
                    </span>
                    <Sparkles className="w-5 h-5 animate-spin" />
                  </>
                )}
              </motion.button>
            ) : (
              <div className="bg-[#05070A] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Today's Reward Claimed!</div>
                    <div className="text-[11px] text-slate-400">
                      You are on track. Come back tomorrow for Day {nextDayToClaim} reward (+
                      {streakStatus?.todayRewardCoins} Coins).
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0F131C] border border-orange-500/30 text-orange-400 font-mono text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Next: {countdownText}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ======================================================== */}
        {/* 2. 🎁 REDEEM CODE SECTION (Col span 5) */}
        {/* ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          id="redeem-code-section"
          className="lg:col-span-5 bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
        >
          <div className="flex items-center gap-3 pb-5 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00FF66] to-emerald-600 flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,102,0.3)]">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">Redeem Promo Code</h2>
              <p className="text-xs text-slate-400">
                Enter your coupon or stream drop code below to get instant coins.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRedeemCode} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="coupon-code-input" className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Reward Code
              </label>
              <div className="relative">
                <input
                  id="coupon-code-input"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. ASJAD100)"
                  className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-[#05070A] border border-white/15 focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] text-white font-mono font-bold placeholder-slate-500 uppercase text-sm tracking-wider outline-none transition-all"
                />
                <Gift className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                {couponCode && (
                  <button
                    type="button"
                    onClick={() => setCouponCode('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Error or Success feedback */}
            {redeemResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                  redeemResult.type === 'success'
                    ? 'bg-[#00FF66]/15 border border-[#00FF66]/40 text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.2)]'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {redeemResult.type === 'success' ? (
                  <Sparkles className="w-4 h-4 shrink-0 text-[#00FF66]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <div className="flex-1">
                  <div>{redeemResult.message}</div>
                  {redeemResult.coins && (
                    <div className="text-[11px] font-mono font-bold mt-0.5 text-white">
                      +{redeemResult.coins} Coins credited to your wallet!
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.button
              id="btn-redeem-code-submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isRedeeming || !couponCode.trim()}
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                !couponCode.trim()
                  ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#00FF66] to-[#05DF72] text-[#05070A] shadow-[0_0_25px_rgba(0,255,102,0.3)] hover:shadow-[0_0_35px_rgba(0,255,102,0.5)]'
              }`}
            >
              {isRedeeming ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Validating Code...</span>
                </>
              ) : (
                <>
                  <span>REDEEM REWARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Active Starter Codes / Hints */}
          {activeSampleCodes.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-2.5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Featured Community Codes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSampleCodes.map((code) => {
                  const alreadyUsed = userRedemptions.some(
                    (r) => r.code.toUpperCase() === code.code.toUpperCase()
                  );
                  return (
                    <button
                      key={code.id}
                      type="button"
                      disabled={alreadyUsed}
                      onClick={() => setCouponCode(code.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        alreadyUsed
                          ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed line-through'
                          : 'bg-[#05070A] hover:bg-[#00FF66]/10 border border-white/15 hover:border-[#00FF66]/40 text-[#00FF66]'
                      }`}
                    >
                      <span>{code.code}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (+{code.rewardCoins})
                      </span>
                      {alreadyUsed && <CheckCircle2 className="w-3 h-3 text-slate-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="p-3.5 rounded-2xl bg-[#05070A]/60 border border-white/5 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-[#00FF66] shrink-0" />
            <div className="text-[11px] text-slate-400">
              Each code is verified in real-time. Single-use per verified account.
            </div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================== */}
      {/* 3. RECENT REWARD REDEMPTIONS HISTORY */}
      {/* ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        id="rewards-history-table-card"
        className="bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#00FF66]" />
            <h3 className="text-base sm:text-lg font-bold text-white">Your Redeemed Promo Codes</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {userRedemptions.length} Code{userRedemptions.length === 1 ? '' : 's'} Redeemed
          </span>
        </div>

        {userRedemptions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
            <Gift className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>You haven't redeemed any promo codes yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Codes released during live sessions and announcements can be redeemed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-mono">
                  <th className="pb-3 px-3 font-semibold">CODE</th>
                  <th className="pb-3 px-3 font-semibold">REWARD</th>
                  <th className="pb-3 px-3 font-semibold">STATUS</th>
                  <th className="pb-3 px-3 font-semibold">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {userRedemptions.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-2">
                      <Ticket className="w-3.5 h-3.5 text-[#00FF66]" />
                      <span>{log.code}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#FFD700]">
                      +{log.rewardCoins} Coins
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-mono font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Credited
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.redeemedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};
