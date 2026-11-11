import nodemailer from 'nodemailer';
import type { Config } from './config.js';

export interface MailAttachment { filename: string; content: Buffer; contentType: string }
export interface Mail { to: string[]; subject: string; html: string; attachments?: MailAttachment[] }
export type Mailer = (mail: Mail) => Promise<void>;

/**
 * Envoi des rapports par e-mail. En développement, le message est écrit dans le journal du serveur.
 * En production : relais SMTP (MAIL_PROVIDER=smtp, SMTP_URL) ou API Brevo (MAIL_PROVIDER=brevo, BREVO_API_KEY).
 */
export function createMailer(cfg: Config, log: (msg: string) => void): Mailer {
  if (cfg.mailProvider === 'smtp' && cfg.smtpUrl) {
    const transport = nodemailer.createTransport(cfg.smtpUrl);
    return async (m) => { await transport.sendMail({ from: cfg.mailFrom, to: m.to, subject: m.subject, html: m.html, attachments: m.attachments }); };
  }
  if (cfg.mailProvider === 'brevo' && cfg.brevoApiKey) {
    const from = cfg.mailFrom.match(/^(.*)<(.+)>$/);
    return async (m) => {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': cfg.brevoApiKey! },
        body: JSON.stringify({
          sender: { name: from?.[1].trim() || 'Origa', email: (from?.[2] ?? cfg.mailFrom).trim() },
          to: m.to.map((email) => ({ email })), subject: m.subject, htmlContent: m.html,
          ...(m.attachments?.length ? { attachment: m.attachments.map((a) => ({ name: a.filename, content: a.content.toString('base64') })) } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Envoi d'e-mail : ${res.status}`);
    };
  }
  return async (m) => { log(`[E-mail → ${m.to.join(', ')}] ${m.subject} (${m.attachments?.map((a) => a.filename).join(', ') ?? 'sans pièce jointe'})`); };
}
