import { User, DailySpinRecord, DailySpinStatus, CoinTransaction } from '../types';
import {
  findUserById,
  updateUser,
  getAllTransactions,
  createNotification,
  notifyDataChanged,
} from './storage';
import { insertSupabaseTransaction, upsertSupabaseUser } from './supabase';
import { triggerCoinReward } from '../components/CoinRewardAnimation';

const SPINS_STORAGE_KEY = 'asjadfx_daily_spins_v1';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // Strict 24 hours

// Reward pools for the two VIP tiers
export const VIP_BASIC_SPIN_POOL = [10, 15, 20, 25, 30, 40, 50, 100];
export const VIP_PRO_SPIN_POOL = [25, 50, 75, 100, 150, 200, 250, 500];

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key}:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error saving ${key}:`, err);
  }
}

export function getAllSpinRecords(): Record<string, DailySpinRecord> {
  return getFromStorage<Record<string, DailySpinRecord>>(SPINS_STORAGE_KEY, {});
}

/**
 * Determines exact VIP Tier for spin privileges
 */
export function getUserSpinTier(user: User | null): 'vip_lifetime' | 'vip_basic' | 'free' {
  if (!user) return 'free';
  if (user.membership_type !== 'premium' || user.premium_status !== 'active') {
    return 'free';
  }
  if (user.vip_tier === 'vip_lifetime' || !user.premium_expires_at) {
    return 'vip_lifetime';
  }
  return 'vip_basic';
}

/**
 * Gets the current daily spin status, cooldown, and reward pool for a user
 */
export function getDailySpinStatus(userId: string): DailySpinStatus {
  const targetUser = findUserById(userId);
  const userTier = getUserSpinTier(targetUser);
  const rewardPool = userTier === 'vip_lifetime' ? VIP_PRO_SPIN_POOL : VIP_BASIC_SPIN_POOL;

  const records = getAllSpinRecords();
  const userRecord = records[userId];
  const now = Date.now();

  if (!userRecord || !userRecord.lastSpinTimestamp) {
    return {
      canSpin: userTier !== 'free',
      timeRemainingMs: 0,
      nextSpinTimestamp: now,
      formattedCountdown: 'Ready to Spin!',
      userTier,
      rewardPool,
      lastReward: null,
      totalSpins: 0,
    };
  }

  const timeSinceLastSpin = now - userRecord.lastSpinTimestamp;
  const canSpin = userTier !== 'free' && timeSinceLastSpin >= COOLDOWN_MS;
  const timeRemainingMs = canSpin ? 0 : Math.max(0, COOLDOWN_MS - timeSinceLastSpin);
  const nextSpinTimestamp = userRecord.lastSpinTimestamp + COOLDOWN_MS;

  const totalSeconds = Math.floor(timeRemainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedCountdown = canSpin
    ? 'Ready to Spin!'
    : `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds
        .toString()
        .padStart(2, '0')}s`;

  return {
    canSpin,
    timeRemainingMs,
    nextSpinTimestamp,
    formattedCountdown,
    userTier,
    rewardPool,
    lastReward: userRecord.lastRewardCoins || null,
    totalSpins: userRecord.totalSpins || 0,
  };
}

/**
 * Performs a verified Daily Spin for an authenticated VIP user.
 * Credits authoritative balance, records immutable transaction, and updates cooldown.
 */
export function performDailySpin(user: User): {
  success: boolean;
  reward?: number;
  prizeIndex?: number;
  error?: string;
  userTier?: 'vip_lifetime' | 'vip_basic' | 'free';
} {
  if (user.status === 'banned' || user.isBanned) {
    return { success: false, error: 'Your account is banned and cannot use Daily Spin.' };
  }
  if (user.status === 'restricted' || user.isRestricted) {
    return { success: false, error: 'Your account is restricted from claiming spin rewards.' };
  }

  const targetUser = findUserById(user.id) || user;
  const userTier = getUserSpinTier(targetUser);

  if (userTier === 'free') {
    return {
      success: false,
      error: 'Daily Spin is an exclusive VIP feature. Upgrade to VIP Basic (₹49) or VIP Lifetime (₹99) to unlock daily spins!',
    };
  }

  const status = getDailySpinStatus(targetUser.id);
  if (!status.canSpin) {
    return {
      success: false,
      error: `Next daily spin unlocks in ${status.formattedCountdown}. Come back tomorrow!`,
    };
  }

  const pool = userTier === 'vip_lifetime' ? VIP_PRO_SPIN_POOL : VIP_BASIC_SPIN_POOL;

  // Weighted random selection:
  // Normal prizes have higher weights; top jackpots have lower weights
  const weights =
    userTier === 'vip_lifetime'
      ? [20, 20, 18, 16, 12, 8, 4, 2] // Higher average return for Pro
      : [25, 22, 20, 15, 10, 5, 2, 1]; // Basic pool weights

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  let randomVal = Math.random() * totalWeight;
  let selectedIndex = 0;

  for (let i = 0; i < weights.length; i++) {
    if (randomVal < weights[i]) {
      selectedIndex = i;
      break;
    }
    randomVal -= weights[i];
  }

  const rewardCoins = pool[selectedIndex] || pool[0];
  const now = Date.now();
  const isoDate = new Date(now).toISOString();

  // 1. Update spin storage record
  const allRecords = getAllSpinRecords();
  const currentRecord = allRecords[targetUser.id] || {
    userId: targetUser.id,
    lastSpinTimestamp: 0,
    lastSpinDate: '',
    totalSpins: 0,
    lastRewardCoins: 0,
    spinTier: userTier,
    history: [],
  };

  const updatedRecord: DailySpinRecord = {
    userId: targetUser.id,
    lastSpinTimestamp: now,
    lastSpinDate: isoDate,
    totalSpins: (currentRecord.totalSpins || 0) + 1,
    lastRewardCoins: rewardCoins,
    spinTier: userTier,
    history: [
      {
        coins: rewardCoins,
        timestamp: now,
        date: isoDate,
        spinTier: userTier,
      },
      ...(currentRecord.history || []).slice(0, 20),
    ],
  };

  allRecords[targetUser.id] = updatedRecord;
  saveToStorage(SPINS_STORAGE_KEY, allRecords);

  // 2. Authoritatively credit user coin balance
  targetUser.coins = Number(targetUser.coins || 0) + rewardCoins;
  targetUser.coinBalance = targetUser.coins;
  updateUser(targetUser);
  upsertSupabaseUser(targetUser).catch(() => {});

  // 3. Create immutable CoinTransaction
  const txId = `tx_spin_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const tierLabel = userTier === 'vip_lifetime' ? 'VIP Pro Spin' : 'VIP Basic Spin';
  const transaction: CoinTransaction = {
    id: txId,
    transactionId: txId,
    userId: targetUser.id,
    userFullName: targetUser.fullName,
    username: targetUser.username,
    amount: rewardCoins,
    type: 'credit',
    reason: `🎰 ${tierLabel} Daily Reward`,
    description: `Won ${rewardCoins} ASJADFX Coins from ${tierLabel}`,
    source: 'daily_spin',
    date: isoDate,
    status: 'completed',
  };

  const allTransactions = getAllTransactions();
  allTransactions.unshift(transaction);
  saveToStorage('asjadfx_transactions_db_v1', allTransactions);
  insertSupabaseTransaction(transaction).catch(() => {});

  // 4. Send user in-app notification
  createNotification({
    userId: targetUser.id,
    type: 'coin_credit',
    title: `🎰 ${tierLabel} Win!`,
    message: `+${rewardCoins} Coins credited to your wallet from today's Daily Spin.`,
  });

  // 5. Trigger celebratory coin burst
  triggerCoinReward(rewardCoins, `${tierLabel} (+${rewardCoins} Coins)`);

  // 6. Dispatch real-time cross-tab sync
  notifyDataChanged();

  return {
    success: true,
    reward: rewardCoins,
    prizeIndex: selectedIndex,
    userTier,
  };
}
