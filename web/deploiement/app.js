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

require("./serveur/server.js"); // le serveur Next.js se place lui-même dans serveur/ (fichiers publics, .next)

// Cache de l'hébergeur (Varnish LWS) : vidé après une nouvelle version, une fois le serveur prêt.
if (nouvelleVersion) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "").replace(/\/$/, "");
  if (site) setTimeout(() => fetch(`${site}/.*`, { method: "PURGE" }).then((r) => console.log(`[mise à jour] cache purgé (${r.status})`)).catch(() => {}), 15000).unref();
}
