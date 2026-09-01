import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PremiumUpgradeCardProps {
  onUpgradeClick?: () => void;
  className?: string;
}

export const PremiumUpgradeCard: React.FC<PremiumUpgradeCardProps> = ({
  onUpgradeClick,
  className = '',
}) => {
  const { user, navigateTo } = useAuth();

  // If user is already an active premium member, DO NOT show this card
  if (user?.membership_type === 'premium' && user?.premium_status === 'active') {
    return null;
  }

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
    navigateTo('/premium');
  };

  return (
    <div
      id="premium-upgrade-card"
      className={`rounded-2xl bg-gradient-to-b from-[#161B24] to-[#0A0D14] border border-[#FFD700]/30 p-3.5 space-y-2.5 shadow-[0_0_20px_rgba(255,215,0,0.12)] hover:border-[#FFD700]/60 transition-all group ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#FFD700] font-black text-xs font-['Space_Grotesk'] tracking-wider">
          <Crown className="w-3.5 h-3.5 fill-[#FFD700]" />
          <span>ASJADFX PREMIUM</span>
        </div>
        <span className="px-1.5 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-[9px] font-bold font-mono">
          VIP
        </span>
      </div>

      <p className="text-[11px] text-slate-300 leading-snug">
        Unlock exclusive benefits and earn more.
      </p>

      <div className="flex items-center justify-between text-xs font-mono pt-0.5">
        <span className="font-extrabold text-white text-xs sm:text-sm">₹49</span>
        <span className="text-[10px] text-[#00FF66] font-bold uppercase tracking-wider">
          • 4 MONTHS
        </span>
      </div>

      <motion.button
        id="btn-sidebar-upgrade"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-amber-400 to-[#F2A900] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(255,215,0,0.25)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all cursor-pointer"
      >
        <span>UPGRADE NOW 👑</span>
      </motion.button>
    </div>
  );
};
