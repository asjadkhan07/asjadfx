import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASJADFXLogo } from '../components/ASJADFXLogo';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, navigateTo } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(cleanEmail);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('Could not process request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#05070A] via-[#0A0D14] to-[#05070A] relative overflow-hidden">
      <div className="absolute -top-40 right-0 w-96 h-96 bg-[#F2A900]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <ASJADFXLogo size="lg" showTagline={false} />
          <h1
            id="forgot-password-heading"
            className="mt-6 text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']"
          >
            Reset Password
          </h1>
          <p id="forgot-password-subtitle" className="mt-2 text-xs sm:text-sm text-slate-400">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {error && (
          <div
            id="forgot-password-error"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            id="forgot-password-success"
            className="space-y-5 text-center py-4"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">Reset Link Sent</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                If an account exists for <span className="text-[#F2A900] font-semibold">{email}</span>, we have dispatched a secure password reset link.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Please check your inbox and spam folder. Links are valid for 60 minutes.
              </p>
            </div>

            <button
              type="button"
              id="btn-back-to-login-after-reset"
              onClick={() => navigateTo('/login')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#161B24] hover:bg-[#1C232E] border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#161B24] border border-white/10 focus:border-[#F2A900] focus:ring-1 focus:ring-[#F2A900] text-white placeholder-slate-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-send-reset-link"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(242,169,0,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-[#05070A] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>SEND RESET LINK</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                id="btn-back-to-login"
                onClick={() => navigateTo('/login')}
                className="text-xs font-semibold text-slate-400 hover:text-[#F2A900] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
