import "server-only";
import crypto from "node:crypto";
import { getDb, tx } from "./db";
import { estimer, mediane, percentile, type Estimation, type Quantites } from "./calcul";
import {
  GRAND_LIBREVILLE,
  MODES,
  type BadgeCode,
  type Famille,
  type MarchandiseCode,
  type ModeCode,
  type PaysCode,
} from "./referentiel";

/** Nombre minimal d'envois pour afficher un délai réel (règle RG2). */
export const MIN_ENVOIS_DELAI = 10;

export type Entrepot = { pays: PaysCode; ville: string; adresse: string };
export type StatutTransitaire = "en_attente" | "verifie" | "refuse" | "suspendu";

export type ProfilModif = {
  description: string;
  whatsapp: string | null;
  email: string | null;
  adresse: string;
  modes_paiement: string;
  marchandises_refusees: MarchandiseCode[];
  entrepots: Entrepot[];
};

export type Transitaire = {
  id: number;
  slug: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  whatsapp: string | null;
  email: string | null;
  gerant: string;
  description: string;
  rccm: string | null;
  nif: string | null;
  agrement_douane: string | null;
  entrepots: Entrepot[];
  marchandises_refusees: MarchandiseCode[];
  modes_paiement: string;
  statut: StatutTransitaire;
  badges: BadgeCode[];
  note_admin: string | null;
  modif_en_attente: ProfilModif | null;
  demo: boolean;
  created_at: string;
  verified_at: string | null;
};

export type Offre = {
  id: number;
  transitaire_id: number;
  origine_pays: PaysCode;
  origine_ville: string;
  mode: ModeCode;
  prix_xaf: number;
  minimum: number;
  frais_fixes_xaf: number;
  diviseur_vol: number;
  dedouanement_inclus: boolean;
  livraison: "retrait" | "grand_libreville" | "tout_gabon";
  villes_desservies: string[];
  inclus: string;
  non_inclus: string;
  delai_min: number;
  delai_max: number;
  marchandises: MarchandiseCode[];
  prochain_depart: string | null;
  statut: "en_attente" | "valide" | "rejete" | "archive";
  remplace_id: number | null;
  motif_rejet: string | null;
  created_at: string;
  validated_at: string | null;
};

export type DelaiReel = { n: number; mediane: number | null; p80: number | null };

export type Stats = {
  nbAvis: number;
  note: number | null;
  notes: { prix: number; delai: number; etat: number; service: number } | null;
  delais: Record<Famille, DelaiReel>;
  delaisTenus: boolean;
};

export type Avis = {
  id: number;
  transitaire_id: number;
  demande_id: number;
  nom: string;
  famille: Famille;
  note_prix: number;
  note_delai: number;
  note_etat: number;
  note_service: number;
  commentaire: string;
  date_remise: string;
  date_reception: string;
  statut: "en_attente" | "publie" | "rejete";
  reponse: string | null;
  reponse_statut: "en_attente" | "publie" | "rejete" | null;
  created_at: string;
};

type Row = Record<string, unknown>;
const json = <T>(v: unknown, d: T): T => {
  try {
    return v ? (JSON.parse(String(v)) as T) : d;
  } catch {
    return d;
  }
};

function toTransitaire(r: Row): Transitaire {
  return {
    ...(r as unknown as Transitaire),
    entrepots: json(r.entrepots, []),
    marchandises_refusees: json(r.marchandises_refusees, []),
    badges: json(r.badges, []),
    modif_en_attente: json(r.modif_en_attente, null),
    demo: Number(r.demo) === 1,
  };
}

function toOffre(r: Row): Offre {
  return {
    ...(r as unknown as Offre),
    dedouanement_inclus: Number(r.dedouanement_inclus) === 1,
    villes_desservies: json(r.villes_desservies, []),
    marchandises: json(r.marchandises, []),
  };
}

const jours = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/* ───────────────────────── Transitaires ───────────────────────── */

export function getTransitaire(id: number): Transitaire | null {
  const r = getDb().prepare("SELECT * FROM transitaires WHERE id = ?").get(id) as Row | undefined;
  return r ? toTransitaire(r) : null;
}

export function getTransitaireBySlug(slug: string): Transitaire | null {
  const r = getDb().prepare("SELECT * FROM transitaires WHERE slug = ?").get(slug) as Row | undefined;
  return r ? toTransitaire(r) : null;
}

export function getTransitaireByTelephone(tel: string): Transitaire | null {
  const r = getDb().prepare("SELECT * FROM transitaires WHERE telephone = ?").get(tel) as Row | undefined;
  return r ? toTransitaire(r) : null;
}

export function listTransitaires(statut?: StatutTransitaire): Transitaire[] {
  const db = getDb();
  const rows = (statut
    ? db.prepare("SELECT * FROM transitaires WHERE statut = ? ORDER BY nom").all(statut)
    : db.prepare("SELECT * FROM transitaires ORDER BY created_at DESC").all()) as Row[];
  return rows.map(toTransitaire);
}

export function listTransitairesModifEnAttente(): Transitaire[] {
  return (getDb().prepare("SELECT * FROM transitaires WHERE modif_en_attente IS NOT NULL ORDER BY nom").all() as Row[]).map(toTransitaire);
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "transitaire";
}

export type NouveauTransitaire = Omit<
  Transitaire,
  "id" | "slug" | "statut" | "badges" | "note_admin" | "modif_en_attente" | "demo" | "created_at" | "verified_at"
>;

export function creerTransitaire(t: NouveauTransitaire, docs: { type: string; fichier: string; nom_original: string; mime: string }[]): number {
  return tx((db) => {
    let slug = slugify(t.nom);
    let i = 2;
    while (db.prepare("SELECT 1 FROM transitaires WHERE slug = ?").get(slug)) slug = `${slugify(t.nom)}-${i++}`;
    const r = db
      .prepare(
        `INSERT INTO transitaires (slug, nom, ville, adresse, telephone, whatsapp, email, gerant, description, rccm, nif, agrement_douane, entrepots, marchandises_refusees, modes_paiement)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(slug, t.nom, t.ville, t.adresse, t.telephone, t.whatsapp, t.email, t.gerant, t.description, t.rccm, t.nif, t.agrement_douane, JSON.stringify(t.entrepots), JSON.stringify(t.marchandises_refusees), t.modes_paiement);
    const id = Number(r.lastInsertRowid);
    const ins = db.prepare("INSERT INTO documents (transitaire_id, type, fichier, nom_original, mime) VALUES (?, ?, ?, ?, ?)");
    for (const d of docs) ins.run(id, d.type, d.fichier, d.nom_original, d.mime);
    return id;
  });
}

export function majStatutTransitaire(id: number, statut: StatutTransitaire, badges: BadgeCode[], note: string | null) {
  getDb()
    .prepare(
      `UPDATE transitaires SET statut = ?, badges = ?, note_admin = ?, verified_at = CASE WHEN ? = 'verifie' THEN COALESCE(verified_at, datetime('now')) ELSE verified_at END WHERE id = ?`,
    )
    .run(statut, JSON.stringify(badges), note, statut, id);
}

export function proposerModifProfil(id: number, m: ProfilModif) {
  getDb().prepare("UPDATE transitaires SET modif_en_attente = ? WHERE id = ?").run(JSON.stringify(m), id);
}

export function traiterModifProfil(id: number, accepter: boolean) {
  const t = getTransitaire(id);
  if (!t?.modif_en_attente) return;
  const m = t.modif_en_attente;
  const db = getDb();
  if (accepter) {
    db.prepare(
      `UPDATE transitaires SET description = ?, whatsapp = ?, email = ?, adresse = ?, modes_paiement = ?, marchandises_refusees = ?, entrepots = ?, modif_en_attente = NULL WHERE id = ?`,
    ).run(m.description, m.whatsapp, m.email, m.adresse, m.modes_paiement, JSON.stringify(m.marchandises_refusees), JSON.stringify(m.entrepots), id);
  } else {
    db.prepare("UPDATE transitaires SET modif_en_attente = NULL WHERE id = ?").run(id);
  }
}

export function documentsDe(transitaireId: number) {
  return getDb().prepare("SELECT * FROM documents WHERE transitaire_id = ? ORDER BY id").all(transitaireId) as {
    id: number;
    type: string;
    fichier: string;
    nom_original: string;
    mime: string;
    created_at: string;
  }[];
}

export function getDocument(id: number) {
  return getDb().prepare("SELECT * FROM documents WHERE id = ?").get(id) as
    | { id: number; transitaire_id: number; fichier: string; nom_original: string; mime: string }
    | undefined;
}

/* ───────────────────────── Statistiques (avis publiés) ───────────────────────── */

export function statsTransitaires(ids: number[]): Map<number, Stats> {
  const out = new Map<number, Stats>();
  if (!ids.length) return out;
  const db = getDb();
  const ph = ids.map(() => "?").join(",");
  const avis = db
    .prepare(`SELECT transitaire_id, famille, note_prix, note_delai, note_etat, note_service, date_remise, date_reception FROM avis WHERE statut = 'publie' AND transitaire_id IN (${ph})`)
    .all(...ids) as Row[];
  const delaisMax = db
    .prepare(`SELECT transitaire_id, mode, MAX(delai_max) AS dmax FROM offres WHERE statut = 'valide' AND transitaire_id IN (${ph}) GROUP BY transitaire_id, mode`)
    .all(...ids) as Row[];

  for (const id of ids) {
    const a = avis.filter((x) => x.transitaire_id === id);
    const delais = (["aerien", "maritime"] as Famille[]).reduce(
      (acc, f) => {
        const d = a.filter((x) => x.famille === f).map((x) => jours(String(x.date_remise), String(x.date_reception)));
        acc[f] = d.length >= MIN_ENVOIS_DELAI ? { n: d.length, mediane: mediane(d), p80: percentile(d, 80) } : { n: d.length, mediane: null, p80: null };
        return acc;
      },
      {} as Record<Famille, DelaiReel>,
    );
    const moy = (k: string) => a.reduce((s, x) => s + Number(x[k]), 0) / a.length;
    const notes = a.length ? { prix: moy("note_prix"), delai: moy("note_delai"), etat: moy("note_etat"), service: moy("note_service") } : null;

    // « Délais tenus » : au moins MIN_ENVOIS_DELAI envois et ≥ 80 % livrés dans le délai maximum annoncé.
    const maxParFamille: Record<Famille, number> = { aerien: 0, maritime: 0 };
    for (const r of delaisMax.filter((x) => x.transitaire_id === id)) {
      const f = MODES[r.mode as ModeCode]?.famille;
      if (f) maxParFamille[f] = Math.max(maxParFamille[f], Number(r.dmax));
    }
    const evalues = a.filter((x) => maxParFamille[x.famille as Famille] > 0);
    const tenus = evalues.filter((x) => jours(String(x.date_remise), String(x.date_reception)) <= maxParFamille[x.famille as Famille]).length;

    out.set(id, {
      nbAvis: a.length,
      note: notes ? (notes.prix + notes.delai + notes.etat + notes.service) / 4 : null,
      notes,
      delais,
      delaisTenus: evalues.length >= MIN_ENVOIS_DELAI && tenus / evalues.length >= 0.8,
    });
  }
  return out;
}

/* ───────────────────────── Offres ───────────────────────── */

export function offresDe(transitaireId: number, statuts: Offre["statut"][] = ["valide"]): Offre[] {
  const ph = statuts.map(() => "?").join(",");
  return (getDb()
    .prepare(`SELECT * FROM offres WHERE transitaire_id = ? AND statut IN (${ph}) ORDER BY origine_pays, mode, origine_ville`)
    .all(transitaireId, ...statuts) as Row[]).map(toOffre);
}

export function getOffre(id: number): Offre | null {
  const r = getDb().prepare("SELECT * FROM offres WHERE id = ?").get(id) as Row | undefined;
  return r ? toOffre(r) : null;
}

export type OffreSaisie = Omit<Offre, "id" | "transitaire_id" | "statut" | "remplace_id" | "motif_rejet" | "created_at" | "validated_at">;

/** Toute création ou modification d'offre passe en attente de vérification (l'ancienne version reste en ligne). */
export function soumettreOffre(transitaireId: number, o: OffreSaisie, remplaceId: number | null) {
  const db = getDb();
  if (remplaceId) db.prepare("DELETE FROM offres WHERE remplace_id = ? AND statut = 'en_attente'").run(remplaceId);
  db.prepare(
    `INSERT INTO offres (transitaire_id, origine_pays, origine_ville, mode, prix_xaf, minimum, frais_fixes_xaf, diviseur_vol, dedouanement_inclus, livraison, villes_desservies, inclus, non_inclus, delai_min, delai_max, marchandises, prochain_depart, remplace_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    transitaireId, o.origine_pays, o.origine_ville, o.mode, o.prix_xaf, o.minimum, o.frais_fixes_xaf, o.diviseur_vol,
    o.dedouanement_inclus ? 1 : 0, o.livraison, JSON.stringify(o.villes_desservies), o.inclus, o.non_inclus,
    o.delai_min, o.delai_max, JSON.stringify(o.marchandises), o.prochain_depart, remplaceId,
  );
}

export function archiverOffre(transitaireId: number, offreId: number) {
  getDb().prepare("UPDATE offres SET statut = 'archive' WHERE id = ? AND transitaire_id = ?").run(offreId, transitaireId);
}

export function offresEnAttente(): (Offre & { transitaire_nom: string })[] {
  return (getDb()
    .prepare("SELECT o.*, t.nom AS transitaire_nom FROM offres o JOIN transitaires t ON t.id = o.transitaire_id WHERE o.statut = 'en_attente' ORDER BY o.created_at")
    .all() as Row[]).map((r) => ({ ...toOffre(r), transitaire_nom: String(r.transitaire_nom) }));
}

export function validerOffre(id: number, ok: boolean, motif: string | null) {
  tx((db) => {
    const o = db.prepare("SELECT * FROM offres WHERE id = ?").get(id) as Row | undefined;
    if (!o) return;
    if (ok) {
      db.prepare("UPDATE offres SET statut = 'valide', validated_at = datetime('now'), motif_rejet = NULL WHERE id = ?").run(id);
      if (o.remplace_id) db.prepare("UPDATE offres SET statut = 'archive' WHERE id = ?").run(Number(o.remplace_id));
    } else {
      db.prepare("UPDATE offres SET statut = 'rejete', motif_rejet = ? WHERE id = ?").run(motif, id);
    }
  });
}

/* ───────────────────────── Recherche ───────────────────────── */

export type Criteres = {
  pays: PaysCode;
  ville: string | null;
  destination: string;
  modes: ModeCode[];
  marchandise: MarchandiseCode;
} & Quantites;

export type Resultat = {
  offre: Offre;
  transitaire: Transitaire;
  stats: Stats;
  estimation: Estimation | null;
  livraisonDestination: "incluse" | "retrait" | "a_preciser";
};

export function livraisonPour(o: Offre, destination: string): Resultat["livraisonDestination"] {
  if (o.livraison === "tout_gabon") {
    return o.villes_desservies.length === 0 || o.villes_desservies.includes(destination) ? "incluse" : "a_preciser";
  }
  if (o.livraison === "grand_libreville" && GRAND_LIBREVILLE.includes(destination)) return "incluse";
  return GRAND_LIBREVILLE.includes(destination) ? "retrait" : "a_preciser";
}

export function rechercher(c: Criteres): Resultat[] {
  const db = getDb();
  const ph = c.modes.map(() => "?").join(",");
  const params: (string | number)[] = [c.pays, ...c.modes];
  let sql = `SELECT o.* FROM offres o JOIN transitaires t ON t.id = o.transitaire_id
             WHERE o.statut = 'valide' AND t.statut = 'verifie' AND o.origine_pays = ? AND o.mode IN (${ph})`;
  if (c.ville) {
    sql += " AND o.origine_ville = ?";
    params.push(c.ville);
  }
  const offres = (db.prepare(sql).all(...params) as Row[]).map(toOffre).filter((o) => o.marchandises.includes(c.marchandise));
  const tids = [...new Set(offres.map((o) => o.transitaire_id))];
  const transitaires = new Map(tids.map((id) => [id, getTransitaire(id)!]));
  const stats = statsTransitaires(tids);
  return offres
    .filter((o) => !transitaires.get(o.transitaire_id)!.marchandises_refusees.includes(c.marchandise))
    .map((o) => ({
      offre: o,
      transitaire: transitaires.get(o.transitaire_id)!,
      stats: stats.get(o.transitaire_id)!,
      estimation: estimer(o, c),
      livraisonDestination: livraisonPour(o, c.destination),
    }));
}

/* ───────────────────────── Demandes et mises en relation ───────────────────────── */

export type NouvelleDemande = {
  nom: string;
  telephone: string;
  origine_pays: PaysCode;
  origine_ville: string | null;
  ville_destination: string;
  mode: ModeCode | null;
  poids: number | null;
  volume: number | null;
  quantite: number | null;
  marchandise: MarchandiseCode;
  description: string;
};

export type Demande = NouvelleDemande & { id: number; ref: string; created_at: string };

const token = (n = 16) => crypto.randomBytes(n).toString("base64url");

export function creerDemande(d: NouvelleDemande, transitaireIds: number[]): string {
  return tx((db) => {
    const ref = token(9);
    const r = db
      .prepare(
        `INSERT INTO demandes (ref, nom, telephone, origine_pays, origine_ville, ville_destination, mode, poids, volume, quantite, marchandise, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(ref, d.nom, d.telephone, d.origine_pays, d.origine_ville, d.ville_destination, d.mode, d.poids, d.volume, d.quantite, d.marchandise, d.description);
    const id = Number(r.lastInsertRowid);
    const insDT = db.prepare("INSERT INTO demande_transitaires (demande_id, transitaire_id, token_avis) VALUES (?, ?, ?)");
    const insC = db.prepare("INSERT INTO contacts (transitaire_id, canal, demande_id) VALUES (?, 'devis', ?)");
    for (const tid of transitaireIds) {
      insDT.run(id, tid, token());
      insC.run(tid, id);
    }
    return ref;
  });
}

export function getDemande(ref: string): (Demande & { transitaires: { transitaire: Transitaire; token_avis: string; avis: boolean }[] }) | null {
  const db = getDb();
  const d = db.prepare("SELECT * FROM demandes WHERE ref = ?").get(ref) as (Demande & Row) | undefined;
  if (!d) return null;
  const liens = db
    .prepare(
      "SELECT dt.transitaire_id, dt.token_avis, (SELECT COUNT(*) FROM avis a WHERE a.demande_id = dt.demande_id AND a.transitaire_id = dt.transitaire_id) AS n FROM demande_transitaires dt WHERE dt.demande_id = ?",
    )
    .all(d.id) as Row[];
  return {
    ...(d as Demande),
    transitaires: liens.map((l) => ({ transitaire: getTransitaire(Number(l.transitaire_id))!, token_avis: String(l.token_avis), avis: Number(l.n) > 0 })),
  };
}

export function getLienAvis(tokenAvis: string) {
  const db = getDb();
  const l = db.prepare("SELECT * FROM demande_transitaires WHERE token_avis = ?").get(tokenAvis) as Row | undefined;
  if (!l) return null;
  const demande = db.prepare("SELECT * FROM demandes WHERE id = ?").get(Number(l.demande_id)) as Demande | undefined;
  const transitaire = getTransitaire(Number(l.transitaire_id));
  const deja = db.prepare("SELECT id FROM avis WHERE demande_id = ? AND transitaire_id = ?").get(Number(l.demande_id), Number(l.transitaire_id));
  if (!demande || !transitaire) return null;
  return { demande, transitaire, dejaNote: !!deja };
}

export function demandesRecues(transitaireId: number, limit = 50): Demande[] {
  return getDb()
    .prepare(
      `SELECT d.* FROM demandes d JOIN demande_transitaires dt ON dt.demande_id = d.id WHERE dt.transitaire_id = ? AND d.ref NOT LIKE 'DEMO-%' ORDER BY d.created_at DESC LIMIT ?`,
    )
    .all(transitaireId, limit) as Demande[];
}

export function enregistrerContact(transitaireId: number, canal: "whatsapp" | "appel") {
  getDb().prepare("INSERT INTO contacts (transitaire_id, canal) VALUES (?, ?)").run(transitaireId, canal);
}

/* ───────────────────────── Avis ───────────────────────── */

export function creerAvis(a: Omit<Avis, "id" | "statut" | "reponse" | "reponse_statut" | "created_at">) {
  getDb()
    .prepare(
      `INSERT INTO avis (transitaire_id, demande_id, nom, famille, note_prix, note_delai, note_etat, note_service, commentaire, date_remise, date_reception)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(a.transitaire_id, a.demande_id, a.nom, a.famille, a.note_prix, a.note_delai, a.note_etat, a.note_service, a.commentaire, a.date_remise, a.date_reception);
}

export function avisDe(transitaireId: number, statut: Avis["statut"] = "publie"): Avis[] {
  return getDb().prepare("SELECT * FROM avis WHERE transitaire_id = ? AND statut = ? ORDER BY date_reception DESC").all(transitaireId, statut) as Avis[];
}

export function avisEnAttente(): (Avis & { transitaire_nom: string })[] {
  return getDb()
    .prepare(
      "SELECT a.*, t.nom AS transitaire_nom FROM avis a JOIN transitaires t ON t.id = a.transitaire_id WHERE a.statut = 'en_attente' OR a.reponse_statut = 'en_attente' ORDER BY a.created_at",
    )
    .all() as (Avis & { transitaire_nom: string })[];
}

export function modererAvis(id: number, publier: boolean) {
  getDb()
    .prepare("UPDATE avis SET statut = ?, published_at = CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id = ?")
    .run(publier ? "publie" : "rejete", publier ? 1 : 0, id);
}

export function repondreAvis(transitaireId: number, avisId: number, reponse: string) {
  getDb().prepare("UPDATE avis SET reponse = ?, reponse_statut = 'en_attente' WHERE id = ? AND transitaire_id = ?").run(reponse, avisId, transitaireId);
}

export function modererReponse(id: number, publier: boolean) {
  getDb().prepare("UPDATE avis SET reponse_statut = ? WHERE id = ?").run(publier ? "publie" : "rejete", id);
}

/* ───────────────────────── Tableau de bord ───────────────────────── */

export function chiffres() {
  const db = getDb();
  const n = (sql: string, ...p: (string | number)[]) => Number((db.prepare(sql).get(...p) as Row).n);
  return {
    transitairesVerifies: n("SELECT COUNT(*) AS n FROM transitaires WHERE statut = 'verifie'"),
    transitairesEnAttente: n("SELECT COUNT(*) AS n FROM transitaires WHERE statut = 'en_attente'"),
    offresValides: n("SELECT COUNT(*) AS n FROM offres WHERE statut = 'valide'"),
    demandes30j: n("SELECT COUNT(*) AS n FROM demandes WHERE ref NOT LIKE 'DEMO-%' AND created_at >= datetime('now', '-30 days')"),
    contacts30j: n("SELECT COUNT(*) AS n FROM contacts WHERE created_at >= datetime('now', '-30 days')"),
    avisPublies: n("SELECT COUNT(*) AS n FROM avis WHERE statut = 'publie'"),
    demo: n("SELECT COUNT(*) AS n FROM transitaires WHERE demo = 1"),
  };
}

export function contactsParTransitaire(transitaireId: number) {
  return getDb()
    .prepare("SELECT canal, COUNT(*) AS n FROM contacts WHERE transitaire_id = ? AND created_at >= datetime('now', '-30 days') GROUP BY canal")
    .all(transitaireId) as { canal: string; n: number }[];
}

export function dernieresDemandes(limit = 20): (Demande & { transitaires: string })[] {
  return getDb()
    .prepare(
      `SELECT d.*, (SELECT GROUP_CONCAT(t.nom, ', ') FROM demande_transitaires dt JOIN transitaires t ON t.id = dt.transitaire_id WHERE dt.demande_id = d.id) AS transitaires
       FROM demandes d WHERE d.ref NOT LIKE 'DEMO-%' ORDER BY d.created_at DESC LIMIT ?`,
    )
    .all(limit) as (Demande & { transitaires: string })[];
}
