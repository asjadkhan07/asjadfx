import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';

// Public & User Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { TasksPage } from './pages/TasksPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GiveawayPage } from './pages/GiveawayPage';
import { MyCoinsPage } from './pages/MyCoinsPage';
import { RulesPage } from './pages/RulesPage';
import { ProfilePage } from './pages/ProfilePage';

// Admin Components & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPlatformsPage } from './pages/admin/AdminPlatformsPage';
import { AdminTasksPage } from './pages/admin/AdminTasksPage';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCoinsPage } from './pages/admin/AdminCoinsPage';
import { AdminLeaderboardPage } from './pages/admin/AdminLeaderboardPage';
import { AdminGiveawaysPage } from './pages/admin/AdminGiveawaysPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminRulesPage } from './pages/admin/AdminRulesPage';
import { AdminWarningsPage } from './pages/admin/AdminWarningsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, currentRoute, navigateTo } = useAuth();

  // Loading Screen while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#05070A] text-white">
        <div className="w-10 h-10 border-2 border-[#00FF66] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#00FF66]/80 font-mono">
          Securing ASJADFX Session...
        </p>
      </div>
    );
  }

  // ==========================================
  // ADMIN PANEL ROUTING (/admin/*)
  // ==========================================
  if (currentRoute.startsWith('/admin')) {
    // If not authenticated as admin, show Admin Login page
    if (!isAuthenticated || user?.role !== 'admin') {
      return <AdminLoginPage />;
    }

    // Render Admin Pages wrapped in AdminLayout
    const renderAdminPage = () => {
      switch (currentRoute) {
        case '/admin':
        case '/admin/dashboard':
          return <AdminDashboardPage />;
        case '/admin/platforms':
          return <AdminPlatformsPage />;
        case '/admin/tasks':
          return <AdminTasksPage />;
        case '/admin/submissions':
          return <AdminSubmissionsPage />;
        case '/admin/users':
          return <AdminUsersPage />;
        case '/admin/coins':
          return <AdminCoinsPage />;
        case '/admin/leaderboard':
          return <AdminLeaderboardPage />;
        case '/admin/giveaways':
          return <AdminGiveawaysPage />;
        case '/admin/announcements':
          return <AdminAnnouncementsPage />;
        case '/admin/rules':
          return <AdminRulesPage />;
        case '/admin/warnings':
          return <AdminWarningsPage />;
        case '/admin/settings':
          return <AdminSettingsPage />;
        default:
          return <AdminDashboardPage />;
      }
    };

    return <AdminLayout>{renderAdminPage()}</AdminLayout>;
  }

  // ==========================================
  // USER PUBLIC / UNAUTHENTICATED ROUTING
  // ==========================================
  if (!isAuthenticated) {
    if (currentRoute === '/signup') {
      return <SignupPage />;
    }
    if (currentRoute === '/login') {
      return <LoginPage />;
    }
    if (currentRoute === '/forgot-password') {
      return <ForgotPasswordPage />;
    }
    if (currentRoute === '/leaderboard') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <Navbar />
          <main className="flex-1 w-full">
            <LeaderboardPage />
          </main>
        </div>
      );
    }
    if (currentRoute === '/rules') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <Navbar />
          <main className="flex-1 w-full">
            <RulesPage />
          </main>
        </div>
      );
    }
    // Default public landing page
    return (
      <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
        <Navbar />
        <main className="flex-1 w-full">
          <LandingPage />
        </main>
      </div>
    );
  }

  // ==========================================
  // USER AUTHENTICATED ROUTING
  // ==========================================
  const renderAuthenticatedPage = () => {
    switch (currentRoute) {
      case '/':
        return <LandingPage />;
      case '/home':
      case '/dashboard':
        return <HomePage />;
      case '/tasks':
        return <TasksPage />;
      case '/leaderboard':
        return <LeaderboardPage />;
      case '/giveaway':
        return <GiveawayPage />;
      case '/coins':
        return <MyCoinsPage />;
      case '/rules':
        return <RulesPage />;
      case '/profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full">{renderAuthenticatedPage()}</main>

      {/* Immersive Footer */}
      <footer className="border-t border-white/5 bg-[#0A0D14]/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 mb-16 lg:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span>ASJADFX Community Protocol</span>
            <span className="opacity-40">•</span>
            <span>All Systems Active</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <button
              onClick={() => navigateTo('/rules')}
              className="hover:text-[#00FF66] transition-colors cursor-pointer"
            >
              Rules & Guidelines
            </button>
            <span className="opacity-40">•</span>
            {user?.role === 'admin' ? (
              <button
                onClick={() => navigateTo('/admin/dashboard')}
                className="text-[#FFD700] font-bold hover:underline cursor-pointer font-mono"
              >
                Admin Console →
              </button>
            ) : (
              <button
                onClick={() => navigateTo('/admin/login')}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Admin Access
              </button>
            )}
            <span className="opacity-40">•</span>
            <span>© {new Date().getFullYear()} ASJADFX. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
