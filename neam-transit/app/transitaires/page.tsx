import type { Metadata } from "next";
import Link from "next/link";
import { listTransitaires, offresDe, statsTransitaires } from "@/lib/queries";
import { MODES, PAYS, type PaysCode } from "@/lib/referentiel";
import { Badges, NoteCourte, PastilleDemo, PastilleVerifie } from "@/components/ui";

export const metadata: Metadata = { title: "Transitaires vérifiés" };

export default function Transitaires() {
  const ts = listTransitaires("verifie");
  const stats = statsTransitaires(ts.map((t) => t.id));
  return (
    <div className="conteneur py-8">
      <h1 className="titre-page">Transitaires vérifiés</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Seuls les transitaires dont les documents ont été contrôlés par Neam Transit apparaissent ici.
      </p>
      {ts.length === 0 ? (
        <div className="carte mt-6 p-8 text-center text-slate-600">Aucun transitaire vérifié pour le moment. Les premiers référencements sont en cours de vérification.</div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {ts.map((t) => {
            const offres = offresDe(t.id);
            const pays = [...new Set(offres.map((o) => o.origine_pays))] as PaysCode[];
            const modes = [...new Set(offres.map((o) => MODES[o.mode].court))];
            const s = stats.get(t.id)!;
            return (
              <li key={t.id} className="carte flex flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-marine-900">
                    <Link href={`/transitaires/${t.slug}`} className="hover:underline">{t.nom}</Link>
                  </h2>
                  <PastilleVerifie />
                  {t.demo && <PastilleDemo />}
                </div>
                <div className="mt-1"><NoteCourte stats={s} /></div>
                <p className="mt-2 text-sm text-slate-700">
                  Agence : {t.ville} · Départs : {pays.map((p) => `${PAYS[p].drapeau} ${PAYS[p].nom}`).join(", ") || "—"}
                </p>
                <p className="text-sm text-slate-600">Modes : {modes.join(", ") || "—"}</p>
                <div className="mt-3"><Badges badges={t.badges} delaisTenus={s.delaisTenus} /></div>
                <Link href={`/transitaires/${t.slug}`} className="btn-contour mt-4 self-start">Voir la fiche</Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
