import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { Config } from './config.js';
import type { Db } from './db.js';
import { createSms, type SmsSender } from './sms.js';
import { hashOtp, lotSigner, newOtp, normalizePhone, sameHash, sha256hex, signToken, verifyToken, type Claims } from './security.js';
import { ALL_TABLES, canRead, canWrite, farmOf, rightsAllow } from './scope.js';

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
    await db.query('UPDATE users SET last_login_at = now() WHERE phone=$1', [phone]);
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
      if (u.role === 'operateur' && (it.table === 'movements' || (it.table === 'lots' && it.payload.parentId))) {
        const lotKey = String(it.table === 'movements' ? it.payload.lotId : it.payload.parentId);
        const parent = (await db.query(`SELECT payload FROM records WHERE tbl='lots' AND key=$1`, [lotKey])).rows[0]?.payload;
        if (!parent || parent.operatorId !== u.operatorId) { rejected.push({ table: it.table, key: it.key, reason: 'lot non cédé à votre structure' }); continue; }
      }
      const cur = (await db.query('SELECT payload, client_at FROM records WHERE tbl=$1 AND key=$2', [it.table, it.key])).rows[0];
      let payload = { ...it.payload };
      const farmId = farmOf(it.table, payload);
      // Une fiche existante ne change pas de ferme (empêche de déplacer des données hors périmètre).
      if (cur && farmOf(it.table, cur.payload) !== farmId) { rejected.push({ table: it.table, key: it.key, reason: 'changement de ferme interdit' }); continue; }
      const settingsRow = (await db.query(`SELECT payload FROM records WHERE tbl='settings' AND key='global'`)).rows[0]?.payload;
      const denied = canWrite(u, it.table, farmId, payload, cur?.payload) ?? rightsAllow(u, it.table, cur?.payload, payload, settingsRow?.rights);
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
      // Alerte précoce : notification immédiate des services vétérinaires (§ 5.2).
      if (it.table === 'alerts' && !cur && payload.status === 'nouvelle') {
        const vets = (await db.query(`SELECT phone FROM users WHERE role='veterinaire' AND active`)).rows;
        for (const v of vets) await sms(v.phone, `Origa · alerte sanitaire ${farmId} : ${String(payload.message ?? '').slice(0, 100)}. Qualifiez-la dans Origa.`).catch(() => undefined);
      }
    }
    return { applied: applied.length, conflicts, rejected };
  });

  app.get<{ Querystring: { since?: string; limit?: string } }>('/sync/pull', { preHandler: auth }, async (req) => {
    const u = req.user!;
    const since = Number(req.query.since ?? 0) || 0;
    const limit = Math.min(2000, Number(req.query.limit ?? 1000) || 1000);
    const rows = (await db.query('SELECT tbl, key, farm_id, payload, seq FROM records WHERE seq > $1 ORDER BY seq LIMIT $2', [since, limit])).rows;
    const bceg = u.role === 'bceg' ? await bcegFarms() : new Set<string>();
    const visible = rows.filter((r) => canRead(u, r.tbl, r.farm_id, bceg, r.payload));
    const cursor = rows.length ? Number(rows[rows.length - 1].seq) : since;
    return { items: visible.map((r) => ({ table: r.tbl, key: r.key, payload: r.payload })), cursor, more: rows.length === limit };
  });

  app.get('/conflicts', { preHandler: auth }, async (req, reply) => {
    if (!['dge', 'admin'].includes(req.user!.role)) return reply.code(403).send({ error: 'Accès réservé.' });
    return (await db.query('SELECT * FROM conflicts ORDER BY at DESC LIMIT 200')).rows;
  });

  app.get('/audit/verify', { preHandler: auth }, async (req, reply) => {
    if (!['dge', 'admin', 'aninf'].includes(req.user!.role)) return reply.code(403).send({ error: 'Accès réservé.' });
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

  // ---------- Demandes d'accès (publiques) et administration ----------
  const PROFILES = ['eleveur', 'agent', 'operateur', 'veterinaire', 'bceg', 'autre'];
  const ROLES = ['eleveur', 'agent', 'dge', 'veterinaire', 'bceg', 'admin', 'operateur', 'maedr', 'aninf'];
  const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

  app.post<{ Body: Record<string, unknown> }>('/access-requests', { config: { rateLimit: { max: Math.max(5, cfg.authRateLimit), timeWindow: '1 hour' } } }, async (req, reply) => {
    const b = req.body ?? {};
    const phone = normalizePhone(str(b.phone, 30));
    const name = str(b.name); const organisation = str(b.organisation); const profile = str(b.profile, 20);
    if (!phone || name.length < 3 || organisation.length < 3 || !PROFILES.includes(profile)) return reply.code(400).send({ error: 'Formulaire incomplet ou invalide.' });
    if (b.consent !== true) return reply.code(400).send({ error: 'Votre accord sur le traitement des données est nécessaire.' });
    const pending = await db.query(`SELECT 1 FROM access_requests WHERE phone=$1 AND status='en_attente'`, [phone]);
    if (pending.rowCount) return { ok: true }; // une demande est déjà en cours pour ce numéro
    const id = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await db.query(`INSERT INTO access_requests (id, name, phone, profile, organisation, province, reference, message, consent) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)`,
      [id, name, phone, profile, organisation, str(b.province, 4) || null, str(b.reference, 60) || null, str(b.message, 1000) || null]);
    await audit(null, 'demande d’accès reçue', 'access_requests', id);
    return { ok: true };
  });

  async function auditors(req: FastifyRequest, reply: FastifyReply) {
    await auth(req, reply);
    if (reply.sent) return;
    if (!['admin', 'aninf'].includes(req.user!.role)) return reply.code(403).send({ error: 'Réservé aux auditeurs.' });
  }
  async function adminOnly(req: FastifyRequest, reply: FastifyReply) {
    await auth(req, reply);
    if (reply.sent) return;
    if (req.user!.role !== 'admin') return reply.code(403).send({ error: 'Réservé à l’administrateur.' });
  }

  const toUser = (r: Record<string, unknown>) => ({
    id: String(r.id), phone: r.phone, name: r.name, role: r.role, farmId: r.farm_id ?? undefined, farmIds: r.farm_ids ?? [],
    operatorId: r.operator_id ?? undefined, active: r.active, createdAt: r.created_at, lastLoginAt: r.last_login_at ?? undefined,
  });

  async function upsertUser(b: Record<string, unknown>, id?: string) {
    const phone = normalizePhone(str(b.phone, 30));
    const name = str(b.name); const role = str(b.role, 20);
    if (!phone || !name || !ROLES.includes(role)) throw Object.assign(new Error('Nom, téléphone ou profil invalide.'), { status: 400 });
    const farmId = role === 'eleveur' ? str(b.farmId, 20) || null : null;
    const farmIds = role === 'agent' && Array.isArray(b.farmIds) ? b.farmIds.map((x) => str(x, 20)).filter(Boolean) : [];
    const operatorId = role === 'operateur' ? str(b.operatorId, 20) || null : null;
    if (role === 'eleveur' && !farmId) throw Object.assign(new Error('Rattachez l’éleveur à sa ferme.'), { status: 400 });
    if (role === 'agent' && !farmIds.length) throw Object.assign(new Error('Rattachez l’agent à au moins une ferme.'), { status: 400 });
    if (role === 'operateur') {
      const op = (await db.query(`SELECT payload FROM records WHERE tbl='operators' AND key=$1`, [operatorId])).rows[0]?.payload;
      if (!op) throw Object.assign(new Error('Opérateur inconnu du registre.'), { status: 400 });
      if (!op.convention) throw Object.assign(new Error('Aucun compte opérateur sans convention signée.'), { status: 400 });
    }
    try {
      const r = id
        ? await db.query(`UPDATE users SET phone=$1, name=$2, role=$3, farm_id=$4, farm_ids=$5, operator_id=$6, active=$7 WHERE id=$8 RETURNING *`, [phone, name, role, farmId, farmIds, operatorId, b.active !== false, Number(id)])
        : await db.query(`INSERT INTO users (phone, name, role, farm_id, farm_ids, operator_id, active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [phone, name, role, farmId, farmIds, operatorId, b.active !== false]);
      if (!r.rows[0]) throw Object.assign(new Error('Compte introuvable.'), { status: 404 });
      return r.rows[0];
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw Object.assign(new Error('Un compte existe déjà avec ce numéro.'), { status: 409 });
      throw e;
    }
  }
  const fail = (reply: FastifyReply, e: unknown) => reply.code((e as { status?: number }).status ?? 500).send({ error: (e as Error).message });

  app.get('/admin/users', { preHandler: adminOnly }, async () => (await db.query('SELECT * FROM users ORDER BY name')).rows.map(toUser));
  app.post<{ Body: Record<string, unknown> }>('/admin/users', { preHandler: adminOnly }, async (req, reply) => {
    try { const u = await upsertUser(req.body ?? {}); await audit(req.user!.sub, 'création de compte', 'users', String(u.id)); return toUser(u); } catch (e) { return fail(reply, e); }
  });
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>('/admin/users/:id', { preHandler: adminOnly }, async (req, reply) => {
    try { const u = await upsertUser(req.body ?? {}, req.params.id); await audit(req.user!.sub, 'modification de compte', 'users', String(u.id)); return toUser(u); } catch (e) { return fail(reply, e); }
  });

  app.get('/admin/requests', { preHandler: adminOnly }, async () => (await db.query('SELECT * FROM access_requests ORDER BY created_at DESC LIMIT 500')).rows.map((r) => ({
    id: r.id, createdAt: r.created_at, name: r.name, phone: r.phone, profile: r.profile, organisation: r.organisation, province: r.province ?? undefined,
    reference: r.reference ?? undefined, message: r.message ?? undefined, consent: r.consent, status: r.status, decidedAt: r.decided_at ?? undefined,
    decidedBy: r.decided_by ?? undefined, decisionNote: r.decision_note ?? undefined, userId: r.user_id ? String(r.user_id) : undefined,
  })));

  app.post<{ Params: { id: string }; Body: { approve?: boolean; note?: string; user?: Record<string, unknown> } }>('/admin/requests/:id/decision', { preHandler: adminOnly }, async (req, reply) => {
    const r = (await db.query('SELECT * FROM access_requests WHERE id=$1', [req.params.id])).rows[0];
    if (!r) return reply.code(404).send({ error: 'Demande introuvable.' });
    if (r.status !== 'en_attente') return reply.code(409).send({ error: 'Demande déjà traitée.' });
    const approve = req.body?.approve === true; const note = str(req.body?.note, 500);
    if (!approve && !note) return reply.code(400).send({ error: 'Indiquez le motif du refus.' });
    try {
      const user = approve ? await upsertUser({ ...(req.body?.user ?? {}), phone: req.body?.user?.phone ?? r.phone }) : null;
      await db.query(`UPDATE access_requests SET status=$1, decided_at=now(), decided_by=$2, decision_note=$3, user_id=$4 WHERE id=$5`,
        [approve ? 'approuvee' : 'refusee', req.user!.name, note || null, user?.id ?? null, r.id]);
      await audit(req.user!.sub, approve ? 'demande approuvée' : 'demande refusée', 'access_requests', r.id);
      await sms(r.phone, approve ? 'Origa : votre compte est activé. Connectez-vous avec votre numéro de téléphone.' : `Origa : votre demande d'accès n'a pas été retenue. ${note}`).catch(() => undefined);
      return { ok: true, userId: user ? String(user.id) : undefined };
    } catch (e) { return fail(reply, e); }
  });

  app.get<{ Querystring: { limit?: string } }>('/admin/audit', { preHandler: auditors }, async (req) => {
    const limit = Math.min(1000, Number(req.query.limit ?? 200) || 200);
    return (await db.query(`SELECT a.id, a.at, COALESCE(u.name, 'système') AS user, a.action, a.tbl, a.key FROM audit a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT $1`, [limit]))
      .rows.map((r) => ({ id: Number(r.id), at: r.at, user: r.user, action: r.action, table: r.tbl ?? undefined, key: r.key ?? undefined }));
  });

  // ---------- Contrôle par le distributeur (§ 6.2) ----------
  app.post<{ Params: { id: string } }>('/lots/:id/distributor-check', { preHandler: auth }, async (req, reply) => {
    const u = req.user!;
    if (u.role !== 'operateur' || !u.operatorId) return reply.code(403).send({ error: 'Réservé aux distributeurs sous convention.' });
    const op = (await db.query(`SELECT payload FROM records WHERE tbl='operators' AND key=$1`, [u.operatorId])).rows[0]?.payload;
    if (op?.type !== 'distributeur' || !op.convention) return reply.code(403).send({ error: 'Réservé aux distributeurs sous convention.' });
    const lot = (await db.query(`SELECT payload FROM records WHERE tbl='lots' AND key=$1`, [req.params.id])).rows[0]?.payload;
    if (!lot) return reply.code(404).send({ error: 'Lot inconnu.' });
    const payload = { ...lot, distributorCheckedAt: new Date().toISOString().slice(0, 10), distributorId: u.operatorId };
    await db.query(`UPDATE records SET payload=$1, client_at=now(), server_at=clock_timestamp(), seq=nextval(pg_get_serial_sequence('records','seq')), updated_by=$2 WHERE tbl='lots' AND key=$3`, [payload, u.sub, req.params.id]);
    await audit(u.sub, 'contrôle par le distributeur', 'lots', req.params.id);
    return { ok: true, validatedAtSlaughterhouse: !!lot.receivedAt };
  });

  // ---------- Agrégats nationaux (diffusion, MAEDR) ----------
  async function aggregates() {
    const rows = (await db.query(`SELECT tbl, payload FROM records WHERE tbl IN ('farms','exits','lots','entries','bands')`)).rows;
    const of = (t: string) => rows.filter((r) => r.tbl === t).map((r) => r.payload);
    const exits = of('exits'); const lots = of('lots'); const bands = of('bands');
    const priced = exits.filter((e) => e.unitPriceXaf);
    const placed = bands.reduce((a, b) => a + (b.chicks ?? 0), 0);
    return {
      fermesActives: of('farms').filter((f) => f.status === 'operationnelle').length,
      volumeKg: Math.round(exits.reduce((a, e) => a + (e.weightKg ?? 0), 0)),
      pouletsVendus: exits.reduce((a, e) => a + (e.count ?? 0), 0),
      prixMoyenTete: Math.round(priced.reduce((a, e) => a + e.unitPriceXaf * e.count, 0) / Math.max(1, priced.reduce((a, e) => a + e.count, 0))),
      mortaliteMoyennePct: Math.round((of('entries').reduce((a, e) => a + (e.deaths ?? 0), 0) / Math.max(1, placed)) * 1000) / 10,
      lotsTraces: lots.length,
      lotsAvecQrPct: lots.length ? Math.round((lots.filter((l) => l.signature).length / lots.length) * 100) : 0,
    };
  }
  app.get('/stats/aggregates', { preHandler: auth }, async (req, reply) => {
    if (!['dge', 'admin', 'maedr'].includes(req.user!.role)) return reply.code(403).send({ error: 'Accès réservé.' });
    return aggregates();
  });
  app.get('/public/stats', async () => {
    const r = (await db.query(`SELECT payload FROM records WHERE tbl='publications' AND payload->>'status'='validee' ORDER BY server_at DESC LIMIT 1`)).rows[0];
    return r ? { period: r.payload.period, data: r.payload.data, validatedAt: r.payload.decidedAt } : { period: null, data: null };
  });

  // ---------- Interopérabilité EMA-i+ (FAO) : export des événements sanitaires confirmés ----------
  app.get<{ Querystring: { since?: string } }>('/interop/ema-i/events', { preHandler: auth }, async (req, reply) => {
    if (!['veterinaire', 'dge', 'admin'].includes(req.user!.role)) return reply.code(403).send({ error: 'Réservé aux services vétérinaires.' });
    const since = req.query.since ?? '1970-01-01';
    const alerts = (await db.query(`SELECT payload FROM records WHERE tbl='alerts' AND payload->>'status' IN ('confirmee','close') AND server_at >= $1`, [since])).rows.map((r) => r.payload);
    const farms = new Map((await db.query(`SELECT key, payload FROM records WHERE tbl='farms'`)).rows.map((r) => [r.key, r.payload]));
    return {
      format: 'origa-ema-i/1.0', generatedAt: new Date().toISOString(),
      events: alerts.map((a) => {
        const f = farms.get(a.farmId) ?? {};
        return { eventId: a.id, reportDate: a.createdAt, species: 'Gallus gallus domesticus', productionType: 'poulet de chair', country: 'GA', adminLevel1: PROVINCES[f.province] ?? f.province, locality: f.locality, latitude: f.lat ?? null, longitude: f.lng ?? null, farmCode: a.farmId, source: a.source, description: a.message, status: a.status, history: a.history };
      }),
    };
  });

  // ---------- Documentation de l'API (OpenAPI 3) ----------
  app.get('/openapi.json', async () => ({
    openapi: '3.0.3',
    info: { title: 'API du serveur national Origa', version: '1.1.0', description: 'Synchronisation, authentification par code SMS, traçabilité publique, administration, interopérabilité EMA-i+.' },
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
    paths: {
      '/auth/otp/request': { post: { summary: 'Demander un code de connexion par SMS', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { phone: { type: 'string' } } } } } } } },
      '/auth/otp/verify': { post: { summary: 'Vérifier le code et obtenir un jeton de session' } },
      '/sync': { post: { summary: 'Envoyer la file locale (règle : dernière saisie horodatée, conflits conservés)', security: [{ bearer: [] }] } },
      '/sync/pull': { get: { summary: 'Recevoir les données du périmètre depuis un curseur', security: [{ bearer: [] }], parameters: [{ name: 'since', in: 'query', schema: { type: 'integer' } }] } },
      '/public/lots/{token}': { get: { summary: 'Page publique d’un lot (sans donnée personnelle)' } },
      '/public/key': { get: { summary: 'Clé publique Ed25519 de vérification des QR' } },
      '/public/stats': { get: { summary: 'Derniers indicateurs consolidés validés par le MAEDR' } },
      '/access-requests': { post: { summary: 'Demande d’accès (validée par l’administrateur)' } },
      '/lots/{id}/distributor-check': { post: { summary: 'Contrôle d’un lot par un distributeur', security: [{ bearer: [] }] } },
      '/stats/aggregates': { get: { summary: 'Agrégats nationaux (DGE, MAEDR)', security: [{ bearer: [] }] } },
      '/interop/ema-i/events': { get: { summary: 'Événements sanitaires confirmés au format d’échange EMA-i+', security: [{ bearer: [] }] } },
      '/admin/users': { get: { summary: 'Comptes (administrateur)', security: [{ bearer: [] }] }, post: { summary: 'Créer un compte', security: [{ bearer: [] }] } },
      '/admin/requests': { get: { summary: 'Demandes d’accès', security: [{ bearer: [] }] } },
      '/admin/audit': { get: { summary: 'Journal d’audit (administrateur, ANINF)', security: [{ bearer: [] }] } },
      '/audit/verify': { get: { summary: 'Vérification du chaînage du journal', security: [{ bearer: [] }] } },
    },
  }));

  return app;
}
