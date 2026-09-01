import {
  User,
  DailyStreakConfig,
  UserDailyStreak,
  RedeemCode,
  CodeRedemptionLog,
  CoinTransaction,
} from '../types';
import {
  findUserById,
  updateUser,
  getAllTransactions,
  createNotification,
  notifyDataChanged,
} from './storage';
import { insertSupabaseTransaction } from './supabase';
import { triggerCoinReward } from '../components/CoinRewardAnimation';

const STREAK_CONFIG_KEY = 'asjadfx_daily_streak_config_v1';
const USER_STREAKS_KEY = 'asjadfx_user_streaks_db_v1';
const REDEEM_CODES_KEY = 'asjadfx_redeem_codes_db_v1';
const REDEMPTION_LOGS_KEY = 'asjadfx_redemption_logs_db_v1';

// Default 7-day streak rewards requested by user
export const DEFAULT_STREAK_CONFIG: DailyStreakConfig = {
  enabled: true,
  rewards: [10, 15, 20, 25, 30, 40, 100], // Day 1 to 6 coins, Day 7: 100 Special Bonus
  specialBonusLabel: '100 Coins Jackpot + Elite Badge Bonus',
  resetAfterHours: 48,
};

// No hardcoded starter promo codes - only Admin-created codes exist
const INITIAL_REDEEM_CODES: RedeemCode[] = [];

// Helper to safely read from localStorage
function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

// Helper to write to localStorage
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error saving ${key} to storage:`, err);
  }
}

// -------------------------------------------------------------
// DAILY STREAK SERVICES
// -------------------------------------------------------------

export function getDailyStreakConfig(): DailyStreakConfig {
  const config = getFromStorage<DailyStreakConfig>(STREAK_CONFIG_KEY, DEFAULT_STREAK_CONFIG);
  if (!config.rewards || config.rewards.length !== 7) {
    return DEFAULT_STREAK_CONFIG;
  }
  return config;
}

export function saveDailyStreakConfig(config: DailyStreakConfig): void {
  saveToStorage(STREAK_CONFIG_KEY, config);
  notifyDataChanged();
}

export function getAllUserStreaks(): Record<string, UserDailyStreak> {
  return getFromStorage<Record<string, UserDailyStreak>>(USER_STREAKS_KEY, {});
}

export interface UserStreakStatus {
  currentStreak: number; // 0 to 7
  nextDayToClaim: number; // 1 to 7
  todayRewardCoins: number;
  canClaimToday: boolean;
  isStreakActive: boolean;
  timeRemainingMs: number;
  nextClaimAtTimestamp: number;
  totalDaysClaimed: number;
  formattedCountdown: string;
  config: DailyStreakConfig;
}

/**
 * Calculates accurate streak status for a given user.
 * Only allows 1 claim per 24 hours (or calendar day).
 * Resets streak to Day 1 if missed for more than 48 hours.
 */
export function getUserStreakStatus(userId: string): UserStreakStatus {
  const config = getDailyStreakConfig();
  const streaks = getAllUserStreaks();
  const userStreak = streaks[userId];

  const now = Date.now();
  const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown
  const RESET_THRESHOLD_MS = (config.resetAfterHours || 48) * 60 * 60 * 1000; // 48 hours to reset

  if (!userStreak || !userStreak.lastClaimTimestamp) {
    // User has never claimed a streak yet
    return {
      currentStreak: 0,
      nextDayToClaim: 1,
      todayRewardCoins: config.rewards[0],
      canClaimToday: config.enabled,
      isStreakActive: false,
      timeRemainingMs: 0,
      nextClaimAtTimestamp: now,
      totalDaysClaimed: 0,
      formattedCountdown: 'Ready to Claim!',
      config,
    };
  }

  const timeSinceLastClaim = now - userStreak.lastClaimTimestamp;

  // Check if streak was broken (missed > 48h)
  let effectiveStreak = userStreak.currentStreak;
  if (timeSinceLastClaim > RESET_THRESHOLD_MS) {
    effectiveStreak = 0; // Reset streak
  }

  // Next day index: if effectiveStreak is 7, cycle restarts at Day 1
  let nextDay = (effectiveStreak % 7) + 1;
  const rewardForNextClaim = config.rewards[nextDay - 1] ?? 10;

  // Check if within 24h cooldown
  const canClaim = config.enabled && timeSinceLastClaim >= CLAIM_COOLDOWN_MS;
  const timeRemainingMs = canClaim ? 0 : Math.max(0, CLAIM_COOLDOWN_MS - timeSinceLastClaim);
  const nextClaimAtTimestamp = userStreak.lastClaimTimestamp + CLAIM_COOLDOWN_MS;

  // Format countdown hh:mm:ss
  const totalSeconds = Math.floor(timeRemainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedCountdown = canClaim
    ? 'Ready to Claim!'
    : `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds
        .toString()
        .padStart(2, '0')}s`;

  return {
    currentStreak: effectiveStreak,
    nextDayToClaim: nextDay,
    todayRewardCoins: rewardForNextClaim,
    canClaimToday: canClaim,
    isStreakActive: effectiveStreak > 0 && timeSinceLastClaim <= RESET_THRESHOLD_MS,
    timeRemainingMs,
    nextClaimAtTimestamp,
    totalDaysClaimed: userStreak.totalDaysClaimed || effectiveStreak,
    formattedCountdown,
    config,
  };
}

/**
 * Claims today's daily streak reward safely.
 * Adds coins directly to user balance, inserts transaction, and triggers coin animation.
 */
export function claimDailyStreakReward(user: User): {
  success: boolean;
  coinsAwarded?: number;
  newStreak?: number;
  dayClaimed?: number;
  error?: string;
} {
  if (user.status === 'banned' || user.isBanned) {
    return { success: false, error: 'Your account is banned and cannot claim rewards.' };
  }
  if (user.status === 'restricted' || user.isRestricted) {
    return { success: false, error: 'Your account is currently restricted from claiming rewards.' };
  }

  const config = getDailyStreakConfig();
  if (!config.enabled) {
    return { success: false, error: 'Daily streak rewards are currently paused by administration.' };
  }

  const status = getUserStreakStatus(user.id);
  if (!status.canClaimToday) {
    return {
      success: false,
      error: `You have already claimed today's reward. Next reward unlocks in ${status.formattedCountdown}.`,
    };
  }

  const dayToClaim = status.nextDayToClaim; // 1 to 7
  const coinsAwarded = status.todayRewardCoins;
  const newStreakCount = (status.currentStreak % 7) + 1;
  const now = Date.now();
  const isoDate = new Date(now).toISOString();

  // 1. Update streak record
  const allStreaks = getAllUserStreaks();
  const currentRecord = allStreaks[user.id] || {
    userId: user.id,
    currentStreak: 0,
    lastClaimDate: '',
    lastClaimTimestamp: 0,
    totalDaysClaimed: 0,
    history: [],
  };

  const updatedRecord: UserDailyStreak = {
    userId: user.id,
    currentStreak: newStreakCount,
    lastClaimDate: isoDate,
    lastClaimTimestamp: now,
    totalDaysClaimed: (currentRecord.totalDaysClaimed || 0) + 1,
    history: [
      {
        day: dayToClaim,
        coins: coinsAwarded,
        claimedAt: isoDate,
      },
      ...(currentRecord.history || []).slice(0, 30),
    ],
  };

  allStreaks[user.id] = updatedRecord;
  saveToStorage(USER_STREAKS_KEY, allStreaks);

  // 2. Add real coins to user balance
  const targetUser = findUserById(user.id) || user;
  targetUser.coins = Number(targetUser.coins || 0) + coinsAwarded;
  targetUser.coinBalance = targetUser.coins;
  updateUser(targetUser);

  // 3. Create immutable transaction record
  const txId = `tx_streak_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const isSpecialBonus = dayToClaim === 7;
  const transaction: CoinTransaction = {
    id: txId,
    transactionId: txId,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount: coinsAwarded,
    type: 'credit',
    reason: isSpecialBonus
      ? `🔥 Day 7 Grand Streak Bonus Awarded!`
      : `🔥 Day ${dayToClaim} Daily Streak Check-in Reward`,
    description: `Claimed Day ${dayToClaim} streak bonus of ${coinsAwarded} ASJADFX Coins`,
    source: 'daily_streak',
    date: isoDate,
    status: 'completed',
  };

  const allTransactions = getAllTransactions();
  allTransactions.unshift(transaction);
  saveToStorage('asjadfx_transactions_db_v1', allTransactions);
  insertSupabaseTransaction(transaction);

  // 4. Create App Notification
  createNotification({
    userId: targetUser.id,
    type: 'coin_credit',
    title: isSpecialBonus ? '🌟 Day 7 Grand Bonus Claimed!' : `🔥 Day ${dayToClaim} Streak Claimed!`,
    message: `+${coinsAwarded} ASJADFX Coins have been credited to your balance. Keep your streak alive tomorrow!`,
  });

  // 5. Trigger coin burst animation
  triggerCoinReward(
    coinsAwarded,
    isSpecialBonus ? 'Day 7 Grand Jackpot!' : `Day ${dayToClaim} Streak Bonus`
  );

  // 6. Real-time sync across UI
  notifyDataChanged();

  return {
    success: true,
    coinsAwarded,
    newStreak: newStreakCount,
    dayClaimed: dayToClaim,
  };
}

// -------------------------------------------------------------
// REDEEM CODE SERVICES
// -------------------------------------------------------------

export function getAllRedeemCodes(): RedeemCode[] {
  const codes = getFromStorage<RedeemCode[]>(REDEEM_CODES_KEY, []);
  // Purge any legacy demo codes
  const cleaned = codes.filter(
    (c) =>
      !['code_asjad100', 'code_live500', 'code_tradervip', 'code_launch50'].includes(c.id) &&
      !['ASJAD100', 'LIVE500', 'TRADERVIP', 'LAUNCH50'].includes(c.code.toUpperCase())
  );
  if (cleaned.length !== codes.length) {
    saveToStorage(REDEEM_CODES_KEY, cleaned);
  }
  return cleaned;
}

export function saveRedeemCode(code: RedeemCode): void {
  const codes = getAllRedeemCodes();
  const index = codes.findIndex((c) => c.id === code.id || c.code.toUpperCase() === code.code.toUpperCase());
  if (index >= 0) {
    codes[index] = code;
  } else {
    codes.unshift(code);
  }
  saveToStorage(REDEEM_CODES_KEY, codes);
  notifyDataChanged();
}

export function deleteRedeemCode(codeId: string): void {
  const codes = getAllRedeemCodes();
  const filtered = codes.filter((c) => c.id !== codeId);
  saveToStorage(REDEEM_CODES_KEY, filtered);
  notifyDataChanged();
}

export function toggleRedeemCodeStatus(codeId: string): RedeemCode | null {
  const codes = getAllRedeemCodes();
  const code = codes.find((c) => c.id === codeId);
  if (!code) return null;
  code.status = code.status === 'active' ? 'disabled' : 'active';
  saveToStorage(REDEEM_CODES_KEY, codes);
  notifyDataChanged();
  return code;
}

export function getAllRedemptionLogs(): CodeRedemptionLog[] {
  return getFromStorage<CodeRedemptionLog[]>(REDEMPTION_LOGS_KEY, []);
}

export function getUserRedemptionLogs(userId: string): CodeRedemptionLog[] {
  const logs = getAllRedemptionLogs();
  return logs.filter((l) => l.userId === userId);
}

/**
 * Validates and redeems a promo coupon code for an authenticated user.
 * Enforces usage limits, active status, expiry date, and strict duplicate protection.
 */
export function redeemCouponCode(
  user: User,
  rawCode: string
): {
  success: boolean;
  coinsAwarded?: number;
  code?: string;
  error?: string;
} {
  if (!rawCode || !rawCode.trim()) {
    return { success: false, error: 'Please enter a valid reward code.' };
  }

  if (user.status === 'banned' || user.isBanned) {
    return { success: false, error: 'Your account is banned and cannot redeem codes.' };
  }
  if (user.status === 'restricted' || user.isRestricted) {
    return { success: false, error: 'Your account is restricted from redeeming promo codes.' };
  }

  const cleanCode = rawCode.trim().toUpperCase();
  const allCodes = getAllRedeemCodes();
  const codeObj = allCodes.find((c) => c.code.toUpperCase() === cleanCode);

  if (!codeObj) {
    return {
      success: false,
      error: `Invalid reward code "${cleanCode}". Please verify spelling or look out for live event drops!`,
    };
  }

  if (codeObj.status !== 'active') {
    return {
      success: false,
      error: `Code "${cleanCode}" is currently inactive or disabled by admin.`,
    };
  }

  // Expiry check
  if (codeObj.expiresAt) {
    const expiryTime = new Date(codeObj.expiresAt).getTime();
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return {
        success: false,
        error: `Reward code "${cleanCode}" has expired on ${new Date(
          codeObj.expiresAt
        ).toLocaleDateString()}.`,
      };
    }
  }

  // Maximum uses check
  if (codeObj.maxUses > 0 && (codeObj.usedCount || 0) >= codeObj.maxUses) {
    return {
      success: false,
      error: `Reward code "${cleanCode}" has reached its maximum global redemption limit (${codeObj.maxUses} uses).`,
    };
  }

  // Check if user already redeemed this code
  const allLogs = getAllRedemptionLogs();
  const alreadyRedeemed = allLogs.some(
    (log) => log.userId === user.id && log.code.toUpperCase() === cleanCode
  );

  if (alreadyRedeemed) {
    return {
      success: false,
      error: `You have already redeemed code "${cleanCode}". Each promo code can only be used once per account!`,
    };
  }

  const now = Date.now();
  const isoDate = new Date(now).toISOString();
  const rewardCoins = Number(codeObj.rewardCoins || 0);

  if (rewardCoins <= 0) {
    return { success: false, error: 'Invalid reward coin amount for this code.' };
  }

  // 1. Update code usage counter
  codeObj.usedCount = (codeObj.usedCount || 0) + 1;
  saveRedeemCode(codeObj);

  // 2. Append to Redemption Logs
  const logEntry: CodeRedemptionLog = {
    id: `log_${now}_${Math.random().toString(36).substring(2, 7)}`,
    codeId: codeObj.id,
    code: codeObj.code,
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    rewardCoins,
    redeemedAt: isoDate,
  };
  allLogs.unshift(logEntry);
  saveToStorage(REDEMPTION_LOGS_KEY, allLogs);

  // 3. Credit user's coin balance
  const targetUser = findUserById(user.id) || user;
  targetUser.coins = Number(targetUser.coins || 0) + rewardCoins;
  targetUser.coinBalance = targetUser.coins;
  updateUser(targetUser);

  // 4. Create immutable transaction
  const txId = `tx_code_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const transaction: CoinTransaction = {
    id: txId,
    transactionId: txId,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount: rewardCoins,
    type: 'credit',
    reason: `🎁 Promo Code Redeemed: [${codeObj.code}]`,
    description: `Redeemed promo coupon code ${codeObj.code} for ${rewardCoins} ASJADFX Coins`,
    source: 'coupon_redeem',
    date: isoDate,
    status: 'completed',
  };

  const allTransactions = getAllTransactions();
  allTransactions.unshift(transaction);
  saveToStorage('asjadfx_transactions_db_v1', allTransactions);
  insertSupabaseTransaction(transaction);

  // 5. Send User Notification
  createNotification({
    userId: targetUser.id,
    type: 'coin_credit',
    title: '🎁 Code Redeemed Successfully!',
    message: `+${rewardCoins} Coins credited to your account from code [${codeObj.code}].`,
  });

  // 6. Trigger celebratory animation
  triggerCoinReward(rewardCoins, `Code [${codeObj.code}] Redeemed!`);

  // 7. Sync across UI
  notifyDataChanged();

  return {
    success: true,
    coinsAwarded: rewardCoins,
    code: codeObj.code,
  };
}
