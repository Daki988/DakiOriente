import { loadConfig } from './config.js';
import { createPool, migrate } from './db.js';
import { buildApp } from './app.js';

const cfg = loadConfig();
const db = createPool(cfg.databaseUrl);
await migrate(db);
const app = await buildApp(cfg, db, { logger: true });
await app.listen({ port: cfg.port, host: '0.0.0.0' });
