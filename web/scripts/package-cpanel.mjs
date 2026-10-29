// Paquet de déploiement pour un hébergement cPanel (« Setup Node.js App », Passenger) avec PostgreSQL.
// Usage : cd web && node scripts/package-cpanel.mjs  → ../livraison/navigoal-cpanel-AAAA-MM-JJ.zip
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(web, "..");
const date = new Date().toISOString().slice(0, 10);
const out = path.join(root, "livraison", "navigoal");
const zip = path.join(root, "livraison", `navigoal-cpanel-${date}.zip`);
const run = (cmd, env = {}) => execSync(cmd, { cwd: web, stdio: "inherit", env: { ...process.env, ...env } });
const copy = (a, b) => fs.cpSync(a, b, { recursive: true, filter: (s) => !/\.(meta|DS_Store)$/.test(s) });

console.log("1/4 Build Next.js autonome");
run("npm run build", { BUILD_STANDALONE: "1", NEXT_TELEMETRY_DISABLED: "1" });

console.log("2/4 Scripts de base de données (migrations, données de démarrage)");
fs.rmSync(path.join(root, "livraison"), { recursive: true, force: true });
fs.mkdirSync(path.join(out, "outils"), { recursive: true });
const banner = "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);";
for (const s of ["migrate", "seed", "sauvegarde", "restauration"])
  run(`npx esbuild scripts/${s}.mts --bundle --platform=node --format=esm --target=node20 --external:pg-native --banner:js="${banner}" --outfile=${path.join(out, "outils", s + ".mjs")} --log-level=warning`);

console.log("3/4 Assemblage");
copy(path.join(web, ".next", "standalone"), out);
copy(path.join(web, ".next", "static"), path.join(out, ".next", "static"));
copy(path.join(web, "public"), path.join(out, "public"));
copy(path.join(web, "drizzle"), path.join(out, "drizzle"));
copy(path.join(root, "data", "referentiels"), path.join(out, "data", "referentiels"));
if (fs.existsSync(path.join(root, "data", "archives"))) copy(path.join(root, "data", "archives"), path.join(out, "data", "archives"));
fs.mkdirSync(path.join(out, "stockage"), { recursive: true });
fs.writeFileSync(path.join(out, "stockage", ".htaccess"), "Require all denied\n");
for (const f of ["app.js", ".env.example", "LISEZMOI-DEPLOIEMENT.md"]) fs.copyFileSync(path.join(web, "deploiement", f), path.join(out, f));
// package.json minimal : « type » non défini (server.js et app.js en CommonJS), scripts utiles dans cPanel
fs.writeFileSync(path.join(out, "package.json"), JSON.stringify({
  name: "navigoal", private: true, version: date, main: "app.js",
  scripts: { start: "node app.js", verifier: "node outils/verifier.cjs", migrate: "node outils/env.cjs outils/migrate.mjs", seed: "node outils/env.cjs outils/seed.mjs", sauvegarde: "node outils/env.cjs outils/sauvegarde.mjs" },
  engines: { node: ">=20" },
}, null, 2));
// nodemailer (sans dépendance) pour l'outil de vérification ; le site l'intègre déjà à son code compilé.
if (!fs.existsSync(path.join(out, "node_modules", "nodemailer"))) copy(path.join(web, "node_modules", "nodemailer"), path.join(out, "node_modules", "nodemailer"));
for (const f of ["env.cjs", "verifier.cjs"]) fs.copyFileSync(path.join(web, "deploiement", f), path.join(out, "outils", f));

console.log("4/4 Archive ZIP");
execSync(`cd "${path.join(root, "livraison")}" && zip -qr -9 "${zip}" navigoal`, { stdio: "inherit" });
console.log(`Paquet prêt : ${zip} (${(fs.statSync(zip).size / 1e6).toFixed(1)} Mo)`);
