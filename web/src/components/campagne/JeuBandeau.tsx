"use client";
import Link from "@/components/ui/Link";
import { useEffect, useState } from "react";
import { CAMPAGNE, dateLongue, jeuEnCours } from "@/lib/campagne";

/** Bandeau du jeu #TrouveTaVoie, affiché uniquement pendant le jeu (date vérifiée à chaque visite). */
export function JeuBandeau() {
  const [actif, setActif] = useState(false);
  useEffect(() => setActif(jeuEnCours()), []);
  if (!actif) return null;
  return (
    <div className="border-y-[3px] border-[#0A0A0A] bg-[#FFE14D]">
      <div className="container flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-6">
        <p className="font-display text-2xl text-[#0A0A0A] sm:text-3xl">JEU #TROUVETAVOIE</p>
        <p className="flex-1 text-sm font-bold text-[#0A0A0A] sm:text-base">Du {dateLongue(CAMPAGNE.jeu.debut)} au {dateLongue(CAMPAGNE.jeu.fin)} : fais le test, crée ton compte, partage ton profil. Tirage en direct le {dateLongue(CAMPAGNE.jeu.tirage)}.</p>
        <Link href="/trouve-ta-voie/reglement/" className="font-extrabold text-[#0A0A0A] underline">Lire le règlement</Link>
      </div>
    </div>
  );
}
