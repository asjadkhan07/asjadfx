import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  User,
  Task,
  TaskSubmission,
  CoinTransaction,
  Giveaway,
  AppNotification,
  PlatformConfig,
  PlatformRules,
  AdminSystemSettings,
  Announcement,
  UserWarning,
} from '../types';

// Supabase project credentials
function getValidSupabaseUrl(): string {
  try {
    let url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
    url = url.trim();
    if (!url || url === 'undefined' || url === 'null') {
      url = 'https://mtehyttuasfbvzjsjbkj.supabase.co';
    }
    // If user or settings provided just the project ref (e.g., "mtehyttuasfbvzjsjbkj")
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.supabase.co')) {
        url = `https://${url}`;
      } else {
        url = `https://${url}.supabase.co`;
      }
    }
    url = url.replace(/\/+$/, '');
    new URL(url);
    return url;
  } catch {
    return 'https://mtehyttuasfbvzjsjbkj.supabase.co';
  }
}

function getValidSupabaseKey(): string {
  try {
    let key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';
    key = key.trim();
    if (!key || key === 'undefined' || key === 'null') {
      key = 'sb_publishable_1TLmm_x6n0kcwpC2i-n_pA_d58hXZRi';
    }
    return key;
  } catch {
    return 'sb_publishable_1TLmm_x6n0kcwpC2i-n_pA_d58hXZRi';
  }
}

export const SUPABASE_URL = getValidSupabaseUrl();
export const SUPABASE_ANON_KEY = getValidSupabaseKey();

function initSupabaseClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Fallback Supabase client initialization:', err);
    return createClient('https://mtehyttuasfbvzjsjbkj.supabase.co', 'sb_publishable_1TLmm_x6n0kcwpC2i-n_pA_d58hXZRi');
  }
}

// Supabase client instance
export const supabase: SupabaseClient = initSupabaseClient();

// Storage Bucket for Task Proof Screenshots
export const PROOFS_BUCKET = 'task-proofs';

/**
 * Uploads a screenshot file or base64 data URL to Supabase Storage.
 * Falls back safely to data URL if bucket is unavailable.
 */
export async function uploadScreenshotProofToSupabase(
  fileOrBase64: File | string,
  userId: string,
  taskId: string
): Promise<string> {
  try {
    let fileBody: Blob | File;
    let extension = 'png';

    if (typeof fileOrBase64 === 'string') {
      if (!fileOrBase64.startsWith('data:')) {
        return fileOrBase64; // Already a remote URL
      }
      // Convert base64 Data URL to Blob
      const parts = fileOrBase64.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
      if (mimeType.includes('webp')) extension = 'webp';

      const byteString = atob(parts[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      fileBody = new Blob([uint8Array], { type: mimeType });
    } else {
      fileBody = fileOrBase64;
      const match = fileOrBase64.name.split('.').pop();
      if (match) extension = match;
    }

    const filePath = `submissions/${userId}/${taskId}_${Date.now()}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(PROOFS_BUCKET)
      .upload(filePath, fileBody, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Supabase storage upload notice (using fallback):', uploadError.message);
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROOFS_BUCKET)
      .getPublicUrl(uploadData.path);

    return publicUrlData?.publicUrl || (typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
  } catch (err) {
    console.warn('Screenshot upload error:', err);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }
}

// ----------------- Supabase Data API Helpers -----------------

/**
 * Fetch all registered users from Supabase.
 * Queries all potential user & profile tables and consolidates by unique Supabase Auth UUID.
 */
export async function fetchSupabaseUsers(): Promise<User[] | null> {
  try {
    const userMap = new Map<string, User>();

    // 1. Fetch from 'profiles' table (standard Supabase profile table)
    try {
      const { data: profilesData, error: profError } = await supabase.from('profiles').select('*');
      if (!profError && Array.isArray(profilesData)) {
        for (const row of profilesData) {
          const u = mapDbUserToModel(row);
          if (u && u.id) {
            userMap.set(u.id, u);
          }
        }
      }
    } catch (e) {
      console.warn('Supabase profiles query notice:', e);
    }

    // 2. Fetch from 'users' table (custom user table)
    try {
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (!usersError && Array.isArray(usersData)) {
        for (const row of usersData) {
          const u = mapDbUserToModel(row);
          if (u && u.id) {
            const existing = userMap.get(u.id);
            if (existing) {
              userMap.set(u.id, {
                ...existing,
                ...u,
                fullName: u.fullName || existing.fullName,
                username: u.username || existing.username,
                email: u.email || existing.email,
                avatarUrl: u.avatarUrl || existing.avatarUrl,
                instagramUsername: u.instagramUsername || existing.instagramUsername,
                coins: u.coins ?? existing.coins ?? 0,
                coinBalance: u.coinBalance ?? existing.coinBalance ?? 0,
                membership_type: u.membership_type || existing.membership_type || 'free',
                premium_status: u.premium_status || existing.premium_status || 'inactive',
              });
            } else {
              userMap.set(u.id, u);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Supabase users table query notice:', e);
    }

    // 3. Fetch from 'user_profiles' table (optional alternative)
    try {
      const { data: upData, error: upError } = await supabase.from('user_profiles').select('*');
      if (!upError && Array.isArray(upData)) {
        for (const row of upData) {
          const u = mapDbUserToModel(row);
          if (u && u.id && !userMap.has(u.id)) {
            userMap.set(u.id, u);
          }
        }
      }
    } catch (e) {
      // ignore
    }

    const result = Array.from(userMap.values());
    return result;
  } catch (e) {
    console.warn('Supabase fetchUsers error:', e);
    return null;
  }
}

/**
 * Upsert user profile in Supabase across all active tables.
 */
export async function upsertSupabaseUser(user: User): Promise<boolean> {
  try {
    const row = mapModelToDbUser(user);
    
    // Upsert into 'profiles'
    try {
      await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase profiles upsert notice:', e);
    }

    // Upsert into 'users'
    try {
      await supabase.from('users').upsert(row, { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase users upsert notice:', e);
    }

    return true;
  } catch (e) {
    console.warn('Supabase upsertUser error:', e);
    return false;
  }
}

/**
 * Delete user from Supabase
 */
export async function deleteSupabaseUser(userId: string): Promise<boolean> {
  try {
    await supabase.from('users').delete().eq('id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
    return true;
  } catch (e) {
    console.warn('Supabase deleteUser error:', e);
    return false;
  }
}

/**
 * Fetch all tasks from Supabase
 */
export async function fetchSupabaseTasks(): Promise<Task[] | null> {
  try {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error || !data) return null;
    return data.map(mapDbTaskToModel);
  } catch (e) {
    console.warn('Supabase fetchTasks error:', e);
    return null;
  }
}

/**
 * Upsert task in Supabase
 */
export async function upsertSupabaseTask(task: Task): Promise<boolean> {
  try {
    const row = mapModelToDbTask(task);
    const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
    if (error) console.warn('Supabase upsertTask error:', error.message);
    return !error;
  } catch (e) {
    console.warn('Supabase upsertTask error:', e);
    return false;
  }
}

/**
 * Delete task in Supabase
 */
export async function deleteSupabaseTask(taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    return !error;
  } catch (e) {
    console.warn('Supabase deleteTask error:', e);
    return false;
  }
}

/**
 * Fetch all submissions from Supabase
 */
export async function fetchSupabaseSubmissions(): Promise<TaskSubmission[] | null> {
  try {
    const { data, error } = await supabase.from('task_submissions').select('*');
    if (error) {
      const { data: subData, error: subError } = await supabase.from('submissions').select('*');
      if (subError || !subData) return null;
      return subData.map(mapDbSubmissionToModel);
    }
    return (data || []).map(mapDbSubmissionToModel);
  } catch (e) {
    console.warn('Supabase fetchSubmissions error:', e);
    return null;
  }
}

/**
 * Upsert submission in Supabase
 */
export async function upsertSupabaseSubmission(sub: TaskSubmission): Promise<boolean> {
  try {
    const row = mapModelToDbSubmission(sub);
    const { error } = await supabase.from('task_submissions').upsert(row, { onConflict: 'id' });
    if (error) {
      await supabase.from('submissions').upsert(row, { onConflict: 'id' });
    }
    return true;
  } catch (e) {
    console.warn('Supabase upsertSubmission error:', e);
    return false;
  }
}

/**
 * Fetch all transactions from Supabase
 */
export async function fetchSupabaseTransactions(): Promise<CoinTransaction[] | null> {
  try {
    const { data, error } = await supabase.from('coin_transactions').select('*');
    if (error) {
      const { data: txData, error: txError } = await supabase.from('transactions').select('*');
      if (txError || !txData) return null;
      return txData.map(mapDbTransactionToModel);
    }
    return (data || []).map(mapDbTransactionToModel);
  } catch (e) {
    console.warn('Supabase fetchTransactions error:', e);
    return null;
  }
}

/**
 * Insert transaction in Supabase
 */
export async function insertSupabaseTransaction(tx: CoinTransaction): Promise<boolean> {
  try {
    const row = mapModelToDbTransaction(tx);
    const { error } = await supabase.from('coin_transactions').upsert(row, { onConflict: 'id' });
    if (error) {
      await supabase.from('transactions').upsert(row, { onConflict: 'id' });
    }
    return true;
  } catch (e) {
    console.warn('Supabase insertTransaction error:', e);
    return false;
  }
}

/**
 * Fetch giveaways from Supabase
 */
export async function fetchSupabaseGiveaways(): Promise<Giveaway[] | null> {
  try {
    const { data, error } = await supabase.from('giveaways').select('*');
    if (error || !data) return null;
    return data.map(mapDbGiveawayToModel);
  } catch (e) {
    console.warn('Supabase fetchGiveaways error:', e);
    return null;
  }
}

/**
 * Upsert giveaway in Supabase
 */
export async function upsertSupabaseGiveaway(g: Giveaway): Promise<boolean> {
  try {
    const row = mapModelToDbGiveaway(g);
    const { error } = await supabase.from('giveaways').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (e) {
    console.warn('Supabase upsertGiveaway error:', e);
    return false;
  }
}

/**
 * Delete giveaway in Supabase
 */
export async function deleteSupabaseGiveaway(giveawayId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('giveaways').delete().eq('id', giveawayId);
    return !error;
  } catch (e) {
    console.warn('Supabase deleteGiveaway error:', e);
    return false;
  }
}

/**
 * Fetch announcements from Supabase
 */
export async function fetchSupabaseAnnouncements(): Promise<Announcement[] | null> {
  try {
    const { data, error } = await supabase.from('announcements').select('*');
    if (error || !data) return null;
    return data.map(mapDbAnnouncementToModel);
  } catch (e) {
    console.warn('Supabase fetchAnnouncements error:', e);
    return null;
  }
}

/**
 * Upsert announcement in Supabase
 */
export async function upsertSupabaseAnnouncement(a: Announcement): Promise<boolean> {
  try {
    const row = mapModelToDbAnnouncement(a);
    const { error } = await supabase.from('announcements').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (e) {
    console.warn('Supabase upsertAnnouncement error:', e);
    return false;
  }
}

/**
 * Fetch notifications from Supabase
 */
export async function fetchSupabaseNotifications(userId?: string): Promise<AppNotification[] | null> {
  try {
    let query = supabase.from('notifications').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error || !data) return null;
    return data.map(mapDbNotificationToModel);
  } catch (e) {
    console.warn('Supabase fetchNotifications error:', e);
    return null;
  }
}

/**
 * Upsert notification in Supabase
 */
export async function upsertSupabaseNotification(n: AppNotification): Promise<boolean> {
  try {
    const row = mapModelToDbNotification(n);
    const { error } = await supabase.from('notifications').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (e) {
    console.warn('Supabase upsertNotification error:', e);
    return false;
  }
}

/**
 * Fetch platforms from Supabase
 */
export async function fetchSupabasePlatforms(): Promise<PlatformConfig[] | null> {
  try {
    const { data, error } = await supabase.from('platforms').select('*');
    if (error || !data) return null;
    return data.map(mapDbPlatformToModel);
  } catch (e) {
    console.warn('Supabase fetchPlatforms error:', e);
    return null;
  }
}

/**
 * Upsert platform in Supabase
 */
export async function upsertSupabasePlatform(p: PlatformConfig): Promise<boolean> {
  try {
    const row = mapModelToDbPlatform(p);
    const { error } = await supabase.from('platforms').upsert(row, { onConflict: 'id' });
    return !error;
  } catch (e) {
    console.warn('Supabase upsertPlatform error:', e);
    return false;
  }
}

/**
 * Fetch rules from Supabase
 */
export async function fetchSupabaseRules(): Promise<PlatformRules | null> {
  try {
    const { data, error } = await supabase.from('platform_rules').select('*').limit(1).single();
    if (error || !data) return null;
    return (data.rules_data || data) as PlatformRules;
  } catch (e) {
    console.warn('Supabase fetchRules error:', e);
    return null;
  }
}

/**
 * Upsert rules in Supabase
 */
export async function upsertSupabaseRules(rules: PlatformRules): Promise<boolean> {
  try {
    const { error } = await supabase.from('platform_rules').upsert({
      id: 'default_rules',
      rules_data: rules,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    return !error;
  } catch (e) {
    console.warn('Supabase upsertRules error:', e);
    return false;
  }
}

/**
 * Fetch settings from Supabase
 */
export async function fetchSupabaseSettings(): Promise<AdminSystemSettings | null> {
  try {
    const { data, error } = await supabase.from('admin_settings').select('*').limit(1).single();
    if (error || !data) return null;
    return (data.settings_data || data) as AdminSystemSettings;
  } catch (e) {
    console.warn('Supabase fetchSettings error:', e);
    return null;
  }
}

/**
 * Upsert settings in Supabase
 */
export async function upsertSupabaseSettings(settings: AdminSystemSettings): Promise<boolean> {
  try {
    const { error } = await supabase.from('admin_settings').upsert({
      id: 'default_settings',
      settings_data: settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    return !error;
  } catch (e) {
    console.warn('Supabase upsertSettings error:', e);
    return false;
  }
}

// ----------------- Data Mappers (snake_case DB <-> camelCase TS Models) -----------------

function mapDbUserToModel(r: any): User {
  const userId = r.id || r.user_id || r.userId || r.uid || '';
  const email = (r.email || r.user_email || '').trim().toLowerCase();
  const defaultName = email ? email.split('@')[0] : 'Trader';
  const fullName = r.full_name || r.fullName || r.display_name || r.name || defaultName;
  const username = r.username || r.user_name || (email ? email.split('@')[0] : userId.slice(0, 8));
  const instagram = r.instagram_username || r.instagramUsername || r.instagram_handle || r.instagram || '';
  const isAdmin = email === 'asjadarmwrestlingvloge@gmail.com' || email === 'asjadtrades07@gmail.com' || r.role === 'admin';
  const coins = Number(r.coins ?? r.coin_balance ?? r.coinBalance ?? 0);

  return {
    id: userId,
    fullName,
    username,
    email,
    instagramUsername: instagram,
    passwordHash: r.password_hash || r.passwordHash || '',
    salt: r.salt || '',
    coins,
    coinBalance: coins,
    avatarUrl: r.avatar_url || r.avatarUrl || r.avatar || r.picture,
    role: isAdmin ? 'admin' : (r.role || 'user'),
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    lastLoginAt: r.last_login_at || r.lastLoginAt || new Date().toISOString(),
    status: r.status || (r.is_banned ? 'banned' : 'active'),
    isRestricted: r.is_restricted ?? r.isRestricted ?? false,
    isBanned: r.is_banned ?? r.isBanned ?? false,
    restrictionExpiresAt: r.restriction_expires_at || r.restrictionExpiresAt,
    warnings: r.warnings ? (typeof r.warnings === 'string' ? JSON.parse(r.warnings) : r.warnings) : [],
    warningCount: r.warning_count ?? r.warningCount ?? (r.warnings?.length || 0),
    tasksCompleted: Number(r.tasks_completed ?? r.tasksCompleted ?? 0),
    membership_type: (r.membership_type === 'premium' || r.membership === 'premium' || r.is_premium ? 'premium' : 'free'),
    premium_status: ((r.premium_status || (r.is_premium ? 'active' : 'inactive')) as 'inactive' | 'active' | 'expired'),
    premium_started_at: r.premium_started_at || undefined,
    premium_expires_at: r.premium_expires_at || undefined,
  };
}

function mapModelToDbUser(u: User): any {
  return {
    id: u.id,
    user_id: u.id,
    full_name: u.fullName,
    username: u.username,
    email: u.email,
    instagram_username: u.instagramUsername,
    instagram_handle: u.instagramUsername,
    password_hash: u.passwordHash,
    salt: u.salt,
    coins: u.coins,
    coin_balance: u.coins,
    avatar_url: u.avatarUrl || null,
    role: u.role,
    created_at: u.createdAt,
    last_login_at: u.lastLoginAt,
    status: u.status,
    is_restricted: !!u.isRestricted,
    is_banned: !!u.isBanned,
    restriction_expires_at: u.restrictionExpiresAt || null,
    warnings: u.warnings || [],
    warning_count: u.warnings?.length || 0,
    tasks_completed: u.tasksCompleted || 0,
    membership_type: u.membership_type || 'free',
    premium_status: u.premium_status || 'inactive',
    premium_started_at: u.premium_started_at || null,
    premium_expires_at: u.premium_expires_at || null,
  };
}

function mapDbTaskToModel(r: any): Task {
  return {
    id: r.id,
    title: r.title || '',
    platform: r.platform || 'instagram',
    contentUrl: r.content_url || r.contentUrl || '',
    description: r.description || '',
    instructions: r.instructions || '',
    reward: Number(r.reward ?? 50),
    proofRequired: r.proof_required ?? r.proofRequired ?? true,
    startDate: r.start_date || r.startDate || new Date().toISOString(),
    endDate: r.end_date || r.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    status: r.status || 'active',
    requiredActions: r.required_actions ? (typeof r.required_actions === 'string' ? JSON.parse(r.required_actions) : r.required_actions) : ['like', 'follow'],
    commentRequirement: r.comment_requirement || r.commentRequirement,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt,
  };
}

function mapModelToDbTask(t: Task): any {
  return {
    id: t.id,
    title: t.title,
    platform: t.platform,
    content_url: t.contentUrl,
    description: t.description,
    instructions: t.instructions,
    reward: t.reward,
    proof_required: t.proofRequired,
    start_date: t.startDate,
    end_date: t.endDate,
    status: t.status,
    required_actions: t.requiredActions,
    comment_requirement: t.commentRequirement || null,
    created_at: t.createdAt,
    updated_at: t.updatedAt || new Date().toISOString(),
  };
}

function mapDbSubmissionToModel(r: any): TaskSubmission {
  return {
    id: r.id,
    taskId: r.task_id || r.taskId || '',
    taskTitle: r.task_title || r.taskTitle || '',
    platform: r.platform || 'instagram',
    taskUrl: r.task_url || r.taskUrl || '',
    userId: r.user_id || r.userId || '',
    fullName: r.full_name || r.fullName || '',
    username: r.username || '',
    instagramUsername: r.instagram_username || r.instagramUsername || '',
    proofImageUrl: r.proof_image_url || r.proofImageUrl || '',
    commentProof: r.comment_proof || r.commentProof,
    status: r.status || 'pending',
    rewardCoins: Number(r.reward_coins ?? r.rewardCoins ?? 0),
    rewardAwarded: r.reward_awarded ?? r.rewardAwarded ?? false,
    submittedAt: r.submitted_at || r.submittedAt || new Date().toISOString(),
    reviewedAt: r.reviewed_at || r.reviewedAt,
    approvedAt: r.approved_at || r.approvedAt,
    reviewedByAdminId: r.reviewed_by_admin_id || r.reviewedByAdminId,
    reviewedByAdminName: r.reviewed_by_admin_name || r.reviewedByAdminName,
    rejectionReason: r.rejection_reason || r.rejectionReason,
  };
}

function mapModelToDbSubmission(s: TaskSubmission): any {
  return {
    id: s.id,
    task_id: s.taskId,
    task_title: s.taskTitle,
    platform: s.platform,
    task_url: s.taskUrl,
    user_id: s.userId,
    full_name: s.fullName,
    username: s.username,
    instagram_username: s.instagramUsername,
    proof_image_url: s.proofImageUrl || null,
    comment_proof: s.commentProof || null,
    status: s.status,
    reward_coins: s.rewardCoins,
    reward_awarded: !!s.rewardAwarded,
    submitted_at: s.submittedAt,
    reviewed_at: s.reviewedAt || null,
    approved_at: s.approvedAt || null,
    reviewed_by_admin_id: s.reviewedByAdminId || null,
    reviewed_by_admin_name: s.reviewedByAdminName || null,
    rejection_reason: s.rejectionReason || null,
  };
}

function mapDbTransactionToModel(r: any): CoinTransaction {
  return {
    id: r.id,
    transactionId: r.transaction_id || r.transactionId || r.id,
    userId: r.user_id || r.userId || '',
    userFullName: r.user_full_name || r.userFullName,
    username: r.username,
    amount: Number(r.amount ?? 0),
    type: r.type || 'credit',
    reason: r.reason || '',
    description: r.description || r.reason || '',
    source: r.source || 'task',
    taskId: r.task_id || r.taskId,
    taskTitle: r.task_title || r.taskTitle,
    submissionId: r.submission_id || r.submissionId,
    adminId: r.admin_id || r.adminId,
    adminName: r.admin_name || r.adminName,
    date: r.date || r.created_at || new Date().toISOString(),
    status: r.status || 'completed',
  };
}

function mapModelToDbTransaction(t: CoinTransaction): any {
  return {
    id: t.id,
    transaction_id: t.transactionId || t.id,
    user_id: t.userId,
    user_full_name: t.userFullName || null,
    username: t.username || null,
    amount: t.amount,
    type: t.type,
    reason: t.reason,
    description: t.description || t.reason,
    source: t.source || 'task',
    task_id: t.taskId || null,
    task_title: t.taskTitle || null,
    submission_id: t.submissionId || null,
    admin_id: t.adminId || null,
    admin_name: t.adminName || null,
    date: t.date,
    status: t.status,
  };
}

function mapDbGiveawayToModel(r: any): Giveaway {
  return {
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    prize: r.prize || '',
    firstPlacePrize: r.first_place_prize || r.firstPlacePrize || r.firstPrize,
    secondPlacePrize: r.second_place_prize || r.secondPlacePrize || r.secondPrize,
    thirdPlacePrize: r.third_place_prize || r.thirdPlacePrize || r.thirdPrize,
    startDate: r.start_date || r.startDate || new Date().toISOString(),
    endDate: r.end_date || r.endDate || new Date(Date.now() + 30 * 86400000).toISOString(),
    minCoinsRequired: Number(r.min_coins_required ?? r.minCoinsRequired ?? 0),
    eligibilityRules: r.eligibility_rules || r.eligibilityRules || '',
    status: r.status || 'active',
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    winnerUsername: r.winner_username || r.winnerUsername,
    winnerAnnouncedAt: r.winner_announced_at || r.winnerAnnouncedAt,
  };
}

function mapModelToDbGiveaway(g: Giveaway): any {
  return {
    id: g.id,
    title: g.title,
    description: g.description,
    prize: g.prize,
    first_place_prize: g.firstPlacePrize || g.firstPrize || null,
    second_place_prize: g.secondPlacePrize || g.secondPrize || null,
    third_place_prize: g.thirdPlacePrize || g.thirdPrize || null,
    start_date: g.startDate,
    end_date: g.endDate,
    min_coins_required: g.minCoinsRequired,
    eligibility_rules: g.eligibilityRules,
    status: g.status,
    created_at: g.createdAt,
    winner_username: g.winnerUsername || null,
    winner_announced_at: g.winnerAnnouncedAt || null,
  };
}

function mapDbAnnouncementToModel(r: any): Announcement {
  return {
    id: r.id,
    title: r.title || '',
    message: r.message || '',
    audience: r.audience || 'all',
    targetUserId: r.target_user_id || r.targetUserId,
    targetUsername: r.target_username || r.targetUsername,
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    createdByAdminName: r.created_by_admin_name || r.createdByAdminName || 'ASJADFX Admin',
  };
}

function mapModelToDbAnnouncement(a: Announcement): any {
  return {
    id: a.id,
    title: a.title,
    message: a.message,
    audience: a.audience,
    target_user_id: a.targetUserId || null,
    target_username: a.targetUsername || null,
    created_at: a.createdAt,
    created_by_admin_name: a.createdByAdminName || 'ASJADFX Admin',
  };
}

function mapDbNotificationToModel(r: any): AppNotification {
  return {
    id: r.id,
    userId: r.user_id || r.userId || '',
    type: r.type || 'task_approved',
    title: r.title || '',
    message: r.message || '',
    date: r.date || r.created_at || new Date().toISOString(),
    read: r.read ?? false,
    actionUrl: r.action_url || r.actionUrl,
  };
}

function mapModelToDbNotification(n: AppNotification): any {
  return {
    id: n.id,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    date: n.date,
    read: !!n.read,
    action_url: n.actionUrl || null,
  };
}

function mapDbPlatformToModel(r: any): PlatformConfig {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    icon: r.icon,
    officialUrl: r.official_url || r.officialUrl || '',
    defaultInstructions: r.default_instructions || r.defaultInstructions || '',
    status: r.status || 'active',
  };
}

function mapModelToDbPlatform(p: PlatformConfig): any {
  return {
    id: p.id,
    key: p.key,
    name: p.name,
    icon: p.icon,
    official_url: p.officialUrl,
    default_instructions: p.defaultInstructions,
    status: p.status,
  };
}
