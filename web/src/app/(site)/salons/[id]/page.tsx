import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Radio, Users } from "lucide-react";
import Link from "@/components/ui/Link";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { InscriptionSalon } from "@/components/sections/Salons";
import { salonPublic } from "@/server/services/salons";
import { filAriane } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const revalidate = 300;
async function lire(id: string) { try { return await salonPublic(id); } catch { return null; } }
const date = (d: Date) => new Date(d).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Libreville" });
const heure = (d: Date) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Libreville" });

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const s = await lire((await props.params).id);
  if (!s) return { title: "Salon introuvable" };
  const ecole = s.ecole.sigle ?? s.ecole.nom;
  return { title: `${s.titre} : salon virtuel ${ecole}`.slice(0, 60), description: `${ecole} présente ses formations en direct le ${date(s.debut)}. Inscription gratuite avec ton compte Navigoal, questions en direct.`.slice(0, 160), alternates: { canonical: `/salons/${s.id}/` } };
}

export default async function SalonPage(props: { params: Promise<{ id: string }> }) {
  const s = await lire((await props.params).id);
  if (!s) notFound();
  const ecole = s.ecole.sigle ?? s.ecole.nom;
  const ld = { "@context": "https://schema.org", "@type": "Event", name: s.titre, description: s.description || `Salon virtuel de ${ecole}`, startDate: new Date(s.debut).toISOString(), endDate: new Date(new Date(s.debut).getTime() + s.dureeMin * 60e3).toISOString(), eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled", location: { "@type": "VirtualLocation", url: `${SITE_URL}/salons/${s.id}/` }, organizer: { "@type": "EducationalOrganization", name: s.ecole.nom, url: `${SITE_URL}/etablissements/${s.ecole.id}/` }, isAccessibleForFree: true };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(filAriane(SITE_URL, [["Salons virtuels", "/salons/"], [s.titre, `/salons/${s.id}/`]])).replace(/</g, "\\u003c") }} />
      <section className="bg-gradient-to-br from-brand-950 to-brand-600 py-10 text-white sm:py-14">
        <div className="container grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="flex flex-col gap-4">
            <nav className="text-[13px] text-white/70"><Link href="/salons/" className="hover:text-white">Salons virtuels</Link></nav>
            <span className="chip w-fit bg-white/15 text-white"><Radio size={13} />Salon virtuel en direct · gratuit</span>
            <Link href={`/etablissements/${s.ecole.id}/`} className="flex items-center gap-3">{s.ecole.logo && <EtabLogo e={{ logo: s.ecole.logo, sigle: ecole, nom: s.ecole.nom }} size={52} className="bg-white" />}<span><b className="block">{ecole}</b><span className="text-sm text-white/80">{s.ecole.nom}</span></span></Link>
            <h1 className="text-[34px] font-extrabold leading-tight sm:text-[46px]">{s.titre}</h1>
            {s.description && <p className="max-w-2xl whitespace-pre-line text-white/90">{s.description}</p>}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2 first-letter:uppercase"><CalendarDays size={17} className="text-sun-400" />{date(s.debut)}</span>
              <span className="flex items-center gap-2"><Clock size={17} className="text-sun-400" />{heure(s.debut)} · {s.dureeMin} min (heure de Libreville)</span>
              <span className="flex items-center gap-2"><Users size={17} className="text-sun-400" />{s.inscrits} inscrits · {s.placesRestantes} places</span>
            </div>
          </div>
          <div className="rounded-[22px] bg-white p-5 text-ink">
            <b className="text-lg">Réserve ta place</b>
            <p className="mb-4 mt-1 text-xs text-ink-mute">Tu reçois le lien, un rappel le matin et 15 minutes avant.</p>
            <InscriptionSalon id={s.id} ecole={ecole} />
            <p className="mt-4 text-xs text-ink-mute">Micro et caméra coupés pour les participants · questions par écrit · aucun enregistrement.</p>
          </div>
        </div>
      </section>
      <div className="container grid gap-5 py-10 md:grid-cols-3">
        {!!s.programme.length && <section className="card p-5"><h2 className="font-extrabold">Programme</h2><ul className="mt-3 flex flex-col gap-2 text-sm">{s.programme.map((p, i) => <li key={i} className="flex gap-3"><b className="w-12 shrink-0">{p.heure}</b><span className="text-ink-soft">{p.texte}</span></li>)}</ul></section>}
        {!!s.presentateurs.length && <section className="card p-5"><h2 className="font-extrabold">Présentateurs</h2><ul className="mt-3 flex flex-col gap-3 text-sm">{s.presentateurs.map((p, i) => <li key={i}><b>{p.nom}</b>{p.role && <span className="block text-ink-mute">{p.role}</span>}</li>)}</ul></section>}
        <section className="card p-5"><h2 className="font-extrabold">L&apos;école</h2><p className="mt-3 text-sm text-ink-soft">{s.ecole.nom}{s.ecole.ville ? `, ${s.ecole.ville}` : ""}.</p><Link href={`/etablissements/${s.ecole.id}/`} className="mt-3 inline-block text-sm font-bold text-brand-600">Voir la fiche de l&apos;école</Link></section>
      </div>
    </>
  );
}
