import React from 'react';
import { motion } from 'motion/react';

interface ASJADFXLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ASJADFXLogo: React.FC<ASJADFXLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  onClick,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <motion.div
      id="asjadfx-brand-header"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Immersive Gold Gradient Badge */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-[#F2A900] via-[#FFD700] to-amber-500 rounded-lg shadow-[0_0_15px_rgba(242,169,0,0.35)] flex items-center justify-center shrink-0 relative overflow-hidden group`}
      >
        <span className="text-[#05070A] font-black tracking-tighter leading-none relative z-10">FX</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
      </div>

      <div className="flex flex-col text-left">
        <h1
          className={`${textSizes[size]} font-black tracking-tighter text-white leading-none uppercase font-['Space_Grotesk']`}
        >
          ASJADFX
        </h1>
        <p className="text-[10px] text-[#00FF66] font-semibold tracking-widest uppercase opacity-90 mt-0.5 font-mono">
          TRADE. EARN. RISE.
        </p>
      </div>
    </motion.div>
  );
};
