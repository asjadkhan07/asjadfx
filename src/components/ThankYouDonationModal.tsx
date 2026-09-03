import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, Sparkles, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPendingThankYouDonation, markThankYouAsShown } from '../services/storage';
import { Donation } from '../types';

export const ThankYouDonationModal: React.FC = () => {
  const { user } = useAuth();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const checkPendingThankYou = () => {
    if (!user) return;
    const pending = getPendingThankYouDonation(user.id);
    if (pending) {
      setDonation(pending);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    checkPendingThankYou();

    const handleDataChanged = () => {
      checkPendingThankYou();
    };

    window.addEventListener('asjadfx_data_changed', handleDataChanged);
    return () => window.removeEventListener('asjadfx_data_changed', handleDataChanged);
  }, [user]);

  const handleClose = () => {
    if (donation) {
      markThankYouAsShown(donation.id);
    }
    setIsOpen(false);
  };

  if (!isOpen || !donation) return null;

  const donorDisplayName = donation.isAnonymous
    ? 'Anonymous Supporter'
    : donation.userFullName || user?.fullName || donation.username || 'Valued Trader';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#16121E] via-[#0E0E18] to-[#08080E] border border-rose-500/30 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.25)]"
        >
          {/* Background Ambient Glows */}
          <div className="absolute -top-16 -left-16 w-44 h-44 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Heart Centerpiece */}
          <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-rose-500/20 blur-md"
            />
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-rose-400 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.6)] border border-rose-300/40">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Verified Official Donation</span>
          </div>

          {/* Title & Message */}
          <h3 className="text-2xl font-black text-white tracking-tight mb-2">
            ❤️ Thank You, <span className="text-rose-400">{donorDisplayName}</span>!
          </h3>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 my-4 space-y-1.5">
            <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
              You Donated
            </p>
            <p className="text-3xl font-black text-[#00FF66] font-mono">
              ₹{donation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-mono text-slate-400">
              Ref UTR: {donation.referenceId}
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Your support makes a real difference! Because of community leaders like you, ASJADFX continues to empower traders with free education, tools, and welfare programs.
          </p>

          {donation.causeTitle && (
            <p className="text-xs text-rose-300/80 font-medium mt-2">
              Cause: {donation.causeTitle}
            </p>
          )}

          {/* Action Button */}
          <div className="mt-6">
            <button
              onClick={handleClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 text-white font-extrabold text-sm tracking-wide shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              Continue to ASJADFX
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
