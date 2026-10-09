import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { sendEmail, sendSms } from "../lib/messaging-channels";

const APP_URL = () => process.env.APP_URL || process.env.URL || "https://navigoal.netlify.app";

/** Notification interne + e-mail/SMS selon les canaux demandés et les coordonnées disponibles. */
export async function notify(userId: string, n: { kind: string; title: string; body?: string; link?: string; channels?: ("app" | "email" | "sms")[] }) {
  const channels = n.channels ?? ["app", "email"];
  await db.insert(schema.notifications).values({ userId, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null, channels });
  const [u] = await db.select({ email: schema.users.email, phone: schema.users.phone }).from(schema.users).where(eq(schema.users.id, userId));
  const text = `${n.body ?? n.title}${n.link ? `\n${APP_URL()}${n.link}` : ""}`;
  if (channels.includes("email") && u?.email) await sendEmail({ to: u.email, subject: `Navigoal · ${n.title}`, text });
  if (channels.includes("sms") && u?.phone) await sendSms({ to: u.phone, text: `Navigoal : ${n.title}` });
}

export async function listNotifications(userId: string, limit = 50) {
  return db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt)).limit(limit);
}

export async function unreadCount(userId: string) {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.notifications).where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)));
  return r.n;
}

export async function markRead(userId: string, id?: string) {
  await db.update(schema.notifications).set({ readAt: new Date() })
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt), id ? eq(schema.notifications.id, id) : undefined));
}
