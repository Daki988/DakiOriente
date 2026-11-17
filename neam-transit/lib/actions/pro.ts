"use server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { UPLOAD_DIR } from "@/lib/db";
import { envoyerOtp, exigerPro, fermerSession, ouvrirSession, verifierOtp } from "@/lib/auth";
import {
  archiverOffre,
  avisDe,
  creerTransitaire,
  getOffre,
  getTransitaire,
  getTransitaireByTelephone,
  proposerModifProfil,
  repondreAvis,
  soumettreOffre,
  type Entrepot,
} from "@/lib/queries";
import { normaliserTelephone } from "@/lib/format";
import { isMarchandise, isMode, isPays, isVilleGabon, MODES, PAYS, VILLES_GABON, type MarchandiseCode } from "@/lib/referentiel";

const txt = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const entier = (f: FormData, k: string) => {
  const n = Math.round(Number(String(f.get(k) ?? "").replace(/\s/g, "").replace(",", ".")));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const decimal = (f: FormData, k: string) => {
  const n = Number(String(f.get(k) ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const TYPES_DOC = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const MAX_DOC = 5 * 1024 * 1024;

function lireEntrepots(f: FormData): Entrepot[] {
  const out: Entrepot[] = [];
  for (let i = 0; i < 4; i++) {
    const pays = txt(f, `e_pays_${i}`);
    const ville = txt(f, `e_ville_${i}`, 60);
    const adresse = txt(f, `e_adresse_${i}`, 300);
    if (isPays(pays) && ville && adresse) out.push({ pays, ville, adresse });
  }
  return out;
}

const lireMarchandises = (f: FormData, k: string) => f.getAll(k).map(String).filter(isMarchandise) as MarchandiseCode[];

export async function inscrireTransitaire(form: FormData) {
  const retour = (msg: string) => redirect(`/pro/inscription?erreur=${encodeURIComponent(msg)}`);
  if (txt(form, "site")) return retour("Demande refusée.");
  const telephone = normaliserTelephone(txt(form, "telephone", 30));
  if (!telephone) return retour("Numéro de téléphone invalide.");
  if (getTransitaireByTelephone(telephone)) return retour("Ce numéro est déjà enregistré. Connectez-vous à votre espace.");
  const whatsapp = txt(form, "whatsapp", 30) ? normaliserTelephone(txt(form, "whatsapp", 30)) : telephone;
  if (!whatsapp) return retour("Numéro WhatsApp invalide.");
  const nom = txt(form, "nom", 100);
  const gerant = txt(form, "gerant", 100);
  const ville = txt(form, "ville");
  const adresse = txt(form, "adresse", 300);
  const rccm = txt(form, "rccm", 60);
  const nif = txt(form, "nif", 60);
  if (nom.length < 2 || gerant.length < 2 || !adresse || !rccm || !nif) return retour("Complétez tous les champs obligatoires.");
  if (!isVilleGabon(ville)) return retour("Choisissez la ville de votre agence.");
  const entrepots = lireEntrepots(form);
  if (!entrepots.length) return retour("Indiquez au moins un entrepôt ou partenaire en Chine ou en Corée du Sud.");
  if (form.get("engagement") !== "on") return retour("Vous devez accepter les conditions de référencement.");

  // Documents justificatifs
  const fichiers: { type: string; file: File }[] = [];
  for (const type of ["rccm", "identite", "agrement", "entrepot"]) {
    const f = form.get(`doc_${type}`);
    if (f instanceof File && f.size > 0) fichiers.push({ type, file: f });
  }
  if (!fichiers.some((f) => f.type === "rccm") || !fichiers.some((f) => f.type === "identite")) return retour("Le RCCM et la pièce d'identité du gérant sont obligatoires.");
  for (const { file } of fichiers) {
    if (!(file.type in TYPES_DOC)) return retour("Formats acceptés : PDF, JPG, PNG, WEBP.");
    if (file.size > MAX_DOC) return retour("Chaque document doit faire moins de 5 Mo.");
  }
  const docs: { type: string; fichier: string; nom_original: string; mime: string }[] = [];
  for (const { type, file } of fichiers) {
    const nomFichier = `${crypto.randomBytes(16).toString("hex")}.${TYPES_DOC[file.type as keyof typeof TYPES_DOC]}`;
    await fs.writeFile(path.join(UPLOAD_DIR, nomFichier), Buffer.from(await file.arrayBuffer()));
    docs.push({ type, fichier: nomFichier, nom_original: file.name.slice(0, 120), mime: file.type });
  }

  const id = creerTransitaire(
    {
      nom,
      ville,
      adresse,
      telephone,
      whatsapp,
      email: txt(form, "email", 120) || null,
      gerant,
      description: txt(form, "description", 1000),
      rccm,
      nif,
      agrement_douane: txt(form, "agrement", 60) || null,
      entrepots,
      marchandises_refusees: lireMarchandises(form, "refusees"),
      modes_paiement: txt(form, "modes_paiement", 200),
    },
    docs,
  );
  await ouvrirSession({ role: "pro", id }, 24 * 7);
  redirect("/pro/tableau-de-bord?bienvenue=1");
}

export async function demanderCode(form: FormData) {
  const telephone = normaliserTelephone(txt(form, "telephone", 30));
  if (!telephone) redirect(`/pro/connexion?erreur=${encodeURIComponent("Numéro invalide.")}`);
  const t = getTransitaireByTelephone(telephone);
  // Même réponse que le numéro existe ou non (évite de révéler les comptes).
  if (!t) redirect(`/pro/connexion?tel=${telephone}`);
  const r = await envoyerOtp(telephone);
  if (!r.ok) redirect(`/pro/connexion?erreur=${encodeURIComponent(r.erreur)}`);
  redirect(`/pro/connexion?tel=${telephone}${r.codeDev ? `&dev=${r.codeDev}` : ""}`);
}

export async function validerCode(form: FormData) {
  const telephone = normaliserTelephone(txt(form, "telephone", 30)) ?? "";
  const code = txt(form, "code", 10);
  const t = getTransitaireByTelephone(telephone);
  if (!t || !verifierOtp(telephone, code)) redirect(`/pro/connexion?tel=${telephone}&erreur=${encodeURIComponent("Code incorrect ou expiré.")}`);
  await ouvrirSession({ role: "pro", id: t.id }, 24 * 7);
  redirect("/pro/tableau-de-bord");
}

export async function deconnexion() {
  await fermerSession();
  redirect("/");
}

export async function enregistrerOffre(form: FormData) {
  const tid = await exigerPro();
  const remplace = Number(txt(form, "remplace_id")) || null;
  const retour = (msg: string) => redirect(`${remplace ? `/pro/offres/${remplace}` : "/pro/offres/nouvelle"}?erreur=${encodeURIComponent(msg)}`);
  if (remplace && getOffre(remplace)?.transitaire_id !== tid) return retour("Offre introuvable.");
  const pays = txt(form, "origine_pays");
  const mode = txt(form, "mode");
  const ville = txt(form, "origine_ville", 60);
  if (!isPays(pays) || !isMode(mode) || !PAYS[pays].villes.includes(ville)) return retour("Départ ou mode invalide.");
  const prix = entier(form, "prix_xaf");
  const dmin = entier(form, "delai_min");
  const dmax = entier(form, "delai_max");
  if (!prix || prix < 100) return retour("Indiquez un prix en FCFA.");
  if (!dmin || !dmax || dmin > dmax || dmax > 365) return retour("Délais invalides (minimum ≤ maximum, en jours).");
  const livraison = txt(form, "livraison");
  if (!["retrait", "grand_libreville", "tout_gabon"].includes(livraison)) return retour("Choisissez le mode de remise au client.");
  const marchandises = lireMarchandises(form, "marchandises");
  if (!marchandises.length) return retour("Cochez au moins un type de marchandise accepté.");
  const depart = txt(form, "prochain_depart", 10);
  soumettreOffre(
    tid,
    {
      origine_pays: pays,
      origine_ville: ville,
      mode,
      prix_xaf: prix,
      minimum: decimal(form, "minimum") ?? 0,
      frais_fixes_xaf: entier(form, "frais_fixes_xaf") ?? 0,
      diviseur_vol: MODES[mode].unite === "kg" ? Math.min(10000, Math.max(4000, entier(form, "diviseur_vol") || 6000)) : 6000,
      dedouanement_inclus: form.get("dedouanement_inclus") === "on",
      livraison: livraison as "retrait" | "grand_libreville" | "tout_gabon",
      villes_desservies: livraison === "tout_gabon" ? form.getAll("villes").map(String).filter((v) => VILLES_GABON.includes(v)) : [],
      inclus: txt(form, "inclus", 400),
      non_inclus: txt(form, "non_inclus", 400),
      delai_min: dmin,
      delai_max: dmax,
      marchandises,
      prochain_depart: /^\d{4}-\d{2}-\d{2}$/.test(depart) ? depart : null,
    },
    remplace,
  );
  redirect("/pro/tableau-de-bord?offre=1");
}

export async function retirerOffre(form: FormData) {
  const tid = await exigerPro();
  archiverOffre(tid, Number(form.get("id")));
  redirect("/pro/tableau-de-bord");
}

export async function modifierProfil(form: FormData) {
  const tid = await exigerPro();
  const t = getTransitaire(tid)!;
  const whatsapp = txt(form, "whatsapp", 30) ? normaliserTelephone(txt(form, "whatsapp", 30)) : null;
  const entrepots = lireEntrepots(form);
  if (!entrepots.length) redirect(`/pro/profil?erreur=${encodeURIComponent("Indiquez au moins un entrepôt ou partenaire.")}`);
  proposerModifProfil(tid, {
    description: txt(form, "description", 1000),
    whatsapp: whatsapp ?? t.telephone,
    email: txt(form, "email", 120) || null,
    adresse: txt(form, "adresse", 300) || t.adresse,
    modes_paiement: txt(form, "modes_paiement", 200),
    marchandises_refusees: lireMarchandises(form, "refusees"),
    entrepots,
  });
  redirect("/pro/tableau-de-bord?profil=1");
}

export async function repondre(form: FormData) {
  const tid = await exigerPro();
  const id = Number(form.get("avis_id"));
  const reponse = txt(form, "reponse", 800);
  if (reponse && avisDe(tid).some((a) => a.id === id)) repondreAvis(tid, id, reponse);
  redirect("/pro/tableau-de-bord?reponse=1");
}
