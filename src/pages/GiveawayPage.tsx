import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllGiveaways, getLeaderboard, findUserById } from '../services/storage';
import { Giveaway } from '../types';
import {
  Gift,
  Trophy,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
} from 'lucide-react';

export const GiveawayPage: React.FC = () => {
  const { user } = useAuth();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [syncTick, setSyncTick] = useState(0);

  const loadData = () => {
    setGiveaways(getAllGiveaways());
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
      setSyncTick(t => t + 1);
    };

    window.addEventListener('asjadfx_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('asjadfx_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const freshUser = useMemo(() => {
    if (!user) return null;
    return findUserById(user.id) || user;
  }, [user, syncTick]);

  return (
    <div id="asjadfx-giveaways-page" className="min-h-[calc(100vh-4rem)] pb-24 pt-6 sm:pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-white/5 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-xs font-bold uppercase tracking-wider font-mono">
            <Gift className="w-3.5 h-3.5" />
            <span>Official Rewards Pools</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            Funded Account & Cash Giveaways
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Top coin earners are eligible for exclusive funded trading accounts, USDT pools, and cash giveaways.
          </p>
        </div>

        {/* User Qualification Banner */}
        {freshUser && (
          <div className="p-5 rounded-3xl bg-[#0F131C] border border-[#F2A900]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#F2A900]/10 border border-[#F2A900]/30 text-[#F2A900] flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400">Your Coin Balance</div>
                <div className="text-xl font-extrabold text-[#FFD700] font-mono">🪙 {freshUser.coins ?? 0} Coins</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 max-w-md text-right sm:text-left">
              Earn more coins by completing verified platform tasks to qualify for higher giveaway tiers.
            </div>
          </div>
        )}

        {/* Giveaways List */}
        {giveaways.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#0F131C] border border-dashed border-white/10 space-y-3">
            <Gift className="w-12 h-12 mx-auto text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-white">No active giveaways at this moment.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Our monthly trading giveaways are scheduled by administrators. Continue earning coins to prepare!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {giveaways.map(g => {
              const isEligible = (freshUser?.coins || 0) >= (g.minCoinsRequired || 0);

              return (
                <div
                  key={g.id}
                  className="rounded-3xl bg-[#0F131C] border border-white/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-[#F2A900]/30 transition-all shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-[#F2A900]/10 border border-[#F2A900]/25 text-[#F2A900] text-xs font-bold font-mono uppercase tracking-wider">
                        {g.status} Giveaway
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ends {new Date(g.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-white">{g.title}</h2>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{g.description}</p>
                    </div>

                    {/* Prize Podium Card */}
                    <div className="p-4 rounded-2xl bg-[#0A0D14] border border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono">Total Reward Value:</span>
                        <span className="font-black text-[#FFD700] text-base">{g.prize}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center font-mono text-xs">
                        <div className="p-2 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700]">
                          <div className="text-[10px] uppercase font-bold">1st Prize</div>
                          <div className="font-extrabold text-xs mt-0.5 truncate">{g.firstPrize || g.firstPlacePrize}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-300/10 border border-slate-300/20 text-slate-300">
                          <div className="text-[10px] uppercase font-bold">2nd Prize</div>
                          <div className="font-extrabold text-xs mt-0.5 truncate">{g.secondPrize || g.secondPlacePrize}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-700/10 border border-amber-700/20 text-amber-500">
                          <div className="text-[10px] uppercase font-bold">3rd Prize</div>
                          <div className="font-extrabold text-xs mt-0.5 truncate">{g.thirdPrize || g.thirdPlacePrize}</div>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility details */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-400 font-mono">
                        <span>Minimum Coins Required:</span>
                        <span className="font-bold text-white">🪙 {g.minCoinsRequired || 0} Coins</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                        {g.eligibilityRules}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      {isEligible ? (
                        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>You Meet Qualification Criteria</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">
                          Need {(g.minCoinsRequired || 0) - (freshUser?.coins || 0)} more coins to qualify
                        </span>
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
  );
};
