import { createClient } from '@supabase/supabase-js';

// Environment variable resolvers supporting Vercel, Node, and Vite naming conventions
function getSupabaseUrl(): string {
  try {
    let url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    if (!url || url === 'undefined' || url === 'null') {
      url = 'https://mtehyttuasfbvzjsjbkj.supabase.co';
    }
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

function getSupabaseAnonKey(): string {
  let key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!key || key === 'undefined' || key === 'null') {
    key = 'sb_publishable_1TLmm_x6n0kcwpC2i-n_pA_d58hXZRi';
  }
  return key;
}

function getSupabaseServiceRoleKey(): string {
  let key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();
  if (key === 'undefined' || key === 'null') {
    key = '';
  }
  return key;
}

export default async function handler(req: any, res: any) {
  // Set CORS and JSON Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceRoleKey();
    const anonKey = getSupabaseAnonKey();

    const userMap = new Map<string, any>();
    let serviceRoleActive = false;

    // 1. If Service Role Key is configured, query Supabase Auth Admin API (Full source of truth)
    if (serviceRoleKey) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Fetch all auth users with pagination support (100% complete enumeration)
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: authPageData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });

          if (authListError) {
            console.warn('[Vercel API] Supabase Auth Admin listUsers error:', authListError.message);
            break;
          }

          const users = authPageData?.users || [];
          for (const au of users) {
            const meta = au.user_metadata || (au as any).raw_user_meta_data || {};
            const email = (au.email || '').trim().toLowerCase();
            const defaultName = email ? email.split('@')[0] : 'Trader';
            const fullName = meta.full_name || meta.fullName || meta.display_name || meta.name || defaultName;
            const username = meta.username || meta.user_name || (email ? email.split('@')[0] : au.id.slice(0, 8));
            const instagram = meta.instagram_handle || meta.instagram_username || meta.instagramUsername || '';
            const isAdmin = email === 'asjadarmwrestlingvloge@gmail.com' || email === 'asjadtrades07@gmail.com';

            userMap.set(au.id, {
              id: au.id,
              fullName,
              username,
              email,
              instagramUsername: instagram,
              role: isAdmin ? 'admin' : 'user',
              coins: 0,
              coinBalance: 0,
              status: 'active',
              isRestricted: false,
              isBanned: false,
              createdAt: au.created_at || new Date().toISOString(),
              lastLoginAt: au.last_sign_in_at || au.created_at || new Date().toISOString(),
              tasksCompleted: 0,
              warnings: [],
              warningCount: 0,
              membership_type: 'free',
              premium_status: 'inactive',
              auth_source: 'supabase_auth',
            });
          }

          if (users.length < perPage) {
            hasMore = false;
          } else {
            page++;
          }
        }

        if (userMap.size > 0) {
          serviceRoleActive = true;
        }

        // Fetch profiles table using Admin client (bypasses RLS)
        const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
        if (Array.isArray(profiles)) {
          for (const p of profiles) {
            const uid = p.id || p.user_id || p.userId || '';
            if (!uid) continue;
            const existing = userMap.get(uid);
            const pEmail = (p.email || p.user_email || '').trim().toLowerCase();
            const coins = Number(p.coins ?? p.coin_balance ?? p.coinBalance ?? 0);
            const isAdm = pEmail === 'asjadarmwrestlingvloge@gmail.com' || pEmail === 'asjadtrades07@gmail.com' || p.role === 'admin';

            if (existing) {
              userMap.set(uid, {
                ...existing,
                fullName: p.full_name || p.fullName || p.display_name || existing.fullName,
                username: p.username || p.user_name || existing.username,
                email: pEmail || existing.email,
                instagramUsername: p.instagram_username || p.instagram_handle || existing.instagramUsername,
                avatarUrl: p.avatar_url || p.avatarUrl || existing.avatarUrl,
                coins: coins || existing.coins,
                coinBalance: coins || existing.coinBalance,
                role: isAdm ? 'admin' : (p.role || existing.role),
                status: p.status || (p.is_banned ? 'banned' : existing.status),
                isRestricted: p.is_restricted ?? p.isRestricted ?? existing.isRestricted,
                isBanned: p.is_banned ?? p.isBanned ?? existing.isBanned,
                membership_type: p.membership_type || existing.membership_type,
                premium_status: p.premium_status || existing.premium_status,
                premium_started_at: p.premium_started_at || existing.premium_started_at,
                premium_expires_at: p.premium_expires_at || existing.premium_expires_at,
              });
            } else {
              userMap.set(uid, {
                id: uid,
                fullName: p.full_name || p.fullName || p.display_name || p.name || (pEmail ? pEmail.split('@')[0] : 'Trader'),
                username: p.username || p.user_name || (pEmail ? pEmail.split('@')[0] : uid.slice(0, 8)),
                email: pEmail,
                instagramUsername: p.instagram_username || p.instagram_handle || '',
                avatarUrl: p.avatar_url || p.avatarUrl || null,
                coins: coins,
                coinBalance: coins,
                role: isAdm ? 'admin' : (p.role || 'user'),
                status: p.status || (p.is_banned ? 'banned' : 'active'),
                isRestricted: !!(p.is_restricted ?? p.isRestricted),
                isBanned: !!(p.is_banned ?? p.isBanned),
                createdAt: p.created_at || p.createdAt || new Date().toISOString(),
                lastLoginAt: p.last_login_at || p.lastLoginAt || new Date().toISOString(),
                tasksCompleted: Number(p.tasks_completed ?? p.tasksCompleted ?? 0),
                warnings: [],
                warningCount: 0,
                membership_type: p.membership_type || 'free',
                premium_status: p.premium_status || 'inactive',
              });
            }
          }
        }

        // Also check custom users table
        const { data: customUsers } = await supabaseAdmin.from('users').select('*');
        if (Array.isArray(customUsers)) {
          for (const cu of customUsers) {
            const uid = cu.id || cu.user_id || cu.userId || '';
            if (!uid) continue;
            const existing = userMap.get(uid);
            const cEmail = (cu.email || cu.user_email || '').trim().toLowerCase();
            const coins = Number(cu.coins ?? cu.coin_balance ?? cu.coinBalance ?? 0);
            const isAdm = cEmail === 'asjadarmwrestlingvloge@gmail.com' || cEmail === 'asjadtrades07@gmail.com' || cu.role === 'admin';

            if (existing) {
              userMap.set(uid, {
                ...existing,
                fullName: cu.full_name || cu.fullName || cu.display_name || existing.fullName,
                username: cu.username || cu.user_name || existing.username,
                email: cEmail || existing.email,
                instagramUsername: cu.instagram_username || cu.instagram_handle || existing.instagramUsername,
                avatarUrl: cu.avatar_url || cu.avatarUrl || existing.avatarUrl,
                coins: coins || existing.coins,
                coinBalance: coins || existing.coinBalance,
                role: isAdm ? 'admin' : (cu.role || existing.role),
                status: cu.status || (cu.is_banned ? 'banned' : existing.status),
                isRestricted: cu.is_restricted ?? cu.isRestricted ?? existing.isRestricted,
                isBanned: cu.is_banned ?? cu.isBanned ?? existing.isBanned,
                membership_type: cu.membership_type || existing.membership_type,
                premium_status: cu.premium_status || existing.premium_status,
              });
            } else {
              userMap.set(uid, {
                id: uid,
                fullName: cu.full_name || cu.fullName || cu.display_name || cu.name || (cEmail ? cEmail.split('@')[0] : 'Trader'),
                username: cu.username || cu.user_name || (cEmail ? cEmail.split('@')[0] : uid.slice(0, 8)),
                email: cEmail,
                instagramUsername: cu.instagram_username || cu.instagram_handle || '',
                avatarUrl: cu.avatar_url || cu.avatarUrl || null,
                coins: coins,
                coinBalance: coins,
                role: isAdm ? 'admin' : (cu.role || 'user'),
                status: cu.status || (cu.is_banned ? 'banned' : 'active'),
                isRestricted: !!(cu.is_restricted ?? cu.isRestricted),
                isBanned: !!(cu.is_banned ?? cu.isBanned),
                createdAt: cu.created_at || cu.createdAt || new Date().toISOString(),
                lastLoginAt: cu.last_login_at || cu.lastLoginAt || new Date().toISOString(),
                tasksCompleted: Number(cu.tasks_completed ?? cu.tasksCompleted ?? 0),
                warnings: [],
                warningCount: 0,
                membership_type: cu.membership_type || 'free',
                premium_status: cu.premium_status || 'inactive',
              });
            }
          }
        }

        // Automatically ensure all auth users without a profile in DB get safely created in profiles table
        for (const [uid, userRecord] of userMap.entries()) {
          const hasProfile = profiles?.some((p) => p.id === uid || p.user_id === uid);
          if (!hasProfile && uid.length > 20) {
            try {
              await supabaseAdmin
                .from('profiles')
                .upsert(
                  {
                    id: uid,
                    user_id: uid,
                    full_name: userRecord.fullName,
                    username: userRecord.username,
                    email: userRecord.email,
                    instagram_username: userRecord.instagramUsername,
                    coins: userRecord.coins,
                    coin_balance: userRecord.coins,
                    role: userRecord.role,
                    status: userRecord.status,
                    created_at: userRecord.createdAt,
                    membership_type: userRecord.membership_type,
                    premium_status: userRecord.premium_status,
                  },
                  { onConflict: 'id' }
                );
            } catch (err: any) {
              console.warn('[Vercel API] Auto profile create notice:', err);
            }
          }
        }
      } catch (adminErr) {
        console.warn('[Vercel API] Supabase Admin fetch notice:', adminErr);
      }
    }

    // 2. If userMap is empty or Service Role Key wasn't provided, query public tables using Anon key
    if (userMap.size === 0) {
      try {
        const supabaseClient = createClient(supabaseUrl, anonKey);
        const [profRes, usersRes, upRes] = await Promise.allSettled([
          supabaseClient.from('profiles').select('*'),
          supabaseClient.from('users').select('*'),
          supabaseClient.from('user_profiles').select('*'),
        ]);

        if (profRes.status === 'fulfilled' && Array.isArray(profRes.value.data)) {
          for (const p of profRes.value.data) {
            const uid = p.id || p.user_id || p.userId || '';
            if (!uid) continue;
            const email = (p.email || p.user_email || '').trim().toLowerCase();
            const isAdm =
              email === 'asjadarmwrestlingvloge@gmail.com' ||
              email === 'asjadtrades07@gmail.com' ||
              p.role === 'admin';
            const coins = Number(p.coins ?? p.coin_balance ?? 0);
            userMap.set(uid, {
              id: uid,
              fullName: p.full_name || p.fullName || p.display_name || (email ? email.split('@')[0] : 'Trader'),
              username: p.username || p.user_name || (email ? email.split('@')[0] : uid.slice(0, 8)),
              email,
              instagramUsername: p.instagram_username || p.instagram_handle || '',
              avatarUrl: p.avatar_url || p.avatarUrl || null,
              coins,
              coinBalance: coins,
              role: isAdm ? 'admin' : (p.role || 'user'),
              status: p.status || (p.is_banned ? 'banned' : 'active'),
              isRestricted: !!(p.is_restricted ?? p.isRestricted),
              isBanned: !!(p.is_banned ?? p.isBanned),
              createdAt: p.created_at || new Date().toISOString(),
              lastLoginAt: p.last_login_at || new Date().toISOString(),
              tasksCompleted: Number(p.tasks_completed ?? 0),
              warnings: [],
              warningCount: 0,
              membership_type: p.membership_type || 'free',
              premium_status: p.premium_status || 'inactive',
            });
          }
        }

        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data)) {
          for (const u of usersRes.value.data) {
            const uid = u.id || u.user_id || u.userId || '';
            if (!uid) continue;
            const email = (u.email || u.user_email || '').trim().toLowerCase();
            const isAdm =
              email === 'asjadarmwrestlingvloge@gmail.com' ||
              email === 'asjadtrades07@gmail.com' ||
              u.role === 'admin';
            const coins = Number(u.coins ?? u.coin_balance ?? 0);
            if (userMap.has(uid)) {
              const existing = userMap.get(uid);
              userMap.set(uid, {
                ...existing,
                fullName: u.full_name || existing.fullName,
                email: email || existing.email,
                coins: coins || existing.coins,
              });
            } else {
              userMap.set(uid, {
                id: uid,
                fullName: u.full_name || u.fullName || (email ? email.split('@')[0] : 'Trader'),
                username: u.username || (email ? email.split('@')[0] : uid.slice(0, 8)),
                email,
                instagramUsername: u.instagram_username || u.instagram_handle || '',
                avatarUrl: u.avatar_url || null,
                coins,
                coinBalance: coins,
                role: isAdm ? 'admin' : (u.role || 'user'),
                status: u.status || 'active',
                isRestricted: !!u.is_restricted,
                isBanned: !!u.is_banned,
                createdAt: u.created_at || new Date().toISOString(),
                lastLoginAt: u.last_login_at || new Date().toISOString(),
                tasksCompleted: Number(u.tasks_completed ?? 0),
                warnings: [],
                warningCount: 0,
                membership_type: u.membership_type || 'free',
                premium_status: u.premium_status || 'inactive',
              });
            }
          }
        }

        if (upRes.status === 'fulfilled' && Array.isArray(upRes.value.data)) {
          for (const up of upRes.value.data) {
            const uid = up.id || up.user_id || up.userId || '';
            if (!uid || userMap.has(uid)) continue;
            const email = (up.email || up.user_email || '').trim().toLowerCase();
            const isAdm =
              email === 'asjadarmwrestlingvloge@gmail.com' ||
              email === 'asjadtrades07@gmail.com' ||
              up.role === 'admin';
            const coins = Number(up.coins ?? up.coin_balance ?? 0);
            userMap.set(uid, {
              id: uid,
              fullName: up.full_name || up.fullName || (email ? email.split('@')[0] : 'Trader'),
              username: up.username || (email ? email.split('@')[0] : uid.slice(0, 8)),
              email,
              instagramUsername: up.instagram_username || up.instagram_handle || '',
              avatarUrl: up.avatar_url || null,
              coins,
              coinBalance: coins,
              role: isAdm ? 'admin' : (up.role || 'user'),
              status: up.status || 'active',
              isRestricted: !!up.is_restricted,
              isBanned: !!up.is_banned,
              createdAt: up.created_at || new Date().toISOString(),
              lastLoginAt: up.last_login_at || new Date().toISOString(),
              tasksCompleted: Number(up.tasks_completed ?? 0),
              warnings: [],
              warningCount: 0,
              membership_type: up.membership_type || 'free',
              premium_status: up.premium_status || 'inactive',
            });
          }
        }
      } catch (anonErr) {
        console.warn('[Vercel API] Supabase Anon fetch notice:', anonErr);
      }
    }

    // Filter out only demo mock placeholders
    const mockIds = ['usr_001_arahm', 'usr_002_khan', 'usr_003_example', 'usr_004_zayn', 'usr_005_elena', 'usr_006_marcus'];
    const usersList = Array.from(userMap.values()).filter((u) => !mockIds.includes(u.id));

    return res.status(200).json({
      success: true,
      count: usersList.length,
      users: usersList,
      serviceRoleActive,
      supabaseUrl,
    });
  } catch (err: any) {
    console.error('[Vercel API] /api/admin/supabase-users error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to query Supabase users',
    });
  }
}
