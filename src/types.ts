export type UserRole = 'user' | 'admin';

export type UserAccountStatus = 'active' | 'restricted' | 'banned';

export interface UserWarning {
  id: string;
  userId: string;
  adminId?: string;
  adminName?: string;
  issuedBy?: string;
  level: 1 | 2 | 3; // 1: Warning, 2: Temporary Restriction, 3: Permanent Ban
  reason: string;
  date?: string;
  createdAt: string;
  restrictionDurationDays?: number;
  restrictionExpiresAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  instagramUsername: string;
  passwordHash?: string;
  salt?: string;
  coins: number;
  coinBalance?: number; // Alias for coins
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  status: UserAccountStatus;
  isRestricted?: boolean;
  isBanned?: boolean;
  restrictionExpiresAt?: string;
  warnings?: UserWarning[];
  warningCount?: number;
  tasksCompleted?: number;
  walletBalance?: number; // Real wallet balance in INR (₹)
  wallet_balance?: number; // DB alias
  membership_type?: 'free' | 'premium';
  premium_status?: 'inactive' | 'active' | 'expired';
  vip_tier?: 'vip_basic' | 'vip_lifetime' | 'none';
  premium_started_at?: string;
  premium_expires_at?: string;
  customDpUrl?: string;
  showInVipShowcase?: boolean; // Privacy control: Default false
  vipAvatarChoice?: string; // 1 of 10 fixed premium avatars for VIP Basic
}

export interface SessionData {
  token: string;
  userId: string;
  expiresAt: number;
  rememberMe: boolean;
}

export type PlatformKey = 'instagram' | 'youtube' | 'facebook' | 'telegram' | 'tiktok' | 'x';

export interface PlatformConfig {
  id: string;
  key: PlatformKey;
  name: string;
  icon: string;
  officialUrl: string;
  defaultInstructions: string;
  status: 'active' | 'disabled';
}

export type TaskActionRequirement = 'like' | 'follow' | 'comment' | 'subscribe' | 'join' | 'share';

export type TaskStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Task {
  id: string;
  title: string;
  platform: PlatformKey;
  contentUrl: string;
  description: string;
  instructions: string;
  reward: number;
  proofRequired: boolean;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  requiredActions: TaskActionRequirement[];
  commentRequirement?: string;
  createdAt: string;
  updatedAt?: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskTitle: string;
  platform: PlatformKey;
  taskUrl: string;
  userId: string;
  fullName: string;
  username: string;
  instagramUsername: string;
  proofImageUrl?: string;
  commentProof?: string;
  status: SubmissionStatus;
  rewardCoins: number;
  rewardAwarded?: boolean;
  submittedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  rejectionReason?: string;
}

export interface CoinTransaction {
  id: string;
  transactionId?: string; // alias/explicit identifier
  userId: string;
  userFullName?: string;
  username?: string;
  amount: number; // positive for credit, negative for debit
  type: 'credit' | 'debit' | 'task_reward' | string;
  reason: string;
  description?: string;
  source?: 'task' | 'admin' | 'giveaway' | 'bonus' | 'penalty' | string;
  taskId?: string;
  taskTitle?: string;
  submissionId?: string;
  adminId?: string;
  adminName?: string;
  date: string;
  status: 'completed' | 'approved' | 'pending' | 'rejected' | string;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  firstPlacePrize?: string;
  secondPlacePrize?: string;
  thirdPlacePrize?: string;
  firstPrize?: string;
  secondPrize?: string;
  thirdPrize?: string;
  startDate: string;
  endDate: string;
  minCoinsRequired: number;
  eligibilityRules: string;
  status: 'draft' | 'active' | 'ended' | 'upcoming' | 'completed';
  createdAt: string;
  winnerUsername?: string;
  winnerAnnouncedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience?: 'all' | 'specific';
  targetAudience?: 'all' | 'specific';
  targetUserId?: string;
  targetUsername?: string;
  createdAt: string;
  createdByAdminName?: string;
}

export type NotificationType =
  | 'task_approved'
  | 'task_rejected'
  | 'warning'
  | 'account_restricted'
  | 'account_banned'
  | 'announcement'
  | 'admin_broadcast'
  | 'giveaway_winner'
  | 'coin_credit'
  | 'coin_debit';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  id?: string; // alias
  fullName: string;
  username: string;
  instagramUsername: string;
  coins: number;
  coinBalance?: number; // alias
  tasksCompleted?: number; // alias
  approvedTasksCount: number;
  joinDate: string;
  membership_type?: 'free' | 'premium';
  premium_status?: 'active' | 'inactive' | 'expired';
}

export type LeaderboardUser = LeaderboardEntry;

export interface PlatformRules {
  generalRules: string;
  videoRules: string;
  commentRules: string;
  screenshotRules: string;
  taskRules: string;
  giveawayRules: string;
  warningRules: string;
  general?: string[];
  video?: string[];
  comments?: string[];
  screenshots?: string[];
  tasks?: string[];
  giveaway?: string[];
  warnings?: string[];
  updatedAt?: string;
}

export type PlatformRulesConfig = PlatformRules;

export interface AdminSystemSettings {
  websiteName?: string;
  websiteTagline?: string;
  siteName?: string;
  siteTagline?: string;
  maintenanceMode: boolean;
  allowNewSignups?: boolean;
  signupEnabled?: boolean;
}

export interface DailyStreakConfig {
  enabled: boolean;
  rewards: [number, number, number, number, number, number, number]; // 7 days (e.g. 10, 15, 20, 25, 30, 40, 100)
  specialBonusLabel?: string;
  resetAfterHours?: number; // default 48h to reset
}

export interface UserDailyStreak {
  userId: string;
  currentStreak: number; // 0 to 7
  lastClaimDate: string; // ISO date
  lastClaimTimestamp: number;
  totalDaysClaimed: number;
  history?: {
    day: number;
    coins: number;
    claimedAt: string;
  }[];
}

export interface RedeemCode {
  id: string;
  code: string;
  rewardCoins: number;
  coins?: number; // Alias for rewardCoins
  maxUses: number; // 0 = unlimited
  usedCount: number;
  currentUses?: number; // Alias for usedCount
  expiresAt?: string | null; // ISO string
  status: 'active' | 'disabled';
  isActive?: boolean;
  createdAt: string;
  createdByAdminName?: string;
  description?: string;
}

export interface CodeRedemptionLog {
  id: string;
  codeId?: string;
  code: string;
  userId: string;
  username: string;
  fullName?: string;
  rewardCoins: number;
  redeemedAt: string;
}

export interface PremiumPaymentRequest {
  id: string;
  request_id?: string;
  userId: string;
  user_id?: string;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  plan_name: string;
  plan_tier?: 'vip_basic' | 'vip_lifetime';
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  payment_screenshot_url?: string;
  payment_status: 'pending' | 'approved' | 'rejected';
  request_created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  premium_started_at?: string;
  premium_expires_at?: string;
}

export interface VIPPlanTierConfig {
  id: 'vip_basic' | 'vip_lifetime';
  name: string;
  price: number;
  durationLabel: string;
  durationDays: number; // 60 for basic, -1 for lifetime
  badge: string;
  tagline: string;
  spinPoolType: 'basic' | 'pro';
  benefits: string[];
  popular?: boolean;
}

export interface PremiumSettings {
  planName: string;
  price: number;
  durationDays: number;
  receiverName: string;
  upiId: string;
  qrCodeUrl?: string;
  instructions: string;
  enabled: boolean;
  extraCoinsPercentage: number;
  benefits?: string[];
  plans?: VIPPlanTierConfig[];
}

export interface DailySpinRecord {
  userId: string;
  lastSpinTimestamp: number;
  lastSpinDate: string;
  totalSpins: number;
  lastRewardCoins: number;
  spinTier: 'vip_basic' | 'vip_lifetime' | 'basic' | 'free';
  spinsUsedToday?: number;
  dayKey?: string; // e.g. YYYY-MM-DD
  history?: {
    coins: number;
    timestamp: number;
    date: string;
    spinTier: string;
  }[];
}

export interface DailySpinStatus {
  canSpin: boolean;
  timeRemainingMs: number;
  nextSpinTimestamp: number;
  formattedCountdown: string;
  userTier: 'vip_basic' | 'vip_lifetime' | 'free';
  rewardPool: number[];
  lastReward: number | null;
  totalSpins: number;
  spinsRemainingToday: number;
  totalSpinsAllowed: number;
  dailyResetTimestamp: number;
}

export type WalletTransactionType =
  | 'deposit'
  | 'admin_credit'
  | 'admin_debit'
  | 'withdrawal_request'
  | 'transfer_sent'
  | 'transfer_received'
  | 'donation';

export type WalletTransactionStatus = 'pending' | 'successful' | 'rejected';

export interface WalletTransaction {
  id: string; // e.g. wtx_...
  userId: string;
  userFullName?: string;
  username?: string;
  userEmail?: string;
  amount: number; // in INR (₹)
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  referenceId: string; // UTR or Transaction ID
  paymentMethod: string; // 'UPI / QR Transfer', 'Wallet Transfer', etc.
  screenshotUrl?: string; // payment screenshot
  date: string; // ISO date
  notes?: string;
  adminNotes?: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  balanceAfter?: number;
  recipientUserId?: string;
  recipientUsername?: string;
  recipientFullName?: string;
  senderUserId?: string;
  senderUsername?: string;
  senderFullName?: string;
}

export interface VipChatMessage {
  id: string;
  userId: string;
  username: string;
  userFullName: string;
  avatarUrl?: string;
  vipTier: 'vip_lifetime' | 'vip_basic';
  message: string;
  timestamp: string;
  isDeleted?: boolean;
  reportedBy?: string[];
  reportsCount?: number;
}

export interface WalletConfig {
  minDepositAmount: number; // default 10
  upiId: string;
  receiverName: string;
  qrCodeUrl?: string;
  instructions: string;
  enabled: boolean;
}

export type DonationStatus = 'pending' | 'approved' | 'rejected';

export interface Donation {
  id: string; // e.g. don_...
  userId: string;
  userFullName?: string;
  username?: string;
  userEmail?: string;
  amount: number; // in INR (₹)
  status: DonationStatus;
  referenceId: string; // UTR or Transaction ID
  paymentMethod: string; // 'UPI', 'Wallet Balance'
  screenshotUrl?: string; // payment screenshot
  isAnonymous: boolean; // if true, masked on public leaderboard
  message?: string; // donor's supportive note
  date: string; // ISO date
  causeTitle?: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  thankYouShownToUser?: boolean; // tracks if popup was shown
}

export interface DonationConfig {
  upiId: string;
  receiverName: string;
  qrCodeUrl?: string;
  beneficiaryName: string;
  causeTitle: string;
  causeDescription: string;
  goalAmount?: number;
  instructions: string;
  enabled: boolean;
}

export type AppRoute =
  // Public & User Routes
  | '/'
  | '/dashboard'
  | '/login'
  | '/signup'
  | '/forgot-password'
  | '/home'
  | '/rules'
  | '/tasks'
  | '/leaderboard'
  | '/giveaway'
  | '/premium'
  | '/profile'
  | '/coins'
  | '/rewards'
  | '/wallet'
  | '/donation'
  | '/vip-chat'
  | '/vip-members'
  // Admin Routes
  | '/admin'
  | '/admin/login'
  | '/admin/dashboard'
  | '/admin/premium'
  | '/admin/tasks'
  | '/admin/platforms'
  | '/admin/submissions'
  | '/admin/users'
  | '/admin/coins'
  | '/admin/leaderboard'
  | '/admin/giveaways'
  | '/admin/announcements'
  | '/admin/rules'
  | '/admin/warnings'
  | '/admin/settings'
  | '/admin/rewards'
  | '/admin/wallet'
  | '/admin/donations';
