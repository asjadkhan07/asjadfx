import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AppNotification, AppRoute } from '../types';
import {
  getActiveSession,
  findUserById,
  loginUser,
  registerUser,
  clearSession,
  SignupInput,
  SignupResult,
  LoginResult,
  createPasswordResetToken,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearUserNotifications,
  deleteUserAccount,
  updateUserProfile,
  initializeDatabase,
} from '../services/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  currentRoute: AppRoute;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  accessDeniedMessage: string | null;
  login: (emailOrUsername: string, password: string, rememberMe?: boolean) => Promise<LoginResult>;
  adminLogin: (emailOrUsername: string, password: string) => Promise<LoginResult>;
  signup: (data: SignupInput, rememberMe?: boolean) => Promise<SignupResult>;
  logout: (redirectRoute?: AppRoute) => void;
  deleteMyAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  navigateTo: (route: AppRoute) => void;
  refreshUser: () => void;
  updateProfile: (data: { fullName?: string; instagramUsername?: string; avatarUrl?: string }) => { success: boolean; user?: User; error?: string };
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  clearAccessDenied: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALL_VALID_ROUTES: AppRoute[] = [
  '/',
  '/dashboard',
  '/login',
  '/signup',
  '/forgot-password',
  '/home',
  '/rules',
  '/tasks',
  '/leaderboard',
  '/giveaway',
  '/profile',
  '/coins',
  '/admin',
  '/admin/login',
  '/admin/dashboard',
  '/admin/tasks',
  '/admin/platforms',
  '/admin/submissions',
  '/admin/users',
  '/admin/coins',
  '/admin/leaderboard',
  '/admin/giveaways',
  '/admin/announcements',
  '/admin/rules',
  '/admin/warnings',
  '/admin/settings',
];

function getInitialRoute(): AppRoute {
  const path = window.location.pathname as AppRoute;
  if (ALL_VALID_ROUTES.includes(path)) {
    return path;
  }
  return '/';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Navigation helper updating browser history
  const navigateTo = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check active session & permissions
  const checkSession = useCallback(async () => {
    await initializeDatabase();
    const session = getActiveSession();
    const currentPath = window.location.pathname as AppRoute;

    if (session && session.userId) {
      const existingUser = findUserById(session.userId);
      if (existingUser && !existingUser.isBanned) {
        setUser(existingUser);
        const userNotifs = getUserNotifications(existingUser.id);
        setNotifications(userNotifs);

        // RBAC Check for Admin Routes
        if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
          if (existingUser.role !== 'admin') {
            setAccessDeniedMessage('Access Denied: You do not have permission to access the ASJADFX Admin Panel.');
            navigateTo('/dashboard');
          } else {
            if (currentPath === '/admin') {
              navigateTo('/admin/dashboard');
            }
          }
        } else if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/forgot-password') {
          if (existingUser.role === 'admin') {
            navigateTo('/admin/dashboard');
          } else {
            navigateTo('/dashboard');
          }
        }
      } else {
        clearSession();
        setUser(null);
        if (currentPath.startsWith('/admin')) {
          navigateTo('/admin/login');
        }
      }
    } else {
      setUser(null);
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        setAccessDeniedMessage('Please login with an administrator account to continue.');
        navigateTo('/admin/login');
      }
    }
    setIsLoading(false);
  }, [navigateTo]);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname as AppRoute;
      if (ALL_VALID_ROUTES.includes(path)) {
        // Enforce RBAC
        const session = getActiveSession();
        const currentUser = session ? findUserById(session.userId) : null;
        if (path.startsWith('/admin') && path !== '/admin/login') {
          if (!currentUser || currentUser.role !== 'admin') {
            setAccessDeniedMessage('Access Denied: Admin authorization required.');
            setCurrentRoute('/home');
            window.history.replaceState({}, '', '/home');
            return;
          }
        }
        setCurrentRoute(path);
      } else {
        setCurrentRoute('/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Real-time synchronization across UI when admin approves submissions or updates coins
  useEffect(() => {
    const handleSync = () => {
      const session = getActiveSession();
      if (session && session.userId) {
        const freshUser = findUserById(session.userId);
        if (freshUser) {
          setUser(prev => {
            if (!prev) return freshUser;
            // Only update state if properties changed to avoid unnecessary renders
            if (
              prev.coins !== freshUser.coins ||
              prev.tasksCompleted !== freshUser.tasksCompleted ||
              prev.status !== freshUser.status ||
              prev.fullName !== freshUser.fullName ||
              prev.instagramUsername !== freshUser.instagramUsername
            ) {
              return freshUser;
            }
            return prev;
          });
          const freshNotifs = getUserNotifications(freshUser.id);
          setNotifications(freshNotifs);
        }
      }
    };

    window.addEventListener('asjadfx_data_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('asjadfx_data_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const refreshUser = useCallback(() => {
    if (user) {
      const fresh = findUserById(user.id);
      if (fresh) {
        setUser(fresh);
        const freshNotifs = getUserNotifications(fresh.id);
        setNotifications(freshNotifs);
      }
    }
  }, [user]);

  const login = async (emailOrUsername: string, password: string, rememberMe = true): Promise<LoginResult> => {
    const result = await loginUser(emailOrUsername, password, rememberMe, false);
    if (result.success && result.user) {
      setUser(result.user);
      const notifs = getUserNotifications(result.user.id);
      setNotifications(notifs);
      if (result.user.role === 'admin') {
        navigateTo('/admin/dashboard');
      } else {
        navigateTo('/dashboard');
      }
    }
    return result;
  };

  const adminLogin = async (emailOrUsername: string, password: string): Promise<LoginResult> => {
    const result = await loginUser(emailOrUsername, password, true, true);
    if (result.success && result.user) {
      if (result.user.role === 'admin') {
        setUser(result.user);
        setNotifications(getUserNotifications(result.user.id));
        navigateTo('/admin/dashboard');
      } else {
        return { success: false, error: 'Access Denied: You do not have administrator permissions.' };
      }
    }
    return result;
  };

  const signup = async (data: SignupInput, rememberMe = true): Promise<SignupResult> => {
    const result = await registerUser(data, rememberMe);
    if (result.success && result.user) {
      if (!result.needsEmailVerification) {
        setUser(result.user);
        setNotifications([]);
        navigateTo('/dashboard');
      }
    }
    return result;
  };

  const logout = (redirectRoute: AppRoute = '/') => {
    clearSession();
    setUser(null);
    setNotifications([]);
    navigateTo(redirectRoute);
  };

  const deleteMyAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active session.' };
    const res = await deleteUserAccount(user.id, password, user);
    if (res.success) {
      setUser(null);
      setNotifications([]);
      clearSession();
      navigateTo('/login');
    }
    return res;
  };

  const requestPasswordReset = async (email: string) => {
    return createPasswordResetToken(email);
  };

  const markAsRead = (notificationId: string) => {
    markNotificationRead(notificationId);
    if (user) {
      setNotifications(getUserNotifications(user.id));
    }
  };

  const markAllAsRead = () => {
    if (user) {
      markAllNotificationsRead(user.id);
      setNotifications(getUserNotifications(user.id));
    }
  };

  const updateProfile = (data: { fullName?: string; instagramUsername?: string; avatarUrl?: string }) => {
    if (!user) return { success: false, error: 'No active session.' };
    const res = updateUserProfile(user.id, data);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const clearNotifications = () => {
    if (user) {
      clearUserNotifications(user.id);
      setNotifications([]);
    }
  };

  const clearAccessDenied = () => {
    setAccessDeniedMessage(null);
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        currentRoute,
        notifications,
        unreadNotificationCount,
        accessDeniedMessage,
        login,
        adminLogin,
        signup,
        logout,
        deleteMyAccount,
        requestPasswordReset,
        navigateTo,
        refreshUser,
        updateProfile,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        clearAccessDenied,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
