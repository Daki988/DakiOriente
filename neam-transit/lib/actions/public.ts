"use server";

import { redirect } from "next/navigation";
import { creerAvis, creerDemande, getLienAvis, getTransitaireBySlug } from "@/lib/queries";
import { normaliserTelephone } from "@/lib/format";
import { isMarchandise, isMode, isPays, isVilleGabon, MODES } from "@/lib/referentiel";

const txt = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);
const num = (f: FormData, k: string) => {
  const n = Number(String(f.get(k) ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function envoyerDemande(form: FormData) {
  const retour = (msg: string) => redirect(`/devis?${new URLSearchParams([...[...form.getAll("t")].map((t) => ["t", String(t)] as [string, string]), ["erreur", msg]])}`);
  if (txt(form, "site")) return retour("Demande refusée."); // champ piège anti-robots
  const slugs = [...new Set(form.getAll("t").map(String))].slice(0, 5);
  const transitaires = slugs.map(getTransitaireBySlug).filter((t) => t && t.statut === "verifie");
  if (!transitaires.length) return retour("Choisissez au moins un transitaire.");
  const telephone = normaliserTelephone(txt(form, "telephone", 30));
  if (!telephone) return retour("Numéro de téléphone invalide.");
  const nom = txt(form, "nom", 80);
  if (nom.length < 2) return retour("Indiquez votre nom.");
  const pays = txt(form, "pays");
  const dest = txt(form, "dest");
  const marchandise = txt(form, "marchandise");
  const mode = txt(form, "mode");
  if (!isPays(pays) || !isVilleGabon(dest) || !isMarchandise(marchandise)) return retour("Complétez le départ, l'arrivée et le type de marchandise.");
  if (form.get("consentement") !== "on") return retour("Vous devez accepter la transmission de votre demande aux transitaires choisis.");
  const ref = creerDemande(
    {
      nom,
      telephone,
      origine_pays: pays,
      origine_ville: txt(form, "ville", 60) || null,
      ville_destination: dest,
      mode: isMode(mode) ? mode : null,
      poids: num(form, "poids"),
      volume: num(form, "volume"),
      quantite: isMode(mode) && ["conteneur", "vehicule"].includes(MODES[mode].unite) ? Math.max(1, Math.floor(num(form, "quantite") ?? 1)) : null,
      marchandise,
      description: txt(form, "description", 1500),
    },
    transitaires.map((t) => t!.id),
  );
  redirect(`/demande/${ref}`);
}

export async function envoyerAvis(form: FormData) {
  const token = txt(form, "token", 64);
  const lien = getLienAvis(token);
  if (!lien) redirect("/");
  const retour = (msg: string) => redirect(`/avis/${token}?erreur=${encodeURIComponent(msg)}`);
  if (lien.dejaNote) return retour("Vous avez déjà donné votre avis pour cet envoi.");
  const note = (k: string) => {
    const n = Number(form.get(k));
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
  };
  const notes = ["note_prix", "note_delai", "note_etat", "note_service"].map(note);
  if (notes.some((n) => n === null)) return retour("Donnez une note de 1 à 5 pour chaque critère.");
  const remise = txt(form, "date_remise", 10);
  const reception = txt(form, "date_reception", 10);
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(remise) || !re.test(reception)) return retour("Indiquez les deux dates.");
  const jours = (Date.parse(reception) - Date.parse(remise)) / 86400000;
  if (jours < 1 || jours > 365) return retour("Les dates semblent incorrectes (la réception doit être après la remise au transitaire).");
  if (Date.parse(reception) > Date.now() + 86400000) return retour("La date de réception ne peut pas être dans le futur.");
  if (Date.parse(remise) < Date.parse(lien.demande.created_at.slice(0, 10)) - 30 * 86400000) return retour("La date de remise est trop ancienne par rapport à votre demande.");
  const famille = txt(form, "famille");
  if (famille !== "aerien" && famille !== "maritime") return retour("Précisez avion ou bateau.");
  creerAvis({
    transitaire_id: lien.transitaire.id,
    demande_id: lien.demande.id,
    nom: txt(form, "nom", 60) || lien.demande.nom.split(" ")[0],
    famille,
    note_prix: notes[0]!,
    note_delai: notes[1]!,
    note_etat: notes[2]!,
    note_service: notes[3]!,
    commentaire: txt(form, "commentaire", 1500),
    date_remise: remise,
    date_reception: reception,
  });
  redirect(`/avis/${token}?merci=1`);
}
