// Canaux sortants : e-mail (SMTP, ex. contact@navigoal.net chez LWS), SMS. Sans configuration, les envois sont journalisés.
import fs from "node:fs";
import path from "node:path";
import { emailHtml, emailTexte, type EmailContenu } from "./email-template";

export type Out = { to: string; subject?: string; text: string } & EmailContenu;
export const outbox: Out[] = []; // utilisé par les tests

type Transport = { sendMail: (m: Record<string, unknown>) => Promise<unknown> };
let transport: Transport | null | undefined;

async function smtp(): Promise<Transport | null> {
  if (transport !== undefined) return transport;
  if (!process.env.SMTP_HOST) return (transport = null);
  const nodemailer = await import("nodemailer");
  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    // Connexion conservée et réutilisée : évite une négociation TLS par e-mail (inscription, notifications en série).
    pool: true, maxConnections: 2,
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

const LOGO = (() => {
  for (const p of [path.join(process.cwd(), "public", "brand", "navigoal-email.png"), path.join(process.cwd(), "web", "public", "brand", "navigoal-email.png")])
    if (fs.existsSync(p)) return p;
  return null;
})();

// État de l'envoi d'e-mails. Une panne SMTP est invisible autrement : sendEmail journalise et rend la main,
// et personne ne s'aperçoit que plus rien ne part (panne du 27/11/2026, mot de passe refusé pendant des jours).
// Repris par /api/sante, par le contrôle de fin de mise en ligne et par le workflow « Diagnostic ».
export type EtatEmail = { configure: boolean; etat: "ok" | "en échec" | "non configuré" | "inconnu"; envoyes: number; echecs: number; dernierEchec: { quand: string; message: string } | null };
const etat: EtatEmail = { configure: false, etat: "inconnu", envoyes: 0, echecs: 0, dernierEchec: null };
const echec = (e: unknown) => {
  etat.echecs += 1;
  etat.etat = "en échec";
  etat.dernierEchec = { quand: new Date().toISOString(), message: (e as Error)?.message ?? String(e) };
};

export function etatEmail(): EtatEmail {
  return { ...etat, configure: !!process.env.SMTP_HOST };
}

/** Ouvre une session SMTP sans envoyer d'e-mail : dit tout de suite si les identifiants sont acceptés. */
export async function verifierEmail(): Promise<EtatEmail> {
  const t = await smtp();
  if (!t) {
    etat.etat = "non configuré";
    return etatEmail();
  }
  try {
    await (t as unknown as { verify: () => Promise<unknown> }).verify();
    etat.etat = "ok";
  } catch (e) {
    echec(e);
    console.error("E-MAIL HORS SERVICE : le serveur SMTP refuse nos identifiants —", (e as Error).message);
  }
  return etatEmail();
}

export async function sendEmail(o: Out) {
  const from = process.env.MAIL_FROM || "Navigoal <contact@navigoal.net>";
  const t = await smtp();
  if (t) {
    try {
      await t.sendMail({
        from, to: o.to, subject: o.subject ?? "Navigoal", replyTo: process.env.MAIL_REPLY_TO || "contact@navigoal.net",
        text: emailTexte(o), html: emailHtml(o, LOGO ? "cid:logo-navigoal" : null),
        attachments: LOGO ? [{ filename: "navigoal.png", path: LOGO, cid: "logo-navigoal" }] : [],
      });
      etat.envoyes += 1;
      etat.etat = "ok";
    } catch (e) {
      echec(e);
      console.error("E-mail non envoyé", o.to, (e as Error).message);
    }
    return;
  }
  etat.etat = "non configuré";
  outbox.push(o);
  if (process.env.NODE_ENV !== "test") console.log(`[e-mail] ${o.to} · ${o.subject} · ${o.text}`);
}

export async function sendSms(o: Out) {
  if (process.env.SMS_WEBHOOK_URL) {
    await fetch(process.env.SMS_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: o.to, text: o.text }) });
    return;
  }
  outbox.push(o);
  if (process.env.NODE_ENV !== "test") console.log(`[sms] ${o.to} · ${o.text}`);
}
