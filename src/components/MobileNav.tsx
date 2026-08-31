import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppRoute } from '../types';
import { Home, FileText, Target, Trophy, Coins } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentRoute, navigateTo } = useAuth();

  const mobileItems: { label: string; route: AppRoute; icon: React.ReactNode }[] = [
    { label: 'Home', route: '/home', icon: <Home className="w-5 h-5" /> },
    { label: 'Rules', route: '/rules', icon: <FileText className="w-5 h-5" /> },
    { label: 'Tasks', route: '/tasks', icon: <Target className="w-5 h-5" /> },
    { label: 'Ranks', route: '/leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { label: 'Coins', route: '/coins', icon: <Coins className="w-5 h-5" /> },
  ];

  return (
    <div
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0D14]/95 backdrop-blur-lg border-t border-white/5 px-2 py-1.5 pb-safe"
    >
      <div className="flex items-center justify-around">
        {mobileItems.map(item => {
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.route}
              id={`mobile-tab-${item.label.toLowerCase()}`}
              onClick={() => navigateTo(item.route)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-[#F2A900] font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#F2A900]/15' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
