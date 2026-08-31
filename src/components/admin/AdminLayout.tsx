import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ASJADFXLogo } from '../ASJADFXLogo';
import { AppRoute } from '../../types';
import {
  LayoutDashboard,
  Target,
  Smartphone,
  Camera,
  Users,
  Coins,
  Trophy,
  Gift,
  Megaphone,
  ScrollText,
  AlertTriangle,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  name: string;
  route: AppRoute;
  icon: React.ReactNode;
  badge?: number;
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currentRoute, navigateTo, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Dashboard', route: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Tasks', route: '/admin/tasks', icon: <Target className="w-4 h-4" /> },
    { name: 'Platforms', route: '/admin/platforms', icon: <Smartphone className="w-4 h-4" /> },
    { name: 'Submissions', route: '/admin/submissions', icon: <Camera className="w-4 h-4" /> },
    { name: 'Users', route: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { name: 'Coin Management', route: '/admin/coins', icon: <Coins className="w-4 h-4" /> },
    { name: 'Leaderboard', route: '/admin/leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { name: 'Giveaways', route: '/admin/giveaways', icon: <Gift className="w-4 h-4" /> },
    { name: 'Announcements', route: '/admin/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { name: 'Rules Management', route: '/admin/rules', icon: <ScrollText className="w-4 h-4" /> },
    { name: 'Reports & Warnings', route: '/admin/warnings', icon: <AlertTriangle className="w-4 h-4" /> },
    { name: 'Settings', route: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col selection:bg-[#F2A900]/30 selection:text-[#F2A900]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0A0D14]/95 backdrop-blur border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3">
            <ASJADFXLogo size="sm" />
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#F2A900]/10 border border-[#F2A900]/20 text-[#F2A900] text-[10px] font-bold uppercase tracking-wider font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Console</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('/home')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161B24] border border-white/10 hover:bg-[#1C232E] text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#F2A900]" />
            <span>Open User Site</span>
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{user?.fullName || 'Master Admin'}</div>
              <div className="text-[10px] text-[#F2A900] font-mono">Super Administrator</div>
            </div>
            <button
              onClick={() => logout('/admin/login')}
              title="Logout Admin"
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-[#0A0D14] p-4 space-y-1 shrink-0 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            Platform Management
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  onClick={() => navigateTo(item.route)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F2A900]/20 to-[#F2A900]/5 text-[#F2A900] border border-[#F2A900]/30 shadow-[0_0_15px_rgba(242,169,0,0.1)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-[#F2A900]' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-white/5">
            <div className="p-3 rounded-xl bg-[#0F131C] border border-white/5 space-y-1 text-left">
              <div className="text-[11px] font-bold text-slate-300">Active Admin Session</div>
              <div className="text-[10px] text-slate-500 font-mono break-all">{user?.email}</div>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-[#0A0D14] border-r border-white/10 p-5 flex flex-col z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <ASJADFXLogo size="sm" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map(item => {
                  const isActive = currentRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      onClick={() => {
                        navigateTo(item.route);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#F2A900]/15 text-[#F2A900] border border-[#F2A900]/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={isActive ? 'text-[#F2A900]' : 'text-slate-400'}>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => {
                  navigateTo('/home');
                  setMobileOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#161B24] border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#F2A900]" />
                <span>Go to User Site</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Admin Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
