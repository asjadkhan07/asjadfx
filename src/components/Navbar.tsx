import React, { useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, currentRoute, navigateTo, logout, unreadNotificationCount } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: { label: string; route: AppRoute; icon: React.ReactNode }[] = [
    { label: 'Home', route: '/home', icon: <Home className="w-4 h-4" /> },
    { label: 'Rules', route: '/rules', icon: <FileText className="w-4 h-4" /> },
    { label: 'Tasks', route: '/tasks', icon: <Target className="w-4 h-4" /> },
    { label: 'Leaderboard', route: '/leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Giveaway', route: '/giveaway', icon: <Gift className="w-4 h-4" /> },
    { label: 'My Coins', route: '/coins', icon: <Coins className="w-4 h-4" /> },
    { label: 'Profile', route: '/profile', icon: <UserIcon className="w-4 h-4" /> },
  ];

  return (
    <>
      <header
        id="main-navigation-header"
        className="sticky top-0 z-40 w-full bg-[#0A0D14]/80 backdrop-blur-md border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <ASJADFXLogo
              size="sm"
              onClick={() => navigateTo('/home')}
              className="cursor-pointer"
            />
          </div>

          {/* Desktop Nav Items */}
          <nav id="desktop-nav" className="hidden lg:flex items-center gap-1.5">
            {navItems.map(item => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => navigateTo(item.route)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F2A900]/15 to-transparent text-white border-l-2 border-[#F2A900] shadow-[0_0_15px_rgba(242,169,0,0.1)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Coins Capsule */}
            <button
              id="header-coins-badge"
              onClick={() => navigateTo('/coins')}
              className="bg-[#161B24] border border-white/5 px-3.5 sm:px-4 py-1.5 rounded-full flex items-center gap-2 hover:border-[#F2A900]/30 transition-all cursor-pointer shadow-sm"
            >
              <span className="text-sm opacity-80">🪙</span>
              <span className="font-mono font-bold text-[#F2A900] text-xs sm:text-sm">
                {user?.coins ?? 0}
              </span>
              <span className="text-[10px] uppercase font-bold opacity-40 text-slate-300 ml-0.5 hidden sm:inline">
                Coins
              </span>
            </button>

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
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F2A900] shadow-[0_0_8px_#F2A900]"
                />
              )}
            </button>

            <div className="h-7 w-[1px] bg-white/10 hidden sm:block" />

            {/* User Dropdown */}
            <div className="relative">
              <button
                id="header-user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                    @{user?.username}
                  </span>
                  <span className="text-[10px] text-[#F2A900] font-mono opacity-75">
                    {user?.instagramUsername ? `@${user.instagramUsername}` : 'Trader'}
                  </span>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#1F2530] to-[#0A0D14] border border-white/10 flex items-center justify-center font-bold text-[#F2A900] text-xs sm:text-sm group-hover:border-[#F2A900]/40 shadow-sm transition-all">
                  {user?.fullName
                    ? user.fullName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'TR'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block group-hover:text-slate-200 transition-colors" />
              </button>

              {isUserMenuOpen && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-[#0A0D14] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-2.5 border-b border-white/5 mb-1">
                    <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-[#F2A900] truncate">@{user?.username}</p>
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
                    <Coins className="w-4 h-4 text-[#F2A900]" />
                    <span>My Coins ({user?.coins ?? 0})</span>
                  </button>

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
                </div>
              )}
            </div>

            {/* Mobile Hamburger toggle */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#161B24] border border-white/10 text-slate-300 hover:text-white cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-drawer-menu"
            className="lg:hidden px-4 pt-2 pb-5 bg-[#0A0D14] border-b border-white/10 space-y-1.5"
          >
            {navItems.map(item => {
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
                      ? 'bg-gradient-to-r from-[#F2A900]/15 to-transparent text-white border-l-2 border-[#F2A900]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
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
      </header>

      {/* Notifications Drawer */}
      <NotificationsModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
