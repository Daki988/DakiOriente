"use client";
// Lycée au Gabon (inscription, profil) : province puis lycée de la liste des examens nationaux (référentiel
// etablissements_secondaires, scripts/build_lycees_gabon.py), « Candidat libre » ou « Autre » pour le saisir soi-même.
import { useMemo, useState } from "react";
import { Field, Input, Select } from "@/components/app/form";
import lyceesGa from "@/data/lycees_ga.json";

const PROVINCES_GA = ["Estuaire", "Haut-Ogooué", "Moyen-Ogooué", "Ngounié", "Nyanga", "Ogooué-Ivindo", "Ogooué-Lolo", "Ogooué-Maritime", "Woleu-Ntem"];
const LYCEES_GA = lyceesGa as { n: string; p: string | null; t: number }[];
const AUTRE = "__autre__", LIBRE = "Candidat libre (non scolarisé)";

/** Lycée au Gabon : province, puis lycée de la liste officielle des examens ; « Autre » pour le saisir soi-même. */
export function ChoixLycee({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const connu = LYCEES_GA.find((l) => l.n === valeur);
  const [province, setProvince] = useState(connu?.p ?? "");
  const [autre, setAutre] = useState(!!valeur && !connu && valeur !== LIBRE);
  const options = useMemo<[string, string, string][]>(() => [
    ...LYCEES_GA.filter((l) => l.p === province && !l.t).map((l) => [l.n, l.n, `Lycées · ${province}`] as [string, string, string]),
    ...LYCEES_GA.filter((l) => l.t && (l.p === province || !l.p)).map((l) => [l.n, l.n, "Lycées techniques"] as [string, string, string]),
    [LIBRE, LIBRE, "Autre situation"], [AUTRE, "Autre : mon lycée n'est pas dans la liste", "Autre situation"],
  ], [province]);
  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <Field label="Province de ton lycée">{(i) => <Select id={i} value={province} onChange={(e) => { setProvince(e.target.value); setAutre(false); onChange(""); }} placeholder="Choisir…" options={PROVINCES_GA.map((p) => [p, p])} />}</Field>
      <Field label="Ton lycée" hint={province ? undefined : "Choisis d'abord la province."}>{(i) => <Select id={i} value={autre ? AUTRE : valeur} disabled={!province} onChange={(e) => { const v = e.target.value; if (v === AUTRE) { setAutre(true); onChange(""); } else { setAutre(false); onChange(v); } }} placeholder="Choisir…" options={options} />}</Field>
      {autre && <Field label="Nom de ton lycée" className="sm:col-span-2">{(i) => <Input id={i} value={valeur} onChange={(e) => onChange(e.target.value)} placeholder="Ex. Lycée public de …" maxLength={160} autoFocus className="text-[15px] sm:text-sm" />}</Field>}
    </div>
  );
}

