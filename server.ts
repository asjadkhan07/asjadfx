import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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
