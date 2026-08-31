import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getPlatformPublicStats, getActiveTasks } from '../services/storage';
import { LeaderboardEntry, Task } from '../types';
import {
  Sparkles,
  ArrowRight,
  Trophy,
  Crown,
  Medal,
  Coins,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Flame,
  Star,
  ExternalLink,
  ChevronRight,
  Layers,
  Award,
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, navigateTo } = useAuth();
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

  const stats = useMemo(() => {
    return getPlatformPublicStats();
  }, [syncTick]);

  const leaderboard = useMemo(() => {
    return getLeaderboard();
  }, [syncTick]);

  const activeTasks = useMemo(() => {
    return getActiveTasks();
  }, [syncTick]);

  // Preview shows top 6 users
  const topRanked = leaderboard.slice(0, 6);
  const top1 = topRanked[0];
  const top2 = topRanked[1];
  const top3 = topRanked[2];
  const restUsers = topRanked.slice(3);

  return (
    <div id="asjadfx-landing-page" className="min-h-screen bg-[#05070A] text-slate-100 selection:bg-[#00FF66]/30 selection:text-[#00FF66] overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Neon Green & Gold Atmospheric Backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[350px] bg-gradient-to-tr from-[#00FF66]/15 via-[#FFD700]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-32 right-10 w-96 h-96 bg-[#00FF66]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle Finance Grid / Geometric Canvas Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1A2333_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Top Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0F131C]/90 border border-[#00FF66]/30 shadow-[0_0_20px_rgba(0,255,102,0.15)] backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#00FF66] uppercase">
              ASJADFX COMMUNITY REWARDS
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Earn Real Coins for Simple Tasks
            </span>
          </motion.div>

          {/* Main Hero Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-['Space_Grotesk'] leading-[1.08]"
          >
            Complete Tasks.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF66] via-[#10B981] to-[#00FF66] drop-shadow-[0_0_35px_rgba(0,255,102,0.35)]">
              Earn Coins.
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#F2A900] to-[#FFD700]">
              Rise Higher.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Complete exciting tasks, earn coins, climb the leaderboard and compete with the ASJADFX community.
          </motion.p>

          {/* CTA Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              id="hero-btn-start-earning"
              onClick={() => navigateTo(isAuthenticated ? '/tasks' : '/signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00FF66] hover:bg-[#05DF72] text-[#05070A] font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-[0_0_30px_rgba(0,255,102,0.45)] hover:shadow-[0_0_40px_rgba(0,255,102,0.6)] transition-all flex items-center justify-center gap-3 cursor-pointer group hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Start Earning</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="hero-btn-view-leaderboard"
              onClick={() => {
                const el = document.getElementById('leaderboard-preview');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigateTo('/leaderboard');
                }
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0F131C]/90 hover:bg-[#161B24] border border-[#FFD700]/30 hover:border-[#FFD700] text-white font-bold text-sm sm:text-base tracking-wider uppercase backdrop-blur-md transition-all flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]"
            >
              <Trophy className="w-5 h-5 text-[#FFD700]" />
              <span>View Leaderboard</span>
            </button>
          </motion.div>

          {/* Floating Feature Teaser Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto"
          >
            <div className="p-3 sm:p-4 rounded-2xl bg-[#0F131C]/60 border border-white/5 backdrop-blur-sm text-center">
              <span className="text-xl sm:text-2xl mb-1 block select-none">🪙</span>
              <div className="text-xs sm:text-sm font-bold text-white">Instant Rewards</div>
              <div className="text-[10px] text-slate-400">Verified Coins Credited</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-[#0F131C]/60 border border-white/5 backdrop-blur-sm text-center">
              <span className="text-xl sm:text-2xl mb-1 block select-none">⚡</span>
              <div className="text-xs sm:text-sm font-bold text-white">Daily Tasks</div>
              <div className="text-[10px] text-slate-400">Fresh Content & Missions</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-[#0F131C]/60 border border-white/5 backdrop-blur-sm text-center">
              <span className="text-xl sm:text-2xl mb-1 block select-none">🥇</span>
              <div className="text-xs sm:text-sm font-bold text-white">Live Rankings</div>
              <div className="text-[10px] text-slate-400">Automated Leaderboard</div>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl bg-[#0F131C]/60 border border-white/5 backdrop-blur-sm text-center">
              <span className="text-xl sm:text-2xl mb-1 block select-none">🎁</span>
              <div className="text-xs sm:text-sm font-bold text-white">Big Giveaways</div>
              <div className="text-[10px] text-slate-400">Exclusive Top Rewards</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATS SECTION */}
      {/* ========================================================================= */}
      <section id="stats" className="py-14 bg-[#0A0D14] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Stat 1: Active Users */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#00FF66]/30 transition-all text-center relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity select-none text-[#00FF66]">
                <Users className="w-12 h-12" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-mono font-bold uppercase mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping" />
                Community
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {stats.activeUsers.toLocaleString()}+
              </h3>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mt-2 font-['Space_Grotesk']">
                Active Users
              </p>
            </motion.div>

            {/* Stat 2: Tasks Completed */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 sm:p-8 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#00FF66]/30 transition-all text-center relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity select-none text-[#00FF66]">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-mono font-bold uppercase mb-2">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-[#00FF66] font-mono tracking-tight drop-shadow-[0_0_20px_rgba(0,255,102,0.3)]">
                {stats.tasksCompleted.toLocaleString()}+
              </h3>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mt-2 font-['Space_Grotesk']">
                Tasks Completed
              </p>
            </motion.div>

            {/* Stat 3: Coins Earned */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 sm:p-8 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#FFD700]/30 transition-all text-center relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 p-4 text-3xl opacity-10 group-hover:opacity-20 transition-opacity select-none text-[#FFD700]">
                🪙
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFD700]/10 text-[#FFD700] text-[10px] font-mono font-bold uppercase mb-2">
                <Crown className="w-3 h-3" />
                Rewards
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-[#FFD700] font-mono tracking-tight drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                🪙 {stats.coinsEarned.toLocaleString()}+
              </h3>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mt-2 font-['Space_Grotesk']">
                Coins Earned
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS SECTION */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] text-xs font-bold uppercase tracking-wider font-mono">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Simple 3-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            How It Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Get started in seconds and start accumulating coins to rise through the global ranks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Create Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#0F131C] to-[#0A0D14] border border-white/10 hover:border-[#00FF66]/40 transition-all relative overflow-hidden group shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-2xl font-black text-[#00FF66] font-mono mb-6 group-hover:scale-110 group-hover:bg-[#00FF66] group-hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,102,0.2)]">
              01
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk'] mb-3">
              Create Account
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create your ASJADFX account and join the community. Secure registration takes less than 30 seconds.
            </p>
          </motion.div>

          {/* Card 2: Complete Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#0F131C] to-[#0A0D14] border border-white/10 hover:border-[#00FF66]/40 transition-all relative overflow-hidden group shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-2xl font-black text-[#00FF66] font-mono mb-6 group-hover:scale-110 group-hover:bg-[#00FF66] group-hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,102,0.2)]">
              02
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk'] mb-3">
              Complete Tasks
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Complete available tasks and challenges to earn rewards. Follow channels, watch videos, and share trading content.
            </p>
          </motion.div>

          {/* Card 3: Earn Coins & Rank Up */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#0F131C] to-[#0A0D14] border border-white/10 hover:border-[#FFD700]/40 transition-all relative overflow-hidden group shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-2xl font-black text-[#FFD700] font-mono mb-6 group-hover:scale-110 group-hover:bg-[#FFD700] group-hover:text-black transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)]">
              03
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk'] mb-3">
              Earn Coins & Rank Up
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Earn coins, increase your rank and compete on the leaderboard. Qualify for exclusive rewards and giveaways.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURES SECTION */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 bg-[#0A0D14]/80 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] text-xs font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
              Powerful Features
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Everything you need to compete, track earnings, and dominate the ASJADFX rankings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Earn Coins */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#FFD700]/30 transition-all group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                🪙
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
                Earn Coins
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Accumulate valuable platform coins for every verified task completion and social media interaction.
              </p>
            </motion.div>

            {/* Feature 2: Complete Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#00FF66]/30 transition-all group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform text-[#00FF66]">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
                Complete Tasks
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Browse verified missions across YouTube, Instagram, and Telegram with clear step-by-step instructions.
              </p>
            </motion.div>

            {/* Feature 3: Daily Challenges */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#00FF66]/30 transition-all group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform text-[#00FF66]">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
                Daily Challenges
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Take part in fresh daily activities and seasonal tasks designed to boost your coin balance rapidly.
              </p>
            </motion.div>

            {/* Feature 4: Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#FFD700]/30 transition-all group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform text-[#FFD700]">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
                Leaderboard
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Climb the real-time global leaderboard where rank is determined automatically by total coin balance.
              </p>
            </motion.div>

            {/* Feature 5: Track Progress */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#00FF66]/30 transition-all group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform text-[#00FF66]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
                Track Progress
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Monitor your pending task reviews, completed missions, transaction ledger, and rank advancement.
              </p>
            </motion.div>

            {/* Feature 6: Level Up */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-white/5 hover:border-[#00FF66]/30 transition-all group shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform text-[#00FF66]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Space_Grotesk']">
                Level Up
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Ascend from novice to top trader status to unlock exclusive community giveaways and recognition.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. REAL LEADERBOARD SECTION (HOMEPAGE PREVIEW) */}
      {/* ========================================================================= */}
      <section id="leaderboard-preview" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-wider font-mono">
            <Crown className="w-3.5 h-3.5" />
            <span>Real-time Rankings</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            Top Earners Leaderboard
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Rankings update automatically whenever coin balances change. Compete for the #1 Gold spot!
          </p>
        </div>

        {/* PODIUM: TOP 3 USERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-10 max-w-5xl mx-auto">
          {/* #2 SILVER RANK */}
          {top2 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-slate-400/30 text-center relative overflow-hidden shadow-xl order-2 md:order-1"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-300 text-slate-900 font-black text-lg flex items-center justify-center shadow-md mb-3">
                🥈 #2
              </div>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-slate-600 to-slate-400 p-0.5 mb-3">
                <div className="w-full h-full rounded-2xl bg-[#0F131C] flex items-center justify-center text-xl font-bold text-slate-200">
                  {top2.fullName ? top2.fullName[0] : 'U'}
                </div>
              </div>
              <h4 className="text-lg font-bold text-white truncate">{top2.username}</h4>
              <p className="text-xs font-mono text-slate-400">
                {top2.instagramUsername ? `@${top2.instagramUsername}` : '@trader'}
              </p>
              <div className="mt-4 p-3 rounded-2xl bg-[#161B24] border border-white/5">
                <span className="text-2xl font-black text-slate-200 font-mono">🪙 {top2.coins}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-500">Coins</span>
              </div>
            </motion.div>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* #1 GOLD CHAMPION RANK */}
          {top1 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl bg-[#0F131C] border-2 border-[#FFD700] bg-gradient-to-b from-[#FFD700]/15 to-transparent text-center relative overflow-hidden shadow-[0_0_40px_rgba(255,215,0,0.25)] order-1 md:order-2 md:-translate-y-4"
            >
              <div className="absolute top-2 right-2">
                <Crown className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" />
              </div>
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-[#FFD700] via-amber-400 to-amber-600 text-black font-black text-xl flex items-center justify-center shadow-xl mb-3">
                🥇 #1
              </div>
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-[#FFD700] to-amber-500 p-1 mb-3 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                <div className="w-full h-full rounded-2xl bg-[#0F131C] flex items-center justify-center text-2xl font-bold text-[#FFD700]">
                  {top1.fullName ? top1.fullName[0] : 'U'}
                </div>
              </div>
              <h4 className="text-xl font-extrabold text-white truncate">{top1.username}</h4>
              <p className="text-xs font-mono text-[#FFD700]">
                {top1.instagramUsername ? `@${top1.instagramUsername}` : '@champion'}
              </p>
              <div className="mt-4 p-3.5 rounded-2xl bg-[#161B24] border border-[#FFD700]/30 shadow-inner">
                <span className="text-3xl font-black text-[#FFD700] font-mono">🪙 {top1.coins}</span>
                <span className="block text-[10px] uppercase font-bold text-[#FFD700]/70">Grand Champion</span>
              </div>
            </motion.div>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* #3 BRONZE RANK */}
          {top3 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-7 rounded-3xl bg-[#0F131C] border border-amber-700/30 text-center relative overflow-hidden shadow-xl order-3"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-700 text-white font-black text-lg flex items-center justify-center shadow-md mb-3">
                🥉 #3
              </div>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 p-0.5 mb-3">
                <div className="w-full h-full rounded-2xl bg-[#0F131C] flex items-center justify-center text-xl font-bold text-amber-400">
                  {top3.fullName ? top3.fullName[0] : 'U'}
                </div>
              </div>
              <h4 className="text-lg font-bold text-white truncate">{top3.username}</h4>
              <p className="text-xs font-mono text-amber-500">
                {top3.instagramUsername ? `@${top3.instagramUsername}` : '@trader'}
              </p>
              <div className="mt-4 p-3 rounded-2xl bg-[#161B24] border border-white/5">
                <span className="text-2xl font-black text-amber-500 font-mono">🪙 {top3.coins}</span>
                <span className="block text-[10px] uppercase font-bold text-slate-500">Coins</span>
              </div>
            </motion.div>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        {/* LOWER RANK CARDS (Rank #4, #5, #6, etc.) */}
        {restUsers.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-3 mb-10">
            {restUsers.map(u => (
              <div
                key={u.userId || u.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0F131C] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#161B24] border border-white/10 font-mono font-bold text-slate-400 flex items-center justify-center text-sm shrink-0">
                    #{u.rank}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm sm:text-base truncate">{u.username}</div>
                    <div className="text-xs text-[#00FF66] font-mono">
                      {u.instagramUsername ? `@${u.instagramUsername}` : 'Trader'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-black text-[#FFD700] font-mono">
                    🪙 {u.coins}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Balance</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Full Leaderboard Button */}
        <div className="text-center pt-2">
          <button
            id="btn-view-full-leaderboard-page"
            onClick={() => navigateTo('/leaderboard')}
            className="px-8 py-3.5 rounded-2xl bg-[#161B24] hover:bg-[#1C232E] border border-[#00FF66]/30 hover:border-[#00FF66] text-[#00FF66] font-bold text-sm uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.15)] cursor-pointer"
          >
            <span>View Full Leaderboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CTA SECTION */}
      {/* ========================================================================= */}
      <section id="cta" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-[#0A0D14] to-[#05070A]">
        <div className="absolute inset-0 bg-[radial-gradient(#00FF66_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00FF66]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 p-8 sm:p-14 rounded-3xl bg-[#0F131C]/90 border border-[#00FF66]/30 shadow-[0_0_50px_rgba(0,255,102,0.15)] backdrop-blur-xl">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            Ready to Rise Higher?
          </h2>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Join ASJADFX, complete tasks, earn coins and climb to the top.
          </p>
          <div>
            <button
              id="cta-btn-get-started"
              onClick={() => navigateTo(isAuthenticated ? '/tasks' : '/signup')}
              className="px-10 py-4.5 rounded-2xl bg-[#00FF66] hover:bg-[#05DF72] text-[#05070A] font-black text-base sm:text-lg tracking-wider uppercase shadow-[0_0_35px_rgba(0,255,102,0.5)] hover:shadow-[0_0_50px_rgba(0,255,102,0.7)] transition-all inline-flex items-center gap-3 cursor-pointer hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/5 bg-[#05070A] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00FF66] to-[#10B981] flex items-center justify-center font-black text-black text-xs">
              FX
            </div>
            <div>
              <span className="font-black text-white tracking-wider text-base font-['Space_Grotesk']">
                ASJADFX
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Trade. Earn. Rise.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <button onClick={() => navigateTo('/')} className="hover:text-[#00FF66] transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => {
              const el = document.getElementById('how-it-works');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} className="hover:text-[#00FF66] transition-colors cursor-pointer">
              How It Works
            </button>
            <button onClick={() => navigateTo('/leaderboard')} className="hover:text-[#00FF66] transition-colors cursor-pointer">
              Leaderboard
            </button>
            <button onClick={() => navigateTo('/rules')} className="hover:text-[#00FF66] transition-colors cursor-pointer">
              Platform Rules
            </button>
            <button onClick={() => navigateTo('/admin/login')} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer font-mono text-[11px]">
              Admin Panel
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            © {new Date().getFullYear()} ASJADFX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
