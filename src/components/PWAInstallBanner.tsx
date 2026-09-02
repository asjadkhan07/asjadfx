import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PWAInstallModal } from './PWAInstallModal';

const PWA_BANNER_DISMISS_KEY = 'asjadfx_pwa_banner_dismissed_until';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if dismissed recently
    try {
      const dismissedUntil = localStorage.getItem(PWA_BANNER_DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsVisible(false);
        return;
      }
    } catch {
      // ignore
    }

    // Delay showing banner slightly after page loads
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      // Dismiss for 3 days
      localStorage.setItem(PWA_BANNER_DISMISS_KEY, String(Date.now() + 3 * 24 * 60 * 60 * 1000));
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      } else {
        setIsVisible(false);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled || !isVisible) {
    return (
      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstall={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="pwa-install-floating-banner"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md mx-auto sm:mx-0 rounded-2xl bg-gradient-to-r from-[#0F131C]/95 via-[#131924]/95 to-[#0B0F17]/95 border border-[#F2A900]/40 p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(242,169,0,0.2)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="ASJADFX"
                  className="w-11 h-11 rounded-xl border border-[#F2A900]/50 object-cover shadow-[0_0_12px_rgba(242,169,0,0.3)] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-['Space_Grotesk'] font-bold text-white text-xs sm:text-sm">
                      Install ASJADFX
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#00FF66]/20 text-[#00FF66] text-[9px] font-mono font-bold">
                      FAST
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    Add to home screen for standalone trading experience
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  id="pwa-banner-install-action"
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F2A900] to-[#FFD700] text-black text-xs font-extrabold shadow-[0_0_15px_rgba(242,169,0,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Install</span>
                </button>

                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
