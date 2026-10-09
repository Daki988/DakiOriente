// Canaux sortants : e-mail, SMS, WhatsApp. En l'absence de fournisseur configuré, les envois sont journalisés.
type Out = { to: string; subject?: string; text: string };
export const outbox: Out[] = []; // utilisé par les tests

export async function sendEmail(o: Out) {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "Navigoal <no-reply@navigoal.com>", to: o.to, subject: o.subject, text: o.text }),
    });
    if (!r.ok) console.error("E-mail non envoyé", r.status, await r.text());
    return;
  }
  outbox.push(o);
  if (process.env.NODE_ENV !== "test") console.log(`[e-mail] ${o.to} · ${o.subject} · ${o.text}`);
}

export async function sendSms(o: Out) {
  if (process.env.SMS_WEBHOOK_URL) {
    await fetch(process.env.SMS_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
    return;
  }
  outbox.push(o);
  if (process.env.NODE_ENV !== "test") console.log(`[sms] ${o.to} · ${o.text}`);
}
