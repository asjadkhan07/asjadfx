import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../types';
import { Home, FileText, Target, Trophy, Coins, Gift } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentRoute, navigateTo } = useAuth();

  // Exactly 6 bottom navigation items as required:
  // Home | Rules | Tasks | Ranks | Coins | Rewards
  const mobileItems: { label: string; route: AppRoute; icon: React.ReactNode }[] = [
    { label: 'Home', route: '/home', icon: <Home className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> },
    { label: 'Rules', route: '/rules', icon: <FileText className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> },
    { label: 'Tasks', route: '/tasks', icon: <Target className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> },
    { label: 'Ranks', route: '/leaderboard', icon: <Trophy className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> },
    { label: 'Coins', route: '/coins', icon: <Coins className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> },
    { label: 'Rewards', route: '/rewards', icon: <Gift className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#05070A]/95 backdrop-blur-xl border-t border-white/10 px-1 py-1 sm:py-1.5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="grid grid-cols-6 items-center max-w-md mx-auto">
        {mobileItems.map((item) => {
          const isActive =
            currentRoute === item.route ||
            (item.route === '/home' && currentRoute === '/dashboard');

          return (
            <button
              key={item.route}
              id={`mobile-tab-${item.label.toLowerCase()}`}
              onClick={() => navigateTo(item.route)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer group select-none ${
                isActive
                  ? 'text-[#00FF66] font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 sm:p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#00FF66]/15 border border-[#00FF66]/30 shadow-[0_0_12px_rgba(0,255,102,0.3)] text-[#00FF66]'
                    : 'bg-transparent text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {item.icon}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-0.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[#00FF66] font-bold drop-shadow-[0_0_6px_rgba(0,255,102,0.4)]'
                    : 'text-slate-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
