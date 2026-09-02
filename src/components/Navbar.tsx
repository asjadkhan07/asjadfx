import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASJADFXLogo } from './ASJADFXLogo';
import { NotificationsModal } from './NotificationsModal';
import { AppRoute } from '../types';
import {
  Home,
  FileText,
  Target,
  Trophy,
  Gift,
  User as UserIcon,
  Coins,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  Sparkles,
  ArrowRight,
  Shield,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PremiumUpgradeCard } from './PremiumUpgradeCard';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, currentRoute, navigateTo, logout, unreadNotificationCount } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [prevCoins, setPrevCoins] = useState(user?.coins ?? 0);
  const [coinGlow, setCoinGlow] = useState(false);

  // Trigger brief coin capsule glow when balance changes
  useEffect(() => {
    if (user?.coins !== undefined && user.coins !== prevCoins) {
      setCoinGlow(true);
      setPrevCoins(user.coins);
      const timer = setTimeout(() => setCoinGlow(false), 1800);
      return () => clearTimeout(timer);
    }
  }, [user?.coins]);

  const authNavItems: { label: string; route: AppRoute; icon: React.ReactNode }[] = [
    { label: 'Dashboard', route: '/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Tasks', route: '/tasks', icon: <Target className="w-4 h-4" /> },
    { label: 'Leaderboard', route: '/leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Rewards', route: '/rewards', icon: <Gift className="w-4 h-4" /> },
    { label: 'Giveaway', route: '/giveaway', icon: <Sparkles className="w-4 h-4" /> },
    { label: '👑 Premium', route: '/premium', icon: <Crown className="w-4 h-4 text-[#FFD700]" /> },
    { label: 'My Coins', route: '/coins', icon: <Coins className="w-4 h-4" /> },
    { label: 'Rules', route: '/rules', icon: <FileText className="w-4 h-4" /> },
  ];

  const handleLandingScroll = (elementId: string) => {
    setIsMobileMenuOpen(false);
    if (currentRoute !== '/') {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(elementId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        id="main-navigation-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-40 w-full bg-[#05070A]/85 backdrop-blur-xl border-b border-white/10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Left Side: ASJADFX Logo + Small Lightning Badge */}
          <div className="flex items-center gap-3">
            <ASJADFXLogo
              size="md"
              onClick={() => navigateTo(isAuthenticated ? '/dashboard' : '/')}
              className="cursor-pointer"
            />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F131C] border border-[#00FF66]/20 shadow-[0_0_10px_rgba(0,255,102,0.1)]">
              <span className="text-xs select-none">⚡</span>
              <span className="text-[10px] font-mono font-bold text-[#00FF66] uppercase tracking-wider">
                Official
              </span>
            </div>
          </div>

          {/* Right Side: Public Nav or Authenticated Nav */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Desktop Public Nav */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
                <button
                  id="nav-public-home"
                  onClick={() => handleLandingScroll('hero')}
                  className="text-slate-300 hover:text-[#00FF66] transition-colors cursor-pointer"
                >
                  Home
                </button>
                <button
                  id="nav-public-how-it-works"
                  onClick={() => handleLandingScroll('how-it-works')}
                  className="text-slate-300 hover:text-[#00FF66] transition-colors cursor-pointer"
                >
                  How It Works
                </button>
                <button
                  id="nav-public-leaderboard"
                  onClick={() => navigateTo('/leaderboard')}
                  className="text-slate-300 hover:text-[#FFD700] transition-colors cursor-pointer flex items-center gap-1.5 group"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#FFD700] group-hover:rotate-12 transition-transform" />
                  <span>Leaderboard</span>
                </button>
                <button
                  id="nav-public-rules"
                  onClick={() => navigateTo('/rules')}
                  className="text-slate-300 hover:text-[#00FF66] transition-colors cursor-pointer"
                >
                  Rules
                </button>
              </nav>

              {/* Login & Highlighted Sign Up & PWA Install */}
              <div className="hidden sm:flex items-center gap-3">
                <PWAInstallButton variant="nav" />
                <motion.button
                  id="nav-btn-login"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateTo('/login')}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white hover:text-[#00FF66] bg-[#0F131C] hover:bg-[#161B24] border border-white/10 hover:border-[#00FF66]/30 transition-all cursor-pointer"
                >
                  Login
                </motion.button>
                <motion.button
                  id="nav-btn-signup"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigateTo('/signup')}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-[#05070A] bg-[#00FF66] hover:bg-[#05DF72] shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:shadow-[0_0_25px_rgba(0,255,102,0.6)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              {/* Mobile Hamburger toggle */}
              <button
                id="mobile-public-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-[#0F131C] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            /* Authenticated App Nav */
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Desktop Nav Items */}
              <nav id="desktop-nav" className="hidden lg:flex items-center gap-1">
                {authNavItems.map((item) => {
                  const isActive = currentRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => navigateTo(item.route)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 shadow-[0_0_15px_rgba(0,255,102,0.15)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Coins Capsule with Glow and Micro-Interaction */}
              <motion.button
                id="header-coins-badge"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateTo('/coins')}
                className={`bg-[#0F131C] px-3.5 py-1.5 rounded-full flex items-center gap-2 transition-all cursor-pointer ${
                  coinGlow
                    ? 'border-2 border-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.6)] animate-pulse'
                    : 'border border-[#FFD700]/30 hover:border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                }`}
              >
                <span className="text-sm select-none">🪙</span>
                <span className="font-mono font-black text-[#FFD700] text-xs sm:text-sm">
                  {user?.coins ?? 0}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#FFD700]/80 hidden sm:inline font-mono">
                  Coins
                </span>
              </motion.button>

              {/* PWA Install Button (Desktop) */}
              <div className="hidden sm:block">
                <PWAInstallButton variant="nav" />
              </div>

              {/* Notifications Button */}
              <button
                id="header-notifications-btn"
                onClick={() => setIsNotifOpen(true)}
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity" />
                {unreadNotificationCount > 0 && (
                  <span
                    id="notifications-badge"
                    className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]"
                  />
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="header-user-menu-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
                >
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-white group-hover:text-[#00FF66] transition-colors truncate max-w-[120px]">
                      @{user?.username}
                    </span>
                    <span className="text-[10px] text-[#00FF66] font-mono">
                      {user?.instagramUsername ? `@${user.instagramUsername}` : 'Trader'}
                    </span>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#0F131C] to-[#161B24] border border-[#00FF66]/30 flex items-center justify-center font-black text-[#00FF66] text-xs sm:text-sm group-hover:border-[#00FF66] shadow-sm transition-all">
                    {user?.username ? user.username.slice(0, 2).toUpperCase() : 'TR'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block group-hover:text-slate-200 transition-colors" />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      id="user-dropdown-menu"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-[#0A0D14] border border-white/10 rounded-2xl shadow-2xl p-2 z-50"
                    >
                      <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                        <p className="text-[11px] text-[#00FF66] truncate">@{user?.username}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                      </div>

                      <button
                        id="dropdown-profile-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateTo('/profile');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>My Profile</span>
                      </button>

                      <button
                        id="dropdown-coins-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateTo('/coins');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Coins className="w-4 h-4 text-[#FFD700]" />
                        <span>My Coins ({user?.coins ?? 0})</span>
                      </button>

                      <div className="py-1">
                        <PWAInstallButton
                          variant="compact"
                          className="w-full justify-center"
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                      </div>

                      {user?.role === 'admin' && (
                        <button
                          id="dropdown-admin-btn"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            navigateTo('/admin/dashboard');
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-[#FFD700] hover:bg-[#FFD700]/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-[#FFD700]" />
                          <span>Admin Console</span>
                        </button>
                      )}

                      {/* Upgrade Promotion for Free Users */}
                      <div className="my-2">
                        <PremiumUpgradeCard onUpgradeClick={() => setIsUserMenuOpen(false)} />
                      </div>

                      <div className="my-1 border-t border-white/5" />

                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Hamburger toggle */}
              <button
                id="mobile-menu-toggle-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-[#0F131C] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-drawer-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden px-4 pt-2 pb-5 bg-[#0A0D14] border-b border-white/10 space-y-2 overflow-hidden"
            >
              {!isAuthenticated ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleLandingScroll('hero')}
                    className="w-full px-4 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-300 hover:bg-white/5"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => handleLandingScroll('how-it-works')}
                    className="w-full px-4 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-300 hover:bg-white/5"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/leaderboard');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-left text-sm font-semibold text-[#FFD700] hover:bg-white/5 flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-[#FFD700]" />
                    <span>Leaderboard</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateTo('/rules');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-left text-sm font-semibold text-slate-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-[#00FF66]" />
                    <span>Rules & Guidelines</span>
                  </button>

                  <div className="pt-2">
                    <PWAInstallButton
                      variant="drawer"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigateTo('/login');
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F131C] border border-white/10 text-center"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigateTo('/signup');
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-black text-black bg-[#00FF66] text-center"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {authNavItems.map((item) => {
                    const isActive = currentRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        id={`mobile-menu-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          navigateTo(item.route);
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                          isActive
                            ? 'bg-[#00FF66]/15 text-[#00FF66] border-l-2 border-[#00FF66]'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  {/* PWA Install Button in Mobile Menu */}
                  <div className="pt-2 pb-1">
                    <PWAInstallButton
                      variant="drawer"
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  </div>

                  {/* Upgrade Promotion for Free Users in Mobile Menu */}
                  <div className="pt-2 pb-1">
                    <PremiumUpgradeCard onUpgradeClick={() => setIsMobileMenuOpen(false)} />
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <button
                      id="mobile-menu-logout-btn"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/10 flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Notifications Drawer */}
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
