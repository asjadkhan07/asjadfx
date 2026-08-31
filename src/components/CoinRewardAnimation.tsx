import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Coins } from 'lucide-react';

interface CoinRewardEventDetail {
  amount: number;
  label?: string;
  id?: string;
}

// Global dispatcher helper
export function triggerCoinReward(amount: number, label?: string): void {
  if (typeof window !== 'undefined') {
    const detail: CoinRewardEventDetail = {
      amount,
      label: label || 'Coins Earned!',
      id: Math.random().toString(36).substring(2, 9),
    };
    window.dispatchEvent(new CustomEvent('asjadfx_coin_reward', { detail }));
  }
}

interface ActiveReward {
  id: string;
  amount: number;
  label: string;
}

export const CoinRewardAnimation: React.FC = () => {
  const [activeRewards, setActiveRewards] = useState<ActiveReward[]>([]);

  useEffect(() => {
    const handleReward = (e: Event) => {
      const customEventDir = e as CustomEvent<CoinRewardEventDetail>;
      if (!customEventDir.detail) return;

      const newReward: ActiveReward = {
        id: customEventDir.detail.id || Math.random().toString(36).substring(2, 9),
        amount: customEventDir.detail.amount,
        label: customEventDir.detail.label || 'Coins Earned!',
      };

      setActiveRewards((prev) => [...prev, newReward]);

      // Auto remove after animation completes
      setTimeout(() => {
        setActiveRewards((prev) => prev.filter((r) => r.id !== newReward.id));
      }, 3000);
    };

    window.addEventListener('asjadfx_coin_reward', handleReward);
    return () => {
      window.removeEventListener('asjadfx_coin_reward', handleReward);
    };
  }, []);

  return (
    <div
      id="asjadfx-coin-rewards-container"
      aria-live="polite"
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center"
    >
      <AnimatePresence>
        {activeRewards.map((reward) => (
          <div key={reward.id} className="relative flex flex-col items-center">
            {/* 1. Burst of Flying 3D Golden Coins */}
            {Array.from({ length: 12 }).map((_, index) => {
              const angle = (index / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
              const radius = 90 + Math.random() * 80;
              const randomDelay = Math.random() * 0.15;
              const burstX = Math.cos(angle) * radius;
              const burstY = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={`coin-${reward.id}-${index}`}
                  initial={{
                    opacity: 1,
                    scale: 0.2,
                    x: 0,
                    y: 0,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 1, 0.8, 0],
                    scale: [0.3, 1.3, 1, 0.7, 0.2],
                    x: [0, burstX, burstX * 1.3, window.innerWidth > 768 ? window.innerWidth * 0.28 : 80],
                    y: [0, burstY - 40, burstY - 80, -window.innerHeight * 0.42],
                    rotate: [0, 180, 360, 540],
                  }}
                  transition={{
                    duration: 1.8,
                    delay: randomDelay,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="absolute text-2xl select-none filter drop-shadow-[0_0_12px_rgba(255,215,0,0.8)]"
                >
                  🪙
                </motion.div>
              );
            })}

            {/* 2. Central Glowing Reward Pill "+X COINS" */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{
                opacity: [0, 1, 1, 1, 0],
                scale: [0.6, 1.15, 1, 1, 0.9],
                y: [30, -10, -15, -25, -60],
              }}
              exit={{ opacity: 0, scale: 0.8, y: -80 }}
              transition={{ duration: 2.4, ease: 'easeOut' }}
              className="px-6 py-3.5 rounded-2xl bg-[#0F131C]/95 border-2 border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.5),0_0_20px_rgba(0,255,102,0.3)] backdrop-blur-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FFD700] to-amber-500 flex items-center justify-center text-black font-black shadow-md">
                <Coins className="w-6 h-6 fill-black" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                    +{reward.amount} COINS
                  </span>
                  <Sparkles className="w-4 h-4 text-[#00FF66] animate-spin" />
                </div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-['Space_Grotesk']">
                  {reward.label}
                </span>
              </div>
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
