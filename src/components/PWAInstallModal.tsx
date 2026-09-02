import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share, PlusSquare, Smartphone, CheckCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { ASJADFXLogo } from './ASJADFXLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall?: () => void;
  isInstallable: boolean;
  isIOS: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#0F131C] to-[#070A0F] border border-[#F2A900]/30 p-6 shadow-2xl text-slate-100 overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#F2A900]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#00FF66]/10 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Brand */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="relative">
                <img
                  src="/pwa-192x192.png"
                  alt="ASJADFX App Icon"
                  className="w-14 h-14 rounded-2xl shadow-[0_0_20px_rgba(242,169,0,0.25)] border border-[#F2A900]/40 object-cover"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00FF66] text-[9px] font-black text-black">
                  ✓
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white">ASJADFX App</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#F2A900]/15 border border-[#F2A900]/40 text-[10px] font-mono font-bold text-[#F2A900] uppercase">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Trade • Earn • Rise</p>
              </div>
            </div>

            {/* Features Highlights */}
            <div className="space-y-2 mb-6 bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-4 h-4 text-[#00FF66] shrink-0" />
                <span>Full standalone screen experience (Zero browser url bar)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-[#F2A900] shrink-0" />
                <span>Instant launch from home screen & smooth offline caching</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Secure encrypted session & real-time rewards syncing</span>
              </div>
            </div>

            {/* Installation Instructions for Different Platforms */}
            {isIOS ? (
              <div className="space-y-3 bg-[#131924] border border-white/10 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  How to install on iPhone / iPad (Safari):
                </p>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2A900]/20 font-mono text-[11px] font-bold text-[#F2A900]">
                      1
                    </span>
                    <p className="leading-snug">
                      Tap the <strong className="text-white">Share</strong> button{' '}
                      <Share className="inline w-3.5 h-3.5 text-sky-400 align-text-bottom mx-0.5" /> in the Safari bottom bar.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2A900]/20 font-mono text-[11px] font-bold text-[#F2A900]">
                      2
                    </span>
                    <p className="leading-snug">
                      Scroll down and tap <strong className="text-white">Add to Home Screen</strong>{' '}
                      <PlusSquare className="inline w-3.5 h-3.5 text-[#00FF66] align-text-bottom mx-0.5" />.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2A900]/20 font-mono text-[11px] font-bold text-[#F2A900]">
                      3
                    </span>
                    <p className="leading-snug">
                      Tap <strong className="text-[#00FF66]">Add</strong> at the top right corner. ASJADFX is now installed!
                    </p>
                  </div>
                </div>
              </div>
            ) : isInstallable && onInstall ? (
              <div className="mb-6">
                <button
                  onClick={() => {
                    onInstall();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#E59900] px-5 py-3.5 text-sm font-black text-black shadow-[0_0_25px_rgba(242,169,0,0.35)] hover:shadow-[0_0_35px_rgba(242,169,0,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Install ASJADFX App Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-[#131924] border border-white/10 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  How to install on Android Chrome:
                </p>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    1. Tap the Chrome <strong>three dots (⋮)</strong> menu in the top right.
                  </p>
                  <p>
                    2. Select <strong className="text-[#00FF66]">"Install app"</strong> or{' '}
                    <strong className="text-[#00FF66]">"Add to Home screen"</strong>.
                  </p>
                  <p>3. Tap Install. ASJADFX will appear as a standalone app on your home screen.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Done / Continue Browsing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
