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

export type AppRoute =
  // User Routes
  | '/login'
  | '/signup'
  | '/forgot-password'
  | '/home'
  | '/rules'
  | '/tasks'
  | '/leaderboard'
  | '/giveaway'
  | '/profile'
  | '/coins'
  // Admin Routes
  | '/admin'
  | '/admin/login'
  | '/admin/dashboard'
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
  | '/admin/settings';
