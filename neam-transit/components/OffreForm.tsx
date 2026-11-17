import { enregistrerOffre } from "@/lib/actions/pro";
import type { Offre } from "@/lib/queries";
import { MODES, MODE_CODES, PAYS, PAYS_CODES, PROVINCES } from "@/lib/referentiel";
import { CasesMarchandises } from "./ChampsPro";

export function OffreForm({ offre }: { offre?: Offre }) {
  return (
    <form action={enregistrerOffre} className="carte grid gap-5 p-5 sm:p-6">
      {offre && <input type="hidden" name="remplace_id" value={offre.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="etiquette" htmlFor="origine_pays">Pays de départ</label>
          <select id="origine_pays" name="origine_pays" className="champ" defaultValue={offre?.origine_pays ?? "CN"}>
            {PAYS_CODES.map((c) => <option key={c} value={c}>{PAYS[c].nom}</option>)}
          </select>
        </div>
        <div>
          <label className="etiquette" htmlFor="origine_ville">Ville de départ</label>
          <select id="origine_ville" name="origine_ville" className="champ" defaultValue={offre?.origine_ville ?? "Guangzhou"}>
            {PAYS_CODES.map((c) => (
              <optgroup key={c} label={PAYS[c].nom}>{PAYS[c].villes.map((v) => <option key={v}>{v}</option>)}</optgroup>
            ))}
          </select>
          <p className="aide">Doit correspondre au pays choisi.</p>
        </div>
        <div>
          <label className="etiquette" htmlFor="mode">Mode</label>
          <select id="mode" name="mode" className="champ" defaultValue={offre?.mode ?? "aerien_groupage"}>
            {MODE_CODES.map((m) => <option key={m} value={m}>{MODES[m].label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="etiquette" htmlFor="prix_xaf">Prix (FCFA) par unité</label>
          <input id="prix_xaf" name="prix_xaf" required inputMode="numeric" className="champ" defaultValue={offre?.prix_xaf ?? ""} />
          <p className="aide">Par kg (avion), par m³ (groupage bateau), par conteneur ou par véhicule.</p>
        </div>
        <div>
          <label className="etiquette" htmlFor="minimum">Minimum facturé</label>
          <input id="minimum" name="minimum" inputMode="decimal" className="champ" defaultValue={offre?.minimum ?? 0} />
          <p className="aide">En kg ou en m³ (0 si aucun).</p>
        </div>
        <div>
          <label className="etiquette" htmlFor="frais_fixes_xaf">Frais fixes par envoi (FCFA)</label>
          <input id="frais_fixes_xaf" name="frais_fixes_xaf" inputMode="numeric" className="champ" defaultValue={offre?.frais_fixes_xaf ?? 0} />
          <p className="aide">Dossier, manutention… (0 si aucun).</p>
        </div>
        <div>
          <label className="etiquette" htmlFor="diviseur_vol">Diviseur volumétrique (avion)</label>
          <input id="diviseur_vol" name="diviseur_vol" inputMode="numeric" className="champ" defaultValue={offre?.diviseur_vol ?? 6000} />
        </div>
        <div>
          <label className="etiquette" htmlFor="delai_min">Délai minimum (jours)</label>
          <input id="delai_min" name="delai_min" required inputMode="numeric" className="champ" defaultValue={offre?.delai_min ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="delai_max">Délai maximum (jours)</label>
          <input id="delai_max" name="delai_max" required inputMode="numeric" className="champ" defaultValue={offre?.delai_max ?? ""} />
        </div>
        <div>
          <label className="etiquette" htmlFor="prochain_depart">Prochain départ</label>
          <input id="prochain_depart" name="prochain_depart" type="date" className="champ" defaultValue={offre?.prochain_depart ?? ""} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" name="dedouanement_inclus" defaultChecked={offre?.dedouanement_inclus} className="h-5 w-5 accent-marine-900" />
        Dédouanement inclus dans le prix
      </label>
      <fieldset>
        <legend className="etiquette">Remise au client</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {([["retrait", "Retrait en agence"], ["grand_libreville", "Livraison Grand Libreville"], ["tout_gabon", "Livraison en province"]] as const).map(([v, l]) => (
            <label key={v} className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm has-checked:border-marine-900 has-checked:bg-marine-50">
              <input type="radio" name="livraison" value={v} defaultChecked={(offre?.livraison ?? "retrait") === v} className="accent-marine-900" /> {l}
            </label>
          ))}
        </div>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-marine-700">Livraison en province : limiter à certaines villes (sinon tout le Gabon)</summary>
          <div className="mt-2 grid gap-1 sm:grid-cols-3">
            {PROVINCES.flatMap((p) => p.villes).map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="checkbox" name="villes" value={v} defaultChecked={offre?.villes_desservies.includes(v)} className="accent-marine-900" /> {v}
              </label>
            ))}
          </div>
        </details>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="etiquette" htmlFor="inclus">Inclus dans le prix</label>
          <textarea id="inclus" name="inclus" rows={2} maxLength={400} className="champ" defaultValue={offre?.inclus} placeholder="Manutention, dédouanement, livraison…" />
        </div>
        <div>
          <label className="etiquette" htmlFor="non_inclus">Non inclus (à payer en plus)</label>
          <textarea id="non_inclus" name="non_inclus" rows={2} maxLength={400} className="champ" defaultValue={offre?.non_inclus} placeholder="Droits et taxes, stockage après X jours, assurance…" />
        </div>
      </div>
      <CasesMarchandises name="marchandises" legende="Marchandises acceptées avec ce tarif" valeurs={offre?.marchandises ?? ["generale"]} />
      <p className="text-sm text-slate-600">Votre tarif sera visible après vérification par Neam Transit. {offre && "L'ancienne version reste en ligne en attendant."}</p>
      <button type="submit" className="btn-primaire">Envoyer pour vérification</button>
    </form>
  );
}
