import { and, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;

/** Masque téléphones, e-mails et liens tant qu'une réservation Navilease n'est pas payée (anti-fraude). */
export function maskContacts(s: string) {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[coordonnée masquée]")
    .replace(/(\+?\d[\d .-]{7,}\d)/g, "[coordonnée masquée]")
    .replace(/(https?:\/\/|www\.)\S+/gi, "[lien masqué]")
    .replace(/\b(whatsapp|wa\.me|telegram)\b/gi, "[masqué]");
}

export async function findOrCreateConversation(subject: string, participantIds: string[], context?: { kind: string; id: string }) {
  if (context) {
    const [c] = await db.select().from(schema.conversations).where(and(eq(schema.conversations.contextKind, context.kind), eq(schema.conversations.contextId, context.id))).limit(1);
    if (c) {
      await db.insert(schema.conversationParticipants).values(participantIds.map((u) => ({ conversationId: c.id, userId: u }))).onConflictDoNothing();
      return c;
    }
  }
  const [c] = await db.insert(schema.conversations).values({ subject, contextKind: context?.kind ?? null, contextId: context?.id ?? null }).returning();
  await db.insert(schema.conversationParticipants).values([...new Set(participantIds)].map((u) => ({ conversationId: c.id, userId: u })));
  return c;
}

async function assertParticipant(userId: string, conversationId: string) {
  const r = await db.select().from(schema.conversationParticipants).where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, userId)));
  if (!r.length) throw forbidden();
}

async function mustMask(conv: typeof schema.conversations.$inferSelect) {
  if (conv.contextKind !== "booking" && conv.contextKind !== "housing") return false;
  if (conv.contextKind === "housing") return true;
  const [b] = await db.select({ s: schema.bookings.status }).from(schema.bookings).where(eq(schema.bookings.id, conv.contextId!));
  return !b || ["demande", "acceptee", "attente_garant", "refusee", "annulee"].includes(b.s);
}

export async function sendMessage(author: User, conversationId: string, body: string) {
  const text = body.trim();
  if (!text) throw new AppError("Message vide.");
  if (text.length > 5000) throw new AppError("Message trop long.");
  await assertParticipant(author.id, conversationId);
  const [conv] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId));
  const masked = await mustMask(conv);
  const finalBody = masked ? maskContacts(text) : text;
  const [m] = await db.insert(schema.messages).values({ conversationId, authorId: author.id, body: finalBody, masked: masked && finalBody !== text }).returning();
  await db.update(schema.conversations).set({ lastMessageAt: new Date() }).where(eq(schema.conversations.id, conversationId));
  await db.update(schema.conversationParticipants).set({ lastReadAt: new Date() }).where(and(eq(schema.conversationParticipants.conversationId, conversationId), eq(schema.conversationParticipants.userId, author.id)));
  const others = await db.select({ u: schema.conversationParticipants.userId }).from(schema.conversationParticipants).where(and(eq(schema.conversationParticipants.conversationId, conversationId), ne(schema.conversationParticipants.userId, author.id)));
  for (const o of others) await notify(o.u, { kind: "message", title: `Nouveau message de ${author.firstName} · ${conv.subject}`, link: `/messages/${conversationId}`, channels: ["app"] });
  return m;
}

export async function listConversations(userId: string) {
  const rows = await db.select({ c: schema.conversations, lastReadAt: schema.conversationParticipants.lastReadAt }).from(schema.conversationParticipants)
    .innerJoin(schema.conversations, eq(schema.conversations.id, schema.conversationParticipants.conversationId))
    .where(eq(schema.conversationParticipants.userId, userId)).orderBy(desc(schema.conversations.lastMessageAt));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.c.id);
  const parts = await db.select({ cid: schema.conversationParticipants.conversationId, id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role })
    .from(schema.conversationParticipants).innerJoin(schema.users, eq(schema.users.id, schema.conversationParticipants.userId)).where(inArray(schema.conversationParticipants.conversationId, ids));
  const last = await db.execute<{ conversation_id: string; body: string; created_at: Date; author_id: string }>(sql`select distinct on (conversation_id) conversation_id, body, created_at, author_id from messages where conversation_id in ${ids} order by conversation_id, created_at desc`);
  const unread = await Promise.all(rows.map(async (r) => {
    const [n] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.messages).where(and(eq(schema.messages.conversationId, r.c.id), ne(schema.messages.authorId, userId), r.lastReadAt ? gt(schema.messages.createdAt, r.lastReadAt) : undefined));
    return n.n;
  }));
  return rows.map((r, k) => ({ ...r.c, unread: unread[k], participants: parts.filter((p) => p.cid === r.c.id && p.id !== userId), last: last.rows.find((l) => l.conversation_id === r.c.id) ?? null }));
}

export async function getConversation(userId: string, id: string) {
  await assertParticipant(userId, id);
  const [c] = await db.select().from(schema.conversations).where(eq(schema.conversations.id, id));
  if (!c) throw notFound("Conversation");
  const msgs = await db.select({ m: schema.messages, a: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, role: schema.users.role } })
    .from(schema.messages).innerJoin(schema.users, eq(schema.users.id, schema.messages.authorId)).where(eq(schema.messages.conversationId, id)).orderBy(schema.messages.createdAt);
  await db.update(schema.conversationParticipants).set({ lastReadAt: new Date() }).where(and(eq(schema.conversationParticipants.conversationId, id), eq(schema.conversationParticipants.userId, userId)));
  return { conversation: c, messages: msgs, masked: await mustMask(c) };
}
