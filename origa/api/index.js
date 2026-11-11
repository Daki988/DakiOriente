// Serveur national Origa en fonction sans serveur (Vercel). Le même code que `server/` tourne aussi en conteneur
// (docker-compose) pour l'hébergement au Gabon : ce fichier ne fait que l'adapter aux requêtes de Vercel.
import { loadConfig } from '../server/dist/config.js';
import { createPool, prepare } from '../server/dist/db.js';
import { buildApp } from '../server/dist/app.js';
import { createMailer } from '../server/dist/mail.js';
import { seedDemo } from '../server/dist/demoSeed.js';
import { runDueReports } from '../server/dist/reports.js';

const hasDatabase = () => !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
let booting;

async function boot() {
  const cfg = loadConfig();
  const db = createPool(cfg.databaseUrl);
  await prepare(db, async () => { if (cfg.demoOtp) await seedDemo(db, cfg.lotSigningKey); });
  const log = (m) => console.log(m);
  const mail = createMailer(cfg, log);
  const app = await buildApp(cfg, db, { logger: false, mail });
  await app.ready();
  return { app, db, mail, cfg };
}

/** Chemin demandé, sans le préfixe /api (la réécriture de vercel.json le transmet aussi dans « __path »). */
function target(req) {
  const u = new URL(req.url, 'http://origa');
  const viaRewrite = u.searchParams.get('__path');
  u.searchParams.delete('__path');
  const path = viaRewrite !== null ? `/${viaRewrite}` : u.pathname.replace(/^\/api(?:\/index)?(?=\/|$)/, '') || '/';
  const query = u.searchParams.toString();
  return { path, url: path + (query ? `?${query}` : '') };
}

const json = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)); };

export default async function handler(req, res) {
  const { path, url } = target(req);
  if (!hasDatabase()) {
    // Base non branchée : l'application le lit ici et reste en mode démonstration autonome.
    res.setHeader('Access-Control-Allow-Origin', '*');
    return json(res, path === '/public/config' ? 200 : 503, path === '/public/config' ? { ready: false } : { error: 'Serveur en cours d’installation : base de données non branchée.' });
  }
  let ctx;
  try { ctx = await (booting ??= boot()); } catch (e) {
    booting = undefined;
    console.error(e);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return json(res, path === '/public/config' ? 200 : 503, path === '/public/config' ? { ready: false } : { error: 'Serveur indisponible, réessayez dans un instant.' });
  }
  // Tâche planifiée de Vercel : envoi des rapports périodiques dus (protégée par CRON_SECRET).
  if (path === '/cron/reports') {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return json(res, 401, { error: 'Non autorisé.' });
    return json(res, 200, await runDueReports(ctx.db, ctx.mail, ctx.cfg));
  }
  req.url = url;
  ctx.app.server.emit('request', req, res);
}
