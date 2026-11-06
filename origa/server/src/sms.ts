import type { Config } from './config.js';

export type SmsSender = (phone: string, text: string) => Promise<void>;

/**
 * Envoi des codes de connexion. En développement, le code est écrit dans le journal du serveur.
 * En production, une passerelle HTTP (agrégateur SMS connecté à Airtel Gabon et Moov Africa) reçoit
 * { to, text } avec un jeton Bearer.
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
  return async (to, text) => { log(`[SMS → ${to}] ${text}`); };
}
