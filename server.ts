import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for contact requests
  interface ContactRequest {
    id: string;
    name?: string;
    email: string;
    whatsapp: string;
    reason: string;
    conversationSnippet?: string;
    timestamp: string;
    ip?: string;
    status: 'new' | 'reviewed';
  }

  const contactRequests: ContactRequest[] = [];

  // Helper to create mail transporter lazily with environment variables
  function getMailTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
    return null;
  }

  // =========================================================================
  // API ROUTES (Mounted FIRST)
  // =========================================================================

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'asjadfx-backend', time: new Date().toISOString() });
  });

  // =========================================================================
  // SUPABASE AUTH & USERS SYNC ENDPOINT (Authoritative Source of Truth)
  // =========================================================================
  function getServerSupabaseUrl(): string {
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

  function getServerSupabaseAnonKey(): string {
    let key = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
    if (!key || key === 'undefined' || key === 'null') {
      key = 'sb_publishable_1TLmm_x6n0kcwpC2i-n_pA_d58hXZRi';
    }
    return key;
  }

  function getServerSupabaseServiceKey(): string {
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

  app.get('/api/admin/supabase-users', async (req, res) => {
    try {
      const supabaseUrl = getServerSupabaseUrl();
      const serviceRoleKey = getServerSupabaseServiceKey();
      const anonKey = getServerSupabaseAnonKey();

      const userMap = new Map<string, any>();

      // 1. If Service Role Key is configured, query Supabase Auth Admin API (Full source of truth)
      if (serviceRoleKey) {
        try {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          // Fetch all auth users with full pagination support (no users missed)
          let page = 1;
          const perPage = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data: authPageData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
              page,
              perPage,
            });

            if (authListError) {
              console.warn('[Server] Supabase Auth Admin listUsers error:', authListError.message);
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

          // Automatically ensure all auth users without a profile in DB get safely created
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
                console.warn('[Server] Auto profile create notice:', err);
              }
            }
          }
        } catch (adminErr) {
          console.warn('[Server] Supabase Admin fetch notice:', adminErr);
        }
      }

      // 2. If userMap is empty or Service Role Key wasn't provided, use Anon client to query public tables
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
          console.warn('[Server] Supabase Anon fetch notice:', anonErr);
        }
      }

      // Filter out only demo mock placeholders
      const mockIds = ['usr_001_arahm', 'usr_002_khan', 'usr_003_example', 'usr_004_zayn', 'usr_005_elena', 'usr_006_marcus'];
      const usersList = Array.from(userMap.values()).filter((u) => !mockIds.includes(u.id));

      return res.json({
        success: true,
        count: usersList.length,
        users: usersList,
      });
    } catch (err: any) {
      console.error('[Server] /api/admin/supabase-users error:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to query Supabase users',
      });
    }
  });

  // Contact Request Endpoint for ASJAD AI Escalation
  app.post('/api/contact-request', async (req, res) => {
    try {
      const { name, email, whatsapp, reason, conversationSnippet, timestamp } = req.body;

      if (!email || !whatsapp || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: email, whatsapp, and reason are required.',
        });
      }

      const newRequest: ContactRequest = {
        id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: name || 'ASJADFX Trader',
        email: String(email).trim(),
        whatsapp: String(whatsapp).trim(),
        reason: String(reason).trim(),
        conversationSnippet: conversationSnippet ? String(conversationSnippet).trim() : undefined,
        timestamp: timestamp || new Date().toISOString(),
        ip: req.ip || req.headers['x-forwarded-for']?.toString(),
        status: 'new',
      };

      contactRequests.unshift(newRequest);

      const adminEmail =
        process.env.ADMIN_EMAIL || process.env.ASJADFX_ADMIN_EMAIL || 'asjadtrades07@gmail.com';
      const emailFrom = process.env.EMAIL_FROM || '"ASJADFX Alerts" <alerts@asjadfx.com>';

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #05070A; color: #E2E8F0; padding: 24px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(0, 255, 102, 0.3);">
          <div style="border-bottom: 2px solid #00FF66; padding-bottom: 14px; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: #00FF66; color: #05070A; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; margin-bottom: 8px;">Official Escalation</div>
            <h2 style="color: #FFFFFF; margin: 0; font-size: 22px; letter-spacing: -0.5px;">⚡ New ASJAD AI Contact Request</h2>
            <p style="color: #00FF66; font-size: 13px; margin: 4px 0 0 0; font-family: monospace;">TRADE. EARN. RISE.</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #94A3B8; font-size: 14px; width: 140px;"><strong>User:</strong></td>
              <td style="padding: 8px 0; color: #FFFFFF; font-size: 14px; font-weight: bold;">${newRequest.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;"><strong>Email (Gmail):</strong></td>
              <td style="padding: 8px 0; color: #00FF66; font-size: 14px; font-weight: bold;">
                <a href="mailto:${newRequest.email}" style="color: #00FF66; text-decoration: none;">${newRequest.email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;"><strong>WhatsApp:</strong></td>
              <td style="padding: 8px 0; color: #FFD700; font-size: 14px; font-weight: bold;">
                <a href="https://wa.me/${newRequest.whatsapp.replace(/\D/g, '')}" style="color: #FFD700; text-decoration: none;">${newRequest.whatsapp}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94A3B8; font-size: 14px;"><strong>Submitted At:</strong></td>
              <td style="padding: 8px 0; color: #CBD5E1; font-size: 14px; font-family: monospace;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          <div style="background-color: #0F131C; border: 1px solid rgba(255, 215, 0, 0.3); border-left: 4px solid #FFD700; padding: 16px; border-radius: 10px; margin-bottom: 20px;">
            <strong style="color: #FFD700; font-size: 12px; text-transform: uppercase; font-family: monospace;">📌 Reason for Contacting Asjad:</strong>
            <p style="color: #FFFFFF; font-size: 15px; margin: 8px 0 0 0; line-height: 1.6;">${newRequest.reason}</p>
          </div>

          ${
            newRequest.conversationSnippet
              ? `
            <div style="background-color: #0A0D14; border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px; border-radius: 10px; margin-bottom: 20px;">
              <strong style="color: #64748B; font-size: 11px; text-transform: uppercase; font-family: monospace;">💬 Recent Conversation Snippet:</strong>
              <p style="color: #94A3B8; font-size: 12px; font-family: monospace; white-space: pre-line; margin: 8px 0 0 0; line-height: 1.5;">${newRequest.conversationSnippet}</p>
            </div>
          `
              : ''
          }

          <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; font-size: 11px; color: #64748B;">
            This alert was automatically generated by the ASJAD AI Assistant on the ASJADFX platform.
          </div>
        </div>
      `;

      const textContent = `
New ASJAD AI Contact Request
=======================================
User: ${newRequest.name}
Email: ${newRequest.email}
WhatsApp: ${newRequest.whatsapp}
Date: ${new Date().toLocaleString()}

Reason for Contact:
${newRequest.reason}

${newRequest.conversationSnippet ? `Conversation Snippet:\n${newRequest.conversationSnippet}\n` : ''}
=======================================
      `;

      const transporter = getMailTransporter();
      let emailSent = false;

      if (transporter) {
        try {
          await transporter.sendMail({
            from: emailFrom,
            to: adminEmail,
            subject: `New ASJAD AI Contact Request - ${newRequest.name} (${newRequest.whatsapp})`,
            text: textContent,
            html: htmlContent,
          });
          emailSent = true;
          console.log(`[ASJAD AI] Admin email alert successfully sent to ${adminEmail}`);
        } catch (mailErr) {
          console.error('[ASJAD AI] Mail transport send error:', mailErr);
        }
      } else {
        console.log(`[ASJAD AI Alert] Email notification recorded for Admin (${adminEmail}):`);
        console.log(`- User: ${newRequest.name}`);
        console.log(`- Email: ${newRequest.email}`);
        console.log(`- WhatsApp: ${newRequest.whatsapp}`);
        console.log(`- Reason: ${newRequest.reason}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Contact request recorded and forwarded to Asjad and the ASJADFX team.',
        emailSent,
        requestId: newRequest.id,
      });
    } catch (error: any) {
      console.error('Contact request API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process contact request',
      });
    }
  });

  // Admin endpoint to retrieve all escalation requests
  app.get('/api/contact-requests', (req, res) => {
    res.json({
      success: true,
      count: contactRequests.length,
      requests: contactRequests,
    });
  });

  // =========================================================================
  // VITE MIDDLEWARE (Development) or STATIC ASSETS (Production)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ ASJADFX server running on port ${PORT}`);
  });
}

startServer();
