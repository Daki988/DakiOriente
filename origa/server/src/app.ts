import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { Config } from './config.js';
import type { Db } from './db.js';
import { createSms, type SmsSender } from './sms.js';
import { hashOtp, lotSigner, newOtp, normalizePhone, sameHash, sha256hex, signToken, verifyToken, type Claims } from './security.js';
import { ALL_TABLES, canRead, canWrite, farmOf } from './scope.js';

declare module 'fastify' {
  interface FastifyRequest { user?: Claims }
}

interface SyncItem { table: string; op: 'put' | 'delete'; key: string; payload: Record<string, unknown>; at: string }

const PROVINCES: Record<string, string> = {
  GA1: 'Estuaire', GA2: 'Haut-Ogooué', GA3: 'Moyen-Ogooué', GA4: 'Ngounié', GA5: 'Nyanga',
  GA6: 'Ogooué-Ivindo', GA7: 'Ogooué-Lolo', GA8: 'Ogooué-Maritime', GA9: 'Woleu-Ntem',
};

export async function buildApp(cfg: Config, db: Db, opts: { sms?: SmsSender; logger?: boolean } = {}) {
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 5 * 1024 * 1024, trustProxy: true, maxParamLength: 300 });
  await app.register(cors, { origin: cfg.corsOrigins, credentials: false });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  const sms = opts.sms ?? createSms(cfg, (m) => app.log.info(m));
  const signer = lotSigner(cfg.lotSigningKey);

  async function audit(userId: number | null, action: string, tbl?: string, key?: string) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('LOCK TABLE audit IN EXCLUSIVE MODE');
      const prev = (await client.query('SELECT hash FROM audit ORDER BY id DESC LIMIT 1')).rows[0]?.hash ?? '0'.repeat(64);
      const at = new Date().toISOString();
      const hash = sha256hex(JSON.stringify({ prev, at, userId, action, tbl, key }));
      await client.query('INSERT INTO audit (at, user_id, action, tbl, key, prev_hash, hash) VALUES ($1,$2,$3,$4,$5,$6,$7)', [at, userId, action, tbl ?? null, key ?? null, prev, hash]);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async function auth(req: FastifyRequest, reply: FastifyReply) {
    const h = req.headers.authorization ?? '';
    const claims = h.startsWith('Bearer ') ? verifyToken(h.slice(7), cfg.jwtSecret) : null;
    if (!claims) return reply.code(401).send({ error: 'Session expirée, reconnectez-vous.' });
    req.user = claims;
  }

  async function bcegFarms(): Promise<Set<string>> {
    const r = await db.query(`SELECT key FROM records WHERE tbl='farms' AND (payload->>'bcegFinanced')::boolean AND payload ? 'bcegConsentAt'`);
    return new Set(r.rows.map((x) => x.key));
  }

  app.get('/health', async () => {
    await db.query('SELECT 1');
    return { ok: true, service: 'origa', time: new Date().toISOString() };
  });

  // ---------- Authentification par code SMS ----------
  app.post<{ Body: { phone?: string } }>('/auth/otp/request', { config: { rateLimit: { max: cfg.authRateLimit, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const phone = normalizePhone(req.body?.phone ?? '');
    if (!phone) return reply.code(400).send({ error: 'Numéro de téléphone invalide.' });
    const recent = await db.query(`SELECT count(*)::int AS n FROM otp_codes WHERE phone=$1 AND created_at > now() - interval '10 minutes'`, [phone]);
    if (recent.rows[0].n >= 3) return reply.code(429).send({ error: 'Trop de demandes. Réessayez dans 10 minutes.' });
    const user = (await db.query('SELECT id FROM users WHERE phone=$1 AND active', [phone])).rows[0];
    // Réponse identique que le numéro soit connu ou non : on ne révèle pas qui est inscrit.
    if (user) {
      const code = newOtp();
      await db.query(`INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1,$2, now() + make_interval(secs => $3))`, [phone, hashOtp(phone, code, cfg.jwtSecret), cfg.otpTtlSeconds]);
      await sms(phone, `Origa : votre code de connexion est ${code}. Il expire dans 5 minutes. Ne le communiquez à personne.`);
    }
    return { sent: true, expiresIn: cfg.otpTtlSeconds };
  });

  app.post<{ Body: { phone?: string; code?: string } }>('/auth/otp/verify', { config: { rateLimit: { max: cfg.authRateLimit * 2, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const phone = normalizePhone(req.body?.phone ?? '');
    const code = String(req.body?.code ?? '');
    if (!phone || !/^\d{6}$/.test(code)) return reply.code(400).send({ error: 'Code invalide.' });
    const otp = (await db.query(`SELECT * FROM otp_codes WHERE phone=$1 AND NOT used AND expires_at > now() ORDER BY created_at DESC LIMIT 1`, [phone])).rows[0];
    if (!otp || otp.attempts >= 5) return reply.code(401).send({ error: 'Code expiré. Demandez un nouveau code.' });
    if (!sameHash(otp.code_hash, hashOtp(phone, code, cfg.jwtSecret))) {
      await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id=$1', [otp.id]);
      return reply.code(401).send({ error: 'Code incorrect.' });
    }
    await db.query('UPDATE otp_codes SET used = TRUE WHERE id=$1', [otp.id]);
    const u = (await db.query('SELECT * FROM users WHERE phone=$1 AND active', [phone])).rows[0];
    if (!u) return reply.code(401).send({ error: 'Compte inactif.' });
    const claims = { sub: u.id, role: u.role, name: u.name, farmId: u.farm_id, farmIds: u.farm_ids, operatorId: u.operator_id };
    await audit(u.id, 'connexion');
    return { token: signToken(claims, cfg.jwtSecret, cfg.tokenTtlSeconds), user: claims, expiresIn: cfg.tokenTtlSeconds };
  });

  app.get('/me', { preHandler: auth }, async (req) => req.user);

  // ---------- Synchronisation ----------
  app.post<{ Body: { items?: SyncItem[] } }>('/sync', { preHandler: auth }, async (req, reply) => {
    const u = req.user!;
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length > 500) return reply.code(400).send({ error: 'Lot de synchronisation invalide (500 éléments maximum).' });
    const applied: string[] = []; const conflicts: { table: string; key: string }[] = []; const rejected: { table: string; key: string; reason: string }[] = [];
    for (const it of items) {
      if (!it || typeof it.key !== 'string' || !ALL_TABLES.includes(it.table) || it.op !== 'put' || typeof it.payload !== 'object' || it.payload === null || Number.isNaN(Date.parse(it.at))) {
        rejected.push({ table: String(it?.table), key: String(it?.key), reason: 'élément invalide' }); continue;
      }
      if (String(it.payload.id) !== it.key) { rejected.push({ table: it.table, key: it.key, reason: 'identifiant incohérent' }); continue; }
      const cur = (await db.query('SELECT payload, client_at FROM records WHERE tbl=$1 AND key=$2', [it.table, it.key])).rows[0];
      let payload = { ...it.payload };
      const farmId = farmOf(it.table, payload);
      // Une fiche existante ne change pas de ferme (empêche de déplacer des données hors périmètre).
      if (cur && farmOf(it.table, cur.payload) !== farmId) { rejected.push({ table: it.table, key: it.key, reason: 'changement de ferme interdit' }); continue; }
      const denied = canWrite(u, it.table, farmId, payload, cur?.payload);
      if (denied) { rejected.push({ table: it.table, key: it.key, reason: denied }); continue; }
      // Règle de conflit documentée : la dernière saisie horodatée l'emporte, l'autre est conservée et signalée.
      if (cur && new Date(cur.client_at) > new Date(it.at)) {
        await db.query('INSERT INTO conflicts (tbl, key, incoming, current, user_id) VALUES ($1,$2,$3,$4,$5)', [it.table, it.key, payload, cur.payload, u.sub]);
        conflicts.push({ table: it.table, key: it.key }); continue;
      }
      // Identifiants de lot jamais réutilisés ; signature apposée par le serveur seul.
      if (it.table === 'lots') {
        if (cur && cur.payload.signature) payload = { ...payload, signature: cur.payload.signature, id: cur.payload.id };
        else payload = { ...payload, signature: signer.sign(it.key) };
      }
      await db.query(
        `INSERT INTO records (tbl, key, farm_id, payload, client_at, updated_by) VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (tbl, key) DO UPDATE SET payload=EXCLUDED.payload, farm_id=EXCLUDED.farm_id, client_at=EXCLUDED.client_at,
           updated_by=EXCLUDED.updated_by, server_at=clock_timestamp(), seq=nextval(pg_get_serial_sequence('records','seq'))`,
        [it.table, it.key, farmId, payload, it.at, u.sub],
      );
      await audit(u.sub, cur ? 'modification' : 'création', it.table, it.key);
      applied.push(`${it.table}/${it.key}`);
    }
    return { applied: applied.length, conflicts, rejected };
  });

  app.get<{ Querystring: { since?: string; limit?: string } }>('/sync/pull', { preHandler: auth }, async (req) => {
    const u = req.user!;
    const since = Number(req.query.since ?? 0) || 0;
    const limit = Math.min(2000, Number(req.query.limit ?? 1000) || 1000);
    const rows = (await db.query('SELECT tbl, key, farm_id, payload, seq FROM records WHERE seq > $1 ORDER BY seq LIMIT $2', [since, limit])).rows;
    const bceg = u.role === 'bceg' ? await bcegFarms() : new Set<string>();
    const visible = rows.filter((r) => canRead(u, r.tbl, r.farm_id, bceg));
    const cursor = rows.length ? Number(rows[rows.length - 1].seq) : since;
    return { items: visible.map((r) => ({ table: r.tbl, key: r.key, payload: r.payload })), cursor, more: rows.length === limit };
  });

  app.get('/conflicts', { preHandler: auth }, async (req, reply) => {
    if (!['dge', 'admin'].includes(req.user!.role)) return reply.code(403).send({ error: 'Accès réservé.' });
    return (await db.query('SELECT * FROM conflicts ORDER BY at DESC LIMIT 200')).rows;
  });

  app.get('/audit/verify', { preHandler: auth }, async (req, reply) => {
    if (!['dge', 'admin'].includes(req.user!.role)) return reply.code(403).send({ error: 'Accès réservé.' });
    const rows = (await db.query('SELECT * FROM audit ORDER BY id')).rows;
    const broken = rows.findIndex((r, i) => (i === 0 ? false : r.prev_hash !== rows[i - 1].hash) || r.hash !== sha256hex(JSON.stringify({ prev: r.prev_hash, at: new Date(r.at).toISOString(), userId: r.user_id, action: r.action, tbl: r.tbl ?? undefined, key: r.key ?? undefined })));
    return { entries: rows.length, intact: broken === -1, firstBrokenId: broken === -1 ? null : rows[broken].id };
  });

  // ---------- Traçabilité publique (consommateur, sans compte) ----------
  app.get('/public/key', async () => ({ algorithm: 'Ed25519', publicKey: signer.publicKey }));

  app.get<{ Params: { token: string } }>('/public/lots/:token', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
    const token = decodeURIComponent(req.params.token);
    const i = token.lastIndexOf('.');
    const lotId = i > 0 ? token.slice(0, i) : '';
    const sig = i > 0 ? token.slice(i + 1) : '';
    const valid = !!lotId && signer.verify(lotId, sig);
    await db.query('INSERT INTO scans (lot_id, valid) VALUES ($1,$2)', [lotId || token.slice(0, 64), valid]);
    if (!valid) return reply.code(404).send({ valid: false, error: "Ce QR code n'a pas été émis par Origa." });
    const get = async (tbl: string, key?: unknown) => (key ? (await db.query('SELECT payload FROM records WHERE tbl=$1 AND key=$2', [tbl, String(key)])).rows[0]?.payload : undefined);
    const lot = await get('lots', lotId);
    if (!lot) return { valid: true, lotId, pending: true };
    const [farm, band, op, settings] = await Promise.all([get('farms', lot.farmId), get('bands', lot.bandId), get('operators', lot.operatorId), get('settings', 'global')]);
    const vacc = (await db.query(`SELECT payload->>'vaccine' AS v FROM records WHERE tbl='vaccinations' AND payload->>'bandId'=$1`, [lot.bandId])).rows.map((r) => r.v);
    const age = band ? Math.round((Date.parse(lot.cededAt) - Date.parse(band.placedAt)) / 86_400_000) : 0;
    const due = ((settings?.vaccinationCalendar ?? []) as { day: number; vaccine: string }[]).filter((v) => v.day <= age);
    // Aucune donnée personnelle : ni nom de l'exploitant, ni téléphone, ni position exacte.
    return {
      valid: true,
      lot: { id: lot.id, cededAt: lot.cededAt, receivedAt: lot.receivedAt ?? null },
      farm: farm ? { name: farm.publicName === false ? null : farm.name, locality: farm.locality, province: PROVINCES[farm.province] ?? farm.province } : null,
      band: band ? { placedAt: band.placedAt, strain: band.strain } : null,
      operator: op ? { name: op.name, type: op.type, locality: op.locality } : null,
      vaccinationsOk: due.every((d) => vacc.includes(d.vaccine)),
    };
  });

  return app;
}
