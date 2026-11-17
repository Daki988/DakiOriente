import type { Metadata } from "next";
import Link from "next/link";
import { envoyerDemande } from "@/lib/actions/public";
import { getTransitaireBySlug, listTransitaires } from "@/lib/queries";
import { premier, type SP } from "@/lib/recherche";
import { MARCHANDISES, MARCHANDISE_CODES, MODES, MODE_CODES, PAYS, PAYS_CODES, PROVINCES } from "@/lib/referentiel";
import { Alerte, PastilleDemo } from "@/components/ui";

export const metadata: Metadata = { title: "Demande de devis" };

export default async function Devis({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const v = (k: string) => premier(sp[k]);
  const choisis = [sp.t ?? []].flat().map((s) => getTransitaireBySlug(String(s))).filter((t) => t && t.statut === "verifie").map((t) => t!.slug);
  const tous = listTransitaires("verifie");
  const type = v("type");
  const modeDefaut = type === "vehicule" ? "roro" : type === "conteneur" ? "fcl20" : v("transport") === "bateau" ? "maritime_lcl" : v("transport") === "avion" ? "aerien_groupage" : "";

  return (
    <div className="conteneur max-w-3xl py-8">
      <h1 className="titre-page">Demande de devis</h1>
      <p className="mt-2 text-sm text-slate-600">
        Votre demande est transmise aux transitaires choisis (5 maximum). Ils vous répondent directement. Gratuit et sans engagement.
      </p>
      {v("erreur") && <div className="mt-4"><Alerte type="erreur">{v("erreur")}</Alerte></div>}

      <form action={envoyerDemande} className="carte mt-6 grid gap-5 p-5 sm:p-6">
        <input type="text" name="site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <fieldset>
          <legend className="etiquette">Transitaires (5 maximum)</legend>
          {tous.length === 0 ? (
            <p className="text-sm text-slate-600">Aucun transitaire vérifié pour le moment.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {tous.map((t) => (
                <li key={t.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm has-checked:border-marine-900 has-checked:bg-marine-50">
                    <input type="checkbox" name="t" value={t.slug} defaultChecked={choisis.includes(t.slug)} className="h-5 w-5 accent-marine-900" />
                    <span className="font-medium">{t.nom}</span>
                    {t.demo && <PastilleDemo />}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiquette" htmlFor="pays">Départ</label>
            <select id="pays" name="pays" className="champ" defaultValue={v("pays") || "CN"}>
              {PAYS_CODES.map((c) => <option key={c} value={c}>{PAYS[c].drapeau} {PAYS[c].nom}</option>)}
            </select>
          </div>
          <div>
            <label className="etiquette" htmlFor="ville">Ville de départ (si connue)</label>
            <input id="ville" name="ville" className="champ" defaultValue={v("ville")} placeholder="ex. Guangzhou, Busan" maxLength={60} />
          </div>
          <div>
            <label className="etiquette" htmlFor="dest">Arrivée au Gabon</label>
            <select id="dest" name="dest" className="champ" defaultValue={v("dest") || "Libreville"}>
              {PROVINCES.map((p) => (
                <optgroup key={p.province} label={p.province}>
                  {p.villes.map((x) => <option key={x}>{x}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="etiquette" htmlFor="mode">Mode souhaité</label>
            <select id="mode" name="mode" className="champ" defaultValue={modeDefaut}>
              <option value="">Je ne sais pas encore</option>
              {MODE_CODES.map((m) => <option key={m} value={m}>{MODES[m].label}</option>)}
            </select>
          </div>
          <div>
            <label className="etiquette" htmlFor="marchandise">Marchandise</label>
            <select id="marchandise" name="marchandise" className="champ" defaultValue={type === "vehicule" ? "vehicule" : v("marchandise") || "generale"}>
              {MARCHANDISE_CODES.map((m) => <option key={m} value={m}>{MARCHANDISES[m].label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="etiquette" htmlFor="poids">Poids kg</label>
              <input id="poids" name="poids" type="number" min="0" step="0.1" inputMode="decimal" className="champ" defaultValue={v("poids")} />
            </div>
            <div>
              <label className="etiquette" htmlFor="volume">m³</label>
              <input id="volume" name="volume" type="number" min="0" step="0.01" inputMode="decimal" className="champ" defaultValue={v("volume")} />
            </div>
            <div>
              <label className="etiquette" htmlFor="quantite">Qté</label>
              <input id="quantite" name="quantite" type="number" min="1" step="1" className="champ" defaultValue={v("quantite") || ""} title="Nombre de conteneurs ou de véhicules" />
            </div>
          </div>
        </div>
        <div>
          <label className="etiquette" htmlFor="description">Précisions</label>
          <textarea id="description" name="description" rows={3} maxLength={1500} className="champ" placeholder="Nature des produits, nombre de cartons, valeur approximative, date souhaitée…" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiquette" htmlFor="nom">Votre nom</label>
            <input id="nom" name="nom" required minLength={2} maxLength={80} className="champ" autoComplete="name" />
          </div>
          <div>
            <label className="etiquette" htmlFor="telephone">Téléphone / WhatsApp</label>
            <input id="telephone" name="telephone" required type="tel" inputMode="tel" className="champ" placeholder="077 12 34 56" autoComplete="tel" />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="consentement" required className="mt-1 h-5 w-5 accent-marine-900" />
          J&apos;accepte que ma demande et mon numéro soient transmis aux transitaires choisis pour qu&apos;ils me répondent. <Link href="/conditions" className="underline">Conditions</Link>
        </label>
        <button type="submit" className="btn-primaire text-base">Envoyer ma demande</button>
      </form>
    </div>
  );
}
