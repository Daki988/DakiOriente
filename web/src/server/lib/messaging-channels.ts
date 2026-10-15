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
    } catch (e) {
      console.error("E-mail non envoyé", o.to, (e as Error).message);
    }
    return;
  }
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
