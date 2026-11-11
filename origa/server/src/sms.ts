import type { Config } from './config.js';

export type SmsSender = (phone: string, text: string) => Promise<void>;

/**
 * Envoi des codes de connexion. En développement, le code est écrit dans le journal du serveur.
 * En production, une passerelle HTTP (agrégateur SMS connecté à Airtel Gabon et Moov Africa) reçoit
 * { to, text } avec un jeton Bearer. SMS_PROVIDER=brevo utilise l'API SMS transactionnels de Brevo (BREVO_API_KEY).
 */
export function createSms(cfg: Config, log: (msg: string) => void): SmsSender {
  if (cfg.smsProvider === 'http' && cfg.smsHttpUrl) {
    return async (to, text) => {
      const res = await fetch(cfg.smsHttpUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.smsHttpToken ?? ''}` },
        body: JSON.stringify({ to, text }),
      });
      if (!res.ok) throw new Error(`Passerelle SMS : ${res.status}`);
    };
  }
  if (cfg.smsProvider === 'brevo' && cfg.brevoApiKey) {
    // API SMS transactionnels de Brevo : le numéro est attendu sans le signe « + ».
    return async (to, text) => {
      const res = await fetch('https://api.brevo.com/v3/transactionalSMS/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': cfg.brevoApiKey! },
        body: JSON.stringify({ sender: cfg.smsSender, recipient: to.replace(/^\+/, ''), content: text, type: 'transactional' }),
      });
      if (!res.ok) throw new Error(`Passerelle SMS : ${res.status}`);
    };
  }
  return async (to, text) => { log(`[SMS → ${to}] ${text}`); };
}
