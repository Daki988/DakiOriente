import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Building2, Bus, ChevronRight, GraduationCap, KeyRound, Lightbulb, MapPin, Plane, ShieldCheck, TrainFront, Wallet } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { LabelChip, domStyle } from "@/components/ui/Cards";
import { Prix } from "@/components/ui/Devise";
import { VILLES, norm, villeBySlug, villeHref, type VilleInfo } from "@/lib/catalogue";
import { COUTS } from "@/lib/devis";
import { domaineById, labelById, mobilite, paysDetailById, type Etablissement, type Label } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export const generateStaticParams = () => VILLES.map((v) => ({ slug: v.slug }));
export const dynamicParams = false;

const PROFILS = Object.fromEntries(paysDetailById.MA.villes.map((v) => [norm(v.nom).replace(/[^a-z]/g, ""), v.profil]));
const cle = (v: string) => norm(v).replace(/[^a-z]/g, "");

function resume(v: VilleInfo) {
  const nf = new Set(v.offres.map((o) => o.f.id)).size;
  const reconnus = v.etabs.filter((e) => campusDe(e, v.nom).label === "reconnu_etat").length;
  return { nf, reconnus };
}

/** Campus de l'établissement dans la ville (adresse, quartier, label propres au campus). */
function campusDe(e: Etablissement, ville: string): { label: Label; adresse: string | null; quartier: string | null } {
  const c = e.campus?.find((x) => x.ville === ville);
  return c ? { label: c.label, adresse: c.adresse, quartier: c.geo?.quartier ?? null } : { label: e.label, adresse: e.adresse, quartier: e.geo?.quartier ?? null };
}

export const generateMetadata = ({ params }: { params: { slug: string } }): Metadata => {
  const v = villeBySlug[params.slug];
  if (!v) return {};
  const { nf } = resume(v);
  const title = `Étudier à ${v.nom} : écoles, formations, logement et coût de la vie`;
  const description = `${v.etabs.length} établissement${v.etabs.length > 1 ? "s" : ""} privé${v.etabs.length > 1 ? "s" : ""} et ${nf} formation${nf > 1 ? "s" : ""} à ${v.nom} (Maroc) : campus, quartiers étudiants, transports, budget mensuel en dirhams et logement étudiant Navilease.`;
  return { title, description, alternates: { canonical: villeHref(v.nom) }, openGraph: { title, description, images: v.photo ? [v.photo.src] : undefined } };
};

export default function VillePage({ params }: { params: { slug: string } }) {
  const v = villeBySlug[params.slug];
  if (!v) notFound();
  const M = mobilite[v.nom];
  const { nf, reconnus } = resume(v);
  const C = COUTS.MA;
  const chere = C.vie_mensuelle.villes_cheres.some((x) => cle(x) === cle(v.nom));
  const vie = C.vie_mensuelle[chere ? "ville_chere" : "autre_ville"];
  const B = paysDetailById.MA.budget;
  const quartiersCampus = Array.from(new Set(v.etabs.map((e) => campusDe(e, v.nom).quartier).filter(Boolean) as string[]));
  // Formations disponibles, regroupées par domaine
  const parFormation = new Map<string, { f: VilleInfo["offres"][number]["f"]; n: number }>();
  for (const o of v.offres) parFormation.set(o.f.id, { f: o.f, n: (parFormation.get(o.f.id)?.n ?? 0) + 1 });
  const parDomaine = Array.from(parFormation.values()).reduce<Record<string, { f: VilleInfo["offres"][number]["f"]; n: number }[]>>((a, x) => ((a[x.f.domaine] ??= []).push(x), a), {});
  const domainesTries = Object.entries(parDomaine).sort((a, b) => b[1].length - a[1].length);
  const etabs = [...v.etabs].sort((a, b) => Number(campusDe(b, v.nom).label === "reconnu_etat") - Number(campusDe(a, v.nom).label === "reconnu_etat") || b.filieres.length - a.filieres.length);
  const autres = VILLES.filter((x) => x.slug !== v.slug).slice(0, 8);
  const profil = PROFILS[cle(v.nom)];
  const ld = {
    "@context": "https://schema.org", "@type": "City", name: v.nom, containedInPlace: { "@type": "Country", name: "Maroc" }, url: `${SITE_URL}${villeHref(v.nom)}`,
    containsPlace: etabs.map((e) => ({ "@type": e.type === "universite" ? "CollegeOrUniversity" : "EducationalOrganization", name: e.nom, url: `${SITE_URL}/etablissements/${e.id}/`, address: { "@type": "PostalAddress", addressLocality: v.nom, addressCountry: "MA", streetAddress: campusDe(e, v.nom).adresse ?? undefined } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="relative overflow-hidden bg-brand-950 text-white">
        {v.photo && <Image src={v.photo.src} alt={`Vue de ${v.nom}`} fill priority sizes="100vw" className="object-cover opacity-45" />}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-950/20" />
        <div className="container relative flex flex-col gap-4 pb-12 pt-8 sm:pb-16">
          <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/80" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/villes">Villes</Link><ChevronRight size={14} /><span className="text-white">{v.nom}</span></nav>
          <h1 className="h-display">Étudier à <span className="text-sun-400">{v.nom}</span></h1>
          <p className="max-w-2xl text-lg text-[#d6e0ff]">{profil ?? `${v.nom} accueille ${v.etabs.length} établissement${v.etabs.length > 1 ? "s" : ""} privé${v.etabs.length > 1 ? "s" : ""} référencé${v.etabs.length > 1 ? "s" : ""} sur Navigoal.`}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/formations/?ville=${encodeURIComponent(v.nom)}`} className="btn-sun">Formations à {v.nom} <ArrowRight size={17} /></Link>
            <Link href={`/navilease/logements/?ville=${encodeURIComponent(v.nom)}`} className="btn border border-white/30 text-white hover:bg-white/10"><KeyRound size={16} /> Se loger</Link>
          </div>
          {v.photo && <span className="text-[11px] text-white/60">Photo : {v.photo.credit}{v.photo.licence ? ` · ${v.photo.licence}` : ""}</span>}
        </div>
      </section>

      <div className="container relative -mt-6">
        <Reveal className="card grid grid-cols-2 gap-5 rounded-[22px] p-5 sm:grid-cols-4 sm:p-6">
          {([["Établissements", v.etabs.length], ["Reconnus par l'État", reconnus], ["Formations proposées", nf], ["Offres (formation × école)", v.offres.length]] as const).map(([a, b]) => <div key={a} className="flex flex-col gap-0.5"><b className="text-2xl font-extrabold text-brand-700 sm:text-[28px]">{b}</b><span className="text-xs font-semibold text-ink-mute">{a}</span></div>)}
        </Reveal>
      </div>

      <div className="container mt-12 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-12">
          <section id="etablissements" className="flex scroll-mt-28 flex-col gap-4">
            <div><h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Établissements et campus à {v.nom}</h2><p className="text-ink-mute">Label du campus, quartier et adresse. Les réseaux présents dans plusieurs villes ont un campus ici.</p></div>
            <Stagger className="grid gap-4 sm:grid-cols-2">
              {etabs.slice(0, 12).map((e) => {
                const c = campusDe(e, v.nom);
                const n = v.offres.filter((o) => o.e.id === e.id).length;
                return (
                  <StaggerItem key={e.id}>
                    <Link href={`/etablissements/${e.id}/#campus`} className="card group flex h-full flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                      <div className="flex items-center gap-3"><EtabLogo e={e} size={52} /><span className="min-w-0"><b className="line-clamp-2 leading-snug">{e.nom}</b><span className="text-xs text-ink-mute">{e.type_libelle}{e.campus ? ` · campus de ${v.nom}` : ""}</span></span></div>
                      <div className="flex flex-wrap gap-1.5"><LabelChip label={c.label} court />{n > 0 && <span className="chip bg-brand-50 text-brand-700"><GraduationCap size={12} />{n} formation{n > 1 ? "s" : ""}</span>}</div>
                      {(c.quartier || c.adresse) && <p className="flex items-start gap-1.5 text-[13px] text-ink-soft"><MapPin size={14} className="mt-0.5 shrink-0 text-brand-600" /><span>{c.quartier && <b className="text-ink">{c.quartier}</b>}{c.quartier && c.adresse ? " · " : ""}{c.adresse}</span></p>}
                      <span className="mt-auto text-[13px] font-bold text-brand-600">Voir la fiche →</span>
                    </Link>
                  </StaggerItem>
                );
              })}
            </Stagger>
            {etabs.length > 12 && <Link href={`/etablissements/?ville=${encodeURIComponent(v.nom)}`} className="btn-ghost self-start">Voir les {etabs.length} établissements de {v.nom} <ArrowRight size={16} /></Link>}
          </section>

          <section id="formations" className="flex scroll-mt-28 flex-col gap-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Formations disponibles</h2><p className="text-ink-mute">{nf} formations proposées à {v.nom}, par domaine (nombre d&apos;établissements entre parenthèses).</p></div><Link href={`/formations/?ville=${encodeURIComponent(v.nom)}`} className="flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-brand-600">Rechercher <ArrowRight size={15} /></Link></div>
            <div className="grid gap-4 md:grid-cols-2">
              {domainesTries.map(([d, fs]) => {
                const s = domStyle(d);
                const I = s.icon;
                return (
                  <div key={d} className="card flex flex-col gap-2.5 p-4">
                    <b className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: s.bg, color: s.fg }}><I size={16} /></span>{domaineById[d]?.libelle.split(",")[0]}</b>
                    <ul className="flex flex-col gap-1">{fs.sort((a, b) => b.n - a.n).map(({ f, n }) => <li key={f.id}><Link href={`/formations/${f.id}/`} className="flex min-h-[32px] items-center justify-between gap-2 text-sm text-ink-soft hover:text-brand-600"><span>{f.intitule}</span><span className="shrink-0 text-xs text-ink-mute">({n})</span></Link></li>)}</ul>
                  </div>
                );
              })}
            </div>
          </section>

          {M && (
            <section id="transports" className="flex scroll-mt-28 flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Se déplacer à {v.nom}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="card flex flex-col gap-2 p-4"><b className="flex items-center gap-2"><Bus size={18} className="text-brand-600" />Réseaux</b><ul className="flex flex-col gap-1 text-sm text-ink-soft">{M.reseaux.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div className="card flex flex-col gap-2 p-4"><b className="flex items-center gap-2"><TrainFront size={18} className="text-brand-600" />Gares</b><ul className="flex flex-col gap-1 text-sm text-ink-soft">{M.gares.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div className="card flex flex-col gap-2 p-4"><b className="flex items-center gap-2"><Plane size={18} className="text-brand-600" />Aéroport</b><p className="text-sm text-ink-soft">{M.aeroport}</p></div>
              </div>
              <p className="flex items-start gap-2 rounded-2xl bg-sun-50 p-4 text-sm text-[#8a5a00]"><Lightbulb size={18} className="mt-0.5 shrink-0" />{M.conseil}</p>
            </section>
          )}

          <section id="quartiers" className="flex scroll-mt-28 flex-col gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Quartiers étudiants</h2>
            {M && <div className="flex flex-wrap gap-2">{M.quartiers_etudiants.map((q) => <span key={q} className="chip bg-brand-50 px-3 py-1.5 text-sm text-brand-700">{q}</span>)}</div>}
            {quartiersCampus.length > 0 && <p className="text-sm text-ink-soft"><b className="text-ink">Quartiers des campus :</b> {quartiersCampus.join(", ")}.</p>}
            <p className="text-xs text-ink-mute">Quartiers des campus d&apos;après OpenStreetMap (© contributeurs OSM).</p>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="card flex flex-col gap-3 rounded-[22px] p-5">
            <b className="flex items-center gap-2 text-lg"><Wallet size={19} className="text-brand-600" />Coût de la vie</b>
            <div className="rounded-2xl bg-brand-50 p-3"><span className="text-xs text-ink-mute">Budget mensuel estimé à {v.nom}</span><b className="block text-lg text-brand-700"><Prix mad={vie.min} /> – <Prix mad={vie.max} suffixe="/mois" /></b><span className="text-xs text-ink-mute">{chere ? "Ville parmi les plus chères du Maroc." : "Ville plus abordable que Casablanca et Rabat."}</span></div>
            {B.lignes.map((l) => <div key={l.poste} className="flex justify-between gap-3 text-sm"><span className="text-ink-soft">{l.poste}</span><b className="shrink-0 text-right"><Prix mad={l.min} bloc /> – <Prix mad={l.max} bloc /></b></div>)}
            <span className="text-xs text-ink-mute">Fourchettes nationales par mois. {B.note}</span>
            <Link href="/devis" className="btn-ghost py-2.5">Calculer le coût total des études</Link>
          </div>
          <div className="card flex flex-col gap-2.5 bg-gradient-to-br from-white to-[#fff7dd] p-5">
            <div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Logement Navilease à {v.nom}</b></div>
            <p className="text-[13px] text-ink-soft">Studios, colocations et résidences près des campus. Bailleurs vérifiés et paiement protégé en séquestre.</p>
            <Link href={`/navilease/logements/?ville=${encodeURIComponent(v.nom)}`} className="btn-primary py-2.5">Voir les logements</Link>
            <span className="flex items-center gap-1.5 text-xs text-ink-mute"><ShieldCheck size={13} />Ne payez jamais en dehors de Navilease.</span>
          </div>
          <div className="card flex flex-col gap-2 p-5">
            <b>Autres villes étudiantes</b>
            <div className="flex flex-wrap gap-1.5">{autres.map((x) => <Link key={x.slug} href={villeHref(x.nom)} className="chip min-h-[32px] border border-slate-200 bg-white px-3 text-ink-soft hover:border-brand-300">{x.nom} <span className="text-ink-mute">({x.etabs.length})</span></Link>)}</div>
            <Link href="/villes" className="text-[13px] font-bold text-brand-600">Toutes les villes →</Link>
          </div>
          <div className="card flex flex-col gap-1.5 p-5 text-sm">
            <b className="flex items-center gap-2"><Building2 size={17} className="text-brand-600" />Labels à {v.nom}</b>
            {(["reconnu_etat", "diplomes_homologues", "professionnel", "autorise"] as Label[]).map((l) => { const n = v.etabs.filter((e) => campusDe(e, v.nom).label === l).length; return n ? <span key={l} className="flex justify-between text-ink-soft"><span>{labelById[l].libelle}</span><b className="text-ink">{n}</b></span> : null; })}
            <Link href="/ressources/labels-reconnaissance-etat/" className="text-[13px] font-bold text-brand-600">Comprendre les labels →</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
