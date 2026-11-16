// Contrôle d'accès par pays, regroupé par scripts/package-cpanel.mjs en outils/acces.mjs et appelé par app.js
// pour chaque requête, avant Next.js. Logique et réglage : src/server/services/acces-pays.ts.
import type { IncomingMessage } from "node:http";
import { cheminLibre, decider, reglage, type Decision } from "../src/server/services/acces-pays";
import { ipClient } from "../src/server/lib/geoip";

const jetonDe = (cookie: string | undefined) => {
  const m = /(?:^|;\s*)ng_session=([^;]+)/.exec(cookie ?? "");
  return m ? decodeURIComponent(m[1]) : null;
};

// Décisions récentes (même IP, même session, même type de navigateur) : la base n'est pas interrogée à chaque page.
const memo = new Map<string, { at: number; d: Decision }>();

export async function controler(req: IncomingMessage): Promise<Decision> {
  const r = await reglage(); // gardé 30 s en mémoire
  if (!r.actif) return { actif: false, autorise: true, pays: null, motif: "inactif" };
  const chemin = (req.url ?? "/").split("?")[0];
  if (cheminLibre(chemin)) return { actif: true, autorise: true, pays: null, motif: "libre" };
  const h = new Headers();
  for (const k of ["x-forwarded-for", "x-real-ip"]) { const v = req.headers[k]; if (typeof v === "string") h.set(k, v); }
  const ip = ipClient(h), jeton = jetonDe(req.headers.cookie), agent = String(req.headers["user-agent"] ?? "");
  const cle = `${ip}|${jeton ?? ""}|${agent.slice(0, 120)}`;
  const m = memo.get(cle);
  if (m && Date.now() - m.at < 60_000) return m.d;
  const d = await decider({ chemin, ip, agent, jeton });
  if (memo.size > 5000) memo.clear();
  memo.set(cle, { at: Date.now(), d });
  return d;
}
