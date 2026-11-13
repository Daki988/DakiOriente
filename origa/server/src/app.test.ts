import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool, migrate, type Db } from './db.js';
import type { Mail } from './mail.js';
import { lastPeriod, runDueReports } from './reports.js';
import { createSms } from './sms.js';

const URL = process.env.TEST_DATABASE_URL ?? 'postgresql://origa:origa@localhost:5432/origa_test';
let db: Db; let app: FastifyInstance;
const outbox: { to: string; text: string }[] = [];
const mails: Mail[] = [];
const mailer = async (m: Mail) => { mails.push(m); };
const cfg = loadConfig({ jwtSecret: 'x'.repeat(40), authRateLimit: 100 });

const tokens = new Map<string, string>();
async function login(phone: string) {
  if (tokens.has(phone)) return tokens.get(phone)!;
  const t = await freshLogin(phone);
  tokens.set(phone, t);
  return t;
}
async function freshLogin(phone: string) {
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
  await db.query('DROP TABLE IF EXISTS meta, tombstones, report_runs, access_requests, scans, audit, conflicts, records, otp_codes, users CASCADE');
  await migrate(db);
  for (const [phone, role, farm, farms] of [
    ['+24100000001', 'eleveur', 'GA1-0042', []], ['+24100000002', 'agent', null, ['GA1-0042', 'GA1-0003']],
    ['+24100000003', 'dge', null, []], ['+24100000004', 'veterinaire', null, []], ['+24100000005', 'bceg', null, []],
    ['+24100000006', 'eleveur', 'GA1-0003', []], ['+24100000009', 'admin', null, []],
    ['+24100000010', 'maedr', null, []], ['+24100000011', 'aninf', null, []],
  ] as const) await db.query('INSERT INTO users (phone, name, role, farm_id, farm_ids) VALUES ($1,$1,$2,$3,$4)', [phone, role, farm, farms]);
  app = await buildApp(cfg, db, { sms: async (to, text) => { outbox.push({ to, text }); }, mail: mailer });
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
  it('laisse essayer plusieurs profils de démonstration à la suite, et répond en français au-delà des limites', async () => {
    const strict = await buildApp({ ...cfg, authRateLimit: 5 }, db, { sms: async () => undefined, mail: mailer });
    for (let i = 0; i < 5; i++) await strict.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: `+2410000001${i}` } });
    const blocked = await strict.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '+24100000019' } });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().error).toMatch(/^Trop de tentatives\. Réessayez dans \d+ minute/);
    const demo = await buildApp({ ...cfg, authRateLimit: 5, demoOtp: '241241' }, db, { sms: async () => undefined, mail: mailer });
    for (let i = 0; i < 12; i++) {
      const r = await demo.inject({ method: 'POST', url: '/auth/otp/request', payload: { phone: '+24100000001' } });
      expect(r.statusCode).toBe(200);
    }
    await strict.close(); await demo.close();
    await db.query(`DELETE FROM otp_codes WHERE phone = '+24100000001' OR phone LIKE '+2410000001_'`); // les autres tests se connectent avec ces numéros
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
    // Les données saisies du lot sont restituées telles quelles (effectif, poids, date, destinataire, non encore réceptionné).
    expect(body.lot).toMatchObject({ id: 'GA1-0042-B07-L01', count: 1200, weightKg: 2460, cededAt: '2026-11-25', receivedAt: null });
    expect(body.band).toMatchObject({ rank: 7 });
    expect(body.treatments).toMatchObject({ withdrawalOk: true });
    expect(Array.isArray(body.vaccinations) && Array.isArray(body.movements)).toBe(true);
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

describe('conformité au cahier des charges (v1.1)', () => {
  let admin: string; let dge: string; let vet: string; let eleveur: string; let maedr: string; let aninf: string;
  const req = (method: 'GET' | 'POST', url: string, token?: string, payload?: unknown) =>
    app.inject({ method, url, payload: payload as Record<string, unknown>, headers: token ? { authorization: `Bearer ${token}` } : {} });
  beforeAll(async () => {
    admin = await login('+24100000009'); dge = await login('+24100000003'); vet = await login('+24100000004');
    eleveur = await login('+24100000001'); maedr = await login('+24100000010'); aninf = await login('+24100000011');
  });

  it('notifie les vétérinaires par SMS dès qu’une alerte arrive', async () => {
    const before = outbox.length;
    await sync(eleveur, [item('alerts', { id: 'al-sms', farmId: 'GA1-0042', bandId: 'GA1-0042-B07', status: 'nouvelle', message: 'Mortalité du jour 1,2 %' })]);
    expect(outbox.slice(before).some((m) => m.to === '+24100000004' && /alerte sanitaire GA1-0042/.test(m.text))).toBe(true);
  });

  it('garde la bande clôturée en lecture seule, réouverture par la DGE seulement', async () => {
    const band = (await pull(dge)).items.find((x: { key: string }) => x.key === 'GA1-0042-B07').payload;
    expect((await sync(eleveur, [item('bands', { ...band, closedAt: '2026-11-28' })])).json().applied).toBe(1);
    expect((await sync(eleveur, [item('bands', { ...band, closedAt: undefined, chicks: 9999 })])).json().rejected[0].reason).toMatch(/lecture seule/);
    expect((await sync(dge, [item('bands', { ...band, closedAt: undefined, chicks: 5000 })])).json().applied).toBe(1);
  });

  it('fait valider les commandes d’intrants par la DGE', async () => {
    const order = { id: 'cmd-1', farmId: 'GA1-0042', product: 'Aliment démarrage', type: 'aliment', quantity: 3000, unit: 'kg', status: 'demandee' };
    expect((await sync(eleveur, [item('orders', order)])).json().applied).toBe(1);
    expect((await sync(eleveur, [item('orders', { ...order, status: 'validee' })])).json().rejected).toHaveLength(1);
    expect((await sync(dge, [item('orders', { ...order, status: 'validee', decidedBy: 'DGE' })])).json().applied).toBe(1);
  });

  it('réserve les diagnostics aux vétérinaires', async () => {
    const d = { id: 'dg-1', farmId: 'GA1-0042', diagnostic: 'Coccidiose', intervention: 'Traitement prescrit', by: 'Vétérinaire' };
    expect((await sync(eleveur, [item('diagnostics', d)])).json().rejected).toHaveLength(1);
    expect((await sync(vet, [item('diagnostics', d)])).json().applied).toBe(1);
  });

  it('applique la matrice des droits paramétrable', async () => {
    const settings = (await pull(admin)).items.find((x: { key: string }) => x.key === 'global').payload;
    const rights = { eleveur: { elevage: ['consulter'] }, dge: { fermes: ['consulter', 'creer', 'modifier'], intrants: ['consulter', 'valider'], pilotage: ['consulter', 'creer', 'valider'] }, maedr: { pilotage: ['consulter', 'valider'] } };
    expect((await sync(dge, [item('settings', { ...settings, rights })])).json().rejected[0].reason).toMatch(/administrateur/);
    expect((await sync(admin, [item('settings', { ...settings, rights })])).json().applied).toBe(1);
    const denied = await sync(eleveur, [item('entries', { id: 'e-rights', bandId: 'GA1-0042-B07', date: '2026-11-06', deaths: 1, feedKg: 10 })]);
    expect(denied.json().rejected[0].reason).toMatch(/droit « creer »/);
    await sync(admin, [item('settings', { ...settings, rights: undefined })]); // retour aux droits par défaut
  });

  it('fait valider la diffusion des agrégats par le MAEDR', async () => {
    const agg = (await req('GET', '/stats/aggregates', dge)).json();
    expect(agg.lotsTraces).toBeGreaterThanOrEqual(1);
    expect(agg).toHaveProperty('fermesActives');
    const pub = { id: 'pub-1', period: 'novembre 2026', createdAt: new Date().toISOString(), createdBy: 'DGE', data: agg, status: 'soumise' };
    const created = (await sync(dge, [item('publications', pub)])).json();
    expect(created.rejected).toEqual([]);
    expect((await sync(maedr, [item('publications', { ...pub, data: { faux: 1 }, status: 'validee' })])).json().rejected).toHaveLength(1);
    const validated = (await sync(maedr, [item('publications', { ...pub, status: 'validee', decidedBy: 'MAEDR', decidedAt: '2026-11-06' })])).json();
    expect(validated).toMatchObject({ applied: 1, rejected: [], conflicts: [] });
    expect((await req('GET', '/public/stats')).json().period).toBe('novembre 2026');
    expect((await pull(maedr)).items.every((x: { table: string }) => x.table === 'publications' || x.table === 'settings')).toBe(true);
  });

  it('donne le journal à l’ANINF et rien d’autre', async () => {
    expect((await req('GET', '/admin/audit?limit=5', aninf)).statusCode).toBe(200);
    expect((await req('GET', '/audit/verify', aninf)).json().intact).toBe(true);
    expect((await pull(aninf)).items.filter((x: { table: string }) => x.table !== 'settings')).toHaveLength(0);
    expect((await req('GET', '/admin/users', aninf)).statusCode).toBe(403);
  });

  it('exporte les événements confirmés au format EMA-i+ et documente l’API', async () => {
    await sync(vet, [item('alerts', { id: 'al-sms', farmId: 'GA1-0042', bandId: 'GA1-0042-B07', status: 'confirmee', message: 'Mortalité du jour 1,2 %' })]);
    const ex = (await req('GET', '/interop/ema-i/events', vet)).json();
    expect(ex.events.some((e: { eventId: string; species: string }) => e.eventId === 'al-sms' && e.species === 'Gallus gallus domesticus')).toBe(true);
    expect((await req('GET', '/interop/ema-i/events', eleveur)).statusCode).toBe(403);
    expect((await req('GET', '/openapi.json')).json().openapi).toBe('3.0.3');
  });

  it('laisse un distributeur sous convention contrôler un lot', async () => {
    await sync(dge, [item('operators', { id: 'OP-003', name: 'Distributeur Libreville', type: 'distributeur', locality: 'Libreville', convention: true })]);
    await req('POST', '/admin/users', admin, { name: 'Distributeur Libreville', phone: '+24107000020', role: 'operateur', operatorId: 'OP-003' });
    const dist = await login('+24107000020');
    const r = await req('POST', `/lots/${encodeURIComponent('GA1-0042-B07-L01')}/distributor-check`, dist);
    expect(r.json()).toMatchObject({ ok: true, validatedAtSlaughterhouse: true });
    expect((await req('POST', `/lots/${encodeURIComponent('GA1-0042-B07-L01')}/distributor-check`, eleveur)).statusCode).toBe(403);
  });
});

describe('étiquettes pré-signées, EPCIS 2.0 et rapports par e-mail (v1.2)', () => {
  let dge: string; let eleveur: string; let voisin: string;
  const req = (method: 'GET' | 'POST', url: string, token?: string, payload?: unknown) =>
    app.inject({ method, url, payload: payload as Record<string, unknown>, headers: token ? { authorization: `Bearer ${token}` } : {} });
  beforeAll(async () => { dge = await login('+24100000003'); eleveur = await login('+24100000001'); voisin = await login('+24100000006'); });

  it('émet des étiquettes pré-signées pour les prochains lots de la bande, dans le périmètre seulement', async () => {
    const r = await req('POST', '/lots/presign', eleveur, { bandId: 'GA1-0042-B07', count: 3 });
    expect(r.statusCode).toBe(200);
    const labels = r.json().labels as { lotId: string; signature: string }[];
    // Le lot L01 existe déjà : les étiquettes portent les numéros suivants.
    expect(labels.map((l) => l.lotId)).toEqual(['GA1-0042-B07-L02', 'GA1-0042-B07-L03', 'GA1-0042-B07-L04']);
    expect((await req('POST', '/lots/presign', voisin, { bandId: 'GA1-0042-B07', count: 3 })).statusCode).toBe(403);
    expect((await req('POST', '/lots/presign', eleveur, { bandId: 'GA1-0042-B99' })).statusCode).toBe(404);
    // Avant la synchronisation du lot, le QR collé est déjà reconnu comme authentique.
    const pub = await req('GET', `/public/lots/${encodeURIComponent(`${labels[0].lotId}.${labels[0].signature}`)}`);
    expect(pub.json()).toMatchObject({ valid: true, pending: true });
    // À la synchronisation, le serveur appose exactement la même signature que celle de l'étiquette.
    await sync(eleveur, [item('lots', { id: labels[0].lotId, bandId: 'GA1-0042-B07', farmId: 'GA1-0042', count: 900, weightKg: 1900, operatorId: 'OP-001', cededAt: '2026-11-27', signature: labels[0].signature })]);
    const stored = (await pull(eleveur)).items.find((x: { key: string }) => x.key === labels[0].lotId).payload;
    expect(stored.signature).toBe(labels[0].signature);
    // Ré-émettre repart après le dernier lot utilisé.
    expect((await req('POST', '/lots/presign', eleveur, { bandId: 'GA1-0042-B07', count: 1 })).json().labels[0].lotId).toBe('GA1-0042-B07-L03');
  });

  it('exporte la traçabilité au format GS1 EPCIS 2.0', async () => {
    expect((await req('GET', '/interop/epcis/events', eleveur)).statusCode).toBe(403);
    const r = await req('GET', '/interop/epcis/events?lotId=GA1-0042-B07-L01', dge);
    expect(r.headers['content-type']).toMatch(/ld\+json/);
    const doc = r.json();
    expect(doc).toMatchObject({ type: 'EPCISDocument', schemaVersion: '2.0' });
    const events = doc.epcisBody.eventList as { bizStep: string; eventTime: string; quantityList: { quantity: number }[] }[];
    // Le contrôle du distributeur du jeu d'essai est daté d'aujourd'hui : on compare sans tenir compte de l'ordre.
    expect(events.map((e) => e.bizStep).sort()).toEqual(['commissioning', 'inspecting', 'receiving', 'shipping']);
    expect(events.map((e) => Date.parse(e.eventTime))).toEqual(events.map((e) => Date.parse(e.eventTime)).sort((a, b) => a - b));
    const first = events.find((e) => e.bizStep === 'commissioning')!;
    expect(first).toMatchObject({ type: 'ObjectEvent', action: 'ADD', eventTime: '2026-11-25T12:00:00+01:00', readPoint: { id: 'urn:origa:farm:GA1-0042' } });
    expect(first.quantityList[0]).toEqual({ epcClass: 'urn:origa:lot:GA1-0042-B07-L01', quantity: 1200 });
    expect(events.find((e) => e.bizStep === 'receiving')!.quantityList[0].quantity).toBe(1195);
    expect((await req('GET', '/interop/epcis/events?farmId=GA1-0042', dge)).json().epcisBody.eventList.length).toBeGreaterThan(4);
  });

  it('n’envoie aucun rapport sans destinataire', async () => {
    mails.length = 0;
    const rs = await runDueReports(db, mailer, cfg, new Date('2026-12-01T08:00:00Z'));
    expect(rs.every((r) => r.skipped === 'aucun destinataire')).toBe(true);
    expect(mails).toHaveLength(0);
  });

  it('envoie les rapports périodiques une seule fois par période, avec PDF et CSV', async () => {
    const settings = (await pull(dge)).items.find((x: { table: string }) => x.table === 'settings').payload;
    expect((await sync(dge, [item('settings', { ...settings, reports: { hebdomadaire: true, mensuel: true, finBande: true, recipients: ['dge@agriculture.gouv.ga', 'Cabinet@agriculture.gouv.ga', 'pas-une-adresse'] } })])).json().applied).toBe(1);
    const now = new Date('2026-12-01T08:00:00Z'); // mardi 1er décembre : semaine 48 et novembre sont terminés
    expect(lastPeriod('hebdomadaire', now)).toMatchObject({ key: '2026-W48', from: '2026-11-23', to: '2026-11-29' });
    expect(lastPeriod('mensuel', now)).toMatchObject({ key: '2026-11', label: 'Novembre 2026', from: '2026-11-01', to: '2026-11-30' });
    const rs = await runDueReports(db, mailer, cfg, now);
    expect(rs.map((r) => r.sent)).toEqual([true, true]);
    expect(mails).toHaveLength(2);
    expect(mails[0].to).toEqual(['dge@agriculture.gouv.ga', 'cabinet@agriculture.gouv.ga']);
    expect(mails[0].subject).toMatch(/Rapport hebdomadaire national · Semaine 48/);
    expect(mails[0].html).toMatch(/Poulets sortis/);
    const [pdf, csv] = mails[0].attachments!;
    expect(pdf.filename).toBe('origa-hebdomadaire-2026-W48.pdf');
    expect(pdf.content.subarray(0, 5).toString()).toBe('%PDF-');
    expect(csv.content.toString('utf8')).toMatch(/GA1-0042;Ferme Nkoltang;Estuaire/);
    // Deuxième passage du planificateur : rien n'est renvoyé.
    expect((await runDueReports(db, mailer, cfg, now)).map((r) => r.skipped)).toEqual(['déjà envoyé', 'déjà envoyé']);
    expect(mails).toHaveLength(2);
    const runs = (await req('GET', '/reports/runs', dge)).json();
    expect(runs).toHaveLength(2);
    expect(runs[0]).toMatchObject({ status: 'envoye', recipients: 2, attempts: 1 });
    expect((await req('GET', '/reports/runs', eleveur)).statusCode).toBe(403);
  });

  it('respecte la désactivation d’un rapport et permet l’envoi immédiat', async () => {
    const settings = (await pull(dge)).items.find((x: { table: string }) => x.table === 'settings').payload;
    await sync(dge, [item('settings', { ...settings, reports: { ...settings.reports, hebdomadaire: false } })]);
    const later = new Date('2026-12-08T08:00:00Z');
    expect((await runDueReports(db, mailer, cfg, later))[0].skipped).toMatch(/désactivé/);
    mails.length = 0;
    expect((await req('POST', '/reports/send', eleveur, { kind: 'mensuel' })).statusCode).toBe(403);
    expect((await req('POST', '/reports/send', dge, { kind: 'annuel' })).statusCode).toBe(400);
    const r = await req('POST', '/reports/send', dge, { kind: 'mensuel' });
    expect(r.json()).toMatchObject({ sent: true, kind: 'mensuel' });
    expect(mails).toHaveLength(1);
  });

  it('envoie le rapport de fin de bande à la clôture', async () => {
    mails.length = 0;
    const band = (await pull(dge)).items.find((x: { key: string }) => x.key === 'GA1-0042-B07').payload;
    expect((await sync(eleveur, [item('bands', { ...band, closedAt: '2026-11-30' })])).json().applied).toBe(1);
    for (let i = 0; i < 40 && !mails.length; i++) await new Promise((r) => setTimeout(r, 50));
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).toMatch(/Rapport de fin de bande · Ferme Nkoltang · Bande GA1-0042-B07/);
    expect(mails[0].html).toMatch(/GA1-0042-B07-L02/);
    expect(mails[0].attachments![0].content.subarray(0, 5).toString()).toBe('%PDF-');
    // Une bande clôturée n'accepte plus d'étiquettes.
    expect((await req('POST', '/lots/presign', eleveur, { bandId: 'GA1-0042-B07' })).statusCode).toBe(409);
  });

  it('consigne un échec d’envoi et réessaie', async () => {
    const failing = async () => { throw new Error('relais SMTP injoignable'); };
    const now = new Date('2026-12-15T08:00:00Z');
    const settings = (await pull(dge)).items.find((x: { table: string }) => x.table === 'settings').payload;
    await sync(dge, [item('settings', { ...settings, reports: { ...settings.reports, hebdomadaire: true } })]);
    const ko = (await runDueReports(db, failing, cfg, now))[0];
    expect(ko).toMatchObject({ sent: false, error: 'relais SMTP injoignable' });
    mails.length = 0;
    expect((await runDueReports(db, mailer, cfg, now))[0].sent).toBe(true);
    const run = (await req('GET', '/reports/runs', dge)).json().find((r: { period: string }) => r.period === ko.period);
    expect(run).toMatchObject({ status: 'envoye', attempts: 2 });
  });

  it('envoie les SMS par l’API Brevo quand elle est configurée', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response('{}', { status: 201 }); }) as typeof fetch;
    try {
      await createSms({ ...cfg, smsProvider: 'brevo', brevoApiKey: 'cle-de-test', smsSender: 'Origa' }, () => undefined)('+24107000000', 'Votre code est 123456');
    } finally { globalThis.fetch = original; }
    expect(calls[0].url).toBe('https://api.brevo.com/v3/transactionalSMS/send');
    expect((calls[0].init.headers as Record<string, string>)['api-key']).toBe('cle-de-test');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ sender: 'Origa', recipient: '24107000000', content: 'Votre code est 123456', type: 'transactional' });
  });
});

describe('suppression et correction selon l’habilitation (v1.3)', () => {
  let admin: string; let dge: string; let vet: string; let eleveur: string; let voisin: string; let agent: string;
  const del = (table: string, key: string, at = new Date().toISOString()) => ({ table, op: 'delete', key, payload: { id: key }, at });
  const has = async (token: string, key: string) => (await pull(token)).items.some((x: { key: string; deleted?: boolean }) => x.key === key && !x.deleted);
  beforeAll(async () => {
    admin = await login('+24100000009'); dge = await login('+24100000003'); vet = await login('+24100000004');
    eleveur = await login('+24100000001'); voisin = await login('+24100000006'); agent = await login('+24100000002');
    await sync(agent, [item('farms', { id: 'GA1-0003', name: 'Ferme Owendo', owner: 'Mme Nzé', phone: '+24107000001', province: 'GA1', locality: 'Owendo', bcegFinanced: true })]);
  });

  it('l’éleveur enregistre, corrige puis supprime une charge de sa ferme', async () => {
    expect((await sync(eleveur, [item('charges', { id: 'ch-1', farmId: 'GA1-0042', date: '2026-11-20', post: 'Aliment', amountXaf: 950000 })])).json().applied).toBe(1);
    expect((await sync(eleveur, [item('charges', { id: 'ch-1', farmId: 'GA1-0042', date: '2026-11-20', post: 'Aliment', amountXaf: 980000 })])).json().applied).toBe(1);
    expect((await pull(dge)).items.find((x: { key: string }) => x.key === 'ch-1').payload.amountXaf).toBe(980000);
    // Ni le voisin ni la DGE ne peuvent la supprimer ; l'éleveur oui.
    expect((await sync(voisin, [del('charges', 'ch-1')])).json().rejected[0].reason).toMatch(/hors de votre périmètre/);
    expect((await sync(dge, [del('charges', 'ch-1')])).json().rejected[0].reason).toMatch(/DGE/);
    expect((await sync(eleveur, [del('charges', 'ch-1')])).json().applied).toBe(1);
    expect(await has(dge, 'ch-1')).toBe(false);
    // Les autres appareils apprennent la suppression, sans recevoir le contenu.
    const tomb = (await pull(dge)).items.find((x: { key: string }) => x.key === 'ch-1');
    expect(tomb).toEqual({ table: 'charges', key: 'ch-1', deleted: true });
    // Supprimer deux fois ne provoque pas d'erreur.
    expect((await sync(eleveur, [del('charges', 'ch-1')])).json()).toMatchObject({ applied: 1, rejected: [] });
  });

  it('ne supprime jamais ce qui fonde la traçabilité', async () => {
    for (const [table, key, motif] of [['lots', 'GA1-0042-B07-L01', /traçabilité/], ['bands', 'GA1-0042-B07', /clôture/], ['farms', 'GA1-0042', /statut/]] as const) {
      const r = (await sync(admin, [del(table, key)])).json();
      expect(r.rejected[0].reason).toMatch(motif);
    }
    expect(await has(dge, 'GA1-0042-B07-L01')).toBe(true);
    await sync(admin, [item('exits', { id: 'ex-lot', bandId: 'GA1-0042-B07', date: '2026-11-25', count: 1200, weightKg: 2460, reason: 'abattoir', lotId: 'GA1-0042-B07-L01' })]);
    expect((await sync(admin, [del('exits', 'ex-lot')])).json().rejected[0].reason).toMatch(/lot cédé/);
  });

  it('réserve chaque suppression au profil compétent', async () => {
    await sync(vet, [item('diagnostics', { id: 'dg-1', farmId: 'GA1-0042', date: '2026-11-21', conclusion: 'Coccidiose' })]);
    expect((await sync(eleveur, [del('diagnostics', 'dg-1')])).json().rejected[0].reason).toMatch(/autres profils/);
    expect((await sync(vet, [del('diagnostics', 'dg-1')])).json().applied).toBe(1);
    await sync(agent, [item('prices', { id: 'px-1', date: '2026-11-21', product: 'Poulet vif', priceXaf: 3500, market: 'Mont-Bouët' })]);
    expect((await sync(eleveur, [del('prices', 'px-1')])).json().rejected[0].reason).toMatch(/agents/);
    expect((await sync(dge, [del('prices', 'px-1')])).json().applied).toBe(1);
    // Une commande validée par la DGE ne se supprime plus.
    await sync(voisin, [item('orders', { id: 'od-9', farmId: 'GA1-0003', date: '2026-11-21', type: 'aliment', product: 'Démarrage', quantity: 40, unit: 'sacs', wishedDate: '2026-12-01', status: 'demandee' })]);
    const order = (await pull(dge)).items.find((x: { key: string }) => x.key === 'od-9').payload;
    await sync(dge, [item('orders', { ...order, status: 'validee', decidedBy: 'DGE' })]);
    expect((await sync(voisin, [del('orders', 'od-9')])).json().rejected[0].reason).toMatch(/déjà traitée/);
  });

  it('garde les saisies d’une bande clôturée en lecture seule, sauf pour l’administrateur', async () => {
    // La bande GA1-0042-B07 a été clôturée dans les tests de la version 1.2.
    const refuse = (await sync(eleveur, [item('entries', { id: 'en-tard', bandId: 'GA1-0042-B07', date: '2026-12-02', deaths: 1, feedKg: 10, createdAt: '2026-12-02' })])).json();
    expect(refuse.rejected[0].reason).toMatch(/clôturée/);
    expect((await sync(admin, [item('entries', { id: 'en-admin', bandId: 'GA1-0042-B07', date: '2026-11-29', deaths: 0, feedKg: 12, createdAt: '2026-11-29' })])).json().applied).toBe(1);
    expect((await sync(eleveur, [del('entries', 'en-admin')])).json().rejected[0].reason).toMatch(/clôturée/);
    expect((await sync(admin, [del('entries', 'en-admin')])).json().applied).toBe(1);
  });

  it('applique le droit « supprimer » de la matrice et ne ressuscite pas une donnée supprimée', async () => {
    await sync(voisin, [item('charges', { id: 'ch-2', farmId: 'GA1-0003', date: '2026-11-22', post: 'Litière', amountXaf: 120000 })]);
    const settings = (await pull(admin)).items.find((x: { table: string }) => x.table === 'settings').payload;
    const rights = { eleveur: { economie: ['consulter', 'creer', 'modifier'] }, agent: { economie: ['consulter', 'creer', 'modifier', 'supprimer'] } };
    await sync(admin, [item('settings', { ...settings, rights })]);
    expect((await sync(voisin, [del('charges', 'ch-2')])).json().rejected[0].reason).toMatch(/droit « supprimer » non accordé/);
    // L'agent, lui, garde ce droit sur les fermes qu'il suit.
    const before = new Date(Date.now() - 60_000).toISOString();
    expect((await sync(agent, [del('charges', 'ch-2')])).json().applied).toBe(1);
    // Un téléphone resté hors ligne renvoie une vieille version : elle est refusée.
    expect((await sync(voisin, [item('charges', { id: 'ch-2', farmId: 'GA1-0003', date: '2026-11-22', post: 'Litière', amountXaf: 1 }, before)])).json().rejected[0].reason).toMatch(/supprimé entre-temps/);
    expect(await has(dge, 'ch-2')).toBe(false);
    await sync(admin, [item('settings', { ...settings })]);
    const audit = (await app.inject({ method: 'GET', url: '/admin/audit?limit=400', headers: { authorization: `Bearer ${admin}` } })).json();
    expect(audit.some((a: { action: string; key: string }) => a.action === 'suppression' && a.key === 'ch-2')).toBe(true);
  });

  it('accepte un code de démonstration seulement quand le serveur est en mode démonstration', async () => {
    expect((await app.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone: '+24100000001', code: '241241' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/public/config' })).json()).toEqual({ ready: true, demo: false, sms: false });
    const demo = await buildApp({ ...cfg, demoOtp: '241241' }, db, { sms: async () => undefined, mail: mailer });
    const ok = await demo.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone: '+24100000001', code: '241241' } });
    expect(ok.json().user).toMatchObject({ role: 'eleveur', farmId: 'GA1-0042' });
    expect((await demo.inject({ method: 'POST', url: '/auth/otp/verify', payload: { phone: '+24199999999', code: '241241' } })).statusCode).toBe(401);
    expect((await demo.inject({ method: 'GET', url: '/public/config' })).json().demo).toBe(true);
    // Un QR signé par l'application de démonstration est signalé comme tel, sans donnée ; pas en exploitation.
    const { lotSigner } = await import('./security.js');
    const sig = lotSigner('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60').sign('GA1-0042-B07-L09');
    const url = `/public/lots/${encodeURIComponent(`GA1-0042-B07-L09.${sig}`)}`;
    // Serveur avec sa propre clé (comme en ligne) : le QR de démonstration n'est pas valide, mais il est reconnu.
    const own = 'a'.repeat(64);
    const live = await buildApp({ ...cfg, demoOtp: '241241', lotSigningKey: own }, db, { sms: async () => undefined, mail: mailer });
    expect((await live.inject({ method: 'GET', url })).json()).toMatchObject({ valid: false, demo: true });
    const prod = await buildApp({ ...cfg, lotSigningKey: own }, db, { sms: async () => undefined, mail: mailer });
    expect((await prod.inject({ method: 'GET', url })).json()).toEqual({ valid: false, error: "Ce QR code n'a pas été émis par Origa." });
    await live.close(); await prod.close();
    await demo.close();
  });

  it('remet la démonstration à zéro : administrateur et mode démonstration seulement', async () => {
    const adm = await login('+24100000009'); const ele = await login('+24100000001');
    const post = (a: typeof app, tok: string) => a.inject({ method: 'POST', url: '/admin/demo/reset', headers: { authorization: `Bearer ${tok}` } });
    expect((await post(app, adm)).statusCode).toBe(403); // serveur en exploitation : jamais
    const demo = await buildApp({ ...cfg, demoOtp: '241241' }, db, { sms: async () => undefined, mail: mailer });
    expect((await post(demo, ele)).statusCode).toBe(403);
    const r = await post(demo, adm);
    expect(r.statusCode).toBe(200);
    expect(r.json().records).toBeGreaterThan(100);
    expect((await demo.inject({ method: 'GET', url: '/public/config' })).json().epoch).toBeTruthy();
    // Les comptes et le journal sont conservés.
    expect((await db.query(`SELECT count(*)::int AS n FROM users WHERE phone='+24100000008'`)).rows[0].n).toBe(1);
    await demo.close();
  });
});
