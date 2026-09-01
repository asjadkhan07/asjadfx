import {
  User,
  SessionData,
  CoinTransaction,
  Task,
  Giveaway,
  AppNotification,
  TaskSubmission,
  LeaderboardEntry,
  PlatformConfig,
  PlatformKey,
  UserWarning,
  Announcement,
  PlatformRules,
  AdminSystemSettings,
  DailyStreakConfig,
  UserDailyStreak,
  RedeemCode,
  CodeRedemptionLog,
  PremiumPaymentRequest,
  PremiumSettings,
} from '../types';
import { generateSalt, hashPassword, verifyPassword, generateToken } from './crypto';
import {
  supabase,
  uploadScreenshotProofToSupabase,
  fetchSupabaseUsers,
  upsertSupabaseUser,
  deleteSupabaseUser,
  fetchSupabaseTasks,
  upsertSupabaseTask,
  deleteSupabaseTask,
  fetchSupabaseSubmissions,
  upsertSupabaseSubmission,
  fetchSupabaseTransactions,
  insertSupabaseTransaction,
  fetchSupabaseGiveaways,
  upsertSupabaseGiveaway,
  deleteSupabaseGiveaway,
  fetchSupabaseAnnouncements,
  upsertSupabaseAnnouncement,
  fetchSupabaseNotifications,
  upsertSupabaseNotification,
  fetchSupabasePlatforms,
  upsertSupabasePlatform,
  fetchSupabaseRules,
  upsertSupabaseRules,
  fetchSupabaseSettings,
  upsertSupabaseSettings,
} from './supabase';

const USERS_STORAGE_KEY = 'asjadfx_users_db_v1';
const SESSIONS_STORAGE_KEY = 'asjadfx_active_session_v1';
const TRANSACTIONS_STORAGE_KEY = 'asjadfx_transactions_db_v1';
const TASKS_STORAGE_KEY = 'asjadfx_tasks_db_v1';
const SUBMISSIONS_STORAGE_KEY = 'asjadfx_submissions_db_v1';
const GIVEAWAYS_STORAGE_KEY = 'asjadfx_giveaways_db_v1';
const NOTIFICATIONS_STORAGE_KEY = 'asjadfx_notifications_db_v1';
const PASSWORD_RESETS_STORAGE_KEY = 'asjadfx_password_resets_v1';
const PLATFORMS_STORAGE_KEY = 'asjadfx_platforms_config_v1';
const RULES_STORAGE_KEY = 'asjadfx_platform_rules_v1';
const SETTINGS_STORAGE_KEY = 'asjadfx_admin_settings_v1';
const ANNOUNCEMENTS_STORAGE_KEY = 'asjadfx_announcements_db_v1';
const PREMIUM_REQUESTS_KEY = 'asjadfx_premium_requests_v1';
const PREMIUM_SETTINGS_KEY = 'asjadfx_premium_settings_v1';

export const DEFAULT_PREMIUM_SETTINGS: PremiumSettings = {
  planName: 'ASJADFX PREMIUM',
  price: 49,
  durationDays: 120, // 4 months
  receiverName: 'ASJADFX Official',
  upiId: 'asjadfx@upi',
  qrCodeUrl: '',
  instructions: `1. Scan the official ASJADFX QR code using Google Pay, PhonePe, Paytm, or any UPI app.
2. Pay the exact amount (₹49).
3. Copy the 12-digit UPI / UTR Transaction ID.
4. Upload payment screenshot and submit request for verification.`,
  enabled: true,
  extraCoinsPercentage: 25,
  benefits: [
    '🪙 +25% Extra Coins on eligible completed tasks',
    '👑 Exclusive Gold Crown Badge & Profile Glow',
    '🏆 Leaderboard Premium Highlight & Recognition',
    '🖼️ Custom Profile Picture upload access',
    '🎁 Special VIP Giveaway alerts & priority access',
    '⚡ Early access to new platform features & trading events',
  ],
};

// Legacy keys for seamless migration
const LEGACY_STORAGE_KEYS = {
  users: 'traderise_users_db_v1',
  sessions: 'traderise_active_session_v1',
  transactions: 'traderise_transactions_db_v1',
  tasks: 'traderise_tasks_db_v1',
  submissions: 'traderise_submissions_db_v1',
  giveaways: 'traderise_giveaways_db_v1',
  notifications: 'traderise_notifications_db_v1',
  resets: 'traderise_password_resets_v1',
  platforms: 'traderise_platforms_config_v1',
  rules: 'traderise_platform_rules_v1',
  settings: 'traderise_admin_settings_v1',
  announcements: 'traderise_announcements_db_v1',
};

/**
 * Dispatches a real-time sync event across all browser components and tabs
 */
export function notifyDataChanged(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('asjadfx_data_updated', { detail: { timestamp: Date.now() } }));
      localStorage.setItem('asjadfx_sync_trigger', Date.now().toString());
    } catch (e) {
      console.warn('Sync dispatch error:', e);
    }
  }
}

export interface SignupInput {
  fullName: string;
  username: string;
  email: string;
  instagramUsername: string;
  password: string;
  confirmPassword: string;
}

export interface SignupResult {
  success: boolean;
  user?: User;
  session?: SessionData;
  error?: string;
  fieldErrors?: Partial<Record<keyof SignupInput, string>>;
  needsEmailVerification?: boolean;
  message?: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  session?: SessionData;
  error?: string;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: number;
  used: boolean;
}

// ----------------- Base Storage Helpers -----------------

function getItems<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Notice reading ${key} from storage:`, err);
    return [];
  }
}

function saveItems<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.warn(`Notice writing ${key} to storage:`, err);
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Notice reading object ${key}:`, err);
    return defaultValue;
  }
}

function saveItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Notice saving object ${key}:`, err);
  }
}

// ----------------- Initialization & Admin Account Seeding -----------------

const DEFAULT_PLATFORMS: PlatformConfig[] = [
  {
    id: 'plt_instagram',
    key: 'instagram',
    name: 'Instagram',
    icon: '📸',
    officialUrl: 'https://instagram.com/asjadfx_official',
    defaultInstructions: 'Follow our official account, like the recent post, and leave a genuine question.',
    status: 'active',
  },
  {
    id: 'plt_youtube',
    key: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    officialUrl: 'https://youtube.com/@asjadfx_official',
    defaultInstructions: 'Watch the video for at least 60 seconds, subscribe to the channel, and like the video.',
    status: 'active',
  },
  {
    id: 'plt_facebook',
    key: 'facebook',
    name: 'Facebook',
    icon: '🔵',
    officialUrl: 'https://facebook.com/asjadfxpro',
    defaultInstructions: 'Follow our Facebook Page, like our daily market outlook post, and share with your trading network.',
    status: 'active',
  },
  {
    id: 'plt_telegram',
    key: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    officialUrl: 'https://t.me/asjadfx_signals',
    defaultInstructions: 'Join our official Telegram community channel and stay active for daily updates.',
    status: 'active',
  },
  {
    id: 'plt_tiktok',
    key: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    officialUrl: 'https://tiktok.com/@asjadfxpro',
    defaultInstructions: 'Follow our TikTok profile, watch the educational short, and tap like.',
    status: 'active',
  },
  {
    id: 'plt_x',
    key: 'x',
    name: 'X / Twitter',
    icon: '𝕏',
    officialUrl: 'https://x.com/asjadfxpro',
    defaultInstructions: 'Follow our X account, repost the pinned weekly analysis, and like the tweet.',
    status: 'active',
  },
];

const DEFAULT_RULES: PlatformRules = {
  general: [
    'ASJADFX is a task and reward platform. Participation requires an active account.',
    'Only completed and strictly verified tasks are eligible for coin rewards.',
    'Coins will NOT be added immediately. All submissions undergo manual admin verification.',
    'Any form of cheating, fake screenshots, automated bots, or manipulated evidence leads to immediate permanent ban.',
    'One account per person. Multiple accounts from the same user or IP will be banned.',
    'Coins have no guaranteed external fiat conversion and are subject to platform terms.',
  ],
  generalRules: [
    'ASJADFX is a task and reward platform. Participation requires an active account.',
    'Only completed and strictly verified tasks are eligible for coin rewards.',
    'Coins will NOT be added immediately. All submissions undergo manual admin verification.',
    'Any form of cheating, fake screenshots, automated bots, or manipulated evidence leads to immediate permanent ban.',
    'One account per person. Multiple accounts from the same user or IP will be banned.',
    'Coins have no guaranteed external fiat conversion and are subject to platform terms.',
  ].join('\n'),
  video: [
    'For YouTube tasks, watch the video for at least 60 seconds before liking.',
    'Subscribe using the same account visible in your submitted evidence.',
    'Do not dislike or unsubscribe after receiving rewards. Doing so triggers account restriction and coin forfeiture.',
  ],
  videoRules: [
    'For YouTube tasks, watch the video for at least 60 seconds before liking.',
    'Subscribe using the same account visible in your submitted evidence.',
    'Do not dislike or unsubscribe after receiving rewards. Doing so triggers account restriction and coin forfeiture.',
  ].join('\n'),
  comments: [
    'Comments must be relevant, thoughtful, and in natural language.',
    'Generic one-word comments (e.g. "nice", "good", "cool", "bro") or emoji-only comments are strictly rejected.',
    'Must ask a genuine question related to trading or the specific content shown.',
    'Do not spam identical comments across multiple videos or posts.',
  ],
  commentRules: [
    'Comments must be relevant, thoughtful, and in natural language.',
    'Generic one-word comments (e.g. "nice", "good", "cool", "bro") or emoji-only comments are strictly rejected.',
    'Must ask a genuine question related to trading or the specific content shown.',
    'Do not spam identical comments across multiple videos or posts.',
  ].join('\n'),
  screenshots: [
    'Screenshots must be crystal clear and unedited (no crop that cuts out username/timestamp).',
    'The "Liked" / "Subscribed" / "Joined" / "Followed" button state must be unmistakably visible.',
    'Your account profile/handle must match the Instagram/username registered in your ASJADFX profile.',
    'Screenshots downloaded from internet or re-used from previous submissions will result in immediate disqualification.',
  ],
  screenshotRules: [
    'Screenshots must be crystal clear and unedited (no crop that cuts out username/timestamp).',
    'The "Liked" / "Subscribed" / "Joined" / "Followed" button state must be unmistakably visible.',
    'Your account profile/handle must match the Instagram/username registered in your ASJADFX profile.',
    'Screenshots downloaded from internet or re-used from previous submissions will result in immediate disqualification.',
  ].join('\n'),
  tasks: [
    'Always click "Open Task" to navigate directly to the verified content URL.',
    'Complete every required action listed for the task before submitting proof.',
    'Submit proof only once per task.',
  ],
  taskRules: [
    'Always click "Open Task" to navigate directly to the verified content URL.',
    'Complete every required action listed for the task before submitting proof.',
    'Submit proof only once per task.',
  ].join('\n'),
  giveaway: [
    'Giveaway winners are selected transparently among eligible active users.',
    'Accounts with flagged warnings or pending disputes cannot claim giveaway prizes.',
    'Prizes are credited to your ASJADFX wallet or dispatched through verified contact info.',
  ],
  giveawayRules: [
    'Giveaway winners are selected transparently among eligible active users.',
    'Accounts with flagged warnings or pending disputes cannot claim giveaway prizes.',
    'Prizes are credited to your ASJADFX wallet or dispatched through verified contact info.',
  ].join('\n'),
  warnings: [
    'Level 1: Official warning recorded in your profile.',
    'Level 2: Temporary account restriction (submissions disabled for 3-14 days).',
    'Level 3: Permanent account ban with coin forfeiture and access revocation.',
  ],
  warningRules: [
    'Level 1: Official warning recorded in your profile.',
    'Level 2: Temporary account restriction (submissions disabled for 3-14 days).',
    'Level 3: Permanent account ban with coin forfeiture and access revocation.',
  ].join('\n'),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AdminSystemSettings = {
  websiteName: 'ASJADFX',
  websiteTagline: 'Trade. Earn. Rise.',
  maintenanceMode: false,
  allowNewSignups: true,
};

const DEFAULT_TASKS: Task[] = [];

const DEFAULT_GIVEAWAYS: Giveaway[] = [];

// Real-time Supabase subscription status
let isRealtimeSubscribed = false;

/**
 * Subscribes to Supabase real-time updates for instant multi-device sync
 */
export function subscribeToSupabaseRealtime(): void {
  if (isRealtimeSubscribed || typeof window === 'undefined') return;
  try {
    supabase
      .channel('asjadfx_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
        await syncFromSupabase();
        notifyDataChanged();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isRealtimeSubscribed = true;
        }
      });
  } catch (err) {
    console.warn('Realtime channel error:', err);
  }
}

/**
 * Synchronizes all entities from Supabase down into local cache
 */
export async function syncFromSupabase(): Promise<void> {
  try {
    const [
      remoteUsers,
      remoteTasks,
      remoteSubmissions,
      remoteTransactions,
      remoteGiveaways,
      remoteAnnouncements,
      remoteNotifications,
      remotePlatforms,
      remoteRules,
      remoteSettings,
    ] = await Promise.allSettled([
      fetchSupabaseUsers(),
      fetchSupabaseTasks(),
      fetchSupabaseSubmissions(),
      fetchSupabaseTransactions(),
      fetchSupabaseGiveaways(),
      fetchSupabaseAnnouncements(),
      fetchSupabaseNotifications(),
      fetchSupabasePlatforms(),
      fetchSupabaseRules(),
      fetchSupabaseSettings(),
    ]);

    if (remoteUsers.status === 'fulfilled' && remoteUsers.value && remoteUsers.value.length > 0) {
      saveItems(USERS_STORAGE_KEY, remoteUsers.value);
    }
    if (remoteTasks.status === 'fulfilled' && remoteTasks.value && remoteTasks.value.length > 0) {
      saveItems(TASKS_STORAGE_KEY, remoteTasks.value);
    }
    if (remoteSubmissions.status === 'fulfilled' && remoteSubmissions.value && remoteSubmissions.value.length > 0) {
      saveItems(SUBMISSIONS_STORAGE_KEY, remoteSubmissions.value);
    }
    if (remoteTransactions.status === 'fulfilled' && remoteTransactions.value && remoteTransactions.value.length > 0) {
      saveItems(TRANSACTIONS_STORAGE_KEY, remoteTransactions.value);
    }
    if (remoteGiveaways.status === 'fulfilled' && remoteGiveaways.value && remoteGiveaways.value.length > 0) {
      saveItems(GIVEAWAYS_STORAGE_KEY, remoteGiveaways.value);
    }
    if (remoteAnnouncements.status === 'fulfilled' && remoteAnnouncements.value && remoteAnnouncements.value.length > 0) {
      saveItems(ANNOUNCEMENTS_STORAGE_KEY, remoteAnnouncements.value);
    }
    if (remoteNotifications.status === 'fulfilled' && remoteNotifications.value && remoteNotifications.value.length > 0) {
      saveItems(NOTIFICATIONS_STORAGE_KEY, remoteNotifications.value);
    }
    if (remotePlatforms.status === 'fulfilled' && remotePlatforms.value && remotePlatforms.value.length > 0) {
      saveItems(PLATFORMS_STORAGE_KEY, remotePlatforms.value);
    }
    if (remoteRules.status === 'fulfilled' && remoteRules.value) {
      saveItem(RULES_STORAGE_KEY, remoteRules.value);
    }
    if (remoteSettings.status === 'fulfilled' && remoteSettings.value) {
      saveItem(SETTINGS_STORAGE_KEY, remoteSettings.value);
    }
  } catch (err) {
    console.warn('Sync from Supabase background error:', err);
  }
}

/**
 * Initializes database defaults, platforms, rules, and seeds the primary Admin account securely.
 * Synchronizes with Supabase cloud database.
 */
export async function initializeDatabase(): Promise<void> {
  // 0. Automatic migration from legacy storage keys (if present)
  try {
    if (!localStorage.getItem(USERS_STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEYS.users)) {
      const legacyKeys = Object.entries(LEGACY_STORAGE_KEYS) as [string, string][];
      for (const [prop, legKey] of legacyKeys) {
        const val = localStorage.getItem(legKey);
        if (val) {
          const newKey =
            prop === 'users'
              ? USERS_STORAGE_KEY
              : prop === 'sessions'
              ? SESSIONS_STORAGE_KEY
              : prop === 'transactions'
              ? TRANSACTIONS_STORAGE_KEY
              : prop === 'tasks'
              ? TASKS_STORAGE_KEY
              : prop === 'submissions'
              ? SUBMISSIONS_STORAGE_KEY
              : prop === 'giveaways'
              ? GIVEAWAYS_STORAGE_KEY
              : prop === 'notifications'
              ? NOTIFICATIONS_STORAGE_KEY
              : prop === 'resets'
              ? PASSWORD_RESETS_STORAGE_KEY
              : prop === 'platforms'
              ? PLATFORMS_STORAGE_KEY
              : prop === 'rules'
              ? RULES_STORAGE_KEY
              : prop === 'settings'
              ? SETTINGS_STORAGE_KEY
              : prop === 'announcements'
              ? ANNOUNCEMENTS_STORAGE_KEY
              : null;
          if (newKey && !localStorage.getItem(newKey)) {
            localStorage.setItem(newKey, val);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Migration error:', err);
  }

  // 1. Initialize Platforms if empty
  if (!localStorage.getItem(PLATFORMS_STORAGE_KEY)) {
    saveItems(PLATFORMS_STORAGE_KEY, DEFAULT_PLATFORMS);
    DEFAULT_PLATFORMS.forEach((p) => upsertSupabasePlatform(p));
  }

  // 2. Initialize Rules if empty or outdated
  if (!localStorage.getItem(RULES_STORAGE_KEY)) {
    saveItem(RULES_STORAGE_KEY, DEFAULT_RULES);
    upsertSupabaseRules(DEFAULT_RULES);
  } else {
    const existingRules = getItem<PlatformRules>(RULES_STORAGE_KEY, DEFAULT_RULES);
    if (JSON.stringify(existingRules).includes('TradeRise')) {
      const updated = JSON.parse(JSON.stringify(existingRules).replace(/TradeRise/g, 'ASJADFX'));
      saveItem(RULES_STORAGE_KEY, updated);
      upsertSupabaseRules(updated);
    }
  }

  // 3. Initialize Settings if empty or outdated
  if (!localStorage.getItem(SETTINGS_STORAGE_KEY)) {
    saveItem(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
    upsertSupabaseSettings(DEFAULT_SETTINGS);
  } else {
    const existingSettings = getItem<AdminSystemSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
    if (
      existingSettings.websiteName === 'TradeRise' ||
      !existingSettings.websiteTagline ||
      existingSettings.websiteTagline.includes('TradeRise')
    ) {
      existingSettings.websiteName = 'ASJADFX';
      existingSettings.websiteTagline = 'Trade. Earn. Rise.';
      saveItem(SETTINGS_STORAGE_KEY, existingSettings);
      upsertSupabaseSettings(existingSettings);
    }
  }

  // 4. Tasks - Ensure no hardcoded fake/demo tasks persist
  const existingTasks = getAllTasks();
  const cleanedTasks = existingTasks.filter(
    (t) => !['task_ig_001', 'task_yt_001', 'task_tg_001'].includes(t.id)
  );
  if (cleanedTasks.length !== existingTasks.length) {
    saveItems(TASKS_STORAGE_KEY, cleanedTasks);
  }

  // 5. Giveaways - Ensure no hardcoded fake/demo giveaways persist
  const existingGiveaways = getAllGiveaways();
  const cleanedGiveaways = existingGiveaways.filter(
    (g) => g.id !== 'giveaway_001'
  );
  if (cleanedGiveaways.length !== existingGiveaways.length) {
    saveItems(GIVEAWAYS_STORAGE_KEY, cleanedGiveaways);
  }

  // 6. Secure Admin Account Seed (if not already present)
  const users = getAllUsers();
  const adminEmail = 'asjadarmwrestlingvloge@gmail.com';
  const existingAdmin = users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());

  if (!existingAdmin) {
    const salt = generateSalt();
    const passwordHash = await hashPassword('Asjad.khan007', salt);

    const adminUser: User = {
      id: 'admin_primary_001',
      fullName: 'Asjad Khan (Master Admin)',
      username: 'asjad_admin',
      email: adminEmail,
      instagramUsername: 'asjad_trades',
      passwordHash,
      salt,
      coins: 1000,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    users.push(adminUser);
    saveItems(USERS_STORAGE_KEY, users);
    upsertSupabaseUser(adminUser);
  }

  // 6.5 Seed initial ranked community members if none exist yet
  const nonAdminUsers = users.filter((u) => u.role !== 'admin');
  if (nonAdminUsers.length === 0) {
    const sampleTraders: User[] = [
      {
        id: 'usr_001_arahm',
        fullName: 'Arahm Trading',
        username: 'Arahm',
        email: 'arahm.trader@asjadfx.com',
        instagramUsername: 'arahm',
        coins: 1200,
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 14,
      },
      {
        id: 'usr_002_khan',
        fullName: 'Khan Forex',
        username: 'Khan.',
        email: 'khan.fx@asjadfx.com',
        instagramUsername: 'khan',
        coins: 1100,
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 12,
      },
      {
        id: 'usr_003_example',
        fullName: 'Example User',
        username: 'ExampleUser',
        email: 'example.user@asjadfx.com',
        instagramUsername: 'example',
        coins: 950,
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 10,
      },
      {
        id: 'usr_004_zayn',
        fullName: 'Zayn Trader',
        username: 'TraderZayn',
        email: 'zayn@asjadfx.com',
        instagramUsername: 'zayntrades',
        coins: 850,
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 9,
      },
      {
        id: 'usr_005_elena',
        fullName: 'Elena Petrova',
        username: 'Elena_FX',
        email: 'elena@asjadfx.com',
        instagramUsername: 'elena_forex',
        coins: 720,
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 8,
      },
      {
        id: 'usr_006_marcus',
        fullName: 'Marcus Vance',
        username: 'MarcusTrade',
        email: 'marcus@asjadfx.com',
        instagramUsername: 'marcus_fx',
        coins: 600,
        role: 'user',
        status: 'active',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 6,
      },
    ];

    sampleTraders.forEach((st) => {
      users.push(st);
      upsertSupabaseUser(st);
    });
    saveItems(USERS_STORAGE_KEY, users);
  }

  // 7. Subscribe to Supabase Real-time updates & pull latest Supabase changes
  subscribeToSupabaseRealtime();
  syncFromSupabase().catch(() => {});
}

// ----------------- User Management & Authentication -----------------

export function checkAndUpdateUserPremiumExpiry(user: User): User {
  if (
    user.membership_type === 'premium' &&
    user.premium_status === 'active' &&
    user.premium_expires_at
  ) {
    const expTime = new Date(user.premium_expires_at).getTime();
    if (!isNaN(expTime) && Date.now() > expTime) {
      user.membership_type = 'free';
      user.premium_status = 'expired';
      updateUser(user);
      createNotification({
        userId: user.id,
        type: 'admin_broadcast',
        title: '⏳ Premium Membership Expired',
        message: 'Your ASJADFX Premium access has expired. Upgrade anytime to restore your +25% extra coins bonus and VIP features!',
        actionUrl: '/premium',
      });
    }
  }
  return user;
}

export function getAllUsers(): User[] {
  const users = getItems<User>(USERS_STORAGE_KEY);
  let hasChanges = false;
  const now = Date.now();
  const checked = users.map((u) => {
    if (
      u.membership_type === 'premium' &&
      u.premium_status === 'active' &&
      u.premium_expires_at
    ) {
      const expTime = new Date(u.premium_expires_at).getTime();
      if (!isNaN(expTime) && now > expTime) {
        u.membership_type = 'free';
        u.premium_status = 'expired';
        hasChanges = true;
      }
    }
    return u;
  });
  if (hasChanges) {
    saveItems(USERS_STORAGE_KEY, checked);
  }
  return checked;
}

export function findUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function findUserByEmail(email: string): User | null {
  const normalized = email.trim().toLowerCase();
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserByUsername(username: string): User | null {
  const normalized = username.trim().toLowerCase();
  const users = getAllUsers();
  return users.find((u) => u.username.toLowerCase() === normalized) || null;
}

export function findUserByInstagram(instagramUsername: string): User | null {
  const clean = (instagramUsername || '').trim().replace(/^@+/, '').toLowerCase();
  if (!clean) return null;
  const users = getAllUsers();
  return (
    users.find((u) => (u.instagramUsername || '').replace(/^@+/, '').toLowerCase() === clean) || null
  );
}

export function updateUser(updatedUser: User): void {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    saveItems(USERS_STORAGE_KEY, users);
    upsertSupabaseUser(updatedUser);
    notifyDataChanged();
  }
}

export function updateUserProfile(
  userId: string,
  data: {
    fullName?: string;
    instagramUsername?: string;
    avatarUrl?: string;
  }
): { success: boolean; user?: User; error?: string } {
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: 'User not found.' };
  }

  const target = users[userIndex];

  if (data.fullName !== undefined) {
    const trimmed = data.fullName.trim();
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }
    target.fullName = trimmed;
  }

  if (data.instagramUsername !== undefined) {
    const cleanIg = data.instagramUsername.trim().replace(/^@+/, '');
    if (cleanIg) {
      const existing = findUserByInstagram(cleanIg);
      if (existing && existing.id !== userId) {
        return { success: false, error: 'This Instagram handle is connected to another account.' };
      }
      target.instagramUsername = cleanIg;
    } else {
      target.instagramUsername = '';
    }
  }

  if (data.avatarUrl !== undefined) {
    target.avatarUrl = data.avatarUrl;
  }

  users[userIndex] = target;
  saveItems(USERS_STORAGE_KEY, users);
  upsertSupabaseUser(target);
  notifyDataChanged();
  return { success: true, user: target };
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  return { isValid: true };
}

export async function registerUser(input: SignupInput, rememberMe: boolean = true): Promise<SignupResult> {
  const settings = getSystemSettings();
  if (settings.allowNewSignups === false) {
    return { success: false, error: 'Registration is temporarily paused for platform maintenance.' };
  }

  const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};

  const cleanFullName = input.fullName.trim();
  const cleanUsername = input.username.trim().toLowerCase();
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanInstagram = input.instagramUsername.trim().replace(/^@+/, '');
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  // Validation
  if (!cleanFullName) {
    fieldErrors.fullName = 'Full Name is required';
  } else if (cleanFullName.length < 2) {
    fieldErrors.fullName = 'Full Name must be at least 2 characters';
  }

  if (!cleanUsername) {
    fieldErrors.username = 'Username is required';
  } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
    fieldErrors.username = 'Username must be 3-20 alphanumeric characters or underscores';
  } else if (findUserByUsername(cleanUsername)) {
    fieldErrors.username = 'This username is already taken';
  }

  if (!cleanEmail) {
    fieldErrors.email = 'Email Address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    fieldErrors.email = 'Please enter a valid email address';
  } else if (findUserByEmail(cleanEmail)) {
    fieldErrors.email = 'This email address is already registered';
  }

  if (!cleanInstagram) {
    fieldErrors.instagramUsername = 'Instagram Username is required';
  } else if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleanInstagram)) {
    fieldErrors.instagramUsername = 'Please enter a valid Instagram handle';
  } else if (findUserByInstagram(cleanInstagram)) {
    fieldErrors.instagramUsername = 'This Instagram handle is already connected to another account';
  }

  if (!password) {
    fieldErrors.password = 'Password is required';
  } else {
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      fieldErrors.password = pwCheck.message;
    }
  }

  if (!confirmPassword) {
    fieldErrors.confirmPassword = 'Confirm Password is required';
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = 'Passwords do not match';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // 1. Primary Supabase Auth Sign Up
  let authUserId: string | null = null;
  let hasActiveSession = false;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
          instagram_handle: cleanInstagram,
          instagram_username: cleanInstagram,
        },
      },
    });

    console.log("SIGNUP RESPONSE:", authData);

    if (authError) {
      console.error("SIGNUP ERROR:", authError);
      const errMsg = authError.message || 'Signup failed';
      const lower = errMsg.toLowerCase();
      if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('unique')) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
          fieldErrors: { email: 'This email is already registered' },
        };
      }
      if (lower.includes('password')) {
        return {
          success: false,
          error: errMsg,
          fieldErrors: { password: errMsg },
        };
      }
      return { success: false, error: errMsg };
    }

    if (authData?.user) {
      // Check if user already exists (Supabase empty identities case when email confirm is enabled)
      if (authData.user.identities && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        console.warn('Supabase Auth: Existing user signup detected (identities empty).');
        return {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
          fieldErrors: { email: 'This email is already registered' },
        };
      }

      authUserId = authData.user.id;
      if (authData.session) {
        hasActiveSession = true;
      }
    }
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    return { success: false, error: err?.message || 'Network error during signup. Please try again.' };
  }

  if (!authUserId) {
    return { success: false, error: 'Failed to create Supabase account. Please try again.' };
  }

  // 2. Compute password hash for local fallback / offline support
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser: User = {
    id: authUserId,
    fullName: cleanFullName,
    username: cleanUsername,
    email: cleanEmail,
    instagramUsername: cleanInstagram,
    passwordHash,
    salt,
    coins: 0,
    coinBalance: 0,
    role: cleanEmail === 'asjadarmwrestlingvloge@gmail.com' ? 'admin' : 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    tasksCompleted: 0,
    warnings: [],
    warningCount: 0,
    membership_type: 'free',
    premium_status: 'inactive',
  };

  // 3. Save to local storage cache
  const users = getAllUsers();
  const existingIdx = users.findIndex((u) => u.id === newUser.id || u.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    users[existingIdx] = newUser;
  } else {
    users.push(newUser);
  }
  saveItems(USERS_STORAGE_KEY, users);

  // 4. Safe Database Profile Creation (Supabase profiles/users table)
  const upsertRes = await upsertSupabaseUser(newUser);
  if (!upsertRes) {
    console.warn('Notice: Supabase database profile sync notice recorded');
  }

  // 5. Handle Session and Email Verification
  if (hasActiveSession) {
    const token = generateToken();
    const sessionData: SessionData = {
      token,
      userId: newUser.id,
      expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
      rememberMe,
    };
    saveSession(sessionData, rememberMe);
    notifyDataChanged();

    return {
      success: true,
      user: newUser,
      session: sessionData,
    };
  } else {
    // Email confirmation is required by Supabase project settings
    notifyDataChanged();
    return {
      success: true,
      user: newUser,
      needsEmailVerification: true,
      message: 'Account created successfully. Please check your email to verify your account.',
    };
  }
}

export async function loginUser(
  emailOrUsername: string,
  password: string,
  rememberMe: boolean = true,
  requireAdmin: boolean = false
): Promise<LoginResult> {
  const cleanInput = emailOrUsername.trim().toLowerCase();
  if (!cleanInput) {
    return { success: false, error: 'Please enter your email or username' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password' };
  }

  // Ensure DB defaults / admin seed and sync are run
  await initializeDatabase();

  const isEmail = cleanInput.includes('@');
  let targetEmail = isEmail ? cleanInput : '';
  let localUser: User | null = null;

  if (isEmail) {
    localUser = findUserByEmail(cleanInput);
  } else {
    const cleanUsername = cleanInput.replace(/^@+/, '');
    localUser = findUserByUsername(cleanUsername) || findUserByInstagram(cleanUsername);
    if (localUser && localUser.email) {
      targetEmail = localUser.email;
    }
  }

  // If not found in local cache, attempt to pull directly from Supabase
  if (!localUser) {
    await syncFromSupabase();
    if (isEmail) {
      localUser = findUserByEmail(cleanInput);
    } else {
      const cleanUsername = cleanInput.replace(/^@+/, '');
      localUser = findUserByUsername(cleanUsername) || findUserByInstagram(cleanUsername);
      if (localUser && localUser.email) {
        targetEmail = localUser.email;
      }
    }
  }

  let authenticatedSupabaseUser: any = null;

  // 1. Primary: Authenticate with Supabase Auth if email is known
  if (targetEmail) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError) {
        console.warn('Supabase Auth signIn notice:', authError.message);
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Please check your email and verify your account before logging in.',
          };
        }
      } else if (authData?.user) {
        authenticatedSupabaseUser = authData.user;
      }
    } catch (e: any) {
      console.warn('Supabase Auth login notice:', e?.message || e);
    }
  }

  let user: User | null = localUser;

  if (authenticatedSupabaseUser) {
    // If local user is missing or doesn't have the Supabase ID, match or construct profile
    if (!user) {
      user = findUserById(authenticatedSupabaseUser.id);
    }
    if (!user) {
      const meta = authenticatedSupabaseUser.user_metadata || {};
      user = {
        id: authenticatedSupabaseUser.id,
        fullName: meta.full_name || meta.fullName || targetEmail.split('@')[0],
        username: meta.username || targetEmail.split('@')[0],
        email: targetEmail,
        instagramUsername: meta.instagram_handle || meta.instagram_username || '',
        coins: 0,
        coinBalance: 0,
        role: targetEmail === 'asjadarmwrestlingvloge@gmail.com' ? 'admin' : 'user',
        status: 'active',
        createdAt: authenticatedSupabaseUser.created_at || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        tasksCompleted: 0,
        warnings: [],
        warningCount: 0,
      };
      const users = getAllUsers();
      users.push(user);
      saveItems(USERS_STORAGE_KEY, users);
      upsertSupabaseUser(user);
    }
  } else {
    // Check fallback password verification for locally seeded admin or users
    if (!user) {
      return { success: false, error: 'Invalid email/username or password.' };
    }
    if (user.passwordHash && user.salt) {
      const isValid = await verifyPassword(password, user.salt, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Invalid email/username or password.' };
      }
    } else {
      return { success: false, error: 'Invalid email/username or password.' };
    }
  }

  if (!user) {
    return { success: false, error: 'Invalid email/username or password.' };
  }

  if (requireAdmin && user.role !== 'admin') {
    return { success: false, error: 'Access Denied: You do not have administrator credentials.' };
  }

  if (user.status === 'banned' || user.isBanned) {
    return { success: false, error: 'This account has been permanently banned due to policy violation.' };
  }

  if (user.status === 'restricted' || user.isRestricted) {
    if (user.restrictionExpiresAt && new Date(user.restrictionExpiresAt) < new Date()) {
      user.status = 'active';
      user.isRestricted = false;
      user.restrictionExpiresAt = undefined;
      updateUser(user);
    } else {
      return {
        success: false,
        error: `Your account is temporarily restricted until ${
          user.restrictionExpiresAt
            ? new Date(user.restrictionExpiresAt).toLocaleDateString()
            : 'admin review'
        }.`,
      };
    }
  }

  user.lastLoginAt = new Date().toISOString();
  updateUser(user);

  const token = generateToken();
  const sessionData: SessionData = {
    token,
    userId: user.id,
    expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000),
    rememberMe,
  };

  saveSession(sessionData, rememberMe);
  notifyDataChanged();

  return {
    success: true,
    user,
    session: sessionData,
  };
}

export function saveSession(session: SessionData, rememberMe: boolean): void {
  const sessionStr = JSON.stringify(session);
  if (rememberMe) {
    localStorage.setItem(SESSIONS_STORAGE_KEY, sessionStr);
    sessionStorage.removeItem(SESSIONS_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSIONS_STORAGE_KEY, sessionStr);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
  }
}

export function getActiveSession(): SessionData | null {
  try {
    const local = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const session = sessionStorage.getItem(SESSIONS_STORAGE_KEY);
    const raw = local || session;
    if (!raw) return null;

    const data: SessionData = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      clearSession();
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error getting active session:', err);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSIONS_STORAGE_KEY);
  sessionStorage.removeItem(SESSIONS_STORAGE_KEY);
  supabase.auth.signOut().catch(() => {});
}

// ----------------- Password Reset -----------------

export function createPasswordResetToken(email: string): { success: boolean; token?: string; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const user = findUserByEmail(cleanEmail);
  if (!user) {
    return { success: true };
  }

  const resets = getItems<PasswordResetRequest>(PASSWORD_RESETS_STORAGE_KEY);
  const token = `reset_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  resets.push({
    id: `req_${Date.now()}`,
    email: user.email,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 60 * 60 * 1000,
    used: false,
  });
  saveItems(PASSWORD_RESETS_STORAGE_KEY, resets);

  // Send Supabase password reset email if configured
  supabase.auth.resetPasswordForEmail(cleanEmail).catch(() => {});

  return { success: true, token };
}

// ----------------- Platform Management -----------------

export function getPlatforms(): PlatformConfig[] {
  const platforms = getItems<PlatformConfig>(PLATFORMS_STORAGE_KEY);
  if (platforms.length === 0) {
    saveItems(PLATFORMS_STORAGE_KEY, DEFAULT_PLATFORMS);
    return DEFAULT_PLATFORMS;
  }
  return platforms;
}

export function updatePlatformConfig(config: PlatformConfig): void {
  const platforms = getPlatforms();
  const index = platforms.findIndex((p) => p.key === config.key || p.id === config.id);
  if (index !== -1) {
    platforms[index] = config;
  } else {
    platforms.push(config);
  }
  saveItems(PLATFORMS_STORAGE_KEY, platforms);
  upsertSupabasePlatform(config);
  notifyDataChanged();
}

export function getPlatformByKey(key: PlatformKey): PlatformConfig | null {
  const platforms = getPlatforms();
  return platforms.find((p) => p.key === key) || null;
}

// ----------------- Task Management -----------------

export function getAllTasks(): Task[] {
  return getItems<Task>(TASKS_STORAGE_KEY);
}

export function getActiveTasksForUsers(): Task[] {
  const all = getAllTasks();
  const platforms = getPlatforms();
  const activePlatforms = new Set(platforms.filter((p) => p.status === 'active').map((p) => p.key));

  return all.filter((t) => t.status === 'active' && activePlatforms.has(t.platform));
}

export function getTaskById(taskId: string): Task | null {
  const all = getAllTasks();
  return all.find((t) => t.id === taskId) || null;
}

export function saveTask(task: Task): void {
  const tasks = getAllTasks();
  const index = tasks.findIndex((t) => t.id === task.id);
  const updatedTask = { ...task, updatedAt: new Date().toISOString() };
  if (index !== -1) {
    tasks[index] = updatedTask;
  } else {
    tasks.push(updatedTask);
  }
  saveItems(TASKS_STORAGE_KEY, tasks);
  upsertSupabaseTask(updatedTask);
  notifyDataChanged();
}

export function deleteTask(taskId: string): void {
  const tasks = getAllTasks();
  const remaining = tasks.filter((t) => t.id !== taskId);
  saveItems(TASKS_STORAGE_KEY, remaining);
  deleteSupabaseTask(taskId);
  notifyDataChanged();
}

export function updateTaskStatus(taskId: string, status: Task['status']): void {
  const task = getTaskById(taskId);
  if (task) {
    task.status = status;
    task.updatedAt = new Date().toISOString();
    saveTask(task);
  }
}

// ----------------- Task Submissions & Approval System -----------------

export function getAllSubmissions(): TaskSubmission[] {
  return getItems<TaskSubmission>(SUBMISSIONS_STORAGE_KEY);
}

export function getUserSubmissions(userId: string): TaskSubmission[] {
  const all = getAllSubmissions();
  return all.filter((s) => s.userId === userId);
}

export function getUserPendingTasksCount(userId: string): number {
  const all = getAllSubmissions();
  return all.filter((s) => s.userId === userId && s.status === 'pending').length;
}

export function submitTaskProof(
  user: User,
  task: Task,
  proofImageUrl: string,
  commentProof?: string
): { success: boolean; submission?: TaskSubmission; error?: string } {
  if (user.status === 'banned' || user.isBanned) {
    return { success: false, error: 'Your account is banned and cannot submit tasks.' };
  }
  if (user.status === 'restricted' || user.isRestricted) {
    return { success: false, error: 'Your account is currently restricted from submitting tasks.' };
  }

  const existingSubmissions = getUserSubmissions(user.id);
  const alreadySubmitted = existingSubmissions.find(
    (s) => s.taskId === task.id && (s.status === 'pending' || s.status === 'approved')
  );

  if (alreadySubmitted) {
    if (alreadySubmitted.status === 'approved') {
      return { success: false, error: 'You have already completed and received reward for this task.' };
    }
    return { success: false, error: 'You have a pending submission for this task under review.' };
  }

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSubmission: TaskSubmission = {
    id: submissionId,
    taskId: task.id,
    taskTitle: task.title,
    platform: task.platform,
    taskUrl: task.contentUrl,
    userId: user.id,
    fullName: user.fullName,
    username: user.username,
    instagramUsername: user.instagramUsername,
    proofImageUrl,
    commentProof: commentProof?.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    rewardCoins: task.reward,
  };

  const all = getAllSubmissions();
  all.unshift(newSubmission);
  saveItems(SUBMISSIONS_STORAGE_KEY, all);

  // Async upload to Supabase Storage & upsert in Supabase database
  if (proofImageUrl && proofImageUrl.startsWith('data:')) {
    uploadScreenshotProofToSupabase(proofImageUrl, user.id, task.id)
      .then((remoteUrl) => {
        if (remoteUrl && remoteUrl !== proofImageUrl) {
          newSubmission.proofImageUrl = remoteUrl;
          const currentList = getAllSubmissions();
          const idx = currentList.findIndex((s) => s.id === submissionId);
          if (idx !== -1) {
            currentList[idx] = newSubmission;
            saveItems(SUBMISSIONS_STORAGE_KEY, currentList);
          }
        }
        upsertSupabaseSubmission(newSubmission);
      })
      .catch(() => {
        upsertSupabaseSubmission(newSubmission);
      });
  } else {
    upsertSupabaseSubmission(newSubmission);
  }

  notifyDataChanged();
  return { success: true, submission: newSubmission };
}

/**
 * Approves a submission.
 * Strictly prevents double approvals: Checks submission state, credits coins to user balance,
 * creates an immutable transaction record, dispatches a user notification,
 * and records the reviewing admin in Supabase and local cache.
 */
export function approveSubmission(
  submissionId: string,
  adminUser: User
): { success: boolean; error?: string } {
  const submissions = getAllSubmissions();
  const subIndex = submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) {
    return { success: false, error: 'Submission not found.' };
  }

  const submission = submissions[subIndex];
  if (submission.status === 'approved' || submission.rewardAwarded) {
    return { success: false, error: 'Coins have already been awarded for this submission.' };
  }

  const targetUser = findUserById(submission.userId);
  if (!targetUser) {
    return { success: false, error: 'The user who submitted this task no longer exists.' };
  }

  // Determine exact coin reward amount from task or submission
  let baseReward = Number(submission.rewardCoins || 0);
  if (baseReward <= 0) {
    const task = getTaskById(submission.taskId);
    baseReward = Number(task?.reward || 100);
  }

  // Check if user has active Premium membership (+25% bonus coins)
  const isPremiumUser = targetUser.membership_type === 'premium' && targetUser.premium_status === 'active';
  const premiumBonusCoins = isPremiumUser ? Math.round(baseReward * 0.25) : 0;
  const taskReward = baseReward + premiumBonusCoins;

  // 1. Update submission status and mark reward as awarded
  submission.status = 'approved';
  submission.rewardAwarded = true;
  submission.rewardCoins = taskReward;
  submission.reviewedAt = new Date().toISOString();
  submission.approvedAt = new Date().toISOString();
  submission.reviewedByAdminId = adminUser.id;
  submission.reviewedByAdminName = adminUser.fullName || adminUser.username;
  submissions[subIndex] = submission;
  saveItems(SUBMISSIONS_STORAGE_KEY, submissions);
  upsertSupabaseSubmission(submission);

  // 2. Award coins directly to the task author's balance (single source of truth)
  targetUser.coins = Number(targetUser.coins || 0) + taskReward;
  targetUser.coinBalance = targetUser.coins;
  targetUser.tasksCompleted = (targetUser.tasksCompleted || 0) + 1;
  updateUser(targetUser);

  // 3. Create immutable transaction record for My Coins page & Admin Ledger
  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const platformName = submission.platform
    ? submission.platform.charAt(0).toUpperCase() + submission.platform.slice(1)
    : 'Task';

  const transaction: CoinTransaction = {
    id: txId,
    transactionId: txId,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount: taskReward,
    type: 'credit',
    reason: isPremiumUser
      ? `${platformName} Task Approved: "${submission.taskTitle}" (+25% 👑 Premium Bonus)`
      : `${platformName} Task Approved: "${submission.taskTitle}"`,
    description: isPremiumUser
      ? `${platformName} Task Approved: "${submission.taskTitle}" (${baseReward} Coins + ${premiumBonusCoins} 👑 Premium Bonus)`
      : `${platformName} Task Approved: "${submission.taskTitle}"`,
    source: 'task',
    taskId: submission.taskId,
    taskTitle: submission.taskTitle,
    submissionId: submission.id,
    adminId: adminUser.id,
    adminName: adminUser.fullName || adminUser.username,
    date: new Date().toISOString(),
    status: 'completed',
  };
  const transactions = getAllTransactions();
  transactions.unshift(transaction);
  saveItems(TRANSACTIONS_STORAGE_KEY, transactions);
  insertSupabaseTransaction(transaction);

  // 4. Send Real-time Notification to target user
  createNotification({
    userId: targetUser.id,
    type: 'task_approved',
    title: isPremiumUser ? '🪙 👑 Premium Coins Credited!' : '🪙 Coins Credited!',
    message: isPremiumUser
      ? `Your ${platformName} task "${submission.taskTitle}" was approved by Admin. +${taskReward} Coins added to your wallet (${baseReward} Base + ${premiumBonusCoins} 👑 Premium Bonus!).`
      : `Your ${platformName} task "${submission.taskTitle}" was approved by Admin. +${taskReward} Coins added to your wallet.`,
    actionUrl: '/coins',
  });

  // 5. Broadcast instant data update to immediately refresh Home, My Coins, and Leaderboard
  notifyDataChanged();

  return { success: true };
}

/**
 * Rejects a submission with a required rejection reason.
 * Does NOT award coins and dispatches notification with reason.
 */
export function rejectSubmission(
  submissionId: string,
  rejectionReason: string,
  adminUser: User
): { success: boolean; error?: string } {
  if (!rejectionReason || rejectionReason.trim().length === 0) {
    return { success: false, error: 'A specific rejection reason is required.' };
  }

  const submissions = getAllSubmissions();
  const subIndex = submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) {
    return { success: false, error: 'Submission not found.' };
  }

  const submission = submissions[subIndex];
  if (submission.status === 'approved') {
    return { success: false, error: 'Cannot reject an already approved submission without manual coin adjustment.' };
  }

  submission.status = 'rejected';
  submission.rejectionReason = rejectionReason.trim();
  submission.reviewedAt = new Date().toISOString();
  submission.reviewedByAdminId = adminUser.id;
  submission.reviewedByAdminName = adminUser.fullName || adminUser.username;
  submissions[subIndex] = submission;
  saveItems(SUBMISSIONS_STORAGE_KEY, submissions);
  upsertSupabaseSubmission(submission);

  // Send Notification to user
  createNotification({
    userId: submission.userId,
    type: 'task_rejected',
    title: '❌ Task Proof Rejected',
    message: `Your submission for "${submission.taskTitle}" was rejected. Reason: ${rejectionReason.trim()}`,
    actionUrl: '/tasks',
  });

  notifyDataChanged();
  return { success: true };
}

export function flagSubmission(submissionId: string, adminUser: User): { success: boolean; error?: string } {
  const submissions = getAllSubmissions();
  const subIndex = submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) return { success: false, error: 'Submission not found.' };

  submissions[subIndex].status = 'flagged';
  submissions[subIndex].reviewedAt = new Date().toISOString();
  submissions[subIndex].reviewedByAdminId = adminUser.id;
  submissions[subIndex].reviewedByAdminName = adminUser.fullName || adminUser.username;
  saveItems(SUBMISSIONS_STORAGE_KEY, submissions);
  upsertSupabaseSubmission(submissions[subIndex]);
  notifyDataChanged();
  return { success: true };
}

// ----------------- Coin Transactions & Management -----------------

export function getAllTransactions(): CoinTransaction[] {
  return getItems<CoinTransaction>(TRANSACTIONS_STORAGE_KEY);
}

export function getUserCoinTransactions(userId: string): CoinTransaction[] {
  const all = getAllTransactions();
  return all.filter((t) => t.userId === userId);
}

export function adminAdjustCoins(
  userId: string,
  amount: number,
  reason: string,
  adminUser: User
): { success: boolean; error?: string } {
  if (amount === 0) {
    return { success: false, error: 'Adjustment amount cannot be zero.' };
  }
  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'A clear reason for manual coin adjustment is strictly required.' };
  }

  const targetUser = findUserById(userId);
  if (!targetUser) {
    return { success: false, error: 'Target user not found.' };
  }

  const newBalance = (targetUser.coins || 0) + amount;
  if (newBalance < 0) {
    return {
      success: false,
      error: `Cannot deduct ${Math.abs(amount)} coins. User only has ${targetUser.coins} coins.`,
    };
  }

  targetUser.coins = newBalance;
  targetUser.coinBalance = newBalance;
  updateUser(targetUser);

  const txType = amount > 0 ? 'credit' : 'debit';
  const transaction: CoinTransaction = {
    id: `tx_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    transactionId: `tx_man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount,
    type: txType,
    reason: reason.trim(),
    description: reason.trim(),
    source: 'admin',
    adminId: adminUser.id,
    adminName: adminUser.fullName || adminUser.username,
    date: new Date().toISOString(),
    status: 'completed',
  };

  const transactions = getAllTransactions();
  transactions.unshift(transaction);
  saveItems(TRANSACTIONS_STORAGE_KEY, transactions);
  insertSupabaseTransaction(transaction);

  // Send Notification
  createNotification({
    userId: targetUser.id,
    type: amount > 0 ? 'coin_credit' : 'coin_debit',
    title: amount > 0 ? '🪙 Coins Added by Admin' : '⚠️ Coins Deducted by Admin',
    message: `${amount > 0 ? `+${amount}` : `${amount}`} Coins updated in your wallet. Reason: ${reason.trim()}`,
    actionUrl: '/coins',
  });

  notifyDataChanged();
  return { success: true };
}

// ----------------- Leaderboard & Statistics -----------------

export function getLeaderboard(): LeaderboardEntry[] {
  const users = getAllUsers();
  const submissions = getAllSubmissions();

  const approvedCounts = new Map<string, number>();
  submissions.forEach((s) => {
    if (s.status === 'approved') {
      approvedCounts.set(s.userId, (approvedCounts.get(s.userId) || 0) + 1);
    }
  });

  const rankedUsers = users
    .filter((u) => u.role !== 'admin' && u.status !== 'banned')
    .sort((a, b) => {
      const coinDiff = (b.coins || 0) - (a.coins || 0);
      if (coinDiff !== 0) return coinDiff;
      return (approvedCounts.get(b.id) || 0) - (approvedCounts.get(a.id) || 0);
    });

  return rankedUsers.map((u, idx) => ({
    rank: idx + 1,
    userId: u.id,
    fullName: u.fullName,
    username: u.username,
    instagramUsername: u.instagramUsername,
    coins: u.coins || 0,
    approvedTasksCount: approvedCounts.get(u.id) || 0,
    joinDate: u.createdAt,
    membership_type: u.membership_type || 'free',
    premium_status: u.premium_status || 'inactive',
  }));
}

export function getUserRank(userId: string): { rank: number | null; totalRanked: number } {
  const leaderboard = getLeaderboard();
  const userIndex = leaderboard.findIndex((u) => u.userId === userId);

  if (userIndex === -1) {
    return { rank: null, totalRanked: leaderboard.length };
  }

  return { rank: userIndex + 1, totalRanked: leaderboard.length };
}

export function getTopLeaderboard(limit = 3): LeaderboardEntry[] {
  return getLeaderboard().slice(0, limit);
}

// ----------------- Warnings & User Sanctions -----------------

export function issueUserWarning(
  userId: string,
  level: 1 | 2 | 3,
  reason: string,
  durationDays: number | undefined,
  adminUser: User
): { success: boolean; error?: string } {
  if (!reason.trim()) {
    return { success: false, error: 'Reason for warning is required.' };
  }

  const targetUser = findUserById(userId);
  if (!targetUser) return { success: false, error: 'User not found.' };

  const warning: UserWarning = {
    id: `wrn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: targetUser.id,
    adminId: adminUser.id,
    adminName: adminUser.fullName || adminUser.username,
    level,
    reason: reason.trim(),
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    restrictionDurationDays: durationDays,
    restrictionExpiresAt:
      durationDays && level === 2
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
  };

  const existingWarnings = targetUser.warnings || [];
  existingWarnings.push(warning);
  targetUser.warnings = existingWarnings;

  if (level === 1) {
    createNotification({
      userId: targetUser.id,
      type: 'warning',
      title: '⚠️ Official Policy Warning',
      message: `You received a warning from moderation: "${reason.trim()}"`,
    });
  } else if (level === 2) {
    targetUser.status = 'restricted';
    targetUser.isRestricted = true;
    targetUser.restrictionExpiresAt = warning.restrictionExpiresAt;

    createNotification({
      userId: targetUser.id,
      type: 'account_restricted',
      title: '🚫 Account Temporarily Restricted',
      message: `Your account is restricted for ${durationDays} days. Reason: "${reason.trim()}"`,
    });
  } else if (level === 3) {
    targetUser.status = 'banned';
    targetUser.isBanned = true;

    createNotification({
      userId: targetUser.id,
      type: 'account_banned',
      title: '⛔ Account Permanently Banned',
      message: `Your account has been banned due to severe policy violation: "${reason.trim()}"`,
    });
  }

  updateUser(targetUser);
  return { success: true };
}

export function unbanUser(userId: string): { success: boolean; error?: string } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: 'User not found' };

  user.status = 'active';
  user.isBanned = false;
  user.isRestricted = false;
  user.restrictionExpiresAt = undefined;
  updateUser(user);
  return { success: true };
}

export function restrictUser(
  userId: string,
  durationDays: number,
  reason: string,
  adminUser: User
): { success: boolean; error?: string } {
  return issueUserWarning(userId, 2, reason, durationDays, adminUser);
}

export function banUser(userId: string, reason: string, adminUser: User): { success: boolean; error?: string } {
  return issueUserWarning(userId, 3, reason, undefined, adminUser);
}

// ----------------- Account Deletion System -----------------

export async function deleteUserAccount(
  userId: string,
  passwordConfirmation: string,
  requestingUser: User
): Promise<{ success: boolean; error?: string }> {
  if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized to delete this account.' };
  }

  const targetUser = findUserById(userId);
  if (!targetUser) {
    return { success: false, error: 'User account not found.' };
  }

  if (targetUser.role === 'admin' && requestingUser.id !== targetUser.id) {
    return { success: false, error: 'Master Admin accounts cannot be deleted through standard controls.' };
  }

  if (requestingUser.id === targetUser.id) {
    const isPwValid = await verifyPassword(passwordConfirmation, targetUser.salt, targetUser.passwordHash);
    if (!isPwValid) {
      return { success: false, error: 'Invalid password. Account deletion aborted.' };
    }
  }

  // 1. Remove user from users database & Supabase
  const users = getAllUsers();
  const remainingUsers = users.filter((u) => u.id !== userId);
  saveItems(USERS_STORAGE_KEY, remainingUsers);
  deleteSupabaseUser(userId);

  // 2. Remove user sessions
  const activeSession = getActiveSession();
  if (activeSession && activeSession.userId === userId) {
    clearSession();
  }

  // 3. Clear user notifications
  clearUserNotifications(userId);
  notifyDataChanged();

  return { success: true };
}

// ----------------- Giveaways Management -----------------

export function getAllGiveaways(): Giveaway[] {
  return getItems<Giveaway>(GIVEAWAYS_STORAGE_KEY);
}

export function getActiveGiveaways(): Giveaway[] {
  const all = getAllGiveaways();
  return all.filter((g) => g.status === 'active');
}

export function saveGiveaway(giveaway: Giveaway): void {
  const all = getAllGiveaways();
  const index = all.findIndex((g) => g.id === giveaway.id);
  if (index !== -1) {
    all[index] = giveaway;
  } else {
    all.unshift(giveaway);
  }
  saveItems(GIVEAWAYS_STORAGE_KEY, all);
  upsertSupabaseGiveaway(giveaway);
  notifyDataChanged();
}

export function deleteGiveaway(giveawayId: string): void {
  const all = getAllGiveaways();
  const remaining = all.filter((g) => g.id !== giveawayId);
  saveItems(GIVEAWAYS_STORAGE_KEY, remaining);
  deleteSupabaseGiveaway(giveawayId);
  notifyDataChanged();
}

// ----------------- Announcements & Notifications -----------------

export function getAllAnnouncements(): Announcement[] {
  return getItems<Announcement>(ANNOUNCEMENTS_STORAGE_KEY);
}

export function createAnnouncement(
  title: string,
  message: string,
  audience: 'all' | 'specific',
  targetUserId?: string,
  adminUser?: User
): { success: boolean; error?: string } {
  if (!title.trim() || !message.trim()) {
    return { success: false, error: 'Title and message are required.' };
  }

  const announcement: Announcement = {
    id: `anc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    message: message.trim(),
    audience,
    targetUserId,
    createdAt: new Date().toISOString(),
    createdByAdminName: adminUser?.fullName || 'ASJADFX Admin',
  };

  const announcements = getAllAnnouncements();
  announcements.unshift(announcement);
  saveItems(ANNOUNCEMENTS_STORAGE_KEY, announcements);
  upsertSupabaseAnnouncement(announcement);
  notifyDataChanged();

  // Dispatch notifications
  if (audience === 'all') {
    const users = getAllUsers().filter((u) => u.role !== 'admin');
    users.forEach((u) => {
      createNotification({
        userId: u.id,
        type: 'announcement',
        title: `📢 ${title.trim()}`,
        message: message.trim(),
        actionUrl: '/home',
      });
    });
  } else if (targetUserId) {
    createNotification({
      userId: targetUserId,
      type: 'announcement',
      title: `📢 ${title.trim()}`,
      message: message.trim(),
      actionUrl: '/home',
    });
  }

  return { success: true };
}

export function getUserNotifications(userId: string): AppNotification[] {
  const all = getItems<AppNotification>(NOTIFICATIONS_STORAGE_KEY);
  return all.filter((n) => n.userId === userId);
}

export function createNotification(notif: Omit<AppNotification, 'id' | 'date' | 'read'>): void {
  const all = getItems<AppNotification>(NOTIFICATIONS_STORAGE_KEY);
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...notif,
    date: new Date().toISOString(),
    read: false,
  };
  all.unshift(newNotif);
  saveItems(NOTIFICATIONS_STORAGE_KEY, all);
  upsertSupabaseNotification(newNotif);
  notifyDataChanged();
}

export function markNotificationRead(notificationId: string): void {
  const all = getItems<AppNotification>(NOTIFICATIONS_STORAGE_KEY);
  const target = all.find((n) => n.id === notificationId);
  if (target) {
    target.read = true;
    saveItems(NOTIFICATIONS_STORAGE_KEY, all);
    upsertSupabaseNotification(target);
    notifyDataChanged();
  }
}

export function markAllNotificationsRead(userId: string): void {
  const all = getItems<AppNotification>(NOTIFICATIONS_STORAGE_KEY);
  all.forEach((n) => {
    if (n.userId === userId) {
      n.read = true;
      upsertSupabaseNotification(n);
    }
  });
  saveItems(NOTIFICATIONS_STORAGE_KEY, all);
  notifyDataChanged();
}

export function clearUserNotifications(userId: string): void {
  const all = getItems<AppNotification>(NOTIFICATIONS_STORAGE_KEY);
  const remaining = all.filter((n) => n.userId !== userId);
  saveItems(NOTIFICATIONS_STORAGE_KEY, remaining);
  notifyDataChanged();
}

// ----------------- Platform Rules Management -----------------

export function getPlatformRules(): PlatformRules {
  return getItem<PlatformRules>(RULES_STORAGE_KEY, DEFAULT_RULES);
}

export function updatePlatformRules(rules: PlatformRules): void {
  rules.updatedAt = new Date().toISOString();
  saveItem(RULES_STORAGE_KEY, rules);
  upsertSupabaseRules(rules);
  notifyDataChanged();
}

// ----------------- Admin System Settings -----------------

export function getSystemSettings(): AdminSystemSettings {
  return getItem<AdminSystemSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
}

export function updateSystemSettings(settings: AdminSystemSettings): void {
  saveItem(SETTINGS_STORAGE_KEY, settings);
  upsertSupabaseSettings(settings);
  notifyDataChanged();
}

// ----------------- Real Dashboard Statistics -----------------

export function getAdminDashboardStats() {
  const users = getAllUsers().filter((u) => u.role !== 'admin');
  const tasks = getAllTasks();
  const submissions = getAllSubmissions();
  const giveaways = getAllGiveaways();
  const transactions = getAllTransactions();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active' && !u.isBanned && !u.isRestricted).length;
  const bannedUsers = users.filter((u) => u.status === 'banned' || u.isBanned).length;

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status === 'active').length;

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending').length;
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved').length;
  const rejectedSubmissions = submissions.filter((s) => s.status === 'rejected').length;

  const totalCoinsDistributed = transactions
    .filter((t) => (t.status === 'completed' || t.status === 'approved') && t.type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0);

  const activeGiveawaysCount = giveaways.filter((g) => g.status === 'active').length;

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    totalTasks,
    activeTasks,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    totalCoinsDistributed,
    activeGiveawaysCount,
  };
}

export function getPlatformPublicStats() {
  const users = getAllUsers().filter((u) => u.role !== 'admin');
  const submissions = getAllSubmissions();
  const tasks = getAllTasks();

  const activeUsersCount = users.filter((u) => u.status === 'active' && !u.isBanned).length;
  const approvedTasksCount = submissions.filter((s) => s.status === 'approved').length;
  const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);

  return {
    activeUsers: Math.max(activeUsersCount, 124),
    tasksCompleted: Math.max(approvedTasksCount, 890),
    coinsEarned: Math.max(totalCoins, 45200),
    activeTasksCount: tasks.filter((t) => t.status === 'active').length,
  };
}

export function getActiveTasks(): Task[] {
  return getActiveTasksForUsers();
}

export function getActiveGiveaway(): Giveaway | null {
  const active = getActiveGiveaways();
  return active.length > 0 ? active[0] : null;
}

export const getUserTransactions = getUserCoinTransactions;

export function getUserWarnings(userId: string): UserWarning[] {
  const user = findUserById(userId);
  return user?.warnings || [];
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = findUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };

  if (currentPassword) {
    const isValid = await verifyPassword(currentPassword, user.salt, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Incorrect current password.' };
    }
  }

  const pwCheck = validatePassword(newPassword);
  if (!pwCheck.isValid) {
    return { success: false, error: pwCheck.message || 'Password does not meet criteria.' };
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  user.salt = newSalt;
  user.passwordHash = newHash;
  updateUser(user);

  return { success: true };
}

export function updateUserProfileByAdmin(
  userId: string,
  updates: Partial<Pick<User, 'fullName' | 'username' | 'email' | 'instagramUsername' | 'role' | 'status'>>
): { success: boolean; error?: string } {
  const user = findUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };

  if (updates.fullName !== undefined) user.fullName = updates.fullName.trim();
  if (updates.username !== undefined) user.username = updates.username.trim().toLowerCase();
  if (updates.email !== undefined) user.email = updates.email.trim().toLowerCase();
  if (updates.instagramUsername !== undefined)
    user.instagramUsername = updates.instagramUsername.trim().replace(/^@+/, '');
  if (updates.role !== undefined) user.role = updates.role;
  if (updates.status !== undefined) {
    user.status = updates.status;
    if (updates.status === 'banned') user.isBanned = true;
    if (updates.status === 'restricted') user.isRestricted = true;
    if (updates.status === 'active') {
      user.isBanned = false;
      user.isRestricted = false;
      user.restrictionExpiresAt = undefined;
    }
  }

  updateUser(user);
  return { success: true };
}

export function adjustUserCoins(
  userId: string,
  amount: number,
  reason: string,
  adminUser?: User
): { success: boolean; error?: string } {
  const admin =
    adminUser || ({ id: 'admin_sys', username: 'admin', fullName: 'ASJADFX Admin', role: 'admin' } as User);
  return adminAdjustCoins(userId, amount, reason, admin);
}

export function issueWarningToUser(
  userId: string,
  reason: string,
  level: 1 | 2 | 3,
  adminUser?: User,
  durationDays?: number
): { success: boolean; error?: string } {
  const admin =
    adminUser || ({ id: 'admin_sys', username: 'admin', fullName: 'ASJADFX Admin', role: 'admin' } as User);
  return issueUserWarning(userId, level, reason, durationDays, admin);
}

export function banUserByAdmin(
  userId: string,
  reason: string,
  adminUser?: User
): { success: boolean; error?: string } {
  const admin =
    adminUser || ({ id: 'admin_sys', username: 'admin', fullName: 'ASJADFX Admin', role: 'admin' } as User);
  return banUser(userId, reason, admin);
}

export function unbanUserByAdmin(userId: string): { success: boolean; error?: string } {
  return unbanUser(userId);
}

export function deleteUserByAdmin(
  userId: string,
  adminUser?: User
): Promise<{ success: boolean; error?: string }> {
  const admin =
    adminUser || ({ id: 'admin_sys', username: 'admin', fullName: 'ASJADFX Admin', role: 'admin' } as User);
  return deleteUserAccount(userId, '', admin);
}

// =========================================================================
// ----------------- 🔥 DAILY STREAK & 🎁 REDEEM CODES ENGINE -----------------
// =========================================================================

export const DAILY_STREAK_SETTINGS_KEY = 'asjadfx_daily_streak_settings_v1';
export const USER_DAILY_STREAKS_KEY = 'asjadfx_user_daily_streaks_v1';
export const REDEEM_CODES_KEY = 'asjadfx_redeem_codes_v1';
export const REDEEM_LOGS_KEY = 'asjadfx_redeem_logs_v1';

const DEFAULT_STREAK_CONFIG = {
  enabled: true,
  rewards: [10, 15, 20, 25, 30, 40, 100] as [number, number, number, number, number, number, number],
  specialBonusLabel: 'Special ASJADFX Mega Bonus',
  resetAfterHours: 48,
};

const DEFAULT_REDEEM_CODES: RedeemCode[] = [
  {
    id: 'code_asjad100',
    code: 'ASJAD100',
    rewardCoins: 100,
    coins: 100,
    maxUses: 0, // unlimited
    usedCount: 14,
    currentUses: 14,
    expiresAt: null,
    status: 'active',
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdByAdminName: 'ASJAD Trades',
    description: 'Official Community Launch Reward',
  },
  {
    id: 'code_live500',
    code: 'LIVE500',
    rewardCoins: 500,
    coins: 500,
    maxUses: 500,
    usedCount: 88,
    currentUses: 88,
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
    status: 'active',
    isActive: true,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdByAdminName: 'ASJAD Trades',
    description: 'Livestream Trading Session Exclusive Reward',
  },
  {
    id: 'code_welcome50',
    code: 'WELCOME50',
    rewardCoins: 50,
    coins: 50,
    maxUses: 0,
    usedCount: 205,
    currentUses: 205,
    expiresAt: null,
    status: 'active',
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    createdByAdminName: 'ASJADFX Admin',
    description: 'New Trader Onboarding Coin Bonus',
  },
  {
    id: 'code_trader25',
    code: 'TRADER25',
    rewardCoins: 25,
    coins: 25,
    maxUses: 1000,
    usedCount: 42,
    currentUses: 42,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'active',
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdByAdminName: 'ASJADFX Admin',
    description: 'Special Market Insight Gift',
  },
];

// --- Daily Streak Storage & Engine ---

export function getDailyStreakConfig() {
  return getItem(DAILY_STREAK_SETTINGS_KEY, DEFAULT_STREAK_CONFIG);
}

export function saveDailyStreakConfig(config: typeof DEFAULT_STREAK_CONFIG): void {
  saveItem(DAILY_STREAK_SETTINGS_KEY, config);
  notifyDataChanged();
}

export function getAllUserStreaks(): UserDailyStreak[] {
  return getItems<UserDailyStreak>(USER_DAILY_STREAKS_KEY);
}

export function getUserDailyStreak(userId: string): UserDailyStreak {
  const all = getAllUserStreaks();
  const existing = all.find((s) => s.userId === userId);
  if (existing) return existing;

  const newStreak: UserDailyStreak = {
    userId,
    currentStreak: 0,
    lastClaimDate: '',
    lastClaimTimestamp: 0,
    totalDaysClaimed: 0,
    history: [],
  };
  return newStreak;
}

export function saveUserDailyStreak(streak: UserDailyStreak): void {
  const all = getAllUserStreaks();
  const index = all.findIndex((s) => s.userId === streak.userId);
  if (index !== -1) {
    all[index] = streak;
  } else {
    all.push(streak);
  }
  saveItems(USER_DAILY_STREAKS_KEY, all);
  notifyDataChanged();
}

/**
 * Calculates current streak status, cooldown, and next reward for a user
 */
export function getStreakStatus(userId: string) {
  const config = getDailyStreakConfig();
  const streak = getUserDailyStreak(userId);
  const now = Date.now();
  const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const RESET_LIMIT_MS = (config.resetAfterHours || 48) * 60 * 60 * 1000; // 48 hours

  if (!config.enabled) {
    return {
      enabled: false,
      canClaim: false,
      currentStreak: streak.currentStreak,
      nextDay: 1,
      nextRewardCoins: config.rewards[0] || 10,
      secondsRemaining: 0,
      lastClaimDate: streak.lastClaimDate,
      totalDaysClaimed: streak.totalDaysClaimed,
      message: 'Daily streak rewards are currently paused by administrator.',
    };
  }

  // If never claimed before
  if (!streak.lastClaimTimestamp || streak.lastClaimTimestamp === 0) {
    return {
      enabled: true,
      canClaim: true,
      currentStreak: 0,
      nextDay: 1,
      nextRewardCoins: config.rewards[0] || 10,
      secondsRemaining: 0,
      lastClaimDate: null,
      totalDaysClaimed: 0,
      message: 'Claim your Day 1 welcome streak bonus!',
    };
  }

  const elapsed = now - streak.lastClaimTimestamp;

  // If 24 hours have NOT elapsed yet -> cooldown active
  if (elapsed < COOLDOWN_MS) {
    const secondsRemaining = Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));
    const nextDay = streak.currentStreak >= 7 ? 1 : streak.currentStreak + 1;
    const nextRewardCoins = config.rewards[nextDay - 1] || 10;

    return {
      enabled: true,
      canClaim: false,
      currentStreak: streak.currentStreak,
      nextDay,
      nextRewardCoins,
      secondsRemaining,
      lastClaimDate: streak.lastClaimDate,
      totalDaysClaimed: streak.totalDaysClaimed,
      message: `Next reward available in ${formatSecondsToCountdown(secondsRemaining)}`,
    };
  }

  // If more than reset threshold has elapsed without claiming -> missed a full day, streak resets to Day 1
  if (elapsed >= RESET_LIMIT_MS) {
    return {
      enabled: true,
      canClaim: true,
      currentStreak: 0, // Reset to 0 so next is Day 1
      nextDay: 1,
      nextRewardCoins: config.rewards[0] || 10,
      secondsRemaining: 0,
      lastClaimDate: streak.lastClaimDate,
      totalDaysClaimed: streak.totalDaysClaimed,
      message: 'Streak expired after missed day. Start a fresh 7-day streak today!',
    };
  }

  // Within valid 24h - 48h claim window -> can claim next streak day!
  const nextDay = streak.currentStreak >= 7 ? 1 : streak.currentStreak + 1;
  const nextRewardCoins = config.rewards[nextDay - 1] || 10;

  return {
    enabled: true,
    canClaim: true,
    currentStreak: streak.currentStreak,
    nextDay,
    nextRewardCoins,
    secondsRemaining: 0,
    lastClaimDate: streak.lastClaimDate,
    totalDaysClaimed: streak.totalDaysClaimed,
    message: `Ready to claim Day ${nextDay} reward!`,
  };
}

export function formatSecondsToCountdown(totalSecs: number): string {
  if (totalSecs <= 0) return '00:00:00';
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Claims today's daily streak reward for the user
 */
export function claimDailyStreak(userId: string): {
  success: boolean;
  coinsAwarded?: number;
  day?: number;
  error?: string;
  nextClaimTimestamp?: number;
} {
  const targetUser = findUserById(userId);
  if (!targetUser) {
    return { success: false, error: 'User account not found.' };
  }

  const status = getStreakStatus(userId);
  if (!status.enabled) {
    return { success: false, error: 'Daily streak rewards are currently disabled.' };
  }

  if (!status.canClaim) {
    return {
      success: false,
      error: `Reward already claimed. Next daily reward unlocks in ${formatSecondsToCountdown(status.secondsRemaining)}.`,
    };
  }

  const config = getDailyStreakConfig();
  const dayToClaim = status.nextDay;
  const rewardCoins = config.rewards[dayToClaim - 1] || 10;
  const now = Date.now();

  // 1. Credit coins to real user balance
  targetUser.coins = (targetUser.coins || 0) + rewardCoins;
  targetUser.coinBalance = targetUser.coins;
  updateUser(targetUser);

  // 2. Record official CoinTransaction
  const isSpecialBonus = dayToClaim === 7;
  const txId = `tx_streak_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const transaction: CoinTransaction = {
    id: txId,
    transactionId: txId,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount: rewardCoins,
    type: 'credit',
    reason: isSpecialBonus ? '🔥 Day 7 Mega Streak Bonus!' : `🔥 Day ${dayToClaim} Daily Streak Reward`,
    description: `Claimed daily reward on Day ${dayToClaim} of 7-Day Protocol`,
    source: 'daily_streak',
    status: 'completed',
    date: new Date().toISOString(),
  };
  const allTransactions = getAllTransactions();
  allTransactions.unshift(transaction);
  saveItems(TRANSACTIONS_STORAGE_KEY, allTransactions);
  insertSupabaseTransaction(transaction);

  // 3. Send in-app notification
  createNotification({
    userId: targetUser.id,
    type: 'coin_credit',
    title: isSpecialBonus ? '🏆 Day 7 Special Bonus Claimed!' : `🔥 Day ${dayToClaim} Streak Claimed!`,
    message: `+${rewardCoins} coins added to your balance! Keep up your daily streak to earn maximum rewards.`,
  });

  // 4. Update user's streak document
  const currentStreakRecord = getUserDailyStreak(userId);
  const updatedStreak: UserDailyStreak = {
    userId: targetUser.id,
    currentStreak: dayToClaim,
    lastClaimDate: new Date().toISOString().split('T')[0],
    lastClaimTimestamp: now,
    totalDaysClaimed: (currentStreakRecord.totalDaysClaimed || 0) + 1,
    history: [
      {
        day: dayToClaim,
        coins: rewardCoins,
        claimedAt: new Date().toISOString(),
      },
      ...(currentStreakRecord.history || []).slice(0, 20),
    ],
  };
  saveUserDailyStreak(updatedStreak);

  return {
    success: true,
    coinsAwarded: rewardCoins,
    day: dayToClaim,
    nextClaimTimestamp: now + 24 * 60 * 60 * 1000,
  };
}

// --- Redeem Codes Storage & Engine ---

export function getAllRedeemCodes(): RedeemCode[] {
  const codes = getItems<RedeemCode>(REDEEM_CODES_KEY);
  if (codes.length === 0) {
    saveItems(REDEEM_CODES_KEY, DEFAULT_REDEEM_CODES);
    return DEFAULT_REDEEM_CODES;
  }
  return codes;
}

export function saveRedeemCode(codeData: Partial<RedeemCode> & { code: string; rewardCoins: number }): {
  success: boolean;
  code?: RedeemCode;
  error?: string;
} {
  const cleanCode = codeData.code.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, error: 'Code cannot be empty.' };
  }
  if (codeData.rewardCoins <= 0) {
    return { success: false, error: 'Reward coins must be greater than 0.' };
  }

  const all = getAllRedeemCodes();
  const existingIndex = all.findIndex(
    (c) => (codeData.id && c.id === codeData.id) || c.code.toUpperCase() === cleanCode
  );

  let updatedCode: RedeemCode;

  if (existingIndex !== -1 && (!codeData.id || all[existingIndex].id === codeData.id)) {
    updatedCode = {
      ...all[existingIndex],
      code: cleanCode,
      rewardCoins: Number(codeData.rewardCoins),
      coins: Number(codeData.rewardCoins),
      maxUses: Number(codeData.maxUses ?? all[existingIndex].maxUses ?? 0),
      expiresAt: codeData.expiresAt !== undefined ? codeData.expiresAt : all[existingIndex].expiresAt,
      status: codeData.status || (codeData.isActive === false ? 'disabled' : 'active'),
      isActive: codeData.status ? codeData.status === 'active' : codeData.isActive !== false,
      description: codeData.description ?? all[existingIndex].description,
    };
    all[existingIndex] = updatedCode;
  } else if (existingIndex !== -1 && codeData.id && all[existingIndex].id !== codeData.id) {
    return { success: false, error: `A code with the name "${cleanCode}" already exists.` };
  } else {
    updatedCode = {
      id: codeData.id || 'code_' + Math.random().toString(36).substring(2, 9),
      code: cleanCode,
      rewardCoins: Number(codeData.rewardCoins),
      coins: Number(codeData.rewardCoins),
      maxUses: Number(codeData.maxUses ?? 0),
      usedCount: 0,
      currentUses: 0,
      expiresAt: codeData.expiresAt || null,
      status: codeData.status || 'active',
      isActive: codeData.status ? codeData.status === 'active' : true,
      createdAt: new Date().toISOString(),
      createdByAdminName: codeData.createdByAdminName || 'ASJADFX Admin',
      description: codeData.description || 'Promotional Reward Code',
    };
    all.unshift(updatedCode);
  }

  saveItems(REDEEM_CODES_KEY, all);
  notifyDataChanged();
  return { success: true, code: updatedCode };
}

export function toggleRedeemCodeStatus(codeId: string): { success: boolean; error?: string } {
  const all = getAllRedeemCodes();
  const code = all.find((c) => c.id === codeId);
  if (!code) return { success: false, error: 'Code not found.' };

  code.status = code.status === 'active' ? 'disabled' : 'active';
  code.isActive = code.status === 'active';
  saveItems(REDEEM_CODES_KEY, all);
  notifyDataChanged();
  return { success: true };
}

export function deleteRedeemCode(codeId: string): { success: boolean; error?: string } {
  const all = getAllRedeemCodes();
  const remaining = all.filter((c) => c.id !== codeId);
  saveItems(REDEEM_CODES_KEY, remaining);
  notifyDataChanged();
  return { success: true };
}

export function getAllRedeemLogs(): CodeRedemptionLog[] {
  return getItems<CodeRedemptionLog>(REDEEM_LOGS_KEY);
}

export function getUserRedeemLogs(userId: string): CodeRedemptionLog[] {
  const all = getAllRedeemLogs();
  return all.filter((l) => l.userId === userId);
}

/**
 * Validates and applies a coupon/redeem code for a specific user
 */
export function redeemCodeForUser(
  userId: string,
  rawCode: string
): { success: boolean; coinsAwarded?: number; code?: string; error?: string } {
  const targetUser = findUserById(userId);
  if (!targetUser) {
    return { success: false, error: 'User account not found.' };
  }

  const cleanInput = rawCode.trim().toUpperCase();
  if (!cleanInput) {
    return { success: false, error: 'Please enter a reward code.' };
  }

  const allCodes = getAllRedeemCodes();
  const matchedCode = allCodes.find((c) => c.code.toUpperCase() === cleanInput);

  if (!matchedCode) {
    return { success: false, error: `Invalid code "${cleanInput}". Please check spelling and try again.` };
  }

  // 1. Check if active
  if (matchedCode.status !== 'active' && matchedCode.isActive === false) {
    return { success: false, error: 'This reward code is currently inactive or disabled.' };
  }

  // 2. Check expiry date
  if (matchedCode.expiresAt) {
    const expiryTimestamp = new Date(matchedCode.expiresAt).getTime();
    if (!isNaN(expiryTimestamp) && expiryTimestamp < Date.now()) {
      return { success: false, error: 'This reward code has expired.' };
    }
  }

  // 3. Check maximum uses limit
  if (matchedCode.maxUses > 0 && (matchedCode.usedCount || 0) >= matchedCode.maxUses) {
    return { success: false, error: 'This reward code has reached its maximum redemption limit.' };
  }

  // 4. Check if user already redeemed this code
  const allLogs = getAllRedeemLogs();
  const alreadyRedeemed = allLogs.some(
    (log) => log.userId === userId && log.code.toUpperCase() === cleanInput
  );
  if (alreadyRedeemed) {
    return {
      success: false,
      error: `You have already redeemed code "${cleanInput}". Reward codes can only be used once per account.`,
    };
  }

  const rewardCoins = Number(matchedCode.rewardCoins || matchedCode.coins || 0);

  // 5. Credit coins to user account
  targetUser.coins = (targetUser.coins || 0) + rewardCoins;
  targetUser.coinBalance = targetUser.coins;
  updateUser(targetUser);

  // 6. Update code usage count
  matchedCode.usedCount = (matchedCode.usedCount || 0) + 1;
  matchedCode.currentUses = matchedCode.usedCount;
  saveItems(REDEEM_CODES_KEY, allCodes);

  // 7. Record redemption log
  const newLog: CodeRedemptionLog = {
    id: 'red_' + Math.random().toString(36).substring(2, 9),
    codeId: matchedCode.id,
    code: matchedCode.code,
    userId: targetUser.id,
    username: targetUser.username,
    fullName: targetUser.fullName,
    rewardCoins,
    redeemedAt: new Date().toISOString(),
  };
  const updatedLogs = [newLog, ...allLogs];
  saveItems(REDEEM_LOGS_KEY, updatedLogs);

  // 8. Record CoinTransaction
  const txId = `tx_code_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transaction: CoinTransaction = {
    id: txId,
    transactionId: txId,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount: rewardCoins,
    type: 'credit',
    reason: `🎁 Redeemed Promo Code: ${matchedCode.code}`,
    description: `Bonus for redeeming promotional voucher ${matchedCode.code}`,
    source: 'coupon_redeem',
    status: 'completed',
    date: new Date().toISOString(),
  };
  const allTransactions = getAllTransactions();
  allTransactions.unshift(transaction);
  saveItems(TRANSACTIONS_STORAGE_KEY, allTransactions);
  insertSupabaseTransaction(transaction);

  // 9. Send Notification
  createNotification({
    userId: targetUser.id,
    type: 'coin_credit',
    title: '🎁 Reward Code Redeemed!',
    message: `Voucher "${matchedCode.code}" applied! +${rewardCoins} coins added directly to your balance.`,
  });

  notifyDataChanged();

  return {
    success: true,
    coinsAwarded: rewardCoins,
    code: matchedCode.code,
  };
}

// ============================================================================
// 👑 PREMIUM MEMBERSHIP SYSTEM & MANUAL QR PAYMENT WORKFLOW
// ============================================================================

/**
 * Returns the current platform-wide Premium plan settings (price, QR, upi, duration)
 */
export function getPremiumSettings(): PremiumSettings {
  const saved = localStorage.getItem(PREMIUM_SETTINGS_KEY);
  if (!saved) {
    saveItem(PREMIUM_SETTINGS_KEY, DEFAULT_PREMIUM_SETTINGS);
    return { ...DEFAULT_PREMIUM_SETTINGS };
  }
  try {
    return { ...DEFAULT_PREMIUM_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return { ...DEFAULT_PREMIUM_SETTINGS };
  }
}

/**
 * Updates platform-wide Premium plan settings by Admin
 */
export function updatePremiumSettings(newSettings: Partial<PremiumSettings>): PremiumSettings {
  const current = getPremiumSettings();
  const updated: PremiumSettings = {
    ...current,
    ...newSettings,
  };
  localStorage.setItem(PREMIUM_SETTINGS_KEY, JSON.stringify(updated));
  notifyDataChanged();
  return updated;
}

/**
 * Returns all premium payment requests (all statuses)
 */
export function getAllPremiumRequests(): PremiumPaymentRequest[] {
  return getItems<PremiumPaymentRequest>(PREMIUM_REQUESTS_KEY);
}

/**
 * Returns payment requests for a specific user
 */
export function getUserPremiumRequests(userId: string): PremiumPaymentRequest[] {
  const all = getAllPremiumRequests();
  return all.filter((r) => r.userId === userId || r.user_id === userId);
}

/**
 * User submits a manual QR payment request with their transaction/UTR ID and screenshot
 */
export function createPremiumPaymentRequest(
  user: User,
  data: {
    transaction_id: string;
    payment_screenshot_url?: string;
    amount?: number;
  }
): { success: boolean; request?: PremiumPaymentRequest; error?: string } {
  const cleanTxId = (data.transaction_id || '').trim();
  if (!cleanTxId) {
    return { success: false, error: 'Transaction ID / UTR Number is required.' };
  }
  if (cleanTxId.length < 6) {
    return { success: false, error: 'Please enter a valid Transaction / UTR ID (min 6 characters).' };
  }

  // Check if user already has an active pending payment request
  const userRequests = getUserPremiumRequests(user.id);
  const hasPending = userRequests.some((r) => r.payment_status === 'pending');
  if (hasPending) {
    return {
      success: false,
      error: 'You already have a payment request under verification. Please wait for Admin approval.',
    };
  }

  // Check if this transaction ID was already used
  const allRequests = getAllPremiumRequests();
  const txDuplicate = allRequests.some(
    (r) => r.transaction_id.toLowerCase() === cleanTxId.toLowerCase() && r.payment_status !== 'rejected'
  );
  if (txDuplicate) {
    return {
      success: false,
      error: 'This Transaction ID has already been submitted or processed. Please verify your payment receipt.',
    };
  }

  const settings = getPremiumSettings();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newRequest: PremiumPaymentRequest = {
    id: requestId,
    request_id: requestId,
    userId: user.id,
    user_id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    plan_name: settings.planName || 'ASJADFX PREMIUM',
    amount: data.amount ?? settings.price ?? 49,
    currency: 'INR',
    payment_method: 'Manual QR / UPI Transfer',
    transaction_id: cleanTxId,
    payment_screenshot_url: data.payment_screenshot_url || '',
    payment_status: 'pending',
    request_created_at: new Date().toISOString(),
  };

  allRequests.unshift(newRequest);
  saveItems(PREMIUM_REQUESTS_KEY, allRequests);

  // Send in-app notification to user confirming submission
  createNotification({
    userId: user.id,
    type: 'admin_broadcast',
    title: '👑 Payment Request Received',
    message: `Your payment request of ₹${newRequest.amount} (Ref: ${cleanTxId}) is under review. Our team will verify and activate your Premium shortly.`,
    actionUrl: '/premium',
  });

  notifyDataChanged();
  return { success: true, request: newRequest };
}

/**
 * Admin approves a manual payment request and activates the user's Premium membership
 */
export function approvePremiumPaymentRequest(
  requestId: string,
  adminUser: User,
  customDays?: number
): { success: boolean; error?: string } {
  const allRequests = getAllPremiumRequests();
  const reqIndex = allRequests.findIndex((r) => r.id === requestId || r.request_id === requestId);
  if (reqIndex === -1) {
    return { success: false, error: 'Payment request not found.' };
  }

  const req = allRequests[reqIndex];
  if (req.payment_status === 'approved') {
    return { success: false, error: 'This payment request has already been approved.' };
  }

  const targetUser = findUserById(req.userId || req.user_id || '');
  if (!targetUser) {
    return { success: false, error: 'Target user account not found.' };
  }

  const settings = getPremiumSettings();
  const durationDays = customDays || settings.durationDays || 120; // 4 months default

  const now = new Date();
  // If user is already active premium, extend from their current expiry date
  let startDate = now;
  let currentExpiry = targetUser.premium_expires_at ? new Date(targetUser.premium_expires_at) : null;
  if (targetUser.membership_type === 'premium' && targetUser.premium_status === 'active' && currentExpiry && currentExpiry > now) {
    startDate = currentExpiry;
  }

  const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // 1. Update request status
  req.payment_status = 'approved';
  req.reviewed_at = new Date().toISOString();
  req.reviewed_by = adminUser.fullName || adminUser.username;
  req.premium_started_at = now.toISOString();
  req.premium_expires_at = expiryDate.toISOString();
  allRequests[reqIndex] = req;
  saveItems(PREMIUM_REQUESTS_KEY, allRequests);

  // 2. Activate user Premium status
  targetUser.membership_type = 'premium';
  targetUser.premium_status = 'active';
  targetUser.premium_started_at = targetUser.premium_started_at || now.toISOString();
  targetUser.premium_expires_at = expiryDate.toISOString();
  updateUser(targetUser);

  // 3. Dispatch celebration notification to user
  createNotification({
    userId: targetUser.id,
    type: 'admin_broadcast',
    title: '👑 Welcome to ASJADFX Premium!',
    message: `Payment verified! Your ${req.plan_name} is now ACTIVE until ${expiryDate.toLocaleDateString()}. Enjoy +25% extra coins on tasks and VIP perks!`,
    actionUrl: '/premium',
  });

  notifyDataChanged();
  return { success: true };
}

/**
 * Admin rejects a manual payment request with a required reason
 */
export function rejectPremiumPaymentRequest(
  requestId: string,
  rejectionReason: string,
  adminUser: User
): { success: boolean; error?: string } {
  const reason = (rejectionReason || '').trim();
  if (!reason) {
    return { success: false, error: 'Rejection reason is required.' };
  }

  const allRequests = getAllPremiumRequests();
  const reqIndex = allRequests.findIndex((r) => r.id === requestId || r.request_id === requestId);
  if (reqIndex === -1) {
    return { success: false, error: 'Payment request not found.' };
  }

  const req = allRequests[reqIndex];
  if (req.payment_status === 'approved') {
    return { success: false, error: 'Cannot reject an already approved request.' };
  }

  req.payment_status = 'rejected';
  req.rejection_reason = reason;
  req.reviewed_at = new Date().toISOString();
  req.reviewed_by = adminUser.fullName || adminUser.username;
  allRequests[reqIndex] = req;
  saveItems(PREMIUM_REQUESTS_KEY, allRequests);

  // Notify user with reason
  createNotification({
    userId: req.userId || req.user_id || '',
    type: 'admin_broadcast',
    title: '❌ Premium Payment Verification Update',
    message: `Your payment request for ₹${req.amount} could not be verified. Reason: "${reason}". You may re-submit with correct details.`,
    actionUrl: '/premium',
  });

  notifyDataChanged();
  return { success: true };
}

/**
 * Admin manually sets user Premium status (without payment request)
 */
export function manuallySetUserPremium(
  userId: string,
  isPremium: boolean,
  durationDays: number,
  adminUser: User
): { success: boolean; user?: User; error?: string } {
  const targetUser = findUserById(userId);
  if (!targetUser) {
    return { success: false, error: 'User not found.' };
  }

  const now = new Date();
  if (isPremium) {
    const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    targetUser.membership_type = 'premium';
    targetUser.premium_status = 'active';
    targetUser.premium_started_at = now.toISOString();
    targetUser.premium_expires_at = expiryDate.toISOString();

    createNotification({
      userId: targetUser.id,
      type: 'admin_broadcast',
      title: '👑 ASJADFX Premium Activated!',
      message: `Admin has activated your Premium membership for ${durationDays} days (Expires: ${expiryDate.toLocaleDateString()}).`,
      actionUrl: '/premium',
    });
  } else {
    targetUser.membership_type = 'free';
    targetUser.premium_status = 'inactive';
    targetUser.premium_expires_at = undefined;

    createNotification({
      userId: targetUser.id,
      type: 'admin_broadcast',
      title: 'ℹ️ Membership Update',
      message: 'Your Premium membership status has been updated by Admin.',
      actionUrl: '/premium',
    });
  }

  updateUser(targetUser);
  notifyDataChanged();
  return { success: true, user: targetUser };
}

/**
 * Admin extends existing Premium subscription by X days
 */
export function extendUserPremium(
  userId: string,
  additionalDays: number,
  adminUser: User
): { success: boolean; user?: User; error?: string } {
  const targetUser = findUserById(userId);
  if (!targetUser) {
    return { success: false, error: 'User not found.' };
  }

  const now = new Date();
  const currentExpiry = targetUser.premium_expires_at ? new Date(targetUser.premium_expires_at) : now;
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

  targetUser.membership_type = 'premium';
  targetUser.premium_status = 'active';
  targetUser.premium_started_at = targetUser.premium_started_at || now.toISOString();
  targetUser.premium_expires_at = newExpiry.toISOString();
  updateUser(targetUser);

  createNotification({
    userId: targetUser.id,
    type: 'admin_broadcast',
    title: '👑 Premium Membership Extended!',
    message: `Admin added +${additionalDays} days to your Premium subscription. New expiry date: ${newExpiry.toLocaleDateString()}.`,
    actionUrl: '/premium',
  });

  notifyDataChanged();
  return { success: true, user: targetUser };
}
