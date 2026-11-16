// Robot des accréditations (.github/workflows/accreditations.yml) : reporte les renouvellements validés dans le
// back-office (base de production) vers data/sources/maroc/renouvellements.csv, que lit le script de construction.
// Deux temps, pour ne rien perdre si l'envoi échoue :
//   npx tsx scripts/sync-renouvellements.mts exporter  → complète le CSV, écrit les identifiants dans .renouvellements-ids
//   npx tsx scripts/sync-renouvellements.mts marquer   → après l'envoi réussi, marque ces lignes « reportées » en base
import fs from "node:fs";
import path from "node:path";
import { inArray } from "drizzle-orm";

const mode = process.argv[2];
const CSV = path.resolve(import.meta.dirname, "..", "..", "data", "sources", "maroc", "renouvellements.csv");
const IDS = path.resolve(import.meta.dirname, "..", ".renouvellements-ids");
const { db, schema } = await import("../src/server/db");

if (mode === "exporter") {
  const { aReporter } = await import("../src/server/services/accreditations");
  const lignes = await aReporter();
  const existant = fs.readFileSync(CSV, "utf8");
  const deja = new Set(existant.split(/\r?\n/).slice(1).filter(Boolean).map((l) => { const c = l.split(";"); return `${c[0]}|${c[1]}|${c[2]}|${c[4]}`; }));
  const propre = (v: string | null | undefined) => String(v ?? "").replace(/[;\r\n]+/g, " ").trim();
  const nouvelles = lignes.filter((l) => !deja.has(`${l.etablissementId}|${l.filiere}|${l.composante}|${l.arrete}`));
  if (nouvelles.length) {
    const texte = nouvelles.map((l) => [l.etablissementId, l.filiere, l.composante, l.fin, l.arrete, l.bulletinOfficiel, l.datePublication, l.source,
      l.le.toISOString().slice(0, 10), l.origine === "ia" ? "assistant IA, validé par l'administrateur" : "administrateur"].map(propre).join(";")).join("\n");
    fs.writeFileSync(CSV, existant.replace(/\n?$/, "\n") + texte + "\n");
  }
  fs.writeFileSync(IDS, JSON.stringify(lignes.map((l) => l.id)));
  console.log(`${nouvelles.length} renouvellement(s) ajouté(s) au registre (${lignes.length} à marquer).`);
} else if (mode === "marquer") {
  const ids: string[] = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, "utf8")) : [];
  if (ids.length) await db.update(schema.accreditationRenouvellements).set({ reporte: true }).where(inArray(schema.accreditationRenouvellements.id, ids));
  console.log(`${ids.length} renouvellement(s) marqué(s) comme reporté(s).`);
} else {
  console.error("Usage : sync-renouvellements.mts exporter | marquer");
  process.exit(2);
}
process.exit(0);
