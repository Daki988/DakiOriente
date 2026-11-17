// Fichier de démarrage pour cPanel « Setup Node.js App » (Phusion Passenger).
// Charge les variables du fichier .env (si elles ne sont pas déjà définies dans cPanel), applique une nouvelle version
// si besoin (sauvegarde, migrations, données de référence), puis lance le serveur Next.js autonome.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const ligne of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(ligne);
    if (m && !ligne.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.HOSTNAME = process.env.APP_HOSTNAME || "0.0.0.0"; // Passenger fournit PORT et relaie les requêtes
if (!process.env.STORAGE_DIR) process.env.STORAGE_DIR = path.join(__dirname, "stockage");
process.chdir(__dirname);

// Nouvelle version déposée (mise en ligne automatique par FTP, ou paquet ZIP) : version.txt diffère de la dernière
// version appliquée. On sauvegarde, on migre, on recharge les référentiels, une seule fois par version.
// En cas d'échec des migrations, la version n'est pas marquée comme appliquée : nouvel essai au prochain démarrage.
const fichierVersion = path.join(__dirname, "version.txt");
const fichierApplique = path.join(__dirname, ".version-appliquee");
const lire = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim() : "");
const version = lire(fichierVersion);
let nouvelleVersion = false;
if (version && version !== lire(fichierApplique) && (process.env.DATABASE_URL || process.env.NETLIFY_DB_URL)) {
  const outil = (nom) => execFileSync(process.execPath, [path.join("outils", "env.cjs"), path.join("outils", nom)], { stdio: "inherit", timeout: 240000 });
  console.log(`[mise à jour] version ${version}`);
  try { outil("sauvegarde.mjs"); } catch (e) { console.error("[mise à jour] sauvegarde impossible :", e.message); }
  try {
    outil("migrate.mjs");
    outil("seed.mjs");
    fs.writeFileSync(fichierApplique, version + "\n");
    nouvelleVersion = true;
    console.log("[mise à jour] terminée");
  } catch (e) {
    console.error("[mise à jour] ÉCHEC des migrations ou des données :", e.message);
  }
}

// Connexions WebSocket refusées : le site n'en utilise aucune, et Next.js 14 a une faille connue sur ce point (SSRF).
const http = require("http");
const creerServeur = http.createServer;
http.createServer = function (...args) {
  const srv = creerServeur.apply(this, args);
  srv.prependListener("upgrade", (_req, socket) => socket.destroy());
  return srv;
};

// Robots : seuls ceux de Google et de Bing sont admis (adresse vérifiée par DNS inverse pour démasquer les imposteurs) ;
// les autres reçoivent une réponse 403. Toujours permis : robots.txt (pour qu'ils lisent la consigne), contrôle de santé,
// notifications de paiement (serveurs E-Billing et Stripe). Limite : une page déjà gardée par le cache de l'hébergeur
// (Varnish, 5 min) est servie sans passer par ici.
const dns = require("dns").promises;
const ROBOT = /bot\/|bot;|\bbot\b|robot|crawl|spider|slurp|scrap|facebookexternalhit|facebookcatalog|meta-external|whatsapp|telegram|discord|skype|slack|preview|embedly|python-|python\/|aiohttp|httpx|go-http-client|okhttp|java\/|libwww|httpclient|curl\/|wget|headless|phantomjs|puppeteer|playwright|selenium|ahrefs|semrush|mj12|petalbot|bytespider|gptbot|claude|ccbot|perplexity|amazonbot|applebot|yandex|baidu|duckduck|sogou|seznam|ia_archiver|archive\.org|feedfetcher|validator|monitor|uptime|pingdom|lighthouse/i;
const ADMIS = [
  { ua: /googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|mediapartners-google|apis-google|feedfetcher-google|google-site-verification|google-read-aloud/i, hotes: /\.(googlebot|google|googleusercontent)\.com$/ },
  { ua: /bingbot|msnbot|bingpreview|adidxbot/i, hotes: /\.search\.msn\.com$/ },
];
const LIBRES = /^\/(robots\.txt|api\/sante\/?|api\/paiements\/webhook\/)/;
const verifies = new Map(); // ip|famille → { ok, le }
async function ipDe(hotes, ip) {
  const cle = `${hotes.source}|${ip}`;
  const c = verifies.get(cle);
  if (c && Date.now() - c.le < 864e5) return c.ok;
  let ok;
  try {
    const noms = await dns.reverse(ip);
    const nom = noms.find((n) => hotes.test(n));
    ok = !!nom && (await dns.lookup(nom, { all: true })).some((a) => a.address === ip);
  } catch { ok = null; } // DNS indisponible ou adresse sans nom : on laisse passer plutôt que de risquer de refuser Google
  if (ok !== null) { verifies.set(cle, { ok, le: Date.now() }); if (verifies.size > 5000) verifies.delete(verifies.keys().next().value); }
  return ok !== false;
}
async function robotRefuse(req) {
  const ua = String(req.headers["user-agent"] || "");
  if (LIBRES.test(req.url || "")) return false;
  if (!ua) return true; // aucun navigateur n'envoie de requête sans identification
  const famille = ADMIS.find((a) => a.ua.test(ua));
  if (famille) {
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim().replace(/^::ffff:/, "");
    return !(await ipDe(famille.hotes, ip));
  }
  return ROBOT.test(ua);
}
{
  const creer = http.createServer;
  http.createServer = function (...args) {
    const i = args.findIndex((a) => typeof a === "function");
    if (i < 0) return creer.apply(this, args);
    const suite = args[i];
    args[i] = (req, res) => {
      robotRefuse(req).then((non) => {
        if (!non) return suite(req, res);
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "CDN-Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
        res.end("Robots non autorisés sur navigoal.net.\n");
      }).catch(() => suite(req, res));
    };
    return creer.apply(this, args);
  };
}

// Accès par pays (réglage du back-office) : contrôlé ici, devant Next.js, pour chaque requête, y compris les pages
// pré-générées. Quand le filtre est actif, les pages ne sont plus gardées par le cache de l'hébergeur (sinon une page
// en cache serait servie à un visiteur d'un autre pays sans contrôle).
let acces = null;
const outilAcces = path.join(__dirname, "outils", "acces.mjs");
if (fs.existsSync(outilAcces)) {
  const pret = import(require("url").pathToFileURL(outilAcces).href).then((m) => (acces = m)).catch((e) => console.error("[accès par pays] module indisponible :", e.message));
  const creer = http.createServer;
  http.createServer = function (...args) {
    const i = args.findIndex((a) => typeof a === "function");
    if (i < 0) return creer.apply(this, args);
    const suite = args[i];
    args[i] = (req, res) => {
      pret.then(() => (acces ? acces.controler(req) : null)).then((d) => {
        if (!d || !d.actif) return suite(req, res);
        const poser = res.setHeader.bind(res);
        res.setHeader = (nom, valeur) => poser(nom, String(nom).toLowerCase() === "cdn-cache-control" ? "no-store" : valeur);
        poser("CDN-Cache-Control", "no-store");
        poser("Vary", "Cookie");
        if (d.autorise) return suite(req, res);
        if ((req.url || "").startsWith("/api/")) {
          res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
          return res.end(JSON.stringify({ error: { code: "pays_non_autorise", message: "Navigoal n'est pas disponible dans votre pays." } }));
        }
        res.writeHead(302, { Location: "/acces-restreint/", "Cache-Control": "no-store" });
        res.end();
      }).catch((e) => { console.error("[accès par pays]", e.message); suite(req, res); }); // en cas de panne : on laisse passer
    };
    return creer.apply(this, args);
  };
}

require("./serveur/server.js"); // le serveur Next.js se place lui-même dans serveur/ (fichiers publics, .next)

// Anciennes versions encore en mémoire : l'hébergeur (Passenger) ne relance pas toujours tous les processus après une
// mise à jour. Un processus resté sur une ancienne version sert alors des pages qui réclament des fichiers JavaScript
// supprimés (écran « Application error »). Deux garde-fous :
// 1. au démarrage d'une nouvelle version, les autres processus de cette application sont arrêtés (Passenger en relance) ;
// 2. chaque processus surveille version.txt et s'arrête de lui-même dès qu'une autre version est déposée.
const arreterAnciens = () => {
  try {
    const lignes = execFileSync("ps", ["-u", String(process.getuid()), "-o", "pid=,args="], { encoding: "utf8", timeout: 5000 }).split("\n");
    for (const l of lignes) {
      const m = /^\s*(\d+)\s+(.*)$/.exec(l);
      if (!m) continue;
      const pid = Number(m[1]);
      if (pid === process.pid || pid === process.ppid || !m[2].includes(__dirname) || !/Passenger NodeApp|app\.js/i.test(m[2])) continue;
      try { process.kill(pid, "SIGTERM"); console.log(`[mise à jour] ancien processus ${pid} arrêté`); } catch { /* déjà arrêté ou pas à nous */ }
    }
  } catch (e) { console.error("[mise à jour] liste des processus indisponible :", e.message); }
};
if (nouvelleVersion) setTimeout(arreterAnciens, 5000).unref();
if (version) {
  const surveiller = setInterval(() => {
    const v = lire(fichierVersion);
    if (v && v !== version) {
      console.log(`[mise à jour] version ${v} déposée : arrêt de ce processus (version ${version}), Passenger en relance un neuf`);
      clearInterval(surveiller);
      setTimeout(() => process.exit(0), 20000).unref(); // laisse finir l'envoi des fichiers et les requêtes en cours
    }
  }, 30000);
  surveiller.unref();
}

// Cache de l'hébergeur (Varnish LWS) : vidé après une nouvelle version, une fois le serveur prêt.
if (nouvelleVersion) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").replace(/\/$/, "");
  if (site) setTimeout(() => fetch(`${site}/.*`, { method: "PURGE" }).then((r) => console.log(`[mise à jour] cache purgé (${r.status})`)).catch(() => {}), 15000).unref();
}
