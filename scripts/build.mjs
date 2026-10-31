// Copie uniquement les fichiers publics du site dans « public/ ».
import { cp, rm, mkdir } from "node:fs/promises";

const OUT = "public";
const FILES = ["index.html", "guide.html", "suivi.html", "mentions-legales.html", "cgv.html", "confidentialite.html", "robots.txt"];
const DIRS = ["assets", "admin"];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const f of FILES) await cp(f, `${OUT}/${f}`);
for (const d of DIRS) await cp(d, `${OUT}/${d}`, { recursive: true });
console.log("Site copié dans", OUT);
