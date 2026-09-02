import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASJADFXLogo } from '../components/ASJADFXLogo';
import { SignupInput } from '../services/storage';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AtSign,
  Instagram,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { motion } from 'motion/react';

export const SignupPage: React.FC = () => {
  const { signup, navigateTo } = useAuth();

  const [formData, setFormData] = useState<SignupInput>({
    fullName: '',
    username: '',
    email: '',
    instagramUsername: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupInput, string>>>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');

  const handleInputChange = (field: keyof SignupInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for that field
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    // Client side pre-check
    const errors: Partial<Record<keyof SignupInput, string>> = {};

    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username.trim())) {
      errors.username = 'Username must be 3-20 characters (letters, numbers, underscores only)';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email Address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.instagramUsername.trim()) {
      errors.instagramUsername = 'Instagram Username is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup(formData, true);
      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.error) {
          setGeneralError(result.error);
        }
      } else if (result.needsEmailVerification) {
        setRegisteredEmail(formData.email.trim());
        setVerificationNotice(
          result.message || 'Account created successfully. Please check your email to verify your account.'
        );
      }
    } catch (err) {
      console.error('Signup error:', err);
      setGeneralError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#05070A] via-[#0A0D14] to-[#05070A] relative overflow-hidden py-10">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F2A900]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F2A900]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg bg-[#0F131C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <ASJADFXLogo size="lg" showTagline={false} />
          <h1
            id="signup-heading"
            className="mt-6 text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk']"
          >
            Create Your Account
          </h1>
          <p id="signup-subtitle" className="mt-2 text-xs sm:text-sm text-slate-400">
            Join ASJADFX and start earning rewards.
          </p>
        </div>

        {/* Verification Success View or Form */}
        {verificationNotice ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F2A900]/10 border border-[#F2A900]/30 text-[#F2A900] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(242,169,0,0.2)]">
              <CheckCircle2 className="w-8 h-8 text-[#F2A900]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                Account Created Successfully
              </h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                {verificationNotice}
              </p>
              {registeredEmail && (
                <div className="mt-3 inline-block px-3.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#F2A900]">
                  {registeredEmail}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="btn-proceed-to-login"
                onClick={() => navigateTo('/login')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(242,169,0,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PROCEED TO LOGIN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* General Error Alert or User Already Registered Alert */}
            {generalError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                id="signup-general-error"
                className={`mb-5 p-4 rounded-2xl border text-xs sm:text-sm flex flex-col gap-3 ${
                  generalError.toLowerCase().includes('already exists') ||
                  generalError.toLowerCase().includes('already registered')
                    ? 'bg-[#F2A900]/10 border-[#F2A900]/40 text-[#F2A900]'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      generalError.toLowerCase().includes('already exists') ||
                      generalError.toLowerCase().includes('already registered')
                        ? 'text-[#F2A900]'
                        : 'text-rose-400'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-white">
                      {generalError.toLowerCase().includes('already exists') ||
                      generalError.toLowerCase().includes('already registered')
                        ? 'Account Already Registered'
                        : 'Registration Notice'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                      {generalError}
                    </p>
                  </div>
                </div>

                {(generalError.toLowerCase().includes('already exists') ||
                  generalError.toLowerCase().includes('already registered')) && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <button
                      type="button"
                      id="btn-goto-login-from-error"
                      onClick={() => navigateTo('/login')}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] text-[#05070A] font-extrabold text-xs uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>LOG IN NOW</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id="btn-forgot-pw-from-error"
                      onClick={() => navigateTo('/forgot-password')}
                      className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="signup-fullname"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    Full Name <span className="text-[#F2A900]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-fullname"
                      type="text"
                      value={formData.fullName}
                      onChange={e => handleInputChange('fullName', e.target.value)}
                      placeholder="e.g. John Doe"
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#161B24] border text-white placeholder-slate-500 text-sm transition-all ${
                        fieldErrors.fullName
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-white/10 focus:border-[#F2A900]'
                      }`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="signup-username"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    Username <span className="text-[#F2A900]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-username"
                      type="text"
                      value={formData.username}
                      onChange={e => handleInputChange('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="trader_pro"
                      autoComplete="username"
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#161B24] border text-white placeholder-slate-500 text-sm transition-all ${
                        fieldErrors.username
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-white/10 focus:border-[#F2A900]'
                      }`}
                    />
                  </div>
                  {fieldErrors.username && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Email Address <span className="text-[#F2A900]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="name@domain.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#161B24] border text-white placeholder-slate-500 text-sm transition-all ${
                      fieldErrors.email
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-white/10 focus:border-[#F2A900]'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Instagram Username */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signup-instagram"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300"
                  >
                    Instagram Username <span className="text-[#F2A900]">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">For task verification</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-instagram"
                    type="text"
                    value={formData.instagramUsername}
                    onChange={e => handleInputChange('instagramUsername', e.target.value.replace(/^@+/, ''))}
                    placeholder="instagram_handle"
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#161B24] border text-white placeholder-slate-500 text-sm transition-all ${
                      fieldErrors.instagramUsername
                        ? 'border-rose-500/80 focus:border-rose-500'
                        : 'border-white/10 focus:border-[#F2A900]'
                    }`}
                  />
                </div>
                {fieldErrors.instagramUsername && (
                  <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.instagramUsername}
                  </p>
                )}
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    Password <span className="text-[#F2A900]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={e => handleInputChange('password', e.target.value)}
                      placeholder="Min. 8 chars"
                      autoComplete="new-password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#161B24] border text-white placeholder-slate-500 text-sm transition-all ${
                        fieldErrors.password
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-white/10 focus:border-[#F2A900]'
                      }`}
                    />
                    <button
                      type="button"
                      id="btn-toggle-signup-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                  >
                    Confirm Password <span className="text-[#F2A900]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={e => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#161B24] border text-white placeholder-slate-500 text-sm transition-all ${
                        fieldErrors.confirmPassword
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : 'border-white/10 focus:border-[#F2A900]'
                      }`}
                    />
                    <button
                      type="button"
                      id="btn-toggle-confirm-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements Indicator */}
              {formData.password && (
                <div className="p-3 rounded-xl bg-[#0A0D14] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Security Strength:</span>
                    <span
                      className={`font-bold ${
                        passwordScore <= 1
                          ? 'text-rose-400'
                          : passwordScore === 2
                          ? 'text-[#F2A900]'
                          : 'text-emerald-400'
                      }`}
                    >
                      {passwordScore <= 1 ? 'Weak' : passwordScore === 2 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-white/5">
                    <div className={`h-full ${passwordScore >= 1 ? 'bg-rose-500' : 'bg-transparent'}`} />
                    <div className={`h-full ${passwordScore >= 2 ? 'bg-[#F2A900]' : 'bg-transparent'}`} />
                    <div className={`h-full ${passwordScore >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    <div className={`h-full ${passwordScore >= 4 ? 'bg-emerald-400' : 'bg-transparent'}`} />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-signup-submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#F2A900] via-[#FFD700] to-[#F2A900] hover:opacity-90 text-[#05070A] font-extrabold text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(242,169,0,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-[#05070A] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Footer Link to Login */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              id="link-go-to-login"
              onClick={() => navigateTo('/login')}
              className="font-bold text-[#F2A900] hover:text-[#FFD700] hover:underline transition-colors ml-1 cursor-pointer"
            >
              LOGIN
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
