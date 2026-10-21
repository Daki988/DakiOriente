// Audit fonctionnel, volet 2 : chaque action de chaque profil, enchaînées comme un vrai parcours
// (inscription → test → candidature → paiement → décision de l'école ; annonce → modération → réservation → garant → contrat → loyer…).
// Puis balayage des routes GET : jamais de 500, et refus (401/403) pour les profils non autorisés.
// À lancer sur une base de démonstration jetable : le script crée des comptes, des annonces et des paiements simulés.
// Usage : BASE=http://localhost:3000 OUT=dossier MDP=… node scripts/audit-actions.mjs
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "audit-fonctionnel";
const MDP = process.env.MDP || "Navigoal2026";
const DEMO = (p) => `${p}@demo.navigoal.net`;
const RUN = Date.now().toString(36);
const resultats = [];
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000201a5f6d6a30000000049454e44ae426082", "hex");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");

/** Client HTTP avec son propre cookie de session. */
function client(nom, cookieInitial = "") {
  let cookie = cookieInitial;
  const call = async (method, url, body, { form } = {}) => {
    const headers = { cookie, origin: BASE };
    let payload;
    if (form) { payload = new FormData(); for (const [k, v] of Object.entries(form)) payload.append(k, v); }
    else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    // trailingSlash : /api/x/ (sauf fichiers .pdf/.csv/.json)
    const [chemin, qs] = url.split("?");
    const u = /\.[a-z]+$/.test(chemin) || chemin.endsWith("/") ? chemin : chemin + "/";
    const r = await fetch(BASE + "/api" + u + (qs ? "?" + qs : ""), { method, headers, body: payload, redirect: "manual" });
    const set = r.headers.getSetCookie?.() ?? [];
    for (const c of set) { const [kv] = c.split(";"); const [k] = kv.split("="); cookie = [...cookie.split("; ").filter((x) => x && !x.startsWith(k + "=")), kv].join("; "); }
    const type = r.headers.get("content-type") ?? "";
    const data = type.includes("json") ? await r.json().catch(() => null) : { octets: (await r.arrayBuffer()).byteLength, type };
    return { status: r.status, data };
  };
  return { nom, call, get: (u) => call("GET", u), post: (u, b, o) => call("POST", u, b ?? {}, o), patch: (u, b) => call("PATCH", u, b), put: (u, b) => call("PUT", u, b), del: (u) => call("DELETE", u) };
}

/** Exécute une action et consigne le résultat ; `attendu` peut être un statut ou une liste. */
async function action(profil, libelle, fn, attendu = [200, 201]) {
  const ok = Array.isArray(attendu) ? attendu : [attendu];
  try {
    const r = await fn();
    const passe = ok.includes(r.status);
    resultats.push({ profil, action: libelle, statut: r.status, ok: passe, detail: passe ? undefined : JSON.stringify(r.data).slice(0, 300) });
    if (!passe) console.log(`✗ [${profil}] ${libelle} → ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`);
    return r.data;
  } catch (e) {
    resultats.push({ profil, action: libelle, statut: 0, ok: false, detail: String(e).slice(0, 300) });
    console.log(`✗ [${profil}] ${libelle} → exception ${e}`);
    return null;
  }
}
const connecter = async (c, identifiant) => action(c.nom, "connexion", () => c.post("/auth/connexion", { identifiant, motDePasse: MDP }));
const an = new Date().getFullYear();

// ------------------------------------------------------------ Visiteur
const visiteur = client("visiteur");
for (const u of ["/session", "/auth/fournisseurs", "/recherche?q=informatique", "/etablissements", "/etablissements?ville=Casablanca", "/campagnes", "/articles", "/paiements/moyens", "/logements", "/logements?ville=Rabat&budget=4000", "/openapi.json"])
  await action("visiteur", `GET ${u}`, () => visiteur.get(u));
await action("visiteur", "espace privé refusé sans connexion", () => visiteur.get("/moi"), 401);
await action("visiteur", "connexion avec un mauvais mot de passe refusée", () => visiteur.post("/auth/connexion", { identifiant: DEMO("amina.demo"), motDePasse: "faux-mot-de-passe" }), [400, 401]);
await action("visiteur", "code OTP mot de passe oublié", () => visiteur.post("/auth/code", { contact: DEMO("amina.demo"), but: "reinitialisation" }), [200, 201, 400]);

// ------------------------------------------------------------ Nouvel élève (inscription avec code de parrainage + utm)
const amina = client("etudiant");
await connecter(amina, DEMO("amina.demo"));
const parrainage = await action("etudiant", "mon code de parrainage", () => amina.get("/moi/parrainage"));
const nouveau = client("nouvel eleve", `ng_acq=${encodeURIComponent(JSON.stringify({ source: "lycee", content: "audit", ref: parrainage?.code, landing: "/trouve-ta-voie/", at: new Date().toISOString() }))}`);
await action("nouvel eleve", "inscription (avec code de parrainage)", () => nouveau.post("/auth/inscription", { role: "eleve", firstName: "Audit", lastName: "Élève", email: `audit.eleve.${RUN}@exemple.ga`, password: MDP, country: "GA", birthYear: an - 18, acceptTerms: true }));
await action("nouvel eleve", "profil", () => nouveau.get("/moi"));
await action("nouvel eleve", "mise à jour du profil", () => nouveau.patch("/moi", { city: "Libreville", level: "terminale", serie: "D" }));
const scores = { R: 4, I: 9, A: 3, S: 5, E: 6, C: 2 };
await action("nouvel eleve", "enregistrer un test d'orientation", () => nouveau.post("/orientation/resultats", { answers: Array.from({ length: 24 }, (_, i) => i % 3), scores, top: ["I", "E", "S"] }));
await action("nouvel eleve", "historique des tests", () => nouveau.get("/orientation/resultats"));
await action("nouvel eleve", "recommandations", () => nouveau.get("/recommandations"));
await action("nouvel eleve", "rapport d'orientation PDF", () => nouveau.get("/orientation/rapport.pdf"));
await action("nouvel eleve", "changer de mot de passe", () => nouveau.post("/moi/mot-de-passe", { actuel: MDP, nouveau: MDP + "!" }));
await action("nouvel eleve", "déconnexion", () => nouveau.post("/auth/deconnexion"));
await action("nouvel eleve", "reconnexion avec le nouveau mot de passe", () => nouveau.post("/auth/connexion", { identifiant: `audit.eleve.${RUN}@exemple.ga`, motDePasse: MDP + "!" }));
const apresParrainage = await action("etudiant", "filleul compté dans le parrainage", () => amina.get("/moi/parrainage"));
if (apresParrainage && parrainage && apresParrainage.filleuls !== parrainage.filleuls + 1) resultats.push({ profil: "etudiant", action: "filleul compté (+1 attendu)", statut: 200, ok: false, detail: `${parrainage.filleuls} → ${apresParrainage.filleuls}` });

// ------------------------------------------------------------ Étudiant : documents, candidature, paiement, messagerie, RDV
await action("etudiant", "profil", () => amina.get("/moi"));
const d1 = await action("etudiant", "déposer une pièce d'identité", () => amina.post("/documents", undefined, { form: { fichier: new File([PDF], "cni.pdf", { type: "application/pdf" }), type: "identite", libelle: "CNI" } }));
const d2 = await action("etudiant", "déposer un relevé de notes", () => amina.post("/documents", undefined, { form: { fichier: new File([PDF], "releve.pdf", { type: "application/pdf" }), type: "releve_notes" } }));
const d4 = await action("etudiant", "déposer un diplôme", () => amina.post("/documents", undefined, { form: { fichier: new File([PDF], "bac.pdf", { type: "application/pdf" }), type: "diplome" } }));
const d3 = await action("etudiant", "déposer une photo", () => amina.post("/documents", undefined, { form: { fichier: new File([PNG], "photo.png", { type: "image/png" }), type: "photo" } }));
await action("etudiant", "mes documents", () => amina.get("/documents"));
if (d1?.id) await action("etudiant", "télécharger un document", () => amina.get(`/documents/${d1.id}/fichier`));
const tmp = await action("etudiant", "déposer un document à supprimer", () => amina.post("/documents", undefined, { form: { fichier: new File([PDF], "brouillon.pdf", { type: "application/pdf" }), type: "autre" } }));
if (tmp?.id) await action("etudiant", "supprimer un document", () => amina.del(`/documents/${tmp.id}`));

const formations = await action("etudiant", "formations de l'ESA", () => amina.get("/etablissements/ma-esa-casa/formations"));
const deja = new Set([].concat((await amina.get("/candidatures")).data ?? []).map((x) => x.program?.id ?? x.a?.programId ?? x.application?.programId));
const prog = (formations ?? []).find((p) => !deja.has(p.id)) ?? formations?.[0];
if (prog) await action("etudiant", "détail d'une formation", () => amina.get(`/formations-offres/${prog.id}`));
const cand = prog && await action("etudiant", "commencer une candidature", () => amina.post("/candidatures", { programId: prog.id }));
let paiementCandidature = null;
if (cand?.id) {
  const docs = [d1, d2, d3, d4].filter(Boolean).map((d) => d.id);
  await action("etudiant", "compléter le dossier", () => amina.patch(`/candidatures/${cand.id}`, { motivation: "Je veux étudier la gestion au Maroc et revenir créer mon entreprise à Libreville.", documentIds: docs }));
  const env = await action("etudiant", "envoyer la candidature (+ frais)", () => amina.post(`/candidatures/${cand.id}/envoyer`, { moyen: "mobile_money_afrique" }));
  paiementCandidature = env?.payment?.reference ?? env?.paiement?.reference ?? null;
  await action("etudiant", "détail de la candidature", () => amina.get(`/candidatures/${cand.id}`));
  await action("etudiant", "bordereau PDF", () => amina.get(`/candidatures/${cand.id}/bordereau.pdf`));
  await action("etudiant", "contacter l'école", () => amina.post("/conversations", { candidature: cand.id, texte: "Bonjour, quand aurai-je une réponse ?" }));
}
const paiements = await action("etudiant", "mes paiements", () => amina.get("/paiements"));
const ref = paiementCandidature ?? (paiements ?? []).map((p) => p.payment ?? p.p ?? p).find((p) => p.status === "en_attente")?.reference;
if (ref) {
  await action("etudiant", "statut du paiement", () => amina.get(`/paiements/${ref}`));
  await action("etudiant", "payer (bac à sable)", () => amina.post(`/paiements/${ref}/simulation`, { succes: true }));
  await action("etudiant", "reçu PDF", () => amina.get(`/paiements/${ref}/recu.pdf`));
}
await action("etudiant", "notifications", () => amina.get("/notifications"));
await action("etudiant", "tout marquer comme lu", () => amina.post("/notifications/lues"));
const rdv = await action("etudiant", "demander un rendez-vous conseiller", () => amina.post("/rendez-vous", { topic: "Choix entre gestion et informatique", channel: "whatsapp", preferredAt: new Date(Date.now() + 3 * 864e5).toISOString() }));
await action("etudiant", "mes rendez-vous", () => amina.get("/rendez-vous"));
const alerte = await action("etudiant", "créer une alerte logement", () => amina.post("/logements/alertes", { ville: "Casablanca", budgetMax: 4000 }));
await action("etudiant", "mes alertes", () => amina.get("/logements/alertes"));
if (alerte?.id) await action("etudiant", "supprimer une alerte", () => amina.del(`/logements/alertes/${alerte.id}`));
const invit = await action("etudiant", "inviter un tuteur", () => amina.post("/moi/tuteurs", { contact: `tuteur.${RUN}@exemple.ga`, relation: "oncle" }));
await action("etudiant", "mes tuteurs", () => amina.get("/moi/tuteurs"));

// ------------------------------------------------------------ Établissement : traiter la candidature
const ecole = client("etablissement");
await connecter(ecole, DEMO("ecole.demo"));
const mes = await action("etablissement", "mes établissements", () => ecole.get("/ecole"));
const eid = mes?.[0]?.e?.id ?? mes?.[0]?.id ?? mes?.[0]?.establishment?.id ?? "ma-esa-casa";
await action("etablissement", "tableau de bord", () => ecole.get(`/ecole/${eid}/tableau-de-bord?periode=mois`));
await action("etablissement", "modifier la fiche", () => ecole.patch(`/ecole/${eid}`, { description: "École supérieure des affaires de Casablanca : gestion, finance, marketing. Fiche mise à jour par l'audit." }));
await action("etablissement", "formations", () => ecole.get(`/ecole/${eid}/formations`));
const nf = await action("etablissement", "publier une formation", () => ecole.post(`/ecole/${eid}/formations`, { formationId: "frm-licence-gestion", title: `Bachelor audit ${RUN}`, diploma: "Licence / Bachelor", level: "niv-bac3", tuitionMin: 50000, tuitionMax: 60000, currency: "MAD", applicationFee: 300, durationYears: 3 }));
if (nf?.id) await action("etablissement", "modifier une formation", () => ecole.patch(`/ecole/${eid}/formations/${nf.id}`, { formationId: "frm-licence-gestion", title: `Bachelor audit ${RUN} (modifié)`, tuitionMin: 52000, tuitionMax: 60000, currency: "MAD" }));
const camp = await action("etablissement", "créer une campagne", () => ecole.post(`/ecole/${eid}/campagnes`, { kind: "admission", title: `Admissions audit ${RUN}`, startsAt: `${an}-11-01`, endsAt: `${an + 1}-03-31`, published: false }));
if (camp?.id) await action("etablissement", "modifier une campagne", () => ecole.patch(`/ecole/${eid}/campagnes/${camp.id}`, { kind: "admission", title: `Admissions audit ${RUN}`, startsAt: `${an}-11-01`, endsAt: `${an + 1}-04-30`, published: true }));
await action("etablissement", "campagnes", () => ecole.get(`/ecole/${eid}/campagnes`));
await action("etablissement", "candidatures reçues", () => ecole.get(`/ecole/${eid}/candidatures`));
await action("etablissement", "export CSV des candidatures", () => ecole.get(`/ecole/${eid}/candidatures?format=csv`));
if (cand?.id) {
  await action("etablissement", "ouvrir la candidature", () => ecole.get(`/candidatures/${cand.id}`));
  await action("etablissement", "passer en vérification", () => ecole.post(`/ecole/candidatures/${cand.id}/statut`, { status: "en_verification" }));
  await action("etablissement", "demander une pièce", () => ecole.post(`/ecole/candidatures/${cand.id}/statut`, { status: "piece_demandee", requestedDocuments: ["attestation_scolarite"] }));
  await action("etudiant", "ajouter la pièce demandée", async () => {
    const d = (await amina.post("/documents", undefined, { form: { fichier: new File([PDF], "scolarite.pdf", { type: "application/pdf" }), type: "attestation_scolarite" } })).data;
    const cur = (await amina.get(`/candidatures/${cand.id}`)).data;
    return amina.patch(`/candidatures/${cand.id}`, { documentIds: [...(cur?.application?.documentIds ?? []), d.id] });
  });
  await action("etudiant", "renvoyer le dossier complété", () => amina.post(`/candidatures/${cand.id}/envoyer`));
  await action("etablissement", "dossier complet", () => ecole.post(`/ecole/candidatures/${cand.id}/statut`, { status: "complet" }));
  await action("etablissement", "accepter", () => ecole.post(`/ecole/candidatures/${cand.id}/statut`, { status: "acceptee", note: "Bienvenue à l'ESA !" }));
  await action("etudiant", "attestation d'admission PDF", () => amina.get(`/candidatures/${cand.id}/attestation.pdf`));
}
const convs = await action("etablissement", "conversations", () => ecole.get("/conversations"));
const conv = convs?.[0]?.c?.id ?? convs?.[0]?.id ?? convs?.[0]?.conversation?.id;
if (conv) {
  await action("etablissement", "lire un fil", () => ecole.get(`/conversations/${conv}`));
  await action("etablissement", "répondre", () => ecole.post(`/conversations/${conv}/messages`, { texte: "Votre dossier est complet, réponse sous 10 jours." }));
}
await action("etablissement", "accès back-office refusé", () => ecole.get("/admin/statistiques"), 403);

// ------------------------------------------------------------ Parent
const parent = client("parent");
await connecter(parent, DEMO("parent.demo"));
const enfants = await action("parent", "enfants suivis", () => parent.get("/parent/enfants"));
const enfant = enfants?.[0]?.child?.id;
if (enfant) {
  await action("parent", "candidatures de l'enfant", () => parent.get(`/parent/enfants/${enfant}/candidatures`));
  await action("parent", "consentement parental", () => parent.post(`/parent/enfants/${enfant}/consentement`, { consentement: true }));
}
if (invit?.devCode) await action("parent", "lier un enfant avec un code (code d'un autre tuteur : refus attendu si contact différent)", () => parent.post("/parent/enfants", { code: invit.devCode, consentement: true }), [200, 201, 400, 403]);
await action("parent", "paiements de la famille", () => parent.get("/paiements"));
await action("parent", "réservations", () => parent.get("/reservations"));
await action("parent", "demander un rendez-vous", () => parent.post("/rendez-vous", { topic: "Coût des études au Maroc", channel: "telephone" }));
await action("parent", "candidature refusée pour un parent", () => parent.post("/candidatures", { programId: prog?.id ?? "x" }), 403);

// ------------------------------------------------------------ Conseiller
const cons = client("conseiller");
await connecter(cons, DEMO("conseiller.demo"));
await action("conseiller", "demandes de rendez-vous", () => cons.get("/rendez-vous"));
if (rdv?.id) {
  await action("conseiller", "planifier un créneau", () => cons.post(`/rendez-vous/${rdv.id}/planifier`, { date: new Date(Date.now() + 4 * 864e5).toISOString(), notes: "Lien visio envoyé" }));
  await action("conseiller", "clôturer le rendez-vous", () => cons.post(`/rendez-vous/${rdv.id}/cloturer`, { statut: "termine" }));
}
await action("conseiller", "conversations", () => cons.get("/conversations"));
await action("conseiller", "notifications", () => cons.get("/notifications"));

// ------------------------------------------------------------ Bailleur + admin : annonce → modération ; réservation complète
const bailleur = client("bailleur");
await connecter(bailleur, DEMO("bailleur.demo"));
const adm = client("admin");
await connecter(adm, "admin@demo.navigoal.net");
await action("bailleur", "mes annonces", () => bailleur.get("/bailleur/logements"));
const h = await action("bailleur", "créer une annonce", () => bailleur.post("/bailleur/logements", { title: `Studio audit ${RUN}`, type: "studio", description: "Studio meublé de 22 m², cuisine équipée, wifi, à 10 minutes à pied de l'ESA.", ville: "Casablanca", quartier: "Maârif", address: "3 rue de l'audit", rent: 2800, charges: 200, deposit: 2800, amenities: ["wifi"], nearEstablishments: [{ id: "ma-esa-casa", minutes: 10, mode: "pied" }] }));
if (h?.id) {
  await action("bailleur", "modération refusée sans photos", () => bailleur.post(`/bailleur/logements/${h.id}/moderation`), 400);
  let cle = null;
  for (let i = 0; i < 4; i++) cle = (await action("bailleur", `ajouter la photo ${i + 1}`, () => bailleur.post(`/bailleur/logements/${h.id}/photos`, undefined, { form: { fichier: new File([PNG], `p${i}.png`, { type: "image/png" }) } })))?.key ?? cle;
  if (cle) await action("bailleur", "retirer une photo", () => bailleur.del(`/bailleur/logements/${h.id}/photos?cle=${encodeURIComponent(cle)}`));
  await action("bailleur", "modifier l'annonce", () => bailleur.patch(`/bailleur/logements/${h.id}`, { title: `Studio audit ${RUN}`, type: "studio", description: "Studio meublé de 22 m², cuisine équipée, wifi, à 10 minutes à pied de l'ESA. Calme.", ville: "Casablanca", address: "3 rue de l'audit", rent: 2700, charges: 200, deposit: 2700 }));
  await action("bailleur", "soumettre à la modération", () => bailleur.post(`/bailleur/logements/${h.id}/moderation`));
  await action("bailleur", "voir mon annonce", () => bailleur.get(`/bailleur/logements/${h.id}`));
  await action("admin", "file de modération", () => adm.get("/admin/moderation"));
  await action("admin", "publier l'annonce", () => adm.post(`/admin/logements/${h.id}/moderation`, { publier: true, verification: "identite" }));
  await action("visiteur", "fiche logement publique", () => visiteur.get(`/logements/${h.id}`));
  const pub = (await visiteur.get(`/logements/${h.id}`)).data;
  if (JSON.stringify(pub ?? {}).includes("3 rue de l'audit")) resultats.push({ profil: "visiteur", action: "adresse masquée avant paiement", statut: 200, ok: false, detail: "adresse visible" });
  const photo = (pub?.photos ?? pub?.housing?.photos ?? [])[0];
  if (photo) await action("visiteur", "photo publique d'annonce", () => visiteur.get(String(photo).replace(/^\/api/, "").replace(/^(?!\/fichiers)/, "/fichiers/")));
}
const kyc = [];
for (const t of ["kyc_identite", "kyc_propriete"]) kyc.push((await action("bailleur", `déposer ${t}`, () => bailleur.post("/documents", undefined, { form: { fichier: new File([PDF], `${t}.pdf`, { type: "application/pdf" }), type: t } })))?.id);
await action("bailleur", "soumettre la vérification d'identité", () => bailleur.post("/bailleur/verification", { documents: kyc.filter(Boolean), versement: { moyen: "virement", iban: "MA64011519000001205000534921" } }), [200, 400]);
const moiB = (await bailleur.get("/moi")).data;
const bid0 = moiB?.user?.id ?? moiB?.id;
if (bid0) await action("admin", "valider le KYC du bailleur", () => adm.post(`/admin/bailleurs/${bid0}/kyc`, { valider: true }), [200, 400]);

let resa = null;
if (h?.id) resa = await action("etudiant", "demander une réservation", () => amina.post("/reservations", { housingId: h.id, startDate: `${an + 1}-09-01`, months: 9, message: "Bonjour, je suis admise à l'ESA." }));
if (resa?.id) {
  await action("etudiant", "détail de la réservation", () => amina.get(`/reservations/${resa.id}`));
  await action("bailleur", "réservations reçues", () => bailleur.get("/reservations"));
  const rep = await action("bailleur", "accepter la réservation", () => bailleur.post(`/reservations/${resa.id}/reponse`, { accepter: true }));
  if (rep?.statut === "attente_garant") await action("parent", "se porter garant", () => parent.post(`/reservations/${resa.id}/garant`));
  const pb = await action("parent", "payer la réservation (séquestre)", () => parent.post(`/reservations/${resa.id}/paiement`, { moyen: "mobile_money_afrique" }));
  if (pb?.payment?.reference) await action("parent", "confirmer le paiement (bac à sable)", () => parent.post(`/paiements/${pb.payment.reference}/simulation`, { succes: true }));
  const det = await action("etudiant", "coordonnées révélées après paiement", () => amina.get(`/reservations/${resa.id}`));
  if (det && !det.revealed) resultats.push({ profil: "etudiant", action: "coordonnées révélées après paiement", statut: 200, ok: false, detail: `revealed=${det.revealed}, statut ${det.booking?.status}` });
  await action("etudiant", "signer le contrat", () => amina.post(`/reservations/${resa.id}/signature`));
  await action("bailleur", "signer le contrat", () => bailleur.post(`/reservations/${resa.id}/signature`));
  await action("parent", "contrat PDF", () => parent.get(`/reservations/${resa.id}/contrat.pdf`));
  await action("etudiant", "déclarer l'entrée", () => amina.post(`/reservations/${resa.id}/entree`, { photos: [], notes: "RAS" }));
  const loyer = await action("etudiant", "payer un loyer", () => amina.post(`/reservations/${resa.id}/loyer`, { moyen: "mobile_money_afrique", periode: `${an + 1}-10` }));
  if (loyer?.payment?.reference) {
    await action("etudiant", "confirmer le loyer (bac à sable)", () => amina.post(`/paiements/${loyer.payment.reference}/simulation`, { succes: true }));
    await action("bailleur", "quittance PDF", () => bailleur.get(`/quittances/${loyer.payment.reference}.pdf`));
  }
  await action("etudiant", "laisser un avis", () => amina.post(`/reservations/${resa.id}/avis`, { note: 5, commentaire: "Propre et calme." }));
  const lit = await action("etudiant", "ouvrir un litige", () => amina.post(`/reservations/${resa.id}/litige`, { motif: "Eau coupée", description: "Plus d'eau chaude depuis 3 jours." }));
  if (lit?.id) await action("admin", "résoudre le litige", () => adm.post(`/admin/litiges/${lit.id}/resolution`, { resolution: "Chauffe-eau remplacé par le bailleur." }));
  await action("etudiant", "donner son préavis", () => amina.post(`/reservations/${resa.id}/preavis`, { note: "Fin d'année universitaire" }));
  await action("bailleur", "état des lieux de sortie", () => bailleur.post(`/reservations/${resa.id}/sortie`, { photos: [], notes: "Bon état", retenue: 0 }));
}
// Réservation annulée avant signature
const h2 = (await visiteur.get("/logements")).data;
const autre = (h2?.items ?? h2 ?? []).find?.((x) => x.id !== h?.id);
if (autre) {
  const r2 = await action("etudiant", "demander une 2e réservation", () => amina.post("/reservations", { housingId: autre.id ?? autre.h?.id, startDate: `${an + 1}-09-01`, months: 10 }));
  if (r2?.id) await action("etudiant", "annuler avant signature", () => amina.post(`/reservations/${r2.id}/annulation`, { motif: "Autre logement trouvé" }));
}
if (h?.id) await action("bailleur", "archiver l'annonce", () => bailleur.post(`/bailleur/logements/${h.id}/archiver`));

// ------------------------------------------------------------ Admin
for (const u of ["/admin/statistiques", "/admin/campagne", "/admin/campagne?depuis=2026-01-01", "/admin/campagne/export.csv", "/admin/utilisateurs", "/admin/utilisateurs?role=etudiant&pays=GA", "/admin/etablissements", "/admin/homologations", "/admin/referentiels/competences", "/admin/referentiels/competences?format=csv", "/admin/referentiels-historique", "/admin/moderation", "/admin/paiements", "/admin/paiements?statut=reussi", "/admin/articles", "/admin/journal", "/rendez-vous"])
  await action("admin", `GET ${u}`, () => adm.get(u));
const staff = await action("admin", "créer un compte conseiller", () => adm.post("/admin/utilisateurs", { role: "conseiller", firstName: "Audit", lastName: "Conseil", email: `audit.conseil.${RUN}@navigoal.net`, password: MDP }));
const sid = staff?.id ?? staff?.user?.id;
if (sid) {
  await action("admin", "suspendre un compte", () => adm.post(`/admin/utilisateurs/${sid}/statut`, { statut: "suspendu" }));
  const s2 = client("conseiller suspendu");
  await action("conseiller suspendu", "connexion refusée au compte suspendu", () => s2.post("/auth/connexion", { identifiant: `audit.conseil.${RUN}@navigoal.net`, motDePasse: MDP }), [401, 403]);
  await action("admin", "réactiver un compte", () => adm.post(`/admin/utilisateurs/${sid}/statut`, { statut: "actif" }));
}
await action("admin", "mettre un établissement en avant", () => adm.patch("/admin/etablissements/ma-esa-casa", { featured: true }));
const homolog = await action("admin", "filières à homologuer", () => adm.get("/admin/homologations"));
const hp = (homolog ?? []).map((x) => x.p ?? x.program ?? x)[0];
if (hp?.id) await action("admin", "valider une homologation", () => adm.patch(`/admin/formations/${hp.id}/homologation`, { homologated: true, texte: "Arrêté n° 1234-26 du 2 mars 2026, BO n° 7400" }));
await action("admin", "créer un élément de référentiel", () => adm.put("/admin/referentiels/competences", { id: `cmp-audit-${RUN}`, libelle: "Compétence audit", categorie: "transversale", domaine: null }));
await action("admin", "supprimer un élément de référentiel", () => adm.del(`/admin/referentiels/competences/cmp-audit-${RUN}`));
await action("admin", "importer un référentiel CSV", () => adm.post("/admin/referentiels/competences/import", undefined, { form: { fichier: new File([`id;libelle;categorie;domaine\ncmp-imp-${RUN};Import audit;transversale;\n`], "c.csv", { type: "text/csv" }) } }));
const art = await action("admin", "créer un article", () => adm.post("/admin/articles", { slug: `audit-${RUN}`, title: "Article d'audit fonctionnel", category: "conseils", excerpt: "Résumé de l'article d'audit.", body: "Corps de l'article d'audit fonctionnel, assez long.", published: false }));
if (art?.id) await action("admin", "publier l'article", () => adm.patch(`/admin/articles/${art.id}`, { slug: `audit-${RUN}`, title: "Article d'audit fonctionnel", category: "conseils", excerpt: "Résumé de l'article d'audit.", body: "Corps de l'article d'audit fonctionnel, assez long.", published: true }));
if (art?.id) await action("visiteur", "article publié visible", () => visiteur.get(`/articles/audit-${RUN}`));
await action("admin", "créer un témoignage", () => adm.post("/admin/temoignages", { name: "Audit", quote: "Témoignage d'audit fonctionnel.", country: "GA", role: "Étudiante", published: false }), [200, 201]);
await action("admin", "créer un partenaire", () => adm.post("/admin/partenaires", { name: `Partenaire audit ${RUN}`, kind: "ecole", url: "https://exemple.ga" }), [200, 201]);

// ------------------------------------------------------------ Matrice des droits sur les routes GET sans paramètre
const ROUTES = fs.readFileSync(new URL("../src/server/api/router.ts", import.meta.url), "utf8").matchAll(/^route\("GET", "([^"]+)", "[^"]+", "[^"]+", ([^,]+(?:, "[^"]+")*\]?)/gm);
const profils = { visiteur, etudiant: amina, parent, etablissement: ecole, bailleur, conseiller: cons, admin: adm };
const ROLE = { etudiant: "etudiant", parent: "parent", etablissement: "etablissement", bailleur: "bailleur", conseiller: "conseiller", admin: "admin" };
const matrice = [];
for (const [, url, droits] of ROUTES) {
  if (url.includes(":") || /google|\.pdf|\.csv/.test(url)) continue;
  for (const [p, c] of Object.entries(profils)) {
    const r = await c.get(url);
    const autorise = droits.includes('"public"') || (p !== "visiteur" && (droits.includes('"user"') || (droits === "STUDENT" ? ["etudiant"].includes(p) : droits.includes(`"${ROLE[p]}"`))));
    const ok = r.status < 500 && (autorise ? r.status < 400 || r.status === 404 : [401, 403].includes(r.status));
    matrice.push({ url, profil: p, statut: r.status, autorise, ok });
    if (!ok) { console.log(`✗ [droits] ${p} GET ${url} → ${r.status} (autorisé : ${autorise})`); resultats.push({ profil: p, action: `droits GET ${url}`, statut: r.status, ok: false, detail: `autorisé attendu : ${autorise}` }); }
  }
}

// ------------------------------------------------------------ Robustesse : identifiants et corps invalides → jamais de 500
const TOUTES = [...fs.readFileSync(new URL("../src/server/api/router.ts", import.meta.url), "utf8").matchAll(/^route\("([A-Z]+)", "([^"]+)", "[^"]+", "[^"]+", ([^,]+(?:, "[^"]+")*\]?)/gm)];
const qui = (droits) => droits.includes('"admin"') && !droits.includes('"user"') && !droits.includes('"bailleur"') && !droits.includes('"etablissement"') && !droits.includes('"parent"') && !droits.includes('"conseiller"') ? adm
  : droits.includes('"bailleur"') ? bailleur : droits.includes('"etablissement"') ? ecole : droits.includes('"conseiller"') ? cons : droits.includes('"parent"') && !droits.includes('"eleve"') ? parent : amina;
const robustesse = [];
const SANS_RISQUE = /deconnexion|google|webhook/;
for (const [, method, url, droits] of TOUTES) {
  if (SANS_RISQUE.test(url)) continue;
  const c = qui(droits);
  const ids = url.includes(":") ? ["abc", "00000000-0000-4000-8000-000000000000", "%27%20or%201%3D1"] : [null];
  const corps = method === "GET" || method === "DELETE" ? [undefined] : [{}, { texte: 12, statut: ["x"], moyen: null, programId: {}, housingId: 5, note: "abc", date: "pas-une-date", periode: "x", accepter: "oui", code: 1, status: "inconnu", verification: "x", sequestre: "x", resolution: 3, role: "x", featured: "x" }, "{non-json"];
  for (const id of ids) for (const b of corps) {
    const u = id === null ? url : url.replace(/:[a-z]+/g, id);
    let r;
    if (b === "{non-json") r = await fetch(BASE + "/api" + u + (u.match(/\.[a-z]+$/) ? "" : "/"), { method, headers: { "content-type": "application/json", origin: BASE }, body: b }).then((x) => ({ status: x.status }));
    else r = await c.call(method, u, b);
    robustesse.push({ method, url: u, profil: c.nom, corps: typeof b === "object" ? Object.keys(b).length : b, statut: r.status });
    if (r.status >= 500) { console.log(`✗ [robustesse] ${c.nom} ${method} ${u} corps=${JSON.stringify(b)?.slice(0, 40)} → ${r.status}`); resultats.push({ profil: c.nom, action: `robustesse ${method} ${url}`, statut: r.status, ok: false, detail: `id=${id} corps=${JSON.stringify(b)?.slice(0, 80)}` }); }
  }
}
console.log(`Robustesse : ${robustesse.length} appels, ${robustesse.filter((x) => x.statut >= 500).length} erreurs 500`);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "actions.json"), JSON.stringify({ resultats, matrice, robustesse }, null, 1));
const ko = resultats.filter((r) => !r.ok);
const parProfil = Object.entries(Object.groupBy(resultats, (r) => r.profil)).map(([p, rs]) => `${p} ${rs.filter((r) => r.ok).length}/${rs.length}`);
console.log(`\n${resultats.length} actions, ${ko.length} en échec · ${parProfil.join(" · ")}`);
console.log(`Matrice des droits : ${matrice.length} appels, ${matrice.filter((m) => !m.ok).length} anomalies`);
