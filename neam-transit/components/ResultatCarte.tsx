import Link from "next/link";
import type { Resultat } from "@/lib/queries";
import { MODES, PAYS } from "@/lib/referentiel";
import { dateFr, fcfa, nombre } from "@/lib/format";
import { Badges, DelaiReelTexte, NoteCourte, PastilleDemo, PastilleVerifie } from "./ui";

const UNITE_PRIX = { kg: "/ kg", cbm: "/ m³", conteneur: "/ conteneur", vehicule: "/ véhicule" } as const;

export function ResultatCarte({ r, destination, message }: { r: Resultat; destination: string; message: string }) {
  const { offre: o, transitaire: t, stats, estimation: e } = r;
  const mode = MODES[o.mode];
  return (
    <article className="carte overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-marine-900">
              <Link href={`/transitaires/${t.slug}`} className="hover:underline">{t.nom}</Link>
            </h3>
            <PastilleVerifie />
            {t.demo && <PastilleDemo />}
          </div>
          <div className="mt-1"><NoteCourte stats={stats} /></div>
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-semibold">{mode.icone} {mode.label}</span> · depuis {o.origine_ville} ({PAYS[o.origine_pays].nom}) · agence à {t.ville}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-sm text-slate-800">
              Délai annoncé : <strong>{o.delai_min}–{o.delai_max} jours</strong>
              {o.prochain_depart && <span className="text-slate-500"> · prochain départ le {dateFr(o.prochain_depart)}</span>}
            </p>
            <p><DelaiReelTexte d={stats.delais[mode.famille]} famille={mode.famille} /></p>
          </div>
          <div className="mt-3"><Badges badges={t.badges} delaisTenus={stats.delaisTenus} /></div>
        </div>

        <div className="shrink-0 rounded-xl bg-marine-50 p-4 sm:w-64">
          {e ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Coût total estimé</p>
              <p className="text-2xl font-extrabold text-marine-900">{fcfa(e.total)}</p>
              <p className="mt-1 text-xs text-slate-600">
                {nombre(e.facturable)} × {fcfa(o.prix_xaf)} ({e.base}){e.frais ? ` + ${fcfa(e.frais)} de frais fixes` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tarif</p>
              <p className="text-2xl font-extrabold text-marine-900">{fcfa(o.prix_xaf)} <span className="text-sm font-semibold">{UNITE_PRIX[mode.unite]}</span></p>
              <p className="mt-1 text-xs text-slate-600">Indiquez le poids ou le volume pour obtenir le coût total.</p>
            </>
          )}
          <ul className="mt-3 space-y-1 text-xs">
            <li className={o.dedouanement_inclus ? "text-verifie-600" : "text-alerte-600"}>{o.dedouanement_inclus ? "✔ Dédouanement inclus" : "✖ Dédouanement non inclus"}</li>
            <li className={r.livraisonDestination === "incluse" ? "text-verifie-600" : "text-alerte-600"}>
              {r.livraisonDestination === "incluse" ? `✔ Livraison à ${destination} incluse` : r.livraisonDestination === "retrait" ? `✖ Retrait en agence (${t.ville})` : `✖ Acheminement jusqu'à ${destination} à préciser`}
            </li>
            {o.minimum > 0 && mode.unite !== "conteneur" && mode.unite !== "vehicule" && (
              <li className="text-slate-600">Minimum facturé : {nombre(o.minimum)} {mode.unite === "kg" ? "kg" : "m³"}</li>
            )}
          </ul>
        </div>
      </div>

      {(o.inclus || o.non_inclus) && (
        <details className="border-t border-slate-100 px-4 py-3 text-sm sm:px-5">
          <summary className="cursor-pointer font-medium text-marine-800">Détail inclus / non inclus</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <p><span className="font-semibold text-verifie-600">Inclus :</span> {o.inclus || "—"}</p>
            <p><span className="font-semibold text-alerte-600">Non inclus :</span> {o.non_inclus || "—"}</p>
          </div>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <label className="mr-auto inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="t" value={t.slug} className="h-5 w-5 accent-marine-900" />
          Ajouter à ma demande de devis
        </label>
        <Link href={`/transitaires/${t.slug}`} className="btn-contour">Voir la fiche</Link>
        <a href={`/go/${t.id}?canal=whatsapp&m=${encodeURIComponent(message)}`} className="btn-whatsapp" rel="nofollow">WhatsApp</a>
      </div>
    </article>
  );
}
