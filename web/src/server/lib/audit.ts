import { db, schema } from "../db";

export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, meta: Record<string, unknown> = {}) {
  await db.insert(schema.auditLogs).values({ actorId, action, entity, entityId: entityId ?? null, meta });
}
