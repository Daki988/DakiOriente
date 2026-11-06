import { loadConfig } from './config.js';
import { createPool, migrate } from './db.js';

const db = createPool(loadConfig().databaseUrl);
await migrate(db);
await db.end();
console.log('Schéma à jour.');
