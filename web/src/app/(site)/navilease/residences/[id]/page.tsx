import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/ui/Link";
import { ArrowRight, CalendarDays, Check, ChevronRight, ExternalLink, GraduationCap, Info, Mail, MapPin, Phone, Users } from "lucide-react";
import { Prix } from "@/components/ui/Devise";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { ChipOfficiel, ResidenceCarte } from "@/components/navilease/Residences";
import { GalerieResidence } from "@/components/navilease/GalerieResidence";
import { etabById } from "@/lib/data";
import { dateVerif, domaine, lienOfficiel, reservee, residenceById, residencesEtudiantes } from "@/lib/residences";
import { SITE_URL } from "@/lib/site";

/* eslint-disable @next/next/no-img-element */

export const generateStaticParams = () => residencesEtudiantes.map((r) => ({ id: r.id }));
export const dynamicParams = false;
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => {
  const r = residenceById[params.id];
  if (!r) return {};
  const title = `${r.nom} (${r.ville}) : loyers et réservation`;
  const description = `${r.nom}, résidence étudiante à ${r.ville}${r.a_partir_de ? ` dès ${r.a_partir_de.toLocaleString("fr-FR")} DH par mois` : ""} : photos, logements, services inclus et réservation sur ${domaine(r.reservation.url)}.`;
  return { title, description, alternates: { canonical: `/navilease/residences/${r.id}/` }, openGraph: { title, description, images: r.photos[0] ? [r.photos[0].src] : undefined } };
};

/** Fiche résidence (maquettes « residences », écrans 3 à 5) : la réservation se fait sur le site officiel. */
export default function ResidencePage({ params }: { params: { id: string } }) {
  const r = residenceById[params.id];
  if (!r) notFound();
  const lien = lienOfficiel(r.reservation.url);
  const autres = residencesEtudiantes.filter((x) => x.id !== r.id && x.ville === r.ville).slice(0, 3);
  const ecoles = r.etablissements.map((id) => etabById[id]).filter(Boolean);
  const ph = r.photos;
  const ld = {
    "@context": "https://schema.org", "@type": "LodgingBusiness", name: r.nom, url: `${SITE_URL}/navilease/residences/${r.id}/`, sameAs: [r.site_web],
    image: ph.map((p) => `${SITE_URL}${p.src}`), address: { "@type": "PostalAddress", streetAddress: r.adresse, addressLocality: r.ville, addressCountry: "MA" },
    ...(r.a_partir_de ? { priceRange: `À partir de ${r.a_partir_de} MAD par mois` } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="container flex flex-col gap-5 pb-24 pt-7 lg:pb-0">
        <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/navilease">Navilease</Link><ChevronRight size={14} /><Link href="/navilease/residences/">Résidences</Link><ChevronRight size={14} /><Link href={`/navilease/residences/?ville=${encodeURIComponent(r.ville)}`}>{r.ville}</Link><ChevronRight size={14} /><span>{r.nom}</span></nav>
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0"><h1 className="text-3xl font-extrabold tracking-tight sm:text-[40px]">{r.nom}</h1>
            <p className="mt-1 flex items-start gap-1.5 text-ink-soft"><MapPin size={16} className="mt-1 shrink-0" />{r.adresse}, {r.ville} · {r.operateur}</p></div>
          <div className="flex flex-wrap gap-2">{r.statut && <span className="chip bg-[#ffecef] text-[#d42a50]">{r.statut}</span>}{reservee(r) && <span className="chip bg-[#f1edff] text-[#6a3df0]"><GraduationCap size={13} />Étudiants UM6SS</span>}<ChipOfficiel r={r} /></div>
        </div>

        <GalerieResidence photos={ph} nom={r.nom} />
        <p className="-mt-3 text-xs text-ink-mute">{ph.length} photo{ph.length > 1 ? "s" : ""} : {r.photos[0]?.credit ?? r.operateur} (site officiel). Navigoal n&apos;en est pas propriétaire ; retrait sur simple demande.</p>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex min-w-0 flex-col gap-7">
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold">Logements et loyers</h2>
              <div className="card overflow-x-auto p-1.5">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead><tr className="text-xs uppercase tracking-wide text-ink-mute"><th className="p-3">Logement</th><th className="p-3">Surface</th><th className="p-3">Loyer</th>{r.logements.some((l) => l.partage) && <th className="p-3">À deux</th>}</tr></thead>
                  <tbody>{r.logements.map((l) => (
                    <tr key={l.type} className="border-t border-[#eef1f8]">
                      <td className="p-3 font-bold">{l.type}</td><td className="p-3 text-ink-mute">{l.surface ?? "—"}</td>
                      <td className="p-3">{l.loyer_min != null ? <><b><Prix mad={l.loyer_min} /></b> <span className="text-xs text-ink-mute">{l.unite}</span></> : <span className="text-ink-mute">Tarif sur demande</span>}</td>
                      {r.logements.some((x) => x.partage) && <td className="p-3 text-ink-soft">{l.partage ? <><Prix mad={l.partage} /> <span className="text-xs text-ink-mute">par personne</span></> : "—"}</td>}
                    </tr>))}</tbody>
                </table>
              </div>
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold">Compris dans le loyer</h2>
              <div className="flex flex-wrap gap-2">{r.inclus.map((t) => <span key={t} className="chip bg-[#e8f8ef] py-1.5 text-[#0f8a46]"><Check size={13} />{t}</span>)}</div>
            </section>
            {(r.proximite.length > 0 || ecoles.length > 0) && (
              <section className="flex flex-col gap-3">
                <h2 className="text-xl font-extrabold">À proximité</h2>
                {r.proximite.length > 0 && <p className="text-sm text-ink-soft">{r.proximite.join(" · ")}</p>}
                {ecoles.length > 0 && <div className="flex flex-wrap gap-3">{ecoles.map((e) => <Link key={e.id} href={`/etablissements/${e.id}/`} className="card flex items-center gap-3 p-3 transition hover:shadow-lift"><EtabLogo e={e} size={40} /><span className="text-sm font-bold">{e.nom}</span><ArrowRight size={15} className="text-brand-600" /></Link>)}</div>}
              </section>
            )}
            <section className="flex flex-col gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-soft">
              <b className="text-ink">Conditions</b>
              <span className="flex items-start gap-2"><Users size={15} className="mt-0.5 shrink-0" />{r.public}</span>
              {r.ouverture && <span className="flex items-start gap-2"><CalendarDays size={15} className="mt-0.5 shrink-0" />{r.ouverture}</span>}
              {r.duree && <span className="flex items-start gap-2"><CalendarDays size={15} className="mt-0.5 shrink-0" />{r.duree}</span>}
              {r.reservation.note && <span className="flex items-start gap-2"><Info size={15} className="mt-0.5 shrink-0" />{r.reservation.note}</span>}
            </section>
            <p className="text-xs text-ink-mute">Sources : {r.sources.map((s, k) => <span key={s}>{k ? ", " : ""}<a href={s} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">{domaine(s)}</a></span>)} · vérifié le {dateVerif(r.date_verification)} · <a href={`mailto:contact@navigoal.net?subject=${encodeURIComponent(`Correction : ${r.nom}`)}`} className="font-bold text-brand-600">signaler une information à corriger</a></p>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="card flex flex-col gap-2 rounded-3xl p-5 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]">
              {r.a_partir_de != null ? <><span className="text-sm text-ink-mute">À partir de</span><b className="text-[28px] leading-tight"><Prix mad={r.a_partir_de} suffixe=" / mois" bloc /></b></> : <b>Tarif sur demande</b>}
              {r.frais.map((f) => <span key={f.libelle} className="text-sm">{f.libelle} : <b><Prix mad={f.montant} /></b></span>)}
              {r.duree && <span className="flex items-center gap-1.5 text-sm text-ink-soft"><CalendarDays size={14} />{r.duree}</span>}
              <a href={lien} target="_blank" rel="noopener noreferrer" className="btn-primary btn-shine mt-2 w-full">{r.reservation.libelle}<ExternalLink size={16} /></a>
              <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-mute"><Info size={13} className="mt-0.5 shrink-0" />La réservation et le paiement se font sur le site officiel de la résidence. Navilease ne perçoit aucun paiement pour cette résidence.</p>
            </div>
            {r.contact && <div className="card flex flex-col gap-1.5 p-5 text-sm"><b>Contact de la résidence</b><a href={`tel:${r.contact.telephone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-brand-600"><Phone size={14} />{r.contact.telephone}</a><a href={`mailto:${r.contact.email}`} className="flex items-center gap-1.5 hover:text-brand-600"><Mail size={14} />{r.contact.email}</a></div>}
            <a href={r.site_web} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-brand-600">Site officiel <ExternalLink size={14} /></a>
          </aside>
        </div>

        {autres.length > 0 && (
          <section className="mt-6 flex flex-col gap-4">
            <h2 className="text-xl font-extrabold">{r.statut ? `Autres résidences à ${r.ville}` : `Aussi à ${r.ville}`}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{autres.map((x) => <ResidenceCarte key={x.id} r={x} />)}</div>
          </section>
        )}
      </div>
      {/* Téléphone : bouton de réservation fixé en bas (maquette, écran 4) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        {r.a_partir_de != null && <span className="text-sm text-ink-mute">dès <b className="text-base text-ink"><Prix mad={r.a_partir_de} /></b></span>}
        <a href={lien} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 py-2.5">Réserver <ExternalLink size={15} /></a>
      </div>
    </>
  );
}
