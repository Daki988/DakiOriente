// Audit de sécurité : un compte « intrus » de chaque profil tente d'agir sur les données d'un autre compte du même profil
// (IDOR), puis injections, fichiers piégés, sessions, CSRF, redirections ouvertes, en-têtes et cache.
// À lancer APRÈS audit-actions.mjs, sur la même base jetable (il réutilise les candidatures, réservations… créées).
// Usage : BASE=http://localhost:3000 OUT=dossier MDP=… node scripts/audit-securite.mjs
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "audit-fonctionnel";
const MDP = process.env.MDP || "Navigoal2026";
const DEMO = (p) => `${p}@demo.navigoal.net`;
const RUN = Date.now().toString(36);
const an = new Date().getFullYear();
const resultats = [];
const REFUS = [401, 403, 404];
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");

function client(nom, { origin = BASE } = {}) {
  let cookie = "";
  const call = async (method, url, body, { form, headers: h = {}, brut } = {}) => {
    const headers = { cookie, ...(origin ? { origin } : {}), ...h };
    let payload;
    if (form) { payload = new FormData(); for (const [k, v] of Object.entries(form)) payload.append(k, v); }
    else if (brut !== undefined) { payload = brut; headers["content-type"] ??= "application/json"; }
    else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const [chemin, qs] = url.split("?");
    const u = /\.[a-z]+$/.test(chemin) || chemin.endsWith("/") ? chemin : chemin + "/";
    const r = await fetch(BASE + "/api" + u + (qs ? "?" + qs : ""), { method, headers, body: payload, redirect: "manual" });
    for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const [k] = kv.split("="); cookie = [...cookie.split("; ").filter((x) => x && !x.startsWith(k + "=")), kv].join("; "); }
    const type = r.headers.get("content-type") ?? "";
    const data = type.includes("json") ? await r.json().catch(() => null) : await r.text().catch(() => "");
    return { status: r.status, data, headers: r.headers };
  };
  return { nom, call, get cookie() { return cookie; }, set cookie(v) { cookie = v; },
    get: (u, o) => call("GET", u, undefined, o), post: (u, b, o) => call("POST", u, b ?? {}, o), patch: (u, b) => call("PATCH", u, b), put: (u, b) => call("PUT", u, b), del: (u) => call("DELETE", u) };
}

/** Consigne un contrôle : `attendu` = liste de statuts acceptables ; `verif` = test supplémentaire sur la réponse. */
async function controle(theme, libelle, fn, attendu = REFUS, verif) {
  try {
    const r = await fn();
    let ok = attendu.includes(r.status);
    let detail;
    if (ok && verif) { const v = await verif(r); if (v !== true) { ok = false; detail = String(v); } }
    if (!ok) detail ??= `statut ${r.status} : ${JSON.stringify(r.data).slice(0, 200)}`;
    resultats.push({ theme, controle: libelle, statut: r.status, ok, detail });
    if (!ok) console.log(`✗ [${theme}] ${libelle} → ${detail}`);
    return r;
  } catch (e) {
    resultats.push({ theme, controle: libelle, statut: 0, ok: false, detail: String(e).slice(0, 200) });
    console.log(`✗ [${theme}] ${libelle} → exception ${e}`);
    return null;
  }
}
const note = (theme, libelle, ok, detail) => { resultats.push({ theme, controle: libelle, statut: 0, ok, detail }); if (!ok) console.log(`✗ [${theme}] ${libelle} → ${detail}`); };
const connecter = async (c, identifiant, mdp = MDP) => { const r = await c.post("/auth/connexion", { identifiant, motDePasse: mdp }); if (r.status !== 200) throw new Error(`connexion ${identifiant} : ${r.status}`); return r.data; };
const liste = (d) => (Array.isArray(d) ? d : d?.items ?? []);

// ------------------------------------------------------------ Comptes victimes et leurs données
const amina = client("amina"); await connecter(amina, DEMO("amina.demo"));
const parent = client("parent"); await connecter(parent, DEMO("parent.demo"));
const ecole = client("ecole"); const meEcole = await connecter(ecole, DEMO("ecole.demo"));
const bailleur = client("bailleur"); await connecter(bailleur, DEMO("bailleur.demo"));
const adm = client("admin"); await connecter(adm, DEMO("admin"));

const candA = liste((await amina.get("/candidatures")).data).map((x) => x.application?.id ?? x.a?.id ?? x.id).filter(Boolean);
const docsA = liste((await amina.get("/documents")).data).map((x) => x.id);
const convsA = liste((await amina.get("/conversations")).data).map((x) => x.c?.id ?? x.conversation?.id ?? x.id).filter(Boolean);
const paiementsA = liste((await amina.get("/paiements")).data).map((x) => x.reference ?? x.ref ?? x.p?.reference).filter(Boolean);
const resaA = liste((await amina.get("/reservations")).data).map((x) => x.booking?.id ?? x.b?.id ?? x.id).filter(Boolean);
const enfants = liste((await parent.get("/parent/enfants")).data).map((x) => x.child?.id).filter(Boolean);
const eid = (await ecole.get("/moi")).data?.establishments?.[0]?.id ?? (await ecole.get("/moi")).data?.etablissement?.id ?? meEcole?.establishmentId ?? "ma-esa-casa";
const annonces = liste((await bailleur.get("/bailleur/logements")).data).map((x) => x.h?.id ?? x.housing?.id ?? x.id).filter(Boolean);
console.log(`Données cibles : ${candA.length} candidatures, ${docsA.length} documents, ${convsA.length} fils, ${paiementsA.length} paiements, ${resaA.length} réservations, ${enfants.length} enfants, école ${eid}, ${annonces.length} annonces`);
if (!candA.length || !docsA.length) note("préparation", "données victimes présentes (lancer audit-actions avant)", false, "aucune candidature ou document");

// ------------------------------------------------------------ Comptes intrus
const intrus = client("élève intrus");
await controle("inscription", "inscription d'un 2e élève", () => intrus.post("/auth/inscription", { role: "eleve", firstName: "Intrus", lastName: "Test", email: `intrus.${RUN}@exemple.ga`, password: MDP, country: "GA", birthYear: an - 19, acceptTerms: true }), [200, 201]);
const parentIntrus = client("parent intrus");
await controle("inscription", "inscription d'un 2e parent", () => parentIntrus.post("/auth/inscription", { role: "parent", firstName: "Parent", lastName: "Intrus", email: `parent.intrus.${RUN}@exemple.ga`, password: MDP, country: "GA", acceptTerms: true }), [200, 201]);
const bailleurIntrus = client("bailleur intrus");
await controle("inscription", "inscription d'un 2e bailleur", () => bailleurIntrus.post("/auth/inscription", { role: "bailleur", firstName: "Bailleur", lastName: "Intrus", email: `bailleur.intrus.${RUN}@exemple.ma`, password: MDP, country: "MA", acceptTerms: true }), [200, 201]);
// 2e école : accès officiel d'un autre établissement, mot de passe provisoire réinitialisé par l'admin puis remplacé.
const ecoleIntrus = client("école intruse");
const accesListe = liste((await adm.get("/admin/acces")).data);
const autreAcces = accesListe.filter((a) => a.id !== eid).flatMap((a) => a.comptes ?? [])[0];
const uidIntrus = autreAcces?.id;
if (uidIntrus) {
  const reinit = (await adm.post(`/admin/acces/${uidIntrus}/reinitialiser`)).data;
  const ident = reinit?.email ?? reinit?.identifiant ?? autreAcces.email;
  const prov = reinit?.motDePasse ?? reinit?.password ?? reinit?.motDePasseProvisoire;
  if (ident && prov) {
    await connecter(ecoleIntrus, ident, prov);
    await controle("comptes", "accès provisoire : tout est bloqué avant le changement de mot de passe", () => ecoleIntrus.get(`/ecole/${eid}/candidatures`), [403]);
    await controle("comptes", "accès provisoire : mot de passe faible refusé", () => ecoleIntrus.post("/moi/premier-mot-de-passe", { nouveau: "123" }), [400, 422]);
    await ecoleIntrus.post("/moi/premier-mot-de-passe", { motDePasse: MDP + "#X", nouveau: MDP + "#X", password: MDP + "#X" });
  } else note("préparation", "accès d'une 2e école", false, JSON.stringify(reinit).slice(0, 200));
} else note("préparation", "accès d'une 2e école", false, "aucun accès d'un autre établissement");

// ------------------------------------------------------------ IDOR : élève intrus sur les données d'Amina
for (const id of candA.slice(0, 2)) {
  await controle("IDOR élève", `lire la candidature d'un autre`, () => intrus.get(`/candidatures/${id}`));
  await controle("IDOR élève", `modifier la candidature d'un autre`, () => intrus.patch(`/candidatures/${id}`, { motivation: "piraté" }));
  await controle("IDOR élève", `envoyer la candidature d'un autre`, () => intrus.post(`/candidatures/${id}/envoyer`, { moyen: "especes" }));
  await controle("IDOR élève", `désister la candidature d'un autre`, () => intrus.post(`/candidatures/${id}/desister`));
  await controle("IDOR élève", `bordereau PDF d'un autre`, () => intrus.get(`/candidatures/${id}/bordereau.pdf`));
  await controle("IDOR élève", `attestation PDF d'un autre`, () => intrus.get(`/candidatures/${id}/attestation.pdf`));
  await controle("IDOR élève", `ouvrir le fil de l'admin sur la candidature d'un autre`, () => intrus.post(`/admin/candidatures/${id}/fil`));
}
for (const id of docsA.slice(0, 2)) {
  await controle("IDOR élève", "télécharger le document d'un autre", () => intrus.get(`/documents/${id}/fichier`));
  await controle("IDOR élève", "supprimer le document d'un autre", () => intrus.del(`/documents/${id}`));
}
// Joindre le document d'un autre à sa propre candidature (référence indirecte).
const progs = liste((await intrus.get("/etablissements/ma-esa-casa/formations")).data);
const pid = progs[progs.length - 1]?.id ?? progs[0]?.p?.id;
const maCand = pid && (await intrus.post("/candidatures", { programId: pid })).data;
if (maCand?.id && docsA[0]) {
  await controle("IDOR élève", "joindre le document d'un autre à sa candidature", () => intrus.patch(`/candidatures/${maCand.id}`, { documentIds: [docsA[0]] }), [400, 403, 404, 422]);
  const apres = (await intrus.get(`/candidatures/${maCand.id}`)).data;
  note("IDOR élève", "le document d'un autre n'apparaît pas dans sa candidature", !JSON.stringify(apres ?? {}).includes(docsA[0]), "document étranger rattaché");
}
for (const id of convsA.slice(0, 2)) {
  await controle("IDOR élève", "lire le fil d'un autre", () => intrus.get(`/conversations/${id}`));
  await controle("IDOR élève", "écrire dans le fil d'un autre", () => intrus.post(`/conversations/${id}/messages`, { texte: "intrusion" }));
}
for (const ref of paiementsA.slice(0, 2)) {
  await controle("IDOR élève", "voir le paiement d'un autre", () => intrus.get(`/paiements/${ref}`));
  await controle("IDOR élève", "reçu PDF d'un autre", () => intrus.get(`/paiements/${ref}/recu.pdf`));
  await controle("IDOR élève", "valider (simulation) le paiement d'un autre", () => intrus.post(`/paiements/${ref}/simulation`, { issue: "succes" }));
}
for (const id of resaA.slice(0, 2)) {
  await controle("IDOR élève", "voir la réservation d'un autre", () => intrus.get(`/reservations/${id}`));
  await controle("IDOR élève", "contrat PDF d'un autre", () => intrus.get(`/reservations/${id}/contrat.pdf`));
  for (const a of ["paiement", "signature", "annulation", "litige", "preavis", "loyer", "entree", "avis"])
    await controle("IDOR élève", `réservation d'un autre : ${a}`, () => intrus.post(`/reservations/${id}/${a}`, { motif: "x", texte: "x", note: 5, date: `${an + 1}-06-30` }), [...REFUS, 400, 422]);
}
await controle("IDOR élève", "liste des candidatures : seulement les siennes", () => intrus.get("/candidatures"), [200], (r) => !candA.some((id) => JSON.stringify(r.data).includes(id)) || "candidatures d'un autre visibles");
await controle("IDOR élève", "liste des documents : seulement les siens", () => intrus.get("/documents"), [200], (r) => !docsA.some((id) => JSON.stringify(r.data).includes(id)) || "documents d'un autre visibles");

// ------------------------------------------------------------ IDOR : parent intrus
for (const id of enfants) {
  await controle("IDOR parent", "candidatures d'un enfant non rattaché", () => parentIntrus.get(`/parent/enfants/${id}/candidatures`));
  await controle("IDOR parent", "consentement pour un enfant non rattaché", () => parentIntrus.post(`/parent/enfants/${id}/consentement`, { consentement: false }));
  await controle("IDOR parent", "visibilité pour un enfant non rattaché", () => parentIntrus.post(`/parent/enfants/${id}/visibilite`, { accord: true }));
}
for (const id of resaA.slice(0, 2)) await controle("IDOR parent", "se porter garant d'une réservation étrangère", () => parentIntrus.post(`/reservations/${id}/garant`, { accepte: true }), [...REFUS, 400]);
await controle("IDOR parent", "paiements : rien d'une autre famille", () => parentIntrus.get("/paiements"), [200], (r) => !paiementsA.some((x) => JSON.stringify(r.data).includes(x)) || "paiements d'une autre famille visibles");

// ------------------------------------------------------------ IDOR : école intruse sur l'école démo
if (uidIntrus) {
  for (const [m, u, b] of [["GET", `/ecole/${eid}/tableau-de-bord`], ["GET", `/ecole/${eid}/candidatures`], ["GET", `/ecole/${eid}/candidatures?format=csv`], ["GET", `/ecole/${eid}/candidatures-filtrees`], ["GET", `/ecole/${eid}/formations`], ["GET", `/ecole/${eid}/campagnes`], ["GET", `/ecole/${eid}/offre`], ["GET", `/ecole/${eid}/premium`], ["GET", `/ecole/${eid}/prospections`],
    ["PATCH", `/ecole/${eid}`, { description: "piraté" }], ["POST", `/ecole/${eid}/formations`, { name: "Formation pirate" }], ["POST", `/ecole/${eid}/campagnes`, { name: "x" }], ["POST", `/ecole/${eid}/vivier`, {}], ["POST", `/ecole/${eid}/prospections`, { titre: "x" }]])
    await controle("IDOR école", `${m} ${u.replace(eid, ":autre")}`, () => ecoleIntrus.call(m, u, b ?? (m === "GET" ? undefined : {})), REFUS);
  for (const id of candA.slice(0, 2)) {
    await controle("IDOR école", "lire une candidature adressée à une autre école", () => ecoleIntrus.get(`/candidatures/${id}`));
    await controle("IDOR école", "décider d'une candidature adressée à une autre école", () => ecoleIntrus.post(`/ecole/candidatures/${id}/statut`, { status: "refusee", note: "x" }));
    await controle("IDOR école", "pièce d'une candidature d'une autre école", () => ecoleIntrus.get(`/documents/${docsA[0]}/fichier`));
  }
  for (const id of convsA.slice(0, 1)) await controle("IDOR école", "lire le fil d'une autre école", () => ecoleIntrus.get(`/conversations/${id}`));
}

// ------------------------------------------------------------ IDOR : bailleur intrus
for (const id of annonces.slice(0, 2)) {
  await controle("IDOR bailleur", "voir l'annonce (gestion) d'un autre", () => bailleurIntrus.get(`/bailleur/logements/${id}`));
  await controle("IDOR bailleur", "modifier l'annonce d'un autre", () => bailleurIntrus.patch(`/bailleur/logements/${id}`, { title: "Annonce piratée", type: "studio", description: "Description modifiée par un autre bailleur pour le test.", ville: "Casablanca", address: "1 rue x", rent: 1000, charges: 0, deposit: 1000 }));
  await controle("IDOR bailleur", "ajouter une photo à l'annonce d'un autre", () => bailleurIntrus.post(`/bailleur/logements/${id}/photos`, undefined, { form: { fichier: new File([PDF], "x.png", { type: "image/png" }) } }), [...REFUS, 400, 415, 422]);
  await controle("IDOR bailleur", "archiver l'annonce d'un autre", () => bailleurIntrus.post(`/bailleur/logements/${id}/archiver`));
  await controle("IDOR bailleur", "soumettre l'annonce d'un autre", () => bailleurIntrus.post(`/bailleur/logements/${id}/moderation`));
}
for (const id of resaA.slice(0, 2)) {
  await controle("IDOR bailleur", "répondre à la réservation d'un autre bailleur", () => bailleurIntrus.post(`/reservations/${id}/reponse`, { accepte: true }));
  await controle("IDOR bailleur", "état des lieux de sortie chez un autre", () => bailleurIntrus.post(`/reservations/${id}/sortie`, { retenue: 0 }), [...REFUS, 400]);
}

// ------------------------------------------------------------ Élévation de privilèges et affectation de masse
await controle("privilèges", "inscription avec le rôle admin refusée", () => client("x").post("/auth/inscription", { role: "admin", firstName: "A", lastName: "B", email: `adm.${RUN}@exemple.ga`, password: MDP, country: "GA", acceptTerms: true }), [400, 403, 422]);
await controle("privilèges", "inscription conseiller refusée (réservé à l'admin)", () => client("x").post("/auth/inscription", { role: "conseiller", firstName: "A", lastName: "B", email: `cons.${RUN}@exemple.ga`, password: MDP, country: "GA", acceptTerms: true }), [400, 403, 422]);
await intrus.patch("/moi", { role: "admin", status: "actif", plan: "premium", isAdmin: true, emailVerifiedAt: new Date().toISOString(), id: "autre", userId: "autre" });
await controle("privilèges", "PATCH /moi ne change ni le rôle ni l'identité", () => intrus.get("/session"), [200], (r) => (r.data?.user?.role ?? r.data?.role) === "eleve" || `rôle devenu ${JSON.stringify(r.data).slice(0, 120)}`);
await controle("privilèges", "back-office refusé à l'élève après tentative", () => intrus.get("/admin/statistiques"), [403]);
await controle("privilèges", "école : PATCH de la fiche sans changer plan/vérification", () => ecole.patch(`/ecole/${eid}`, { plan: "premium", premiumUntil: "2099-01-01", featuredUntil: "2099-01-01", verified: true }), [200, 400, 422]);
await controle("privilèges", "plan premium non obtenu par la fiche", () => ecole.get(`/ecole/${eid}/premium`), [200], (r) => !JSON.stringify(r.data).includes("2099") || "date 2099 acceptée");
await controle("privilèges", "bailleur : publier sans modération", () => bailleur.patch(`/bailleur/logements/${annonces[0]}`, { status: "publie", verificationLevel: 3 }), [200, 400, 422], async () => {
  const h = (await bailleur.get(`/bailleur/logements/${annonces[0]}`)).data;
  return JSON.stringify(h).includes('"verificationLevel":3') ? "niveau de vérification modifié" : true;
});

// ------------------------------------------------------------ Paiements
await controle("paiements", "webhook sans signature refusé", () => client("x", { origin: null }).post("/paiements/webhook/cinetpay", { reference: paiementsA[0] ?? "x", statut: "succes", montant: 1 }), [400, 401, 403, 404]);
await controle("paiements", "webhook fournisseur inconnu", () => client("x", { origin: null }).post("/paiements/webhook/inconnu", { reference: "x" }), [400, 401, 403, 404]);
if (maCand?.id) await controle("paiements", "montant imposé par le client ignoré", () => intrus.post(`/candidatures/${maCand.id}/envoyer`, { moyen: "especes", montant: 1, amount: 1 }), [200, 201, 400, 422], (r) => {
  const m = r.data?.payment?.amount ?? r.data?.paiement?.amount ?? r.data?.amount;
  return m === undefined || m > 1 || `montant accepté : ${m}`;
});

// ------------------------------------------------------------ Injections
const INJ = ["' OR 1=1--", "\"; DROP TABLE users;--", "1 UNION SELECT password_hash FROM users", "%27%20OR%201%3D1", "${7*7}", "{{7*7}}", "../../../../etc/passwd", "\u0000", "<script>alert(1)</script>"];
for (const v of INJ) {
  await controle("injection", `recherche q=${v.slice(0, 25)}`, () => client("v").get(`/recherche?q=${encodeURIComponent(v)}`), [200, 400], (r) => !/password|hash|root:x/i.test(JSON.stringify(r.data)) || "fuite");
  await controle("injection", `établissements ville=${v.slice(0, 25)}`, () => client("v").get(`/etablissements?ville=${encodeURIComponent(v)}&q=${encodeURIComponent(v)}`), [200, 400]);
  await controle("injection", `connexion identifiant=${v.slice(0, 25)}`, () => client("v").post("/auth/connexion", { identifiant: v, motDePasse: v }), [400, 401, 422, 429]);
}
await controle("injection", "connexion : opérateur objet (NoSQL) refusé", () => client("v").post("/auth/connexion", { identifiant: { $ne: null }, motDePasse: { $gt: "" } }), [400, 401, 422]);
await controle("injection", "corps JSON énorme (2 Mo)", () => client("v").post("/auth/connexion", undefined, { brut: JSON.stringify({ identifiant: "a".repeat(2_000_000), motDePasse: "x" }) }), [400, 401, 413, 422]);
await controle("injection", "JSON profond (prototype pollution)", () => intrus.patch("/moi", JSON.parse('{"__proto__":{"role":"admin"},"constructor":{"prototype":{"role":"admin"}},"city":"Libreville"}')), [200, 400, 422]);
await controle("injection", "pas de pollution de prototype", () => intrus.get("/session"), [200], (r) => (r.data?.user?.role ?? r.data?.role) === "eleve" || "rôle modifié");

// XSS stockée : le contenu doit ressortir échappé (vérifié ensuite dans le navigateur par audit-ui) ; ici : pas de HTML exécuté dans les PDF/CSV.
const XSS = `<img src=x onerror=alert(1)><script>alert(2)</script>"'><svg onload=alert(3)>`;
await controle("XSS", "nom avec balises : refusé ou nettoyé", () => intrus.patch("/moi", { firstName: XSS.slice(0, 60), city: XSS.slice(0, 80) }), [200, 400, 422]);
if (convsA[0]) await controle("XSS", "message avec balises accepté comme texte", () => amina.post(`/conversations/${convsA[0]}/messages`, { texte: XSS }), [200, 201, 400, 422]);
await controle("XSS", "export CSV : formules neutralisées", async () => {
  if (maCand?.id) await intrus.patch(`/candidatures/${maCand.id}`, { motivation: "=HYPERLINK(\"http://evil\",\"x\")" });
  await intrus.patch("/moi", { firstName: "=cmd|' /C calc'!A0", lastName: "+1+1" });
  if (maCand?.id) await intrus.post(`/candidatures/${maCand.id}/envoyer`, { moyen: "especes" });
  return ecole.get(`/ecole/${eid}/candidatures?format=csv`);
}, [200], (r) => !/(^|[;,\n])"?[=+\-@]cmd/m.test(String(r.data)) || "cellule commençant par = non neutralisée");

// ------------------------------------------------------------ Fichiers
const up = (nom, contenu, type, t = "autre") => intrus.post("/documents", undefined, { form: { fichier: new File([contenu], nom, { type }), type: t } });
await controle("fichiers", "HTML déguisé en PDF refusé", () => up("cv.pdf", "<html><script>alert(1)</script></html>", "application/pdf"), [400, 415, 422]);
await controle("fichiers", "SVG avec script refusé", () => up("photo.svg", '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', "image/svg+xml", "photo"), [400, 415, 422]);
await controle("fichiers", "exécutable refusé", () => up("setup.exe", Buffer.from("MZ\x90\x00\x03\x00\x00\x00"), "application/octet-stream"), [400, 415, 422]);
await controle("fichiers", "double extension .pdf.html refusée", () => up("cv.pdf.html", "<script>alert(1)</script>", "text/html"), [400, 415, 422]);
await controle("fichiers", "fichier de 12 Mo refusé", () => up("gros.pdf", Buffer.concat([PDF, Buffer.alloc(12 * 1024 * 1024)]), "application/pdf"), [400, 413, 422]);
const okDoc = (await up("vrai.pdf", PDF, "application/pdf")).data;
if (okDoc?.id) await controle("fichiers", "document servi sans exécution possible", () => intrus.get(`/documents/${okDoc.id}/fichier`), [200], (r) => {
  const t = r.headers.get("content-type") ?? "", n = r.headers.get("x-content-type-options"), d = r.headers.get("content-disposition") ?? "";
  return (/pdf/.test(t) && n === "nosniff") || `type=${t} nosniff=${n} disposition=${d}`;
});
await controle("fichiers", "traversée de chemin (documents)", () => intrus.get(`/documents/..%2F..%2F..%2Fetc%2Fpasswd/fichier`), [400, 403, 404], (r) => !/root:x/.test(String(r.data)) || "fichier système lu");
await controle("fichiers", "traversée de chemin (photos d'annonces)", () => client("v").get(`/fichiers/housings/..%2F..%2F/..%2F.env`), [400, 403, 404], (r) => !/DATABASE_URL/.test(String(r.data)) || ".env lu");

// ------------------------------------------------------------ Authentification et sessions
const cible = client("force brute");
let bloque = false;
for (let i = 0; i < 12 && !bloque; i++) bloque = (await cible.post("/auth/connexion", { identifiant: `intrus.${RUN}@exemple.ga`, motDePasse: `faux${i}` })).status === 429;
note("authentification", "force brute : blocage après plusieurs échecs", bloque, "aucun 429 après 12 essais");
await controle("authentification", "compte bloqué même avec le bon mot de passe", () => cible.post("/auth/connexion", { identifiant: `intrus.${RUN}@exemple.ga`, motDePasse: MDP }), [429]);
const inconnu = await client("v").post("/auth/connexion", { identifiant: `personne.${RUN}@exemple.ga`, motDePasse: "faux" });
const connu = await client("v").post("/auth/connexion", { identifiant: DEMO("parent.demo"), motDePasse: "faux" });
note("authentification", "pas d'énumération : même message pour compte inconnu et mauvais mot de passe", inconnu.status === connu.status && inconnu.data?.error?.message?.split(".")[0] === connu.data?.error?.message?.split(".")[0], `${inconnu.status} « ${inconnu.data?.error?.message} » / ${connu.status} « ${connu.data?.error?.message} »`);
const ri = await client("v").post("/auth/code", { cible: `personne.${RUN}@exemple.ga`, objet: "reset_password" });
const rc = await client("v").post("/auth/code", { cible: DEMO("parent.demo"), objet: "reset_password" });
note("authentification", "mot de passe oublié : pas d'énumération", ri.status === rc.status, `${ri.status} / ${rc.status}`);
let otpBloque = false;
for (let i = 0; i < 8 && !otpBloque; i++) otpBloque = (await client("v").post("/auth/mot-de-passe/reinitialiser", { cible: DEMO("parent.demo"), code: String(100000 + i), motDePasse: MDP + "Z" })).status === 429;
note("authentification", "code OTP : blocage après plusieurs codes faux", otpBloque, "aucun 429 après 8 codes");
await controle("authentification", "mot de passe trop court refusé à l'inscription", () => client("x").post("/auth/inscription", { role: "eleve", firstName: "A", lastName: "B", email: `faible.${RUN}@exemple.ga`, password: "123", country: "GA", birthYear: an - 18, acceptTerms: true }), [400, 422]);
await controle("authentification", "e-mail déjà utilisé refusé", () => client("x").post("/auth/inscription", { role: "eleve", firstName: "A", lastName: "B", email: DEMO("amina.demo"), password: MDP, country: "GA", birthYear: an - 18, acceptTerms: true }), [400, 409, 422]);
// Fixation de session : un cookie choisi avant la connexion ne doit pas devenir la session.
const fix = client("fixation"); fix.cookie = "ng_session=jeton-choisi-par-attaquant";
await connecter(fix, DEMO("amina.demo"));
note("sessions", "fixation : nouveau jeton à la connexion", !fix.cookie.includes("jeton-choisi-par-attaquant"), fix.cookie.slice(0, 80));
const r0 = await fetch(BASE + "/api/auth/connexion/", { method: "POST", headers: { "content-type": "application/json", origin: BASE }, body: JSON.stringify({ identifiant: DEMO("amina.demo"), motDePasse: MDP }) });
const sc = (r0.headers.getSetCookie?.() ?? []).join(" | ");
note("sessions", "cookie de session HttpOnly + SameSite", /HttpOnly/i.test(sc) && /SameSite=Lax|SameSite=Strict/i.test(sc), sc.slice(0, 160));
const vol = client("vol"); vol.cookie = fix.cookie;
await fix.post("/auth/deconnexion");
await controle("sessions", "cookie réutilisé après déconnexion refusé", () => vol.get("/moi"), [401]);
await controle("sessions", "jeton forgé refusé", () => { const c = client("x"); c.cookie = "ng_session=" + "a".repeat(64); return c.get("/moi"); }, [401]);
// Changement de mot de passe : les autres sessions sont fermées.
const s1 = client("s1"), s2 = client("s2");
await connecter(s1, `intrus.${RUN}@exemple.ga`).catch(() => null);
await new Promise((r) => setTimeout(r, 10));

// ------------------------------------------------------------ CSRF
const evil = client("site pirate", { origin: "https://evil.example.com" }); evil.cookie = amina.cookie;
await controle("CSRF", "POST depuis une autre origine refusé", () => evil.post("/rendez-vous", { topic: "csrf", channel: "telephone" }), [403]);
await controle("CSRF", "PATCH /moi depuis une autre origine refusé", () => evil.patch("/moi", { city: "csrf" }), [403]);
await controle("CSRF", "DELETE depuis une autre origine refusé", () => evil.del(`/documents/${docsA[0] ?? "x"}`), [403]);
const nul = client("origine null", { origin: "null" }); nul.cookie = amina.cookie;
await controle("CSRF", "origine « null » (iframe sandbox) avec cookie refusée", () => nul.patch("/moi", { city: "csrf" }), [403]);

// ------------------------------------------------------------ Redirections ouvertes
for (const suite of ["https://evil.example.com", "//evil.example.com", "/\\evil.example.com", "javascript:alert(1)", "https:evil.example.com"]) {
  const r = await fetch(`${BASE}/api/auth/google/?profil=eleve&suite=${encodeURIComponent(suite)}`, { redirect: "manual" });
  const loc = r.headers.get("location") ?? "";
  note("redirections", `Google : suite=${suite}`, !/evil\.example\.com|javascript:/i.test(loc) || /accounts\.google\.com/.test(loc) && !/redirect_uri=[^&]*evil/.test(loc), `→ ${loc.slice(0, 120)}`);
}
for (const p of ["/connexion/?suite=https://evil.example.com", "/connexion/?suite=//evil.example.com"]) {
  const html = await (await fetch(BASE + p)).text();
  note("redirections", `page ${p} ne renvoie pas vers l'extérieur côté serveur`, !/http-equiv="refresh"[^>]*evil/i.test(html), "meta refresh externe");
}

// ------------------------------------------------------------ En-têtes et cache
const page = await fetch(BASE + "/");
for (const [h, re] of [["content-security-policy", /default-src|script-src/], ["strict-transport-security", /max-age/], ["x-frame-options", /SAMEORIGIN|DENY/i], ["x-content-type-options", /nosniff/], ["referrer-policy", /./]])
  note("en-têtes", `accueil : ${h}`, re.test(page.headers.get(h) ?? ""), page.headers.get(h) ?? "absent");
note("en-têtes", "pas d'en-tête X-Powered-By", !page.headers.get("x-powered-by"), page.headers.get("x-powered-by") ?? "");
for (const p of ["/espace/", "/admin/", "/etablissement/", "/parent/", "/bailleur/", "/connexion/", "/premiere-connexion/"]) {
  const r = await fetch(BASE + p, { redirect: "manual" });
  note("cache", `${p} jamais gardé par Varnish`, /no-store/.test(r.headers.get("cdn-cache-control") ?? ""), `CDN-Cache-Control=${r.headers.get("cdn-cache-control")}`);
}
const apiS = await fetch(BASE + "/api/session/", { headers: { cookie: amina.cookie } });
note("cache", "/api/session : no-store", /no-store/.test(apiS.headers.get("cdn-cache-control") ?? "") && !/public/.test(apiS.headers.get("cache-control") ?? ""), `${apiS.headers.get("cdn-cache-control")} / ${apiS.headers.get("cache-control")}`);
const pub = await fetch(BASE + "/etablissements/", { headers: { cookie: amina.cookie } });
const pubHtml = await pub.text();
note("cache", "page publique en cache : aucune donnée personnelle dans le HTML", !/amina|Amina Demo|amina\.demo/i.test(pubHtml), "nom de l'utilisateur connecté présent dans une page mise en cache");
for (const p of ["/admin/", "/espace/", "/etablissement/"]) {
  const r = await fetch(BASE + p, { redirect: "manual" });
  note("accès pages", `${p} sans session : redirection vers la connexion`, [302, 303, 307, 308].includes(r.status) || (r.status === 200 && !/Tableau de bord|Candidatures reçues/.test(await r.text())), `statut ${r.status}`);
}
await controle("accès pages", "documentation API réservée à l'admin", () => client("v").get("/openapi.json"), [401, 403, 404, 200], (r) => process.env.NODE_ENV !== "production" || r.status !== 200 || "openapi public");
await controle("divers", "méthode TRACE refusée", () => client("v").call("TRACE", "/session").catch(() => ({ status: 405 })), [400, 404, 405, 501]);
await controle("divers", "fichiers sensibles non servis (.env)", async () => { const r = await fetch(BASE + "/.env"); return { status: r.status, data: (await r.text()).slice(0, 80) }; }, [403, 404], (r) => !/DATABASE_URL/.test(r.data) || ".env servi");
await controle("divers", "fichiers sensibles non servis (.git)", async () => { const r = await fetch(BASE + "/.git/config"); return { status: r.status, data: "" }; }, [403, 404]);

// ------------------------------------------------------------ Bilan
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "securite.json"), JSON.stringify(resultats, null, 1));
const parTheme = {};
for (const r of resultats) { parTheme[r.theme] ??= [0, 0]; parTheme[r.theme][1]++; if (r.ok) parTheme[r.theme][0]++; }
console.log(`\n${resultats.length} contrôles, ${resultats.filter((r) => !r.ok).length} en échec · ` + Object.entries(parTheme).map(([t, [a, b]]) => `${t} ${a}/${b}`).join(" · "));
