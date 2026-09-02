import nodemailer from 'nodemailer';

function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || '';
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { name, email, whatsapp, reason, conversationSnippet, timestamp } = req.body || {};

    if (!email || !whatsapp || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, whatsapp, and reason are required.',
      });
    }

    const newRequest = {
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name || 'ASJADFX Trader',
      email: String(email).trim(),
      whatsapp: String(whatsapp).trim(),
      reason: String(reason).trim(),
      conversationSnippet: conversationSnippet ? String(conversationSnippet).trim() : undefined,
      timestamp: timestamp || new Date().toISOString(),
      status: 'new',
    };

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

    const transporter = getMailTransporter();
    let emailSent = false;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: emailFrom,
          to: adminEmail,
          subject: `New ASJAD AI Contact Request - ${newRequest.name} (${newRequest.whatsapp})`,
          text: `User: ${newRequest.name}\nEmail: ${newRequest.email}\nWhatsApp: ${newRequest.whatsapp}\nReason: ${newRequest.reason}`,
          html: htmlContent,
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('[ASJAD AI Vercel] Mail transport send error:', mailErr);
      }
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
}
