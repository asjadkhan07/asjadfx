import React, { useState, useEffect } from 'react';
import { User, DailySpinStatus } from '../types';
import {
  getDailySpinStatus,
  performDailySpin,
  getUserSpinTier,
  VIP_BASIC_SPIN_POOL,
  VIP_PRO_SPIN_POOL,
} from '../services/spin';
import { Crown, Sparkles, Lock, Clock, Coins, Trophy, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface DailySpinWheelProps {
  user: User | null;
  onSpinSuccess?: (reward: number) => void;
}

const SLICE_COLORS_BASIC = [
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EAB308', // Gold / Yellow
];

const SLICE_COLORS_PRO = [
  '#FFD700', // Gold
  '#00FF66', // Neon Green
  '#00E5FF', // Neon Cyan
  '#B388FF', // Deep Purple
  '#FF5252', // Coral Red
  '#FFAB00', // Amber
  '#7C4DFF', // Violet
  '#FFD700', // Jackpot Gold
];

export const DailySpinWheel: React.FC<DailySpinWheelProps> = ({ user, onSpinSuccess }) => {
  const { navigateTo, refreshUser } = useAuth();
  const [spinStatus, setSpinStatus] = useState<DailySpinStatus | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winMessage, setWinMessage] = useState<{ reward: number; tier: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('Calculating...');

  const updateStatus = () => {
    if (!user) return;
    const s = getDailySpinStatus(user.id);
    setSpinStatus(s);
    setCountdown(s.formattedCountdown);
  };

  useEffect(() => {
    updateStatus();

    const handleSync = () => {
      updateStatus();
    };
    window.addEventListener('asjadfx_data_updated', handleSync);
    return () => window.removeEventListener('asjadfx_data_updated', handleSync);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      const s = getDailySpinStatus(user.id);
      setCountdown(s.formattedCountdown);
      if (s.canSpin && spinStatus && !spinStatus.canSpin) {
        setSpinStatus(s);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, spinStatus?.canSpin]);

  const spinTier = user ? getUserSpinTier(user) : 'free';
  const pool = spinTier === 'vip_lifetime' ? VIP_PRO_SPIN_POOL : VIP_BASIC_SPIN_POOL;
  const sliceColors = spinTier === 'vip_lifetime' ? SLICE_COLORS_PRO : SLICE_COLORS_BASIC;
  const numSlices = pool.length;
  const sliceAngle = 360 / numSlices;

  const handleSpinClick = () => {
    if (!user) {
      navigateTo('/login');
      return;
    }

    if (spinTier === 'free') {
      navigateTo('/premium');
      return;
    }

    if (isSpinning || !spinStatus?.canSpin) return;

    setIsSpinning(true);
    setWinMessage(null);
    setErrorMessage(null);

    const result = performDailySpin(user);

    if (!result.success) {
      setIsSpinning(false);
      setErrorMessage(result.error || 'Spin failed.');
      return;
    }

    const prizeIndex = result.prizeIndex ?? 0;
    const prizeAmount = result.reward ?? pool[0];

    // Mathematical angle calculation for top pointer:
    // Slices start at top (0 deg) and go clockwise.
    // To land slice `prizeIndex` under top pointer (270 or 0 deg), rotate clockwise:
    // Full extra 5 to 8 rotations + slice center offset
    const extraRotations = 6 * 360; // 2160 deg
    const sliceCenterAngle = prizeIndex * sliceAngle + sliceAngle / 2;
    const targetDeg = extraRotations + (360 - sliceCenterAngle);

    setRotation((prev) => {
      const base = Math.ceil(prev / 360) * 360;
      return base + targetDeg;
    });

    // Wait for wheel animation (4.5s) to finish
    setTimeout(() => {
      setIsSpinning(false);
      setWinMessage({
        reward: prizeAmount,
        tier: spinTier === 'vip_lifetime' ? 'VIP Pro Spin' : 'VIP Basic Spin',
      });
      updateStatus();
      refreshUser();
      if (onSpinSuccess) onSpinSuccess(prizeAmount);
    }, 4600);
  };

  return (
    <div
      id="asjadfx-daily-spin-wheel-card"
      className="rounded-3xl bg-gradient-to-b from-[#0F131C] via-[#141A26] to-[#0A0D14] border border-[#FFD700]/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(255,215,0,0.12)] relative overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#00FF66]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFD700] via-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(255,215,0,0.4)] shrink-0">
            <Crown className="w-6 h-6 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] text-[10px] font-mono font-bold uppercase tracking-wider">
                {spinTier === 'vip_lifetime'
                  ? '⭐ VIP Pro Spin Active'
                  : spinTier === 'vip_basic'
                  ? '👑 VIP Basic Spin Active'
                  : '🔒 VIP Exclusive Feature'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Space_Grotesk'] tracking-tight mt-0.5">
              Daily VIP Fortune Wheel
            </h2>
          </div>
        </div>

        {/* Tier badge & cooldown pill */}
        <div className="flex items-center gap-2">
          {spinTier !== 'free' ? (
            <div className="px-4 py-2 rounded-2xl bg-[#05070A] border border-[#FFD700]/30 text-right">
              <div className="text-[10px] uppercase font-mono text-slate-400">Spin Cooldown</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-[#FFD700] flex items-center gap-1.5 justify-end">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>{countdown}</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigateTo('/premium')}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-105 transition-all cursor-pointer"
            >
              👑 UNLOCK VIP SPIN
            </button>
          )}
        </div>
      </div>

      {/* Main Wheel & Info Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6 relative z-10">
        {/* Left Side: Interactive SVG Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          {/* Wheel Frame */}
          <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
            {/* Outer Glowing Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-[#FFD700]/40 shadow-[0_0_30px_rgba(255,215,0,0.3)] animate-pulse pointer-events-none" />

            {/* Rotating SVG Disc */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{
                duration: 4.5,
                ease: [0.15, 0.9, 0.2, 1], // Realistic spin deceleration
              }}
              className="w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full shadow-2xl overflow-hidden relative"
              style={{ transformOrigin: 'center center' }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {pool.map((reward, i) => {
                  const startAngle = (i * sliceAngle * Math.PI) / 180;
                  const endAngle = (((i + 1) * sliceAngle) * Math.PI) / 180;
                  const x1 = 50 + 50 * Math.cos(startAngle);
                  const y1 = 50 + 50 * Math.sin(startAngle);
                  const x2 = 50 + 50 * Math.cos(endAngle);
                  const y2 = 50 + 50 * Math.sin(endAngle);

                  const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                  const color = sliceColors[i % sliceColors.length];

                  // Text rotation angle
                  const midAngle = i * sliceAngle + sliceAngle / 2;
                  const rad = (midAngle * Math.PI) / 180;
                  const tx = 50 + 32 * Math.cos(rad);
                  const ty = 50 + 32 * Math.sin(rad);

                  return (
                    <g key={`slice-${i}`}>
                      <path
                        d={pathData}
                        fill={color}
                        stroke="#0F131C"
                        strokeWidth="1.2"
                        className="transition-opacity hover:opacity-90"
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill="#000000"
                        fontSize="6.2"
                        fontWeight="900"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                      >
                        +{reward}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>

            {/* Pointer / Needle at TOP (12 o'clock) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-[#FFD700] filter drop-shadow-[0_0_8px_#FFD700]" />
            </div>

            {/* Center Hub / Spin Button */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button
                id="btn-trigger-daily-spin"
                disabled={isSpinning || !spinStatus?.canSpin || spinTier === 'free'}
                onClick={handleSpinClick}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#0F131C] font-black text-xs sm:text-sm uppercase flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-transform ${
                  isSpinning
                    ? 'bg-amber-400 text-black scale-95 cursor-wait'
                    : spinStatus?.canSpin && spinTier !== 'free'
                    ? 'bg-gradient-to-tr from-[#FFD700] via-amber-400 to-[#00FF66] text-black hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,215,0,0.6)] cursor-pointer'
                    : 'bg-[#1F2937] text-slate-400 cursor-not-allowed opacity-80'
                }`}
              >
                {isSpinning ? (
                  <Sparkles className="w-6 h-6 animate-spin text-black" />
                ) : spinStatus?.canSpin && spinTier !== 'free' ? (
                  <>
                    <Zap className="w-4 h-4 fill-black text-black mb-0.5" />
                    <span className="font-extrabold tracking-tighter">SPIN</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="text-[9px]">WAIT</span>
                  </>
                )}
              </button>
            </div>

            {/* Free User Overlay Lock */}
            {spinTier === 'free' && (
              <div className="absolute inset-0 rounded-full bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-25">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-sm font-black text-white">VIP Daily Spin</div>
                <div className="text-[11px] text-slate-300 max-w-[200px] mt-1">
                  Exclusive to ₹49 Basic &amp; ₹99 Lifetime VIP members.
                </div>
                <button
                  onClick={() => navigateTo('/premium')}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tier Pools, Rewards Table & Status */}
        <div className="lg:col-span-5 space-y-4">
          {/* Win Celebration Alert */}
          <AnimatePresence>
            {winMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#00FF66]/20 via-[#FFD700]/15 to-amber-500/20 border-2 border-[#00FF66] shadow-[0_0_25px_rgba(0,255,102,0.3)] text-center space-y-1"
              >
                <div className="text-xs font-mono font-bold uppercase text-[#00FF66] flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00FF66]" />
                  <span>CONGRATULATIONS!</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-[#FFD700]">
                  +{winMessage.reward} COINS
                </div>
                <div className="text-[11px] text-slate-300">
                  Credited directly to your wallet from {winMessage.tier}!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Reward Pool Comparison Box */}
          <div className="p-4 rounded-2xl bg-[#05070A] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>SPIN REWARD POOLS</span>
              </span>
              <span className="text-[#00FF66] text-[11px]">1 Spin / 24 Hours</span>
            </div>

            {/* Basic Pool */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                spinTier === 'vip_basic'
                  ? 'bg-[#FFD700]/10 border-[#FFD700]/40'
                  : 'bg-white/5 border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1">
                  <span>👑 VIP Basic Pool (₹49)</span>
                  {spinTier === 'vip_basic' && (
                    <span className="text-[10px] text-[#00FF66] font-mono">(Your Pool)</span>
                  )}
                </span>
                <span className="font-mono font-bold text-[#FFD700]">10 to 100 Coins</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VIP_BASIC_SPIN_POOL.map((c) => (
                  <span
                    key={`basic-${c}`}
                    className="px-2 py-0.5 rounded-lg bg-black/50 border border-white/10 font-mono text-[10px] text-slate-300 font-bold"
                  >
                    +{c}
                  </span>
                ))}
              </div>
            </div>

            {/* Pro Pool */}
            <div
              className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                spinTier === 'vip_lifetime'
                  ? 'bg-[#00FF66]/10 border-[#00FF66]/40 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                  : 'bg-white/5 border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1">
                  <span>⭐ VIP Lifetime / Pro Pool (₹99)</span>
                  {spinTier === 'vip_lifetime' && (
                    <span className="text-[10px] text-[#00FF66] font-mono">(Your Pool)</span>
                  )}
                </span>
                <span className="font-mono font-bold text-[#00FF66]">25 to 500 Coins</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VIP_PRO_SPIN_POOL.map((c) => (
                  <span
                    key={`pro-${c}`}
                    className="px-2 py-0.5 rounded-lg bg-black/50 border border-[#00FF66]/20 font-mono text-[10px] text-[#00FF66] font-bold"
                  >
                    +{c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action guidance */}
          {spinTier === 'free' ? (
            <button
              onClick={() => navigateTo('/premium')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FFD700] via-amber-400 to-[#FFD700] text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 fill-black" />
              <span>UPGRADE TO VIP TO UNLOCK DAILY SPIN</span>
            </button>
          ) : spinStatus?.canSpin ? (
            <button
              disabled={isSpinning}
              onClick={handleSpinClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#00FF66] via-[#05DF72] to-[#00FF66] text-[#05070A] font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:shadow-[0_0_35px_rgba(0,255,102,0.6)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{isSpinning ? 'SPINNING WHEEL...' : 'SPIN THE WHEEL NOW'}</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#05070A] border border-white/10 text-xs text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />
                <span>Today's spin completed!</span>
              </div>
              <div className="font-mono text-[#FFD700] font-bold">{countdown}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
