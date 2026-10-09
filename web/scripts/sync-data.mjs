// Copie les référentiels (../data/referentiels) et les logos (../assets/logos) dans l'application web.
// Exécuté automatiquement avant `dev` et `build`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, "..");
const root = path.resolve(web, "..");
const REF = path.join(root, "data", "referentiels");
const OUT = path.join(web, "src", "data");
const LOGOS_OUT = path.join(web, "public", "logos");
const PHOTOS_OUT = path.join(web, "public", "photos");

const read = (name) => JSON.parse(fs.readFileSync(path.join(REF, `${name}.json`), "utf8"));
const write = (name, data) => fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));

fs.mkdirSync(OUT, { recursive: true });

for (const name of ["pays", "niveaux", "domaines", "profils_riasec", "competences", "metiers", "formations", "series"]) {
  write(name, read(name).items);
}

const logoUrl = (logo) => (logo ? "/" + logo.fichier.replace(/^assets\//, "") : null);
const photoOf = (p) => ({ src: "/" + p.fichier.replace(/^assets\//, ""), credit: p.credit, licence: p.licence, page: p.page_source });

const sup = read("etablissements_superieurs").items.map((e) => ({
  id: e.id, nom: e.nom, sigle: e.sigle, pays: e.pays, ville: e.ville, type: e.type, type_libelle: e.type_libelle,
  statut: e.statut, site_web: e.site_web, annee_creation: e.annee_creation, coordonnees: e.coordonnees,
  label: e.label, label_libelle: e.label_libelle, reconnaissance: e.reconnaissance, reconnaissance_en_cours: e.reconnaissance_en_cours,
  adresse: e.adresse ?? null, description: e.description ?? null,
  formations: e.formations, filieres: e.filieres, logo: logoUrl(e.logo), photos: (e.photos || []).map(photoOf),
}));
write("etablissements", sup);

const secDoc = read("etablissements_secondaires");
const counts = {};
for (const e of secDoc.items) counts[e.pays] = (counts[e.pays] || 0) + 1;
write("lycees", {
  total: counts,
  items: secDoc.items.filter((e) => e.source === "curation").map((e) => ({
    id: e.id, nom: e.nom, pays: e.pays, ville: e.ville, type: e.type, statut: e.statut,
    series: e.series_proposees, particularites: e.particularites, logo: logoUrl(e.logo),
  })),
});

const nav = read("navilease_logements");
write("navilease", { residences: nav.items, ...nav._meta });
const seriesDoc = JSON.parse(fs.readFileSync(path.join(REF, "series.json"), "utf8"));
write("orientation_seconde", seriesDoc._meta.orientation_fin_college);

write("pays_details", read("pays_details").items);
const origine = JSON.parse(fs.readFileSync(path.join(REF, "pays_origine.json"), "utf8"));
write("pays_origine", {
  regions: origine._meta.regions, visa: origine._meta.visa, avertissement: origine._meta.avertissement,
  items: origine.items.map((p) => ({
    id: p.iso2, nom: p.nom, region: p.region, continent: p.continent, indicatif: p.indicatif, devise: p.devise,
    visa: p.visa_maroc, aevm: !!p.aevm_obligatoire, evisa_conditionnel: !!p.evisa_conditionnel, diplome: p.diplome_fin_secondaire ?? null,
    systeme: p.systeme ?? null, note: p.note ?? null, sejour: p.note_sejour ?? null,
  })),
});
const couts = read("couts_etudes");
const coutsMeta = JSON.parse(fs.readFileSync(path.join(REF, "couts_etudes.json"), "utf8"))._meta;
write("couts", { items: couts.items, taux: coutsMeta.taux_change_indicatifs, hypotheses: coutsMeta.hypotheses, sources: coutsMeta.sources, avertissement: coutsMeta.avertissement });

fs.rmSync(PHOTOS_OUT, { recursive: true, force: true });
fs.cpSync(path.join(root, "assets", "photos"), PHOTOS_OUT, { recursive: true, filter: (src) => !src.endsWith(".json") });

fs.rmSync(LOGOS_OUT, { recursive: true, force: true });
fs.cpSync(path.join(root, "assets", "logos"), LOGOS_OUT, {
  recursive: true,
  filter: (src) => !src.endsWith(".json"),
});

console.log(`Référentiels synchronisés : ${sup.length} établissements, ${read("metiers").items.length} métiers.`);
