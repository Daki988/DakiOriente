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

// Accès par pays (réglage du back-office) : contrôlé ici, devant Next.js, pour chaque requête, y compris les pages
// pré-générées. Quand le filtre est actif, les pages ne sont plus gardées par le cache de l'hébergeur (sinon une page
// en cache serait servie à un visiteur d'un autre pays sans contrôle).
const http = require("http");
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

// Cache de l'hébergeur (Varnish LWS) : vidé après une nouvelle version, une fois le serveur prêt.
if (nouvelleVersion) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").replace(/\/$/, "");
  if (site) setTimeout(() => fetch(`${site}/.*`, { method: "PURGE" }).then((r) => console.log(`[mise à jour] cache purgé (${r.status})`)).catch(() => {}), 15000).unref();
}
