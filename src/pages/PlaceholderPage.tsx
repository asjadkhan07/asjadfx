import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../types';
import {
  Target,
  Trophy,
  Gift,
  User as UserIcon,
  Construction,
  ArrowLeft,
  Coins,
  Shield,
  Clock,
  Calendar,
  Mail,
  Instagram,
} from 'lucide-react';
import { motion } from 'motion/react';

interface PlaceholderPageProps {
  route: AppRoute;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ route }) => {
  const { user, navigateTo } = useAuth();

  const getPageInfo = () => {
    switch (route) {
      case '/tasks':
        return {
          title: 'Tasks',
          subtitle: 'Complete verified platform tasks to earn ASJADFX coins.',
          icon: <Target className="w-8 h-8 text-amber-400" />,
        };
      case '/leaderboard':
        return {
          title: 'Leaderboard',
          subtitle: 'Global rankings based on authentic approved coin balances.',
          icon: <Trophy className="w-8 h-8 text-blue-400" />,
        };
      case '/giveaway':
        return {
          title: 'Community Giveaway',
          subtitle: 'Exclusive prize pools and community reward distributions.',
          icon: <Gift className="w-8 h-8 text-purple-400" />,
        };
      case '/profile':
        return {
          title: 'Trader Profile',
          subtitle: 'Account details and verification credentials.',
          icon: <UserIcon className="w-8 h-8 text-emerald-400" />,
        };
      default:
        return {
          title: 'ASJADFX Section',
          subtitle: 'Trading rewards platform module.',
          icon: <Construction className="w-8 h-8 text-amber-400" />,
        };
    }
  };

  const info = getPageInfo();

  return (
    <div id="asjadfx-placeholder-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-8 sm:pt-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl bg-[#0F131C] border border-white/10 p-6 sm:p-10 shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F2A900]/10 border border-[#F2A900]/20 flex items-center justify-center shadow-[0_0_20px_rgba(242,169,0,0.15)]">
            {info.icon}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              {info.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              {info.subtitle}
            </p>
          </div>

          {/* Specified phrase from instructions */}
          <div className="py-4 px-5 rounded-2xl bg-[#0A0D14] border border-white/5">
            <div className="flex items-center justify-center gap-2 text-[#F2A900] text-xs font-bold uppercase tracking-wider mb-1">
              <Construction className="w-4 h-4" />
              <span>Step-By-Step Rollout</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              This section is currently being built.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Stay tuned as new verified features and modules are deployed in subsequent steps.
            </p>
          </div>

          {/* User Profile Summary when on /profile */}
          {route === '/profile' && user && (
            <div className="text-left p-4 sm:p-5 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Your Account Credentials
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#161B24] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="text-white font-semibold">{user.fullName}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161B24] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Username</span>
                  <span className="text-[#F2A900] font-semibold">@{user.username}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161B24] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Email Address</span>
                  <span className="text-white font-mono">{user.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161B24] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Instagram Handle</span>
                  <span className="text-[#FFD700] font-mono">@{user.instagramUsername}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161B24] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Coin Balance</span>
                  <span className="text-[#F2A900] font-bold font-['Space_Grotesk']">🪙 {user.coins} Coins</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161B24] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Member Since</span>
                  <span className="text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('/home')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <button
              onClick={() => navigateTo('/rules')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#161B24] border border-white/10 hover:bg-[#1C232E] text-slate-300 text-xs font-semibold cursor-pointer"
            >
              View Official Rules
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
