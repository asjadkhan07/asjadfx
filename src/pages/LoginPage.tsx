import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASJADFXLogo } from '../components/ASJADFXLogo';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const { login, navigateTo } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#05070A] via-[#0A0D14] to-[#05070A] relative overflow-hidden">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F2A900]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#F2A900]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <ASJADFXLogo size="lg" showTagline={false} />
          
          <h1
            id="login-heading"
            className="mt-6 text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']"
          >
            Welcome Back
          </h1>
          <p id="login-subtitle" className="mt-2 text-xs sm:text-sm text-slate-400">
            Login to complete tasks, earn coins and rise higher.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            id="login-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Address */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com or @username"
                autoComplete="username email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#161B24] border border-white/10 focus:border-[#F2A900] focus:ring-1 focus:ring-[#F2A900] text-white placeholder-slate-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>
              <button
                type="button"
                id="link-forgot-password"
                onClick={() => navigateTo('/forgot-password')}
                className="text-xs font-semibold text-[#F2A900] hover:text-[#FFD700] hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#161B24] border border-white/10 focus:border-[#F2A900] focus:ring-1 focus:ring-[#F2A900] text-white placeholder-slate-500 text-sm transition-all"
              />
              <button
                type="button"
                id="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                id="login-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#161B24] text-[#F2A900] focus:ring-[#F2A900] focus:ring-offset-[#0A0D14] cursor-pointer accent-[#F2A900]"
              />
              <span className="text-xs font-medium text-slate-300">Remember Me</span>
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted Session</span>
            </div>
          </div>

          {/* Main Button */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(242,169,0,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-[#05070A] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>LOGIN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Signup */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              id="link-go-to-signup"
              onClick={() => navigateTo('/signup')}
              className="font-bold text-[#F2A900] hover:text-[#FFD700] hover:underline transition-colors ml-1 cursor-pointer"
            >
              CREATE ACCOUNT
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
