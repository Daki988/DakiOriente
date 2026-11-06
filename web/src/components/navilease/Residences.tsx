import Link from "@/components/ui/Link";
import { ArrowRight, ExternalLink, GraduationCap, Info, MapPin } from "lucide-react";
import { Prix } from "@/components/ui/Devise";
import { domaine, reservee, residencesEtudiantes, VILLES_RESIDENCES, type Residence } from "@/lib/residences";

/* eslint-disable @next/next/no-img-element */

/** Mention « Réservation sur … » : la résidence se réserve sur son site officiel. */
export function ChipOfficiel({ r, petit = false }: { r: Residence; petit?: boolean }) {
  return <span className={`chip bg-brand-50 text-brand-700 ${petit ? "text-[11px]" : "text-[12px]"}`}><ExternalLink size={12} />Réservation sur {domaine(r.reservation.url)}</span>;
}

/** Carte d'une résidence universitaire (maquettes « residences », écrans 1 et 2). */
export function ResidenceCarte({ r }: { r: Residence }) {
  const p = r.photos[0];
  return (
    <Link href={`/navilease/residences/${r.id}/`} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative h-44 overflow-hidden bg-[#e8edfa]">
        {p && <img src={p.src} alt={`${r.nom} : photo de la résidence`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
        {r.statut && <span className="chip absolute left-2.5 top-2.5 bg-[#d42a50] text-white">{r.statut}</span>}
        {r.photos.length > 1 && <span className="chip absolute bottom-2.5 right-2.5 bg-ink/70 text-white backdrop-blur">{r.photos.length} photos</span>}
        <span className="chip absolute bottom-2.5 left-2.5 bg-ink/70 text-white backdrop-blur"><MapPin size={12} />{r.ville}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <b className="text-[16px] leading-snug">{r.nom}</b>
        <span className="text-xs text-ink-mute">{r.operateur}</span>
        <div className="flex flex-wrap gap-1.5"><ChipOfficiel r={r} petit />{reservee(r) && <span className="chip bg-[#f1edff] text-[11px] text-[#6a3df0]"><GraduationCap size={12} />Étudiants UM6SS</span>}</div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#eef1f8] pt-3">
          <span className="text-xs text-ink-mute">{r.capacite_lits ? `${r.capacite_lits.toLocaleString("fr-FR")} lits` : r.nb_logements ? `${r.nb_logements} logements` : ""}</span>
          {r.a_partir_de != null && <span className="text-right text-xs text-ink-mute">à partir de <b className="text-[17px] text-ink"><Prix mad={r.a_partir_de} bloc /></b> par mois</span>}
        </div>
      </div>
    </Link>
  );
}

/** Rangée « Résidences universitaires » de l'accueil Navilease. */
export function RangeeResidences() {
  const n = residencesEtudiantes.length;
  const min = Math.min(...residencesEtudiantes.map((r) => r.a_partir_de ?? Infinity));
  // Une résidence par opérateur d'abord, ouvertes à tous, pour la variété
  const vus = new Set<string>();
  const ouvertes = residencesEtudiantes.filter((r) => !reservee(r) && !r.statut);
  const premieres = ouvertes.filter((r) => !vus.has(r.operateur) && vus.add(r.operateur));
  const choix = [...premieres, ...ouvertes.filter((r) => !premieres.includes(r))].slice(0, 4);
  return (
    <section id="residences" className="container mt-12 flex scroll-mt-24 flex-col gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-[#a55a00]">Résidences universitaires</span>
          <h2 className="h-section mt-2">{n} résidences dans {VILLES_RESIDENCES.length} villes, dès {min.toLocaleString("fr-FR")} DH par mois</h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-mute"><Info size={14} className="mt-0.5 shrink-0" />Prix et conditions relevés sur les sites officiels. Tu réserves directement auprès de la résidence.</p>
        </div>
        <Link href="/navilease/residences/" className="btn-ghost shrink-0 self-start sm:self-auto">Voir toutes les résidences <ArrowRight size={16} /></Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{choix.map((r) => <ResidenceCarte key={r.id} r={r} />)}</div>
    </section>
  );
}
