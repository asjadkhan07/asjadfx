import React from 'react';

interface ASJADFXLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ASJADFXLogo: React.FC<ASJADFXLogoProps> = ({
  size = 'md',
  showTagline = false,
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
    <div
      id="asjadfx-brand-header"
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Immersive Gold Gradient Badge */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-[#F2A900] to-[#FFD700] rounded-lg shadow-[0_0_15px_rgba(242,169,0,0.3)] flex items-center justify-center shrink-0`}
      >
        <span className="text-[#05070A] font-black tracking-tighter leading-none">FX</span>
      </div>

      <div className="flex flex-col text-left">
        <h1
          className={`${textSizes[size]} font-black tracking-tighter text-white leading-none uppercase font-['Space_Grotesk']`}
        >
          ASJADFX
        </h1>
        <p className="text-[10px] text-[#F2A900] font-medium tracking-widest uppercase opacity-80 mt-0.5">
          {showTagline ? 'Trade. Earn. Rise.' : 'Trade. Earn. Rise.'}
        </p>
      </div>
    </div>
  );
};
