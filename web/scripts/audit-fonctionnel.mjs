// Audit fonctionnel, volet 1 : exploration de toutes les pages accessibles à chaque profil.
// Pour chaque page : statut HTTP, erreurs JavaScript, appels /api en échec, messages d'erreur affichés.
// Usage : BASE=http://localhost:3000 OUT=dossier COMPTES='[{"profil":"eleve","identifiant":"…","motDePasse":"…","depart":["/espace/"]}]' node scripts/audit-fonctionnel.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "audit-fonctionnel";
const MAX_PAR_MOTIF = Number(process.env.MAX_PAR_MOTIF || 2);
const MAX_PAGES = Number(process.env.MAX_PAGES || 400);
const COMPTES = JSON.parse(process.env.COMPTES || "[]");
const PUBLIC_DEPART = ["/", "/trouve-ta-voie/", "/orientation/", "/devis/", "/comparateur/", "/recherche/?q=informatique", "/navilease/logements/", "/connexion/", "/inscription/", "/mot-de-passe-oublie/", "/pays/", "/villes/", "/ressources/", "/actualites/", "/metiers/", "/formations/", "/etablissements/"];
// Liens qui déclenchent une action plutôt qu'une page (déconnexion, téléchargements).
const EXCLUS = [/\/api\//, /deconnexion/, /\.(pdf|csv|zip|png|jpe?g|webp|docx?)(\?|$)/i, /^mailto:|^tel:|^sms:|^https?:\/\/(?!localhost)/];
const MESSAGES_ERREUR = ["Chargement impossible", "Une erreur est survenue", "Page introuvable", "Application error", "Unhandled Runtime Error", "Internal Server Error"];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined });
const rapport = [];

// /etablissements/ma-esa-casa/ → /etablissements/:id/ ; uuid et nombres → :id
const motif = (u) => {
  const p = new URL(u, BASE).pathname;
  return p.split("/").map((s, i, a) => (i >= 2 && i === a.length - 2 && a.length > 3 && !["nouvelle", "nouveau", "profil", "annonces", "reservations", "candidatures", "logements", "reglement"].includes(s)) || /^[0-9a-f-]{20,}$/.test(s) || /^\d+$/.test(s) ? ":id" : s).join("/");
};

async function explorer(profil, compte) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const evts = [];
  page.on("pageerror", (e) => evts.push({ type: "js", msg: e.message.slice(0, 300) }));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Download the React DevTools|net::ERR_ABORTED/.test(m.text())) evts.push({ type: "console", msg: m.text().slice(0, 300) }); });
  page.on("response", (r) => {
    const u = r.url();
    if (!u.startsWith(BASE + "/api/")) return;
    const s = r.status();
    // 401 attendu sur /api/moi pour un visiteur ; 404 attendu sur les sondes facultatives.
    if (s >= 400 && !(s === 401 && !compte)) evts.push({ type: "api", msg: `${r.request().method()} ${u.replace(BASE, "")} → ${s}` });
  });
  if (compte) {
    await page.goto(BASE + "/connexion/", { waitUntil: "networkidle" });
    const st = await page.evaluate(async (c) => (await fetch("/api/auth/connexion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifiant: c.identifiant, motDePasse: c.motDePasse }) })).status, compte);
    if (st !== 200) { rapport.push({ profil, url: "/connexion/", statut: st, problemes: [{ type: "connexion", msg: `connexion refusée (${st})` }] }); await ctx.close(); return; }
  }
  const file = [...(compte?.depart ?? []), ...(compte ? [] : PUBLIC_DEPART)];
  const vus = new Set(), parMotif = {};
  while (file.length && vus.size < MAX_PAGES) {
    const url = file.shift();
    const cle = url.split("#")[0];
    if (vus.has(cle)) continue;
    const m = motif(cle);
    parMotif[m] = (parMotif[m] ?? 0) + 1;
    if (parMotif[m] > MAX_PAR_MOTIF) continue;
    vus.add(cle);
    evts.length = 0;
    let statut = 0;
    try {
      const r = await page.goto(BASE + cle, { waitUntil: "networkidle", timeout: 45000 });
      statut = r?.status() ?? 0;
      await page.waitForTimeout(500);
    } catch (e) { evts.push({ type: "navigation", msg: String(e.message).slice(0, 200) }); }
    const texte = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    const affiches = MESSAGES_ERREUR.filter((t) => texte.includes(t)).map((t) => ({ type: "affiche", msg: t }));
    const finale = new URL(page.url()).pathname + new URL(page.url()).search;
    const problemes = [...(statut >= 400 ? [{ type: "http", msg: `statut ${statut}` }] : []), ...evts.splice(0), ...affiches];
    rapport.push({ profil, url: cle, finale: finale !== cle ? finale : undefined, statut, motif: m, problemes });
    const liens = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href"))).catch(() => []);
    for (const h of liens) {
      if (!h || h.startsWith("#") || EXCLUS.some((re) => re.test(h))) continue;
      const u = new URL(h, BASE + cle);
      if (u.origin !== new URL(BASE).origin) continue;
      const rel = u.pathname + u.search;
      if (!vus.has(rel)) file.push(rel);
    }
  }
  await ctx.close();
}

await explorer("visiteur", null);
for (const c of COMPTES) await explorer(c.profil, c);
await browser.close();
fs.writeFileSync(path.join(OUT, "pages.json"), JSON.stringify(rapport, null, 1));
const ko = rapport.filter((r) => r.problemes.length);
console.log(`${rapport.length} pages visitées, ${ko.length} avec au moins un problème`);
for (const r of ko) console.log(`- [${r.profil}] ${r.url}${r.finale ? ` → ${r.finale}` : ""} : ${r.problemes.map((p) => `${p.type}: ${p.msg}`).join(" | ")}`);
