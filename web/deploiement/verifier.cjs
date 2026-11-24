// Vérifie la configuration du serveur : version de Node.js, variables, base PostgreSQL, envoi d'e-mails.
// Usage (terminal cPanel, dans le dossier de l'application) : npm run verifier
const fs = require("fs");
const path = require("path");
const racine = path.resolve(__dirname, "..");
// .env (réglé à la main, prioritaire) puis .env.github (clés déposées par la mise en ligne depuis les secrets GitHub).
for (const envFile of [path.join(racine, ".env"), path.join(racine, ".env.github")])
  if (fs.existsSync(envFile)) for (const ligne of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(ligne);
    if (m && !ligne.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
process.chdir(racine);
const req = (m) => require(require.resolve(m, { paths: [path.join(racine, "serveur"), racine] }));
const ok = (t) => console.log(`  ✓ ${t}`);
const ko = (t) => { console.log(`  ✗ ${t}`); erreurs++; };
let erreurs = 0;

(async () => {
  console.log("Navigoal · vérification du serveur\n");
  const majeur = Number(process.versions.node.split(".")[0]);
  majeur >= 20 ? ok(`Node.js ${process.versions.node}`) : ko(`Node.js ${process.versions.node} : version 20 minimum (choisir 22 dans Setup Node.js App)`);

  for (const v of ["DATABASE_URL", "APP_URL", "NEXT_PUBLIC_SITE_URL"]) process.env[v] ? ok(`${v} renseignée`) : ko(`${v} manquante dans .env`);
  const stockage = process.env.STORAGE_DIR || path.join(racine, "stockage");
  try { fs.mkdirSync(stockage, { recursive: true }); fs.accessSync(stockage, fs.constants.W_OK); ok(`Dossier de stockage accessible (${stockage})`); }
  catch { ko(`Dossier de stockage non accessible en écriture : ${stockage}`); }

  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    // Base Neon : WebSocket sur le port 443 (comme le site), le port 5432 étant souvent bloqué en mutualisé.
    let neon = false; try { neon = process.env.DATABASE_DRIVER !== "pg" && (process.env.DATABASE_DRIVER === "neon-websocket" || new URL(url).hostname.endsWith(".neon.tech")); } catch {}
    let c;
    if (neon) { const m = req("@neondatabase/serverless"); if (!m.neonConfig.webSocketConstructor) m.neonConfig.webSocketConstructor = globalThis.WebSocket; c = new m.Client({ connectionString: url }); }
    else { const { Client } = req("pg"); c = new Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 }); }
    try {
      await c.connect();
      const r = await c.query("select version() as v, current_database() as db");
      ok(`Base PostgreSQL joignable${neon ? " (Neon, port 443)" : ""} : ${r.rows[0].db} (${String(r.rows[0].v).split(" ").slice(0, 2).join(" ")})`);
      const t = await c.query("select count(*)::int as n from information_schema.tables where table_schema = 'public'");
      t.rows[0].n > 0 ? ok(`${t.rows[0].n} tables présentes`) : console.log("  • Base vide : lancez « npm run migrate » puis « npm run seed »");
    } catch (e) {
      ko(`Connexion à la base impossible : ${e.message}`);
      if (/ETIMEDOUT|ECONNREFUSED|timeout/i.test(e.message))
        console.log("    → Le serveur LWS bloque peut-être les connexions sortantes vers le port 5432 : demandez au support LWS de l'autoriser pour l'hôte de votre base.");
      if (/password|authentication/i.test(e.message)) console.log("    → Identifiant ou mot de passe incorrect dans DATABASE_URL.");
    } finally { await c.end().catch(() => {}); }
  }

  if (process.env.SMTP_HOST) {
    try {
      const nodemailer = req("nodemailer");
      const port = Number(process.env.SMTP_PORT || 465);
      await nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined }).verify();
      ok(`Serveur e-mail ${process.env.SMTP_HOST}:${port} : connexion et mot de passe valides`);
    } catch (e) { ko(`E-mail : ${e.message}`); }
  } else console.log("  • SMTP non configuré : les e-mails seront seulement journalisés");

  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? ok("Connexion Google configurée") : console.log("  • Connexion Google non configurée (facultatif)");
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, signal: AbortSignal.timeout(10000) });
      r.ok ? ok("Navi (assistant IA) : clé Anthropic acceptée") : ko(`Navi : clé Anthropic refusée (HTTP ${r.status})`);
    } catch (e) { ko(`Navi : API Anthropic injoignable (${e.message})`); }
  } else console.log("  • Navi (assistant IA) non configuré : ANTHROPIC_API_KEY absente (facultatif)");
  if (process.env.DAILY_API_KEY) {
    try {
      const r = await fetch("https://api.daily.co/v1/rooms?limit=1", { headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` }, signal: AbortSignal.timeout(10000) });
      r.ok ? ok("Appels audio et vidéo : clé Daily acceptée") : ko(`Appels : clé Daily refusée (HTTP ${r.status})`);
    } catch (e) { ko(`Appels : API Daily injoignable (${e.message})`); }
  } else console.log("  • Appels audio et vidéo non configurés : DAILY_API_KEY absente (facultatif)");
  const kapso = process.env.WHATSAPP_FOURNISSEUR === "kapso" || (process.env.WHATSAPP_FOURNISSEUR !== "meta" && !!process.env.KAPSO_API_KEY);
  if (kapso) {
    // Navi sur WhatsApp via Kapso : même API que Meta, clé X-API-Key et signature X-Webhook-Signature.
    if (!process.env.KAPSO_API_KEY) ko("WhatsApp (Kapso) : KAPSO_API_KEY manquante");
    if (!process.env.WHATSAPP_PHONE_ID) ko("WhatsApp (Kapso) : WHATSAPP_PHONE_ID manquant (identifiant du numéro, visible dans Kapso)");
    if (!process.env.KAPSO_WEBHOOK_SECRET) ko("WhatsApp (Kapso) : KAPSO_WEBHOOK_SECRET manquante (signature des messages reçus)");
    if (process.env.KAPSO_API_KEY && process.env.WHATSAPP_PHONE_ID) {
      try {
        const base = (process.env.KAPSO_API_URL || "https://api.kapso.ai/meta/whatsapp/v24.0").replace(/\/$/, "");
        const r = await fetch(`${base}/${process.env.WHATSAPP_PHONE_ID}?fields=display_phone_number,verified_name`, { headers: { "X-API-Key": process.env.KAPSO_API_KEY }, signal: AbortSignal.timeout(10000) });
        const j = await r.json().catch(() => ({}));
        if (r.ok) ok(`Navi sur WhatsApp (Kapso) : numéro ${j.display_phone_number ?? "?"} (${j.verified_name ?? "?"})`);
        else if (r.status === 401 || r.status === 403) ko(`WhatsApp (Kapso) : clé d'API refusée (HTTP ${r.status})`);
        else console.log(`  • WhatsApp (Kapso) : numéro non lu (HTTP ${r.status}) ; vérifier l'identifiant du numéro dans Kapso`);
      } catch (e) { ko(`WhatsApp (Kapso) : API injoignable (${e.message})`); }
    }
  } else if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    try {
      const r = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v21.0"}/${process.env.WHATSAPP_PHONE_ID}?fields=display_phone_number,verified_name`, { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }, signal: AbortSignal.timeout(10000) });
      const j = await r.json().catch(() => ({}));
      r.ok ? ok(`Navi sur WhatsApp : numéro ${j.display_phone_number ?? "?"} (${j.verified_name ?? "?"})`) : ko(`WhatsApp : jeton ou numéro refusé (HTTP ${r.status})`);
    } catch (e) { ko(`WhatsApp : API de Meta injoignable (${e.message})`); }
    if (!process.env.WHATSAPP_APP_SECRET) ko("WhatsApp : WHATSAPP_APP_SECRET manquante (signature des messages)");
    if (!process.env.WHATSAPP_VERIFY_TOKEN) ko("WhatsApp : WHATSAPP_VERIFY_TOKEN manquante (vérification du webhook)");
  } else console.log("  • Navi sur WhatsApp non configuré (facultatif)");
  console.log(erreurs ? `\n${erreurs} point(s) à corriger.` : "\nTout est prêt.");
  process.exit(erreurs ? 1 : 0);
})();
