import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";
import { ResultatCarte } from "@/components/ResultatCarte";
import { Alerte } from "@/components/ui";
import { rechercher, type Resultat } from "@/lib/queries";
import { lireCriteres, type SP } from "@/lib/recherche";
import { MARCHANDISES, MODES, PAYS } from "@/lib/referentiel";
import { messageContact } from "@/lib/messages";
import { pret } from "@/lib/stockage";

export const metadata: Metadata = { title: "Comparer les transitaires" };

function trier(rs: Resultat[], tri: string) {
  const cle = {
    prix: (r: Resultat) => r.estimation?.total ?? 1e15 + r.offre.prix_xaf,
    delai: (r: Resultat) => r.stats.delais[MODES[r.offre.mode].famille].mediane ?? r.offre.delai_max,
    note: (r: Resultat) => -(r.stats.note ?? 0),
  }[tri as "prix" | "delai" | "note"];
  return [...rs].sort((a, b) => cle(a) - cle(b));
}

export default async function Comparer({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await pret();
  const { criteres: c, valeurs, type, tri } = lireCriteres(sp);
  const resultats = trier(rechercher(c), tri);
  const sansQuantite = type === "groupage" && !c.poids && !c.volume;
  const base = new URLSearchParams(Object.entries(valeurs).filter(([k, v]) => v && k !== "tri"));
  const lienTri = (t: string) => `/comparer?${new URLSearchParams([...base.entries(), ["tri", t]]).toString()}`;

  return (
    <div className="conteneur py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="carte h-fit p-4 lg:sticky lg:top-20">
          <details className="lg:hidden">
            <summary className="cursor-pointer font-semibold text-marine-900">Modifier la recherche</summary>
            <div className="mt-4"><SearchForm valeurs={valeurs} compact /></div>
          </details>
          <div className="hidden lg:block">
            <h2 className="mb-3 font-semibold text-marine-900">Votre envoi</h2>
            <SearchForm valeurs={valeurs} compact />
          </div>
        </aside>

        <section>
          <h1 className="titre-page">
            {PAYS[c.pays].drapeau} {c.ville ?? PAYS[c.pays].nom} → {c.destination}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {MARCHANDISES[c.marchandise].label} · {resultats.length} offre{resultats.length > 1 ? "s" : ""} de transitaires vérifiés
          </p>

          {MARCHANDISES[c.marchandise].sensible && (
            <div className="mt-4">
              <Alerte type="attention">
                Marchandise sensible : seuls les transitaires qui l&apos;acceptent sont affichés. Faites confirmer par écrit les conditions de transport et de dédouanement avant d&apos;expédier.
              </Alerte>
            </div>
          )}
          {sansQuantite && resultats.length > 0 && (
            <div className="mt-4"><Alerte>Indiquez un poids ou un volume pour voir le coût total estimé de chaque offre.</Alerte></div>
          )}

          {resultats.length > 0 && (
            <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Trier">
              <span className="text-slate-600">Trier par :</span>
              {[["prix", "Coût total"], ["delai", "Délai"], ["note", "Note"]].map(([k, l]) => (
                <Link key={k} href={lienTri(k)} className={`rounded-full px-3 py-1.5 font-medium ${tri === k ? "bg-marine-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`} aria-current={tri === k ? "true" : undefined}>
                  {l}
                </Link>
              ))}
            </nav>
          )}

          {resultats.length === 0 ? (
            <div className="carte mt-6 p-8 text-center">
              <p className="font-semibold text-marine-900">Aucune offre vérifiée ne correspond pour l&apos;instant.</p>
              <p className="mt-2 text-sm text-slate-600">Essayez « Toutes les villes » au départ, un autre mode de transport, ou consultez la liste des transitaires.</p>
              <Link href="/transitaires" className="btn-contour mt-4">Voir tous les transitaires</Link>
            </div>
          ) : (
            <form action="/devis" method="get" className="mt-4 space-y-4">
              {Object.entries(valeurs).filter(([k, v]) => v && !["t", "tri"].includes(k)).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              {resultats.map((r) => (
                <ResultatCarte
                  key={r.offre.id}
                  r={r}
                  destination={c.destination}
                  message={messageContact({ pays: c.pays, ville: r.offre.origine_ville, destination: c.destination, mode: r.offre.mode, marchandise: c.marchandise, poids: c.poids, volume: c.volume, quantite: c.quantite })}
                />
              ))}
              <div className="sticky bottom-3 z-10">
                <button type="submit" className="btn-marine w-full text-base shadow-lg">Demander un devis aux transitaires cochés</button>
              </div>
              <p className="text-xs text-slate-500">
                Estimations calculées à partir des tarifs vérifiés publiés par les transitaires. Le prix définitif est celui du devis du transitaire. Les offres sponsorisées n&apos;existent pas sur Neam Transit : le classement dépend uniquement du critère choisi.
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
