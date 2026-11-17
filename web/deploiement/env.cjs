// Lance un script de maintenance (migrations, données) après chargement du fichier .env.
// Usage : node outils/env.cjs outils/migrate.mjs
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
import(require("url").pathToFileURL(path.resolve(racine, process.argv[2])).href).catch((e) => { console.error(e); process.exit(1); });
