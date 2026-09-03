import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { AsjadAiChatbot } from './components/AsjadAiChatbot';
import { AnimatedBackground } from './components/AnimatedBackground';
import { CoinRewardAnimation } from './components/CoinRewardAnimation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallBanner } from './components/PWAInstallBanner';

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
import { RewardsPage } from './pages/RewardsPage';
import { PremiumPage } from './pages/PremiumPage';
import { WalletPage } from './pages/WalletPage';
import { DonationPage } from './pages/DonationPage';
import { ThankYouDonationModal } from './components/ThankYouDonationModal';

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
import { AdminRewardsPage } from './pages/admin/AdminRewardsPage';
import { AdminPremiumPage } from './pages/admin/AdminPremiumPage';
import { AdminWalletPage } from './pages/admin/AdminWalletPage';
import { AdminDonationsPage } from './pages/admin/AdminDonationsPage';

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
        case '/admin/wallet':
          return <AdminWalletPage />;
        case '/admin/donations':
          return <AdminDonationsPage />;
        case '/admin/premium':
          return <AdminPremiumPage />;
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
        case '/admin/rewards':
          return <AdminRewardsPage />;
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
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <SignupPage />
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/login') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <LoginPage />
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/forgot-password') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <ForgotPasswordPage />
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/leaderboard') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <LeaderboardPage />
          </main>
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/rules') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <RulesPage />
          </main>
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/rewards') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-[#00FF66]/15 border border-[#00FF66]/30 text-[#00FF66] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,255,102,0.3)]">
                <span className="text-3xl">🎁</span>
              </div>
              <h1 className="text-3xl font-black text-white">ASJADFX Rewards & Daily Streaks</h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Sign in to your ASJADFX account to claim daily check-in streaks, redeem exclusive live promo codes, and unlock bonus coin rewards.
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => navigateTo('/login')}
                  className="px-6 py-3 rounded-2xl bg-[#00FF66] hover:bg-[#00FF66]/90 text-black font-extrabold text-sm cursor-pointer shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                >
                  Log In to Claim
                </button>
                <button
                  onClick={() => navigateTo('/signup')}
                  className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm cursor-pointer border border-white/10"
                >
                  Create Account
                </button>
              </div>
            </div>
          </main>
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/premium') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <PremiumPage />
          </main>
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    if (currentRoute === '/donation') {
      return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
          <AnimatedBackground />
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <DonationPage />
          </main>
          <AsjadAiChatbot />
          <CoinRewardAnimation />
        </div>
      );
    }
    // Default public landing page
    return (
      <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
        <AnimatedBackground />
        <Navbar />
        <main className="flex-1 w-full relative z-10">
          <LandingPage />
        </main>
        <AsjadAiChatbot />
        <CoinRewardAnimation />
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
      case '/rewards':
        return <RewardsPage />;
      case '/wallet':
        return <WalletPage />;
      case '/donation':
        return <DonationPage />;
      case '/rules':
        return <RulesPage />;
      case '/premium':
        return <PremiumPage />;
      case '/profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-200 flex flex-col relative selection:bg-[#00FF66]/30 selection:text-[#00FF66]">
      {/* Animated Atmospheric Background */}
      <AnimatedBackground />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10">{renderAuthenticatedPage()}</main>

      {/* Immersive Footer */}
      <footer className="border-t border-white/5 bg-[#0A0D14]/80 py-6 px-4 sm:px-8 text-center text-xs text-slate-500 mb-16 lg:mb-0 relative z-10">
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

      {/* Floating ASJAD AI Assistant */}
      <AsjadAiChatbot />

      {/* Coin Reward Celebratory Effect */}
      <CoinRewardAnimation />

      {/* Verified Donation Thank-You Modal */}
      <ThankYouDonationModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <OfflineIndicator />
      <PWAInstallBanner />
    </AuthProvider>
  );
}
