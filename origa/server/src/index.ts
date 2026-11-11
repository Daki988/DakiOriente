import { loadConfig } from './config.js';
import { createPool, migrate } from './db.js';
import { buildApp } from './app.js';
import { createMailer } from './mail.js';
import { startReportScheduler } from './reports.js';

const cfg = loadConfig();
const db = createPool(cfg.databaseUrl);
await migrate(db);
const log = (m: string) => console.log(m);
const mail = createMailer(cfg, log);
const app = await buildApp(cfg, db, { logger: true, mail });
startReportScheduler(db, mail, cfg, log);
await app.listen({ port: cfg.port, host: '0.0.0.0' });
