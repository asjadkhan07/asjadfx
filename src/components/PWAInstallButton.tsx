import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'nav' | 'hero' | 'drawer';
  className?: string;
  onClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
  onClick,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running in standalone PWA, suppress the install button
  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (onClick) onClick();
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'compact') {
    return (
      <>
        <button
          id="pwa-install-compact-btn"
          onClick={handleAction}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2A900]/10 border border-[#F2A900]/30 hover:bg-[#F2A900]/20 text-xs font-bold text-[#F2A900] transition-colors cursor-pointer ${className}`}
          title="Install ASJADFX App"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        <PWAInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onInstall={install}
          isInstallable={isInstallable}
          isIOS={isIOS}
        />
      </>
    );
  }

  if (variant === 'nav') {
    return (
      <>
        <button
          id="pwa-install-nav-btn"
          onClick={handleAction}
          className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F2A900]/15 to-[#FFD700]/10 hover:from-[#F2A900]/25 hover:to-[#FFD700]/20 border border-[#F2A900]/40 text-xs font-bold text-slate-100 hover:text-white shadow-[0_0_15px_rgba(242,169,0,0.15)] transition-all cursor-pointer ${className}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#F2A900] text-black">
            <Download className="w-3 h-3 stroke-[3]" />
          </span>
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">App</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#00FF66] animate-pulse" />
        </button>

        <PWAInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onInstall={install}
          isInstallable={isInstallable}
          isIOS={isIOS}
        />
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <button
          id="pwa-install-hero-btn"
          onClick={handleAction}
          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#E59900] text-black font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(242,169,0,0.35)] hover:shadow-[0_0_45px_rgba(242,169,0,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Download className="w-5 h-5 stroke-[2.5]" />
          <span>Install ASJADFX Mobile App</span>
        </button>

        <PWAInstallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onInstall={install}
          isInstallable={isInstallable}
          isIOS={isIOS}
        />
      </>
    );
  }

  // Drawer / Full variant
  return (
    <>
      <button
        id="pwa-install-drawer-btn"
        onClick={handleAction}
        className={`w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-[#F2A900]/15 to-[#0F131C] border border-[#F2A900]/30 hover:border-[#F2A900]/60 text-slate-100 transition-all cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F2A900]/20 border border-[#F2A900]/40 flex items-center justify-center text-[#F2A900]">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Install ASJADFX App</span>
              <span className="px-1.5 py-0.2 rounded bg-[#00FF66]/20 text-[#00FF66] text-[9px] font-mono">PWA</span>
            </p>
            <p className="text-[11px] text-slate-400">Standalone home screen app</p>
          </div>
        </div>
        <Download className="w-4 h-4 text-[#F2A900]" />
      </button>

      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstall={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
      />
    </>
  );
};
