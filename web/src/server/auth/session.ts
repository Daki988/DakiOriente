import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { db, schema } from "../db";
import { forbidden, unauthorized } from "../lib/errors";
import { randomToken, sha256 } from "./tokens";

export const SESSION_COOKIE = "ng_session";
const DAYS = 30;
export type Role = (typeof schema.roleEnum.enumValues)[number];
export type SessionUser = typeof schema.users.$inferSelect;

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + DAYS * 864e5);
  await db.insert(schema.sessions).values({ id: sha256(token), userId, expiresAt, userAgent: userAgent ?? null });
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, userId));
  return { token, expiresAt };
}

export async function userFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await db.select({ user: schema.users }).from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha256(token)), gt(schema.sessions.expiresAt, new Date()))).limit(1);
  const u = rows[0]?.user;
  return u && u.status !== "suspendu" ? u : null;
}

export async function destroySession(token: string) {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, sha256(token)));
}

// ---- Intégration Next.js (cookies httpOnly)
export async function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}
export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

/** Utilisateur connecté (cookie ou en-tête Authorization: Bearer pour l'API). */
export async function currentUser() {
  const bearer = headers().get("authorization")?.replace(/^Bearer\s+/i, "");
  return userFromToken(bearer || cookies().get(SESSION_COOKIE)?.value);
}

export async function requireUser(...roles: Role[]) {
  const u = await currentUser();
  if (!u) throw unauthorized();
  if (roles.length && !roles.includes(u.role)) throw forbidden();
  return u;
}
