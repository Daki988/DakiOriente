import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { AppError, forbidden, notFound } from "../lib/errors";
import { findOrCreateConversation } from "./messaging";
import { notify } from "./notifications";

type User = typeof schema.users.$inferSelect;
export const appointmentSchema = z.object({ topic: z.string().trim().min(3).max(300), preferredAt: z.coerce.date().optional(), channel: z.enum(["visio", "telephone", "whatsapp"]).default("visio"), notes: z.string().max(2000).optional() });

export async function requestAppointment(student: User, raw: z.input<typeof appointmentSchema>) {
  if (!["eleve", "etudiant", "parent"].includes(student.role)) throw forbidden();
  const i = appointmentSchema.parse(raw);
  const [a] = await db.insert(schema.appointments).values({ studentId: student.id, ...i }).returning();
  const counselors = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.role, "conseiller"));
  for (const c of counselors) await notify(c.id, { kind: "rdv", title: `Demande de rendez-vous : ${i.topic}`, link: "/conseiller" });
  return a;
}

export async function listAppointments(user: User) {
  if (user.role === "conseiller") return db.select({ a: schema.appointments, s: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country } }).from(schema.appointments).innerJoin(schema.users, eq(schema.users.id, schema.appointments.studentId)).where(or(eq(schema.appointments.counselorId, user.id), isNull(schema.appointments.counselorId))).orderBy(asc(schema.appointments.preferredAt));
  return db.select({ a: schema.appointments, s: { id: schema.users.id, firstName: schema.users.firstName, lastName: schema.users.lastName, country: schema.users.country } }).from(schema.appointments).innerJoin(schema.users, eq(schema.users.id, schema.appointments.studentId)).where(eq(schema.appointments.studentId, user.id)).orderBy(desc(schema.appointments.createdAt));
}

export async function scheduleAppointment(counselor: User, id: string, scheduledAt: Date, notes?: string) {
  if (counselor.role !== "conseiller" && counselor.role !== "admin") throw forbidden();
  const [a] = await db.update(schema.appointments).set({ counselorId: counselor.id, scheduledAt, status: "confirme", notes: notes ?? null }).where(and(eq(schema.appointments.id, id), eq(schema.appointments.status, "demande"))).returning();
  if (!a) throw new AppError("Rendez-vous déjà traité ou introuvable.");
  await findOrCreateConversation(`Conseil d'orientation · ${a.topic}`, [a.studentId, counselor.id], { kind: "conseil", id: a.id });
  await notify(a.studentId, { kind: "rdv", title: "Rendez-vous confirmé avec un conseiller", body: scheduledAt.toLocaleString("fr-FR"), link: "/espace/conseiller", channels: ["app", "email", "sms"] });
  return a;
}

export async function closeAppointment(user: User, id: string, status: "termine" | "annule") {
  const [a] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
  if (!a) throw notFound("Rendez-vous");
  if (a.studentId !== user.id && a.counselorId !== user.id && user.role !== "admin") throw forbidden();
  await db.update(schema.appointments).set({ status }).where(eq(schema.appointments.id, id));
}
