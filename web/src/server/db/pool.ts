// Connexion PostgreSQL commune au site et aux scripts (migrations, données, sauvegardes).
// - Base locale ou classique : pilote « pg » (TCP, port 5432).
// - Base Neon : pilote Neon par WebSocket sur le port 443. Indispensable sur les hébergements mutualisés
//   qui bloquent les connexions sortantes vers le port 5432 (cas de LWS cPanel).
// Forçage possible : DATABASE_DRIVER=pg ou DATABASE_DRIVER=neon-websocket.
import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";

export function viaNeonWebSocket(url: string) {
  const d = process.env.DATABASE_DRIVER;
  if (d === "pg") return false;
  if (d === "neon-websocket") return true;
  try { return new URL(url).hostname.endsWith(".neon.tech"); } catch { return false; }
}

/** Pool compatible avec l'interface de « pg » (query, connect, end), quel que soit le pilote. */
export function creerPool(url: string, max = 10): PgPool {
  if (viaNeonWebSocket(url)) {
    // Node 22+ fournit WebSocket nativement.
    if (!neonConfig.webSocketConstructor && typeof globalThis.WebSocket !== "undefined") neonConfig.webSocketConstructor = globalThis.WebSocket;
    return new NeonPool({ connectionString: url, max }) as unknown as PgPool;
  }
  return new PgPool({ connectionString: url, max, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false } });
}
