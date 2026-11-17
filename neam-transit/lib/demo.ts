import type { DatabaseSync } from "node:sqlite";

/**
 * Données de DÉMONSTRATION — transitaires FICTIFS, uniquement pour tester la plateforme.
 * Ils sont marqués demo=1, affichés avec la mention « Démo » et supprimables en un clic
 * depuis l'administration. Aucune de ces informations ne décrit une entreprise réelle.
 */

type DemoT = {
  slug: string;
  nom: string;
  ville: string;
  telephone: string;
  badges: string[];
  description: string;
  entrepots: { pays: "CN" | "KR"; ville: string; adresse: string }[];
  offres: {
    pays: "CN" | "KR";
    ville: string;
    mode: string;
    prix: number;
    minimum: number;
    frais: number;
    douane: 0 | 1;
    livraison: "retrait" | "grand_libreville" | "tout_gabon";
    dmin: number;
    dmax: number;
    marchandises: string[];
  }[];
  avis: { famille: "aerien" | "maritime"; jours: number; notes: [number, number, number, number] }[];
};

const DEMO: DemoT[] = [
  {
    slug: "demo-alpha-fret",
    nom: "Alpha Fret (démo)",
    ville: "Libreville",
    telephone: "24100000001",
    badges: ["identite", "entreprise", "douane", "entrepot_chine"],
    description: "Transitaire fictif de démonstration : groupage aérien et maritime depuis Guangzhou et Yiwu.",
    entrepots: [
      { pays: "CN", ville: "Guangzhou", adresse: "Adresse de démonstration — Baiyun, Guangzhou" },
      { pays: "CN", ville: "Yiwu", adresse: "Adresse de démonstration — Yiwu" },
    ],
    offres: [
      { pays: "CN", ville: "Guangzhou", mode: "aerien_groupage", prix: 9000, minimum: 1, frais: 5000, douane: 1, livraison: "grand_libreville", dmin: 7, dmax: 12, marchandises: ["generale", "textile", "electronique", "pieces_auto"] },
      { pays: "CN", ville: "Guangzhou", mode: "maritime_lcl", prix: 290000, minimum: 0.5, frais: 15000, douane: 1, livraison: "grand_libreville", dmin: 45, dmax: 60, marchandises: ["generale", "textile", "electronique", "mobilier", "pieces_auto"] },
      { pays: "CN", ville: "Yiwu", mode: "aerien_groupage", prix: 9500, minimum: 1, frais: 5000, douane: 1, livraison: "retrait", dmin: 8, dmax: 14, marchandises: ["generale", "textile"] },
    ],
    avis: [
      { famille: "aerien", jours: 10, notes: [4, 4, 5, 4] },
      { famille: "aerien", jours: 11, notes: [4, 5, 5, 4] },
      { famille: "aerien", jours: 9, notes: [5, 5, 4, 5] },
      { famille: "aerien", jours: 13, notes: [4, 3, 4, 4] },
      { famille: "aerien", jours: 12, notes: [4, 4, 4, 5] },
      { famille: "aerien", jours: 10, notes: [5, 4, 5, 4] },
      { famille: "aerien", jours: 11, notes: [4, 4, 5, 5] },
      { famille: "aerien", jours: 15, notes: [3, 2, 4, 3] },
      { famille: "aerien", jours: 10, notes: [4, 5, 5, 5] },
      { famille: "aerien", jours: 12, notes: [4, 4, 4, 4] },
      { famille: "maritime", jours: 55, notes: [5, 4, 4, 4] },
    ],
  },
  {
    slug: "demo-beta-logistique",
    nom: "Bêta Logistique (démo)",
    ville: "Libreville",
    telephone: "24100000002",
    badges: ["identite", "entreprise", "entrepot_chine"],
    description: "Transitaire fictif de démonstration : prix bas, retrait en agence, livraisons en province sur demande.",
    entrepots: [{ pays: "CN", ville: "Guangzhou", adresse: "Adresse de démonstration — Guangzhou" }],
    offres: [
      { pays: "CN", ville: "Guangzhou", mode: "aerien_groupage", prix: 8200, minimum: 2, frais: 0, douane: 0, livraison: "retrait", dmin: 10, dmax: 18, marchandises: ["generale", "textile"] },
      { pays: "CN", ville: "Guangzhou", mode: "maritime_lcl", prix: 250000, minimum: 1, frais: 0, douane: 0, livraison: "retrait", dmin: 50, dmax: 75, marchandises: ["generale", "textile", "mobilier"] },
      { pays: "CN", ville: "Shenzhen", mode: "fcl20", prix: 4800000, minimum: 1, frais: 150000, douane: 0, livraison: "retrait", dmin: 40, dmax: 55, marchandises: ["generale", "mobilier", "pieces_auto", "electronique"] },
    ],
    avis: [
      { famille: "aerien", jours: 17, notes: [5, 3, 4, 3] },
      { famille: "aerien", jours: 14, notes: [5, 4, 4, 3] },
      { famille: "maritime", jours: 70, notes: [5, 3, 4, 3] },
    ],
  },
  {
    slug: "demo-gamma-express",
    nom: "Gamma Express (démo)",
    ville: "Port-Gentil",
    telephone: "24100000003",
    badges: ["identite", "entreprise", "douane", "entrepot_chine", "entrepot_coree"],
    description: "Transitaire fictif de démonstration : express et livraison dans tout le Gabon, départs Chine et Corée du Sud.",
    entrepots: [
      { pays: "CN", ville: "Shenzhen", adresse: "Adresse de démonstration — Shenzhen" },
      { pays: "KR", ville: "Incheon", adresse: "Adresse de démonstration — Incheon" },
    ],
    offres: [
      { pays: "CN", ville: "Shenzhen", mode: "express", prix: 14500, minimum: 0.5, frais: 0, douane: 1, livraison: "tout_gabon", dmin: 4, dmax: 7, marchandises: ["generale", "textile", "electronique", "cosmetiques"] },
      { pays: "KR", ville: "Incheon", mode: "aerien_groupage", prix: 11000, minimum: 1, frais: 7500, douane: 1, livraison: "tout_gabon", dmin: 8, dmax: 14, marchandises: ["generale", "cosmetiques", "electronique", "textile"] },
      { pays: "KR", ville: "Incheon", mode: "express", prix: 16000, minimum: 0.5, frais: 0, douane: 1, livraison: "tout_gabon", dmin: 5, dmax: 8, marchandises: ["generale", "cosmetiques", "electronique"] },
    ],
    avis: [
      { famille: "aerien", jours: 6, notes: [3, 5, 5, 5] },
      { famille: "aerien", jours: 9, notes: [3, 5, 5, 4] },
    ],
  },
  {
    slug: "demo-delta-auto-korea",
    nom: "Delta Auto Korea (démo)",
    ville: "Owendo",
    telephone: "24100000004",
    badges: ["identite", "entreprise", "douane", "entrepot_coree"],
    description: "Transitaire fictif de démonstration : véhicules d'occasion et pièces auto depuis Busan.",
    entrepots: [{ pays: "KR", ville: "Busan", adresse: "Adresse de démonstration — Busan" }],
    offres: [
      { pays: "KR", ville: "Busan", mode: "roro", prix: 1650000, minimum: 1, frais: 100000, douane: 0, livraison: "retrait", dmin: 45, dmax: 65, marchandises: ["vehicule"] },
      { pays: "KR", ville: "Busan", mode: "maritime_lcl", prix: 330000, minimum: 1, frais: 25000, douane: 1, livraison: "grand_libreville", dmin: 50, dmax: 70, marchandises: ["generale", "pieces_auto", "cosmetiques"] },
      { pays: "KR", ville: "Busan", mode: "fcl40", prix: 8900000, minimum: 1, frais: 200000, douane: 0, livraison: "retrait", dmin: 45, dmax: 65, marchandises: ["generale", "pieces_auto", "vehicule", "mobilier"] },
    ],
    avis: [{ famille: "maritime", jours: 58, notes: [4, 4, 5, 4] }],
  },
];

function isoDaysAgo(n: number) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export function seedDemo(db: DatabaseSync) {
  db.exec("BEGIN");
  try {
    const insT = db.prepare(`INSERT INTO transitaires (slug, nom, ville, adresse, telephone, whatsapp, gerant, description, rccm, nif, agrement_douane, entrepots, marchandises_refusees, modes_paiement, statut, badges, demo, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'verifie', ?, 1, datetime('now'))`);
    const insO = db.prepare(`INSERT INTO offres (transitaire_id, origine_pays, origine_ville, mode, prix_xaf, minimum, frais_fixes_xaf, dedouanement_inclus, livraison, inclus, non_inclus, delai_min, delai_max, marchandises, prochain_depart, statut, validated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valide', datetime('now'))`);
    const insD = db.prepare(`INSERT INTO demandes (ref, nom, telephone, origine_pays, ville_destination, marchandise, created_at) VALUES (?, 'Client démo', '24100000000', ?, 'Libreville', 'generale', ?)`);
    const insDT = db.prepare(`INSERT INTO demande_transitaires (demande_id, transitaire_id, token_avis) VALUES (?, ?, ?)`);
    const insA = db.prepare(`INSERT INTO avis (transitaire_id, demande_id, nom, famille, note_prix, note_delai, note_etat, note_service, commentaire, date_remise, date_reception, statut, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'publie', datetime('now'))`);

    let k = 0;
    for (const t of DEMO) {
      const r = insT.run(
        t.slug, t.nom, t.ville, "Adresse de démonstration", t.telephone, t.telephone, "Gérant démo", t.description,
        "DEMO-RCCM", "DEMO-NIF", t.badges.includes("douane") ? "DEMO-AGREMENT" : null,
        JSON.stringify(t.entrepots), JSON.stringify(["batteries"]), "Espèces, Airtel Money, Moov Money (réglés directement au transitaire)",
        JSON.stringify(t.badges),
      );
      const tid = Number(r.lastInsertRowid);
      for (const o of t.offres) {
        const inclus = [o.douane ? "Dédouanement" : null, o.livraison !== "retrait" ? "Livraison" : null, "Manutention entrepôt"].filter(Boolean).join(", ");
        const nonInclus = [o.douane ? null : "Droits et taxes de douane", o.livraison === "retrait" ? "Livraison (retrait en agence)" : null, "Assurance marchandise"].filter(Boolean).join(", ");
        insO.run(tid, o.pays, o.ville, o.mode, o.prix, o.minimum, o.frais, o.douane, o.livraison, inclus, nonInclus, o.dmin, o.dmax, JSON.stringify(o.marchandises), isoDaysAgo(-7 - (k % 10)));
        k++;
      }
      t.avis.forEach((a, i) => {
        k++;
        const remise = isoDaysAgo(a.jours + 20 + i * 3);
        const reception = isoDaysAgo(20 + i * 3);
        const d = insD.run(`DEMO-${t.slug}-${i}`, t.offres[0].pays, remise);
        const did = Number(d.lastInsertRowid);
        insDT.run(did, tid, `demo-${t.slug}-${i}`);
        insA.run(tid, did, `Client démo ${i + 1}`, a.famille, ...a.notes, "Avis de démonstration (fictif).", remise, reception);
      });
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function deleteDemo(db: DatabaseSync) {
  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM demandes WHERE ref LIKE 'DEMO-%'");
    db.exec("DELETE FROM transitaires WHERE demo = 1");
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
