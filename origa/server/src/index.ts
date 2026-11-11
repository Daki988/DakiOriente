import { loadConfig } from './config.js';
import { createPool, prepare } from './db.js';
import { seedDemo } from './demoSeed.js';
import { buildApp } from './app.js';
import { createMailer } from './mail.js';
import { startReportScheduler } from './reports.js';

const cfg = loadConfig();
const db = createPool(cfg.databaseUrl);
await prepare(db, async () => { if (cfg.demoOtp) await seedDemo(db, cfg.lotSigningKey); });
const log = (m: string) => console.log(m);
const mail = createMailer(cfg, log);
const app = await buildApp(cfg, db, { logger: true, mail });
startReportScheduler(db, mail, cfg, log);
await app.listen({ port: cfg.port, host: '0.0.0.0' });
