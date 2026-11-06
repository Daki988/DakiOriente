import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool, migrate, type Db } from './db.js';

const URL = process.env.TEST_DATABASE_URL ?? 'postgresql://origa:origa@localhost:5432/origa_test';
let db: Db; let app: FastifyInstance;
const outbox: { to: string; text: string }[] = [];

async function login(phone: string) {
  await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone } });
  const code = outbox.filter((m) => m.to === phone).at(-1)!.text.match(/(\d{6})/)![1];
  const r = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone, code } });
  return r.json().token as string;
}
const sync = (token: string, items: unknown[]) => app.inject({ method: 'POST', url: '/sync', headers: { authorization: `Bearer ${token}` }, payload: { items } });
const pull = async (token: string) => (await app.inject({ method: 'GET', url: '/sync/pull?since=0', headers: { authorization: `Bearer ${token}` } })).json();
const item = (table: string, payload: Record<string, unknown>, at = new Date().toISOString()) => ({ table, op: 'put', key: payload.id, payload, at });

beforeAll(async () => {
  db = createPool(URL);
  await db.query('DROP TABLE IF EXISTS access_requests, scans, audit, conflicts, records, otp_codes, users CASCADE');
  await migrate(db);
  for (const [phone, role, farm, farms] of [
    ['+24100000001', 'eleveur', 'GA1-0042', []], ['+24100000002', 'agent', null, ['GA1-0042', 'GA1-0003']],
    ['+24100000003', 'dge', null, []], ['+24100000004', 'veterinaire', null, []], ['+24100000005', 'bceg', null, []],
    ['+24100000006', 'eleveur', 'GA1-0003', []], ['+24100000009', 'admin', null, []],
  ] as const) await db.query('INSERT INTO users (phone, name, role, farm_id, farm_ids) VALUES ($1,$1,$2,$3,$4)', [phone, role, farm, farms]);
  app = await buildApp(loadConfig({ jwtSecret: 'x'.repeat(40), authRateLimit: 100 }), db, { sms: async (to, text) => { outbox.push({ to, text }); } });
});
afterAll(async () => { await app.close(); await db.end(); });

describe('connexion par code SMS', () => {
  it('ne révèle pas si un numéro est inscrit', async () => {
    const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '+24199999999' } });
    expect(r.json()).toMatchObject({ sent: true });
    expect(outbox.some((m) => m.to === '+24199999999')).toBe(false);
  });
  it('refuse un mauvais code puis accepte le bon, une seule fois', async () => {
    await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '00241 00 00 00 01' } });
    const code = outbox.at(-1)!.text.match(/(\d{6})/)![1];
    const bad = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone: '+24100000001', code: code === '000000' ? '111111' : '000000' } });
    expect(bad.statusCode).toBe(401);
    const ok = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone: '+24100000001', code } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().user).toMatchObject({ role: 'eleveur', farmId: 'GA1-0042' });
    const replay = await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone: '+24100000001', code } });
    expect(replay.statusCode).toBe(401);
  });
  it('limite les demandes de code par numéro', async () => {
    for (let i = 0; i < 3; i++) await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '+24100000006' } });
    const r = await app.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '+24100000006' } });
    expect(r.statusCode).toBe(429);
  });
  it('protège les routes sans jeton', async () => {
    expect((await app.inject({ method: 'GET', url: '/sync/pull' })).statusCode).toBe(401);
  });
});

describe('synchronisation et périmètres', () => {
  let eleveur: string; let dge: string; let vet: string; let agent: string; let bceg: string;
  beforeAll(async () => {
    eleveur = await login('+24100000001'); dge = await login('+24100000003'); vet = await login('+24100000004');
    agent = await login('+24100000002'); bceg = await login('+24100000005');
  });

  it('l’agent enrôle des fermes, la DGE les paramètre', async () => {
    const r = await sync(agent, [
      item('farms', { id: 'GA1-0042', name: 'Ferme Nkoltang', owner: 'M. Ndong', phone: '+24107000000', province: 'GA1', locality: 'Nkoltang', bcegFinanced: true, bcegConsentAt: '2026-09-01' }),
      item('farms', { id: 'GA1-0003', name: 'Ferme Owendo', owner: 'Mme Nzé', phone: '+24107000001', province: 'GA1', locality: 'Owendo', bcegFinanced: true }),
    ]);
    expect(r.json()).toMatchObject({ applied: 2, rejected: [] });
    const s = await sync(dge, [item('operators', { id: 'OP-001', name: 'Abattoir de Ntoum', type: 'abattoir', locality: 'Ntoum' }),
      item('settings', { id: 'global', alertDailyMortalityPct: 0.5, vaccinationCalendar: [{ day: 7, vaccine: 'Gumboro' }] })]);
    expect(s.json().applied).toBe(2);
  });

  it('l’éleveur écrit dans sa ferme seulement', async () => {
    const r = await sync(eleveur, [
      item('bands', { id: 'GA1-0042-B07', farmId: 'GA1-0042', placedAt: '2026-10-14', chicks: 5000, strain: 'Cobb 500' }),
      item('entries', { id: 'e1', bandId: 'GA1-0042-B07', date: '2026-11-05', deaths: 6, feedKg: 215 }),
      item('vaccinations', { id: 'v1', bandId: 'GA1-0042-B07', date: '2026-10-21', vaccine: 'Gumboro' }),
      item('entries', { id: 'e2', bandId: 'GA1-0003-B01', date: '2026-11-05', deaths: 1, feedKg: 10 }),
      item('alerts', { id: 'a1', farmId: 'GA1-0042', bandId: 'GA1-0042-B07', status: 'confirmee' }),
    ]);
    const j = r.json();
    expect(j.applied).toBe(3);
    expect(j.rejected.map((x: { key: string }) => x.key).sort()).toEqual(['a1', 'e2']);
  });

  it('conserve et signale un conflit au lieu d’écraser', async () => {
    const old = new Date(Date.now() - 3600_000).toISOString();
    const r = await sync(eleveur, [item('entries', { id: 'e1', bandId: 'GA1-0042-B07', date: '2026-11-05', deaths: 99, feedKg: 0 }, old)]);
    expect(r.json().conflicts).toHaveLength(1);
    const rows = await pull(dge);
    expect(rows.items.find((x: { key: string }) => x.key === 'e1').payload.deaths).toBe(6);
  });

  it('réserve le seuil sanitaire aux vétérinaires', async () => {
    const d = await sync(dge, [item('settings', { id: 'global', alertDailyMortalityPct: 2, vaccinationCalendar: [{ day: 7, vaccine: 'Gumboro' }] })]);
    expect(d.json().rejected[0].reason).toMatch(/vétérinaires/);
    const v = await sync(vet, [item('settings', { id: 'global', alertDailyMortalityPct: 0.4, vaccinationCalendar: [{ day: 7, vaccine: 'Gumboro' }] })]);
    expect(v.json().applied).toBe(1);
  });

  it('signe les lots côté serveur et publie une page sans donnée personnelle', async () => {
    await sync(eleveur, [item('lots', { id: 'GA1-0042-B07-L01', bandId: 'GA1-0042-B07', farmId: 'GA1-0042', count: 1200, weightKg: 2460, operatorId: 'OP-001', cededAt: '2026-11-25', signature: 'faux' })]);
    const lot = (await pull(eleveur)).items.find((x: { key: string }) => x.key === 'GA1-0042-B07-L01').payload;
    expect(lot.signature).not.toBe('faux');
    const pub = await app.inject({ method: 'GET', url: `/public/lots/${encodeURIComponent(`${lot.id}.${lot.signature}`)}` });
    const body = pub.json();
    expect(body).toMatchObject({ valid: true, farm: { locality: 'Nkoltang', province: 'Estuaire' }, operator: { name: 'Abattoir de Ntoum' }, vaccinationsOk: true });
    expect(JSON.stringify(body)).not.toMatch(/Ndong|\+241/);
    const fake = await app.inject({ method: 'GET', url: `/public/lots/${encodeURIComponent(`${lot.id}.${'A'.repeat(86)}`)}` });
    expect(fake.statusCode).toBe(404);
  });

  it('filtre la lecture selon le profil', async () => {
    await sync(agent, [item('entries', { id: 'e3', bandId: 'GA1-0003-B01', date: '2026-11-05', deaths: 2, feedKg: 40 }),
      item('exits', { id: 'x1', bandId: 'GA1-0042-B07', date: '2026-11-25', count: 10, weightKg: 20, reason: 'abattoir' })]);
    const keys = (t: string) => pull(t).then((r) => r.items.map((x: { key: string }) => x.key));
    expect(await keys(eleveur)).not.toContain('e3');
    expect(await keys(vet)).not.toContain('x1'); // pas de données économiques pour les vétérinaires
    const b = await keys(bceg);
    expect(b).toContain('GA1-0042'); // financée avec consentement
    expect(b).not.toContain('GA1-0003'); // financée sans consentement
  });

  it('tient un journal d’audit intègre et non modifiable', async () => {
    const r = await app.inject({ method: 'GET', url: '/audit/verify', headers: { authorization: `Bearer ${dge}` } });
    expect(r.json()).toMatchObject({ intact: true });
    expect(r.json().entries).toBeGreaterThan(5);
    await expect(db.query('UPDATE audit SET action = $1', ['falsifié'])).rejects.toThrow(/ajout seul/);
  });
});

describe('demandes d’accès et administration', () => {
  let admin: string; let dge: string; let eleveur: string;
  const req = (method: 'GET' | 'POST' | 'PATCH', url: string, token?: string, payload?: unknown) =>
    app.inject({ method, url, payload: payload as Record<string, unknown>, headers: token ? { authorization: `Bearer ${token}` } : {} });
  beforeAll(async () => { admin = await login('+24100000009'); dge = await login('+24100000003'); eleveur = await login('+24100000001'); });

  it('reçoit une demande publique, sans inscription libre', async () => {
    const bad = await req('POST', '/access-requests', undefined, { name: 'X', phone: '1', profile: 'eleveur', organisation: '', consent: true });
    expect(bad.statusCode).toBe(400);
    const noConsent = await req('POST', '/access-requests', undefined, { name: 'Mme Boussougou', phone: '+24106112233', profile: 'eleveur', organisation: 'Ferme Kango', consent: false });
    expect(noConsent.statusCode).toBe(400);
    const ok = await req('POST', '/access-requests', undefined, { name: 'Mme Boussougou', phone: '+24106112233', profile: 'eleveur', organisation: 'Ferme Kango', reference: 'AMI-2026-131', consent: true });
    expect(ok.json()).toEqual({ ok: true });
    // La demande ne crée aucun compte : la connexion reste impossible.
    await req('POST', '/auth/otp/request', undefined, { phone: '+24106112233' });
    expect(outbox.some((m) => m.to === '+24106112233')).toBe(false);
  });

  it('réserve le back-office à l’administrateur', async () => {
    expect((await req('GET', '/admin/users', dge)).statusCode).toBe(403);
    expect((await req('GET', '/admin/users')).statusCode).toBe(401);
    expect((await req('GET', '/admin/users', admin)).json().length).toBeGreaterThan(5);
  });

  it('approuve une demande en créant le compte, qui peut alors se connecter', async () => {
    const list = (await req('GET', '/admin/requests', admin)).json();
    const r = list.find((x: { phone: string }) => x.phone === '+24106112233');
    const missingFarm = await req('POST', `/admin/requests/${r.id}/decision`, admin, { approve: true, user: { name: 'Mme Boussougou', role: 'eleveur' } });
    expect(missingFarm.statusCode).toBe(400);
    const ok = await req('POST', `/admin/requests/${r.id}/decision`, admin, { approve: true, user: { name: 'Mme Boussougou', role: 'eleveur', farmId: 'GA1-0003' } });
    expect(ok.json().ok).toBe(true);
    expect(outbox.at(-1)!.text).toMatch(/compte est activé/);
    const token = await login('+24106112233');
    expect(token).toBeTruthy();
    const again = await req('POST', `/admin/requests/${r.id}/decision`, admin, { approve: false, note: 'doublon' });
    expect(again.statusCode).toBe(409);
  });

  it('refuse un numéro en double et un opérateur sans convention', async () => {
    const dup = await req('POST', '/admin/users', admin, { name: 'Doublon', phone: '+24100000001', role: 'dge' });
    expect(dup.statusCode).toBe(409);
    await sync(dge, [item('operators', { id: 'OP-009', name: 'Abattoir test', type: 'abattoir', locality: 'Ntoum', convention: false })]);
    const noConv = await req('POST', '/admin/users', admin, { name: 'Abattoir test', phone: '+24107000009', role: 'operateur', operatorId: 'OP-009' });
    expect(noConv.json().error).toMatch(/convention/);
  });

  it('laisse un opérateur réceptionner ses lots, et rien d’autre', async () => {
    await sync(dge, [item('operators', { id: 'OP-001', name: 'Abattoir de Ntoum', type: 'abattoir', locality: 'Ntoum', convention: true })]);
    const created = await req('POST', '/admin/users', admin, { name: 'Abattoir de Ntoum', phone: '+24107000010', role: 'operateur', operatorId: 'OP-001' });
    expect(created.statusCode).toBe(200);
    const op = await login('+24107000010');
    const lots = (await pull(op)).items;
    expect(lots.every((x: { table: string }) => x.table === 'lots' || x.table === 'operators' || x.table === 'settings')).toBe(true);
    const lot = lots.find((x: { key: string }) => x.key === 'GA1-0042-B07-L01').payload;
    const cheat = await sync(op, [item('lots', { ...lot, count: 5000 })]);
    expect(cheat.json().rejected[0].reason).toMatch(/non modifiable/);
    const ok = await sync(op, [item('lots', { ...lot, receivedAt: '2026-11-26', receivedCount: 1195, receivedWeightKg: 2440 })]);
    expect(ok.json().applied).toBe(1);
    const other = await sync(eleveur, [item('farms', { id: 'GA1-0042', name: 'Piratage' })]);
    expect(other.json().rejected).toHaveLength(1);
  });

  it('expose le journal à l’administrateur', async () => {
    const a = (await req('GET', '/admin/audit?limit=50', admin)).json();
    expect(a.some((x: { action: string }) => x.action === 'demande approuvée')).toBe(true);
  });
});
