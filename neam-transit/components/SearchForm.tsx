"use client";

import { useState } from "react";
import { MARCHANDISES, MARCHANDISE_CODES, PAYS, PAYS_CODES, PROVINCES, type PaysCode, type TypeEnvoi } from "@/lib/referentiel";

export type ValeursRecherche = {
  pays?: string;
  ville?: string;
  dest?: string;
  type?: string;
  transport?: string;
  marchandise?: string;
  poids?: string;
  volume?: string;
  quantite?: string;
  tri?: string;
};

export function SearchForm({ valeurs = {}, compact = false }: { valeurs?: ValeursRecherche; compact?: boolean }) {
  const [pays, setPays] = useState<PaysCode>((valeurs.pays as PaysCode) in PAYS ? (valeurs.pays as PaysCode) : "CN");
  const [type, setType] = useState<TypeEnvoi>((["groupage", "conteneur", "vehicule"].includes(valeurs.type ?? "") ? valeurs.type : "groupage") as TypeEnvoi);

  return (
    <form action="/comparer" method="get" className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
      <fieldset className={compact ? "" : "sm:col-span-2"}>
        <legend className="etiquette">Que voulez-vous envoyer ?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["groupage", "Colis"],
              ["conteneur", "Conteneur"],
              ["vehicule", "Véhicule"],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center text-sm font-medium ${type === v ? "border-marine-900 bg-marine-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
              <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="pays" className="etiquette">Départ</label>
        <select id="pays" name="pays" className="champ" value={pays} onChange={(e) => setPays(e.target.value as PaysCode)}>
          {PAYS_CODES.map((c) => (
            <option key={c} value={c}>{PAYS[c].drapeau} {PAYS[c].nom}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ville" className="etiquette">Ville de départ</label>
        <select id="ville" name="ville" className="champ" defaultValue={valeurs.ville ?? ""} key={pays}>
          <option value="">Toutes les villes</option>
          {PAYS[pays].villes.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dest" className="etiquette">Arrivée au Gabon</label>
        <select id="dest" name="dest" className="champ" defaultValue={valeurs.dest ?? "Libreville"}>
          {PROVINCES.map((p) => (
            <optgroup key={p.province} label={p.province}>
              {p.villes.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {type === "groupage" ? (
        <>
          <div>
            <label htmlFor="transport" className="etiquette">Transport</label>
            <select id="transport" name="transport" className="champ" defaultValue={valeurs.transport ?? "tous"}>
              <option value="tous">Avion et bateau</option>
              <option value="avion">Avion (rapide)</option>
              <option value="bateau">Bateau (économique)</option>
            </select>
          </div>
          <div>
            <label htmlFor="marchandise" className="etiquette">Type de marchandise</label>
            <select id="marchandise" name="marchandise" className="champ" defaultValue={valeurs.marchandise ?? "generale"}>
              {MARCHANDISE_CODES.filter((m) => m !== "vehicule").map((m) => (
                <option key={m} value={m}>{MARCHANDISES[m].label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="poids" className="etiquette">Poids (kg)</label>
              <input id="poids" name="poids" type="number" min="0" step="0.1" inputMode="decimal" className="champ" defaultValue={valeurs.poids ?? ""} placeholder="ex. 25" />
            </div>
            <div>
              <label htmlFor="volume" className="etiquette">Volume (m³)</label>
              <input id="volume" name="volume" type="number" min="0" step="0.01" inputMode="decimal" className="champ" defaultValue={valeurs.volume ?? ""} placeholder="ex. 0.3" />
            </div>
            <p className="aide col-span-2">
              Volume inconnu ? <a className="underline" href="/calculateur" target="_blank">Calculez-le à partir de vos cartons</a>.
            </p>
          </div>
        </>
      ) : (
        <>
          {type === "conteneur" && (
            <div>
              <label htmlFor="marchandise" className="etiquette">Type de marchandise</label>
              <select id="marchandise" name="marchandise" className="champ" defaultValue={valeurs.marchandise ?? "generale"}>
                {MARCHANDISE_CODES.map((m) => (
                  <option key={m} value={m}>{MARCHANDISES[m].label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="quantite" className="etiquette">{type === "conteneur" ? "Nombre de conteneurs" : "Nombre de véhicules"}</label>
            <input id="quantite" name="quantite" type="number" min="1" step="1" inputMode="numeric" className="champ" defaultValue={valeurs.quantite ?? "1"} />
          </div>
        </>
      )}

      <button type="submit" className={`btn-primaire w-full text-base ${compact ? "" : "sm:col-span-2"}`}>
        Comparer les transitaires
      </button>
    </form>
  );
}
