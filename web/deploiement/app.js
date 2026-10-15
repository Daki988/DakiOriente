// Fichier de démarrage pour cPanel « Setup Node.js App » (Phusion Passenger).
// Charge les variables du fichier .env (si elles ne sont pas déjà définies dans cPanel) puis lance le serveur Next.js autonome.
const fs = require("fs");
const path = require("path");

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
require("./server.js");
