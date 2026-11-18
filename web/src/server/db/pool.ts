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
    // Connexions gardées 60 s (au lieu de 10 s) : une page qui suit de peu la précédente évite d'ouvrir un nouveau
    // WebSocket (≈ 70 à 100 ms). Rester sous la mise en veille de Neon (5 min d'inactivité).
    const p = new NeonPool({ connectionString: url, max, idleTimeoutMillis: 60_000 }) as unknown as PgPool;
    // Connexion inactive coupée par Neon (mise en veille) : on la journalise au lieu d'arrêter le processus.
    p.on("error", (e) => console.error("[base] connexion inactive interrompue :", e.message));
    return p;
  }
  const pg = new PgPool({ connectionString: url, max, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: process.env.PGSSL_NO_VERIFY !== "1" } });
  pg.on("error", (e) => console.error("[base] connexion inactive interrompue :", e.message));
  return pg;
  // Certificat du serveur vérifié par défaut (PGSSL_NO_VERIFY=1 seulement pour un serveur au certificat auto-signé).
}
