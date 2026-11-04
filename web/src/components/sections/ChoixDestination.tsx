"use client";
import Link from "@/components/ui/Link";
import { ArrowRight, Info, ShieldCheck } from "lucide-react";
import { Drapeau } from "@/components/ui/Drapeau";
import { useDestination } from "@/components/ui/Destination";
import { DESTINATIONS_ACTIVES, DESTINATIONS_BIENTOT } from "@/lib/data";

/** Accueil (maquettes « destinations », écran 1) : « Où veux-tu étudier ? », pays actifs et pays à venir. */
export function ChoixDestination() {
  const { destination, choisie, setDestination } = useDestination();
  if (DESTINATIONS_ACTIVES.length < 2) return null;
  return (
    <section className="container mb-10 mt-10">
      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-ink-mute">Où veux-tu étudier ?</p>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        {DESTINATIONS_ACTIVES.map((d) => {
          const actif = choisie && destination === d.code;
          const villes = d.villes.slice(0, 3).map((v) => v.nom).join(", ");
          const labels = [d.labels.reconnu_etat?.libelle, d.labels.diplomes_homologues?.libelle].filter(Boolean).join(" · ");
          return (
            <div key={d.code} className={`card flex items-center gap-4 rounded-[22px] p-5 transition ${actif ? "ring-2 ring-brand-600" : ""}`}>
              <Drapeau code={d.code} taille={34} />
              <div className="min-w-0 flex-1">
                <b className="text-[19px]">{d.nom}</b>
                <p className="mt-0.5 text-[13px] text-ink-mute">{d.etablissements} établissements privés · {villes}</p>
                {labels && <p className="mt-1.5 flex items-start gap-1 text-[12.5px] font-bold text-[#0f8a46]"><ShieldCheck size={13} className="mt-0.5 shrink-0" /><span>Labels : {labels}</span></p>}
              </div>
              <Link href={`/etablissements/?pays=${d.code}`} onClick={() => setDestination(d.code)} className={`${actif ? "btn-primary" : "btn-ghost"} shrink-0 px-4 py-2.5`}>Explorer<ArrowRight size={15} /></Link>
            </div>
          );
        })}
      </div>
      {DESTINATIONS_BIENTOT.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-ink-mute">Prochaines destinations :</span>
          {DESTINATIONS_BIENTOT.map((d) => <span key={d.code} className="chip border border-dashed border-[#c9d2e6] bg-white px-3 py-1.5 text-[12.5px] text-ink-soft"><Drapeau code={d.code} taille={12} />{d.nom} · bientôt</span>)}
        </div>
      )}
      <p className="mt-4 flex items-start gap-1.5 text-[13px] text-ink-mute"><Info size={14} className="mt-0.5 shrink-0" />Le choix est mémorisé : formations, écoles, comparateur, devis et Navi s&apos;adaptent à la destination. Tu peux aussi tout voir, tous pays confondus.</p>
    </section>
  );
}
