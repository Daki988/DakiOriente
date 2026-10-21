import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ArrowRight, BadgeCheck, Bus, Check, GraduationCap, Mail, Phone, Sparkles, Calculator, ChevronRight, ExternalLink, KeyRound, MapPin, Plane, Scale, ShieldAlert, TrainFront, TramFront } from "lucide-react";
import { permanentRedirect } from "next/navigation";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { STATUT_LONG, mobilite, villesOf, type Campus, type Etablissement, domaineById, etabById, etablissements, fmt, labelById, metierById, niveauLabel, paysDetailById, residences, formationById, type Filiere } from "@/lib/data";
import { LabelChip } from "@/components/ui/Cards";
import { Prix } from "@/components/ui/Devise";
import { villeHref } from "@/lib/catalogue";
import { COUTS, devis, formationParDefaut } from "@/lib/devis";
import { establishmentLive } from "@/server/content-ui";

export const generateStaticParams = () => etablissements.map((e) => ({ id: e.id }));
export const revalidate = 300; // reflète les mises à jour faites par l'établissement
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => {
  const e = etabById[params.id];
  if (!e) return {};
  const villes = villesOf(e);
  const nb = e.filieres.length + e.filieres_echues.length;
  const title = `${e.sigle && !e.nom.startsWith(e.sigle) ? `${e.sigle} – ` : ""}${e.nom} : formations, frais et admission à ${villes.join(", ")}`;
  const description = `${e.nom} (${villes.join(", ")}, Maroc) · ${labelById[e.label]?.libelle}. ${nb ? `${nb} filière${nb > 1 ? "s" : ""}` : "Programmes"}, débouchés, frais de scolarité, quartier, transports et logement étudiant. Candidature en ligne pour les étudiants de toute l'Afrique.`;
  const image = e.photos[0]?.src ?? e.logo ?? undefined;
  return { title, description, alternates: { canonical: `/etablissements/${e.id}/` }, openGraph: { title, description, type: "website", images: image ? [image] : undefined } };
};

const m = (d: number) => (d < 1000 ? `${Math.round(d / 10) * 10} m` : `${(d / 1000).toFixed(1).replace(".", ",")} km`);
const aPied = (d: number) => `${Math.max(1, Math.round(d / 80))} min à pied`;

/** Données structurées schema.org (référencement) */
function jsonLd(e: Etablissement) {
  const campus = e.campus ?? [{ ville: e.ville, adresse: e.adresse, geo: e.geo } as Campus];
  return {
    "@context": "https://schema.org", "@type": e.type === "universite" ? "CollegeOrUniversity" : "EducationalOrganization",
    name: e.nom, alternateName: e.sigle, url: `https://navigoal.netlify.app/etablissements/${e.id}/`, logo: e.logo ? `https://navigoal.netlify.app${e.logo}` : undefined,
    image: e.photos.map((p) => `https://navigoal.netlify.app${p.src}`), sameAs: e.site_web ? [e.site_web] : undefined, foundingDate: e.annee_creation ? String(e.annee_creation) : undefined,
    description: e.description ?? undefined,
    location: campus.map((c) => ({ "@type": "Place", name: `Campus de ${c.ville}`, address: { "@type": "PostalAddress", streetAddress: c.adresse ?? undefined, addressLocality: c.ville, addressCountry: "MA" }, geo: c.geo ? { "@type": "GeoCoordinates", latitude: c.geo.coordonnees.lat, longitude: c.geo.coordonnees.lon } : undefined })),
    hasCredential: e.filieres.slice(0, 30).map((f) => ({ "@type": "EducationalOccupationalCredential", name: f.intitule, credentialCategory: f.diplome ?? undefined })),
  };
}

/** Programmes présentés sur le site de l'établissement, en complément des filières accréditées. */
function ProgrammesSite({ e }: { e: Etablissement }) {
  const progs = e.site?.programmes ?? [];
  if (!progs.length) return null;
  const officiels = new Set([...e.filieres, ...e.filieres_echues].map((f) => f.intitule.toLowerCase()));
  return (
    <section id="programmes" className="flex scroll-mt-32 flex-col gap-4">
      <div><h2 className="text-[28px] font-extrabold tracking-tight">Programmes présentés par l&apos;établissement</h2><p className="text-ink-mute">{progs.length} programme{progs.length > 1 ? "s" : ""} relevé{progs.length > 1 ? "s" : ""} sur le site officiel{e.site?.date ? ` (${new Date(e.site.date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })})` : ""}. Le statut de chaque diplôme (accrédité ou d&apos;établissement) est à confirmer avec l&apos;école.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {progs.map((p, k) => {
          const F = p.formation ? formationById[p.formation] : undefined;
          return (
            <div key={`${p.intitule}-${k}`} className="flex flex-col gap-1.5 rounded-2xl border border-[#eef1f8] bg-white p-4">
              <div className="flex items-start gap-2"><GraduationCap size={17} className="mt-0.5 shrink-0 text-brand-600" />{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[15px] font-bold hover:text-brand-600">{p.intitule}</a> : <b className="text-[15px]">{p.intitule}</b>}</div>
              <span className="text-xs text-ink-mute">{[p.diplome, p.niveau ? niveauLabel(p.niveau) : null, p.duree_annees ? `${p.duree_annees} an${p.duree_annees > 1 ? "s" : ""}` : null, p.campus?.length ? `campus : ${p.campus.join(", ")}` : null].filter(Boolean).join(" · ")}</span>
              {p.specialites.length > 0 && <span className="text-xs text-ink-soft">Spécialités : {p.specialites.join(", ")}</span>}
              {officiels.has(p.intitule.toLowerCase()) && <span className="chip w-fit bg-[#e8f8ef] text-[11px] text-[#0f8a46]">Filière accréditée</span>}
              {F && <Link href={`/formations/${F.id}/?etab=${e.id}`} className="text-[12px] font-bold text-brand-600">Métiers et débouchés →</Link>}
            </div>
          );
        })}
      </div>
      {((e.site?.partenaires.length ?? 0) > 0 || (e.site?.vie_etudiante.length ?? 0) > 0) && (
        <div className="card flex flex-col gap-2 rounded-[22px] p-5">
          <b className="flex items-center gap-2"><Sparkles size={16} className="text-sun-500" />Vie étudiante et partenaires</b>
          <div className="flex flex-wrap gap-1.5">{[...(e.site?.vie_etudiante ?? []), ...(e.site?.partenaires ?? [])].map((t) => <span key={t} className="chip bg-brand-50 text-brand-700">{t}</span>)}</div>
        </div>
      )}
      <p className="text-xs text-ink-mute">Source : site officiel de l&apos;établissement{e.site_web ? ` (${e.site_web.replace(/^https?:\/\//, "").replace(/\/$/, "")})` : ""}.</p>
    </section>
  );
}

/** Campus : quartier, quartiers voisins, transports à proximité et repères de la ville. */
function CampusMobilite({ e }: { e: Etablissement }) {
  const campus: Campus[] = e.campus ?? [{ id: e.id, ville: e.ville, adresse: e.adresse, label: e.label, label_libelle: e.label_libelle, reconnaissance: e.reconnaissance, autorisation: e.autorisation, site_web: e.site_web, geo: e.geo }];
  return (
    <section id="campus" className="flex scroll-mt-32 flex-col gap-4">
      <div><h2 className="text-[28px] font-extrabold tracking-tight">{campus.length > 1 ? `${campus.length} campus au Maroc` : "Campus, quartier et mobilité"}</h2><p className="text-ink-mute">{campus.length > 1 ? "Tu choisis ton campus au moment de ta candidature. " : ""}Quartier, transports à proximité et repères pour s&apos;installer.</p></div>
      <div className={`grid gap-4 ${campus.length > 1 ? "md:grid-cols-2" : ""}`}>
        {campus.map((c) => {
          const g = c.geo, V = mobilite[c.ville];
          return (
            <div key={c.id} className="card flex flex-col gap-3 rounded-[22px] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><Link href={villeHref(c.ville)} className="flex items-center gap-1.5 text-lg font-extrabold hover:text-brand-600"><MapPin size={17} className="text-brand-600" />{campus.length > 1 ? `Campus de ${c.ville}` : c.ville}<ChevronRight size={16} className="text-ink-mute" /></Link>{campus.length > 1 && <LabelChip label={c.label} />}</div>
              {c.adresse && <p className="text-sm text-ink-soft">{c.adresse}</p>}
              {g?.quartier && <p className="text-sm"><b>Quartier :</b> <span className="text-ink-soft">{g.quartier}{g.arrondissement && g.arrondissement !== g.quartier ? ` (${g.arrondissement})` : ""}</span>{g.quartiers_voisins.length > 0 && <span className="text-ink-mute"> · à proximité : {g.quartiers_voisins.map((q) => q.replace(/^(Arrondissement|Préfecture d'arrondissements) de /, "")).join(", ")}</span>}</p>}
              {g && (g.tramway.length > 0 || g.gares.length > 0 || g.bus.arrets_600m > 0) && (
                <ul className="flex flex-col gap-1.5 text-sm">
                  {g.tramway.slice(0, 2).map((t) => <li key={t.nom} className="flex items-center gap-2"><TramFront size={15} className="shrink-0 text-brand-600" />Tramway <b>{t.nom}</b><span className="text-ink-mute">· {m(t.distance_m)}{t.distance_m < 1600 ? ` (${aPied(t.distance_m)})` : ""}</span></li>)}
                  {g.bus.arrets_600m > 0 && <li className="flex items-center gap-2"><Bus size={15} className="shrink-0 text-brand-600" />{g.bus.arrets_600m} arrêt{g.bus.arrets_600m > 1 ? "s" : ""} de bus à moins de 600 m{g.bus.plus_proche ? <span className="text-ink-mute"> · le plus proche : {g.bus.plus_proche.nom} ({m(g.bus.plus_proche.distance_m)})</span> : null}</li>}
                  {g.gares.slice(0, 1).map((t) => <li key={t.nom} className="flex items-center gap-2"><TrainFront size={15} className="shrink-0 text-brand-600" />{/^gare/i.test(t.nom) ? "" : "Gare "}<b>{t.nom}</b><span className="text-ink-mute">· {m(t.distance_m)}</span></li>)}
                </ul>
              )}
              {V && <div className="mt-auto flex flex-col gap-1.5 rounded-2xl bg-[#f6f8fe] p-3 text-[13px] text-ink-soft">
                <span><b className="text-ink">Se déplacer à {c.ville} :</b> {V.reseaux.join(", ")}.</span>
                <span className="flex items-start gap-1.5"><TrainFront size={14} className="mt-0.5 shrink-0" />{V.gares.join(" · ")}</span>
                <span className="flex items-start gap-1.5"><Plane size={14} className="mt-0.5 shrink-0" />{V.aeroport}</span>
                <span><b className="text-ink">Quartiers étudiants :</b> {V.quartiers_etudiants.join(", ")}. {V.conseil}</span>
                <Link href={villeHref(c.ville)} className="font-bold text-brand-600">Étudier à {c.ville} : écoles, coût de la vie, logement →</Link>
              </div>}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-mute">Distances à vol d&apos;oiseau calculées à partir d&apos;OpenStreetMap (© contributeurs OSM) ; à vérifier sur place.</p>
    </section>
  );
}

const ADMISSION = ["Dossier en ligne via Navigoal (bac ou relevés de notes, CV, lettre de motivation).", "Étude du dossier et, selon le programme, test ou entretien à distance.", "Admission, paiement des frais de réservation, attestation pour le visa.", "Arrivée : carte de séjour, logement Navilease, intégration."];

export default async function EtabPage({ params }: { params: { id: string } }) {
  const live = await establishmentLive(params.id);
  const confirmed = (live?.programs ?? []).filter((p) => p.feesConfirmed || !p.indicative);
  const e = etabById[params.id];
  if (e.id !== params.id) permanentRedirect(`/etablissements/${e.id}/`); // ancien campus regroupé
  const P = paysDetailById[e.pays];
  const C = COUTS[e.pays];
  // Filières homologuées, regroupées par composante (universités) ou par domaine
  const groupe = (f: Filiere) => f.composante ?? domaineById[f.domaine ?? ""]?.libelle ?? "Autres filières";
  const autorise = e.label === "autorise";
  const liste = autorise ? [...e.filieres, ...e.filieres_echues] : e.filieres;
  const villes = villesOf(e);
  const groupes = liste.reduce<Record<string, Filiere[]>>((acc, f) => ((acc[groupe(f)] ??= []).push(f), acc), {});
  const shared = (x: typeof e) => x.formations.filter((f) => e.formations.includes(f)).length;
  const similar = etablissements.filter((x) => x.id !== e.id && shared(x) >= 2).sort((a, b) => shared(b) - shared(a)).slice(0, 4);
  const res = residences.filter((r) => r.etablissements_desservis.includes(e.id));
  const fid = formationParDefaut(e.id);
  const D = fid ? devis(e.id, fid) : null;
  const typ = C.scolarite_annuelle[e.type] ?? C.scolarite_annuelle.universite;
  const B = P.budget;
  const facts: [string, string][] = [["Label", labelById[e.label]?.libelle ?? "—"], ["Statut", STATUT_LONG[e.statut] ?? "Privé"], e.campus ? ["Campus", villes.join(" · ")] : ["Ville", e.ville], ["Création", e.annee_creation ? String(e.annee_creation) : "—"], autorise ? ["Diplômes", "D'établissement"] : ["Filières homologuées", String(e.filieres.length)], ["Étudiants étrangers", "Accueillis ✓"]];
  const compare = `/comparateur/?f=${fid}&e=${[e.id, ...similar.slice(0, 2).map((x) => x.id)].join(",")}`;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(e)) }} />
      <div className="container flex flex-col gap-6 pt-7">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/etablissements">Établissements</Link><ChevronRight size={14} /><span>{e.sigle}</span></nav>
        <Reveal className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-center gap-5">
            <EtabLogo e={e} size={88} className="shadow-card" />
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-[44px] sm:leading-[1.05]">{e.nom}</h1>
              <div className="flex flex-wrap gap-2"><LabelChip label={e.label} /><span className="chip bg-brand-50 text-brand-700">{e.type_libelle}</span><span className="chip !inline-block max-w-full whitespace-normal !rounded-2xl bg-sun-100 text-[#a55a00]"><MapPin size={12} className="mr-1 inline align-[-2px]" />{e.campus ? `${e.campus.length} campus : ` : ""}{villes.map((v, k) => <span key={v}>{k ? ", " : ""}<Link href={villeHref(v)} className="hover:underline">{v}</Link></span>)}{e.campus ? "" : ", Maroc"}</span></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href={compare} className="btn-ghost"><Scale size={16} /> Comparer</Link>
            <Link href={`/devis/?etab=${e.id}`} className="btn-ghost"><Calculator size={16} /> Devis parents</Link>
            <Link href={`/espace/candidatures/nouvelle?etab=${e.id}${fid ? `&formation=${fid}` : ""}`} className="btn-primary btn-shine">Candidater <ArrowRight size={16} /></Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}><PhotoGallery e={e} /></Reveal>
        <Reveal delay={0.15} className="card grid grid-cols-2 gap-5 rounded-[20px] px-6 py-5 sm:grid-cols-3 lg:grid-cols-6">
          {facts.map(([a, b]) => <div key={a} className="flex min-w-0 flex-col gap-1"><span className="text-xs font-bold text-ink-mute">{a}</span><b className="text-[15px]">{b}</b></div>)}
        </Reveal>
      </div>

      <div className="container mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          <nav className="sticky top-[76px] z-10 -mx-1 flex gap-6 overflow-x-auto border-b border-slate-200 bg-[#f6f8fe]/90 px-1 backdrop-blur" aria-label="Sections">
            {[["#formations", "Formations & métiers"], ...(e.site?.programmes.length ? [["#programmes", "Programmes"]] : []), ["#campus", e.campus ? "Campus & mobilité" : "Quartier & mobilité"], ["#admission", "Admission"], ["#frais", "Frais & bourses"], ["#logement", "Logement"]].map(([h, t], k) => <a key={h} href={h} className={`shrink-0 whitespace-nowrap py-3 text-sm font-bold ${k === 0 ? "border-b-[3px] border-brand-600 text-brand-600" : "text-ink-mute hover:text-brand-600"}`}>{t}</a>)}
          </nav>
          <section id="formations" className="flex scroll-mt-32 flex-col gap-6">
            <div className={`card flex flex-col gap-2 rounded-[22px] p-5 ${autorise ? "border-[#f3e2b4] bg-[#fffaf0]" : "border-[#cdeedd] bg-[#f3fbf6]"}`}>
              <div className={`flex items-center gap-2 font-extrabold ${autorise ? "text-[#a55a00]" : "text-[#0f8a46]"}`}>{autorise ? <ShieldAlert size={18} /> : <BadgeCheck size={18} />} {labelById[e.label]?.libelle}</div>
              <p className="text-sm text-ink-soft">{labelById[e.label]?.description}{e.reconnaissance_en_cours ? " Reconnaissance par l'État en cours d'attribution." : ""}</p>
              {autorise && e.reconnaissance && <p className="text-sm text-ink-soft">Établissement reconnu par l&apos;État : ses filières doivent être de nouveau accréditées pour délivrer des diplômes équivalents aux diplômes nationaux.</p>}
              {autorise && <p className="text-sm text-ink-soft">Avant de t&apos;inscrire, demande à l&apos;établissement si la filière visée a obtenu le renouvellement de son accréditation (arrêté au Bulletin officiel).</p>}
              {(e.reconnaissance || e.autorisation) && <p className="text-xs text-ink-mute">Source : {[e.reconnaissance, e.autorisation ? `liste des établissements privés autorisés (${e.autorisation})` : null].filter(Boolean).join(" ; ")}.</p>}
            </div>
            {(live?.description ?? e.description) && <div className="card flex flex-col gap-2 rounded-[22px] p-6"><h2 className="text-lg font-extrabold">Présentation</h2><p className="whitespace-pre-line leading-relaxed text-ink-soft">{live?.description ?? e.description}</p>{e.adresse && <p className="flex items-start gap-1.5 text-sm text-ink-mute"><MapPin size={15} className="mt-0.5 shrink-0" />{e.adresse}</p>}</div>}
            {confirmed.length > 0 && (
              <div className="card flex flex-col gap-3 rounded-[22px] p-6">
                <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Frais confirmés par l&apos;établissement</h2><span className="chip bg-[#e8f8ef] text-[#0f8a46]">Vérifié</span></div>
                {confirmed.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f4fb] pb-2 text-sm last:border-0"><span className="font-semibold">{p.title}{p.startDate ? <span className="text-ink-mute"> · rentrée {p.startDate}</span> : null}</span><span className="text-ink-soft">{p.tuitionMin != null ? (p.currency ?? "MAD") === "MAD" ? <><Prix mad={p.tuitionMin} />{p.tuitionMax && p.tuitionMax !== p.tuitionMin ? <> – <Prix mad={p.tuitionMax} /></> : null}/an</> : `${fmt(p.tuitionMin)}${p.tuitionMax && p.tuitionMax !== p.tuitionMin ? ` – ${fmt(p.tuitionMax)}` : ""} ${p.currency}/an` : "sur demande"}{p.applicationFee ? (p.currency ?? "MAD") === "MAD" ? <> · dossier <Prix mad={p.applicationFee} /></> : ` · dossier ${fmt(p.applicationFee)} ${p.currency}` : ""}</span></div>)}
              </div>
            )}
            {autorise
              ? <div><h2 className="text-[28px] font-extrabold tracking-tight">Formations et débouchés</h2><p className="text-ink-mute">{liste.length ? "Filières autrefois accréditées par l'État, dont l'accréditation a pris fin sans renouvellement publié : elles conduisent à un diplôme d'établissement." : "Programmes à préciser par l'établissement."}</p></div>
              : <div><h2 className="text-[28px] font-extrabold tracking-tight">Filières homologuées et débouchés</h2><p className="text-ink-mute">Filières accréditées par l&apos;État, avec la fin de leur accréditation et le texte qui la fixe. Chacune est reliée aux métiers qu&apos;elle prépare.</p></div>}
            {Object.entries(groupes).map(([g, fs]) => (
              <div key={g} className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5"><span className="chip bg-brand-50 px-3 py-1.5 text-[13px] text-brand-700">{g}</span><span className="text-[13px] text-ink-mute">{fs.length} filière{fs.length > 1 ? "s" : ""}</span></div>
                <Stagger className="flex flex-col gap-3">
                  {fs.map((f, k) => {
                    const F = f.formation ? formationById[f.formation] : undefined;
                    const info = [f.diplome ?? "Diplôme à préciser par l'établissement", f.duree_annees ? `${f.duree_annees} an${f.duree_annees > 1 ? "s" : ""}` : null, f.niveau ? niveauLabel(f.niveau) : null, e.campus && f.campus ? `campus : ${f.campus.join(", ")}` : f.ville].filter(Boolean).join(" · ");
                    return (
                      <StaggerItem key={`${f.intitule}-${k}`} className="flex flex-col gap-3 rounded-2xl border border-[#eef1f8] bg-white p-4 md:flex-row md:items-center md:gap-4">
                        <div className="flex flex-col gap-1 md:w-[320px] md:shrink-0">
                          {F ? <Link href={`/formations/${F.id}/?etab=${e.id}`} className="text-[15px] font-bold hover:text-brand-600">{f.intitule}</Link> : <b className="text-[15px]">{f.intitule}</b>}
                          {f.options && <span className="text-xs text-ink-soft">Options : {f.options}</span>}
                          <span className="text-xs text-ink-mute">{info}</span>
                          {f.homologation.statut === "echue"
                            ? <span className="text-[11px] font-semibold text-[#a55a00]" title={f.homologation.texte}>Accréditation échue ({f.homologation.fin}) · diplôme d&apos;établissement</span>
                            : f.homologation.statut === "recente"
                              ? <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-brand-700" title={f.homologation.texte}><span className="chip bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">Accrédité</span>accréditation arrivée à échéance en {f.homologation.fin}, renouvellement à confirmer</span>
                              : <span className="text-[11px] font-semibold text-[#0f8a46]" title={f.homologation.texte}>Accréditée jusqu&apos;en {f.homologation.fin}</span>}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">{F && F.metiers.length > 0 && <><span className="text-[11px] font-extrabold text-ink-mute">MÈNE AUX MÉTIERS</span><div className="flex flex-wrap gap-1.5">{F.metiers.slice(0, 3).map((m) => metierById[m] && <Link key={m} href={`/metiers/${m}/`} className="chip bg-[#f1edff] text-[#6a3df0] hover:bg-[#e4dcff]">{metierById[m].nom}</Link>)}</div></>}</div>
                        {F && <Link href={`/comparateur/?f=${F.id}&e=${e.id}`} className="btn-ghost shrink-0 self-start px-3 py-2 text-[13px] md:self-center"><Scale size={14} /> Comparer</Link>}
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </div>
            ))}
            <p className="text-xs text-ink-mute">Sources : listes du ministère de l&apos;Enseignement supérieur et arrêtés d&apos;accréditation publiés au Bulletin officiel. Frais et calendrier à confirmer auprès de l&apos;établissement.</p>
          </section>
          <ProgrammesSite e={e} />
          <CampusMobilite e={e} />
          <section id="admission" className="scroll-mt-32"><Reveal className="card flex flex-col gap-3 rounded-[22px] p-6">
            <h3 className="text-lg font-extrabold">Admission des étudiants internationaux</h3>
            {e.site?.admission && ((e.site.admission.conditions?.length ?? 0) > 0 || (e.site.admission.etapes?.length ?? 0) > 0 || e.site.admission.dates) && (
              <div className="flex flex-col gap-1.5 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-soft">
                <b className="text-ink">Selon {e.sigle || "l'établissement"}</b>
                {[...(e.site.admission.conditions ?? []), ...(e.site.admission.etapes ?? [])].slice(0, 8).map((t) => <span key={t} className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#0f8a46]" />{t}</span>)}
                {e.site.admission.dates && <span><b>Calendrier :</b> {e.site.admission.dates}</span>}
              </div>
            )}
            {e.site && (e.site.bourses || e.site.international || e.site.logement) && <div className="flex flex-col gap-1 text-sm text-ink-soft">{e.site.bourses && <span><b className="text-ink">Bourses :</b> {e.site.bourses}</span>}{e.site.international && <span><b className="text-ink">International :</b> {e.site.international}</span>}{e.site.logement && <span><b className="text-ink">Logement :</b> {e.site.logement}</span>}</div>}
            {ADMISSION.map((t, k) => <div key={k} className="flex items-start gap-3"><span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-extrabold text-brand-600">{k + 1}</span><span className="pt-1 text-sm text-ink-soft">{t}</span></div>)}
            <Link href="/pays/ma/#venir" className="text-[13px] font-bold text-brand-600">Visa selon ta nationalité et carte de séjour →</Link>
          </Reveal></section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div id="frais" className="card flex scroll-mt-28 flex-col gap-3.5 rounded-3xl p-6 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]">
            <div className="flex items-center justify-between"><b>Budget annuel estimé</b><span className="chip bg-sun-100 text-[#a55a00]">estimation</span></div>
            {([["Frais de scolarité", <><Prix mad={typ.min} bloc /> – <Prix mad={typ.max} bloc /></>], ["Vie (10 mois)", <><Prix mad={B.total_mensuel.min * 10} bloc /> – <Prix mad={B.total_mensuel.max * 10} bloc /></>], ["Visa & séjour", "selon la nationalité"]] as const).map(([a, b]) => <div key={a} className="flex justify-between gap-3 text-sm"><span className="text-ink-mute">{a}</span><b className="text-right">{b}</b></div>)}
            {(e.site?.frais.length ?? 0) > 0 && <div className="flex flex-col gap-1.5 rounded-2xl border border-[#cdeedd] bg-[#f3fbf6] p-3 text-[13px]">
              <b className="text-[#0f8a46]">Frais publiés par l&apos;établissement</b>
              {e.site!.frais.map((f) => <div key={f.cycle} className="flex justify-between gap-3"><span className="text-ink-soft">{f.cycle}</span><b className="text-right">{f.scolarite_annuelle_mad ? <Prix mad={f.scolarite_annuelle_mad} suffixe="/an" bloc /> : "—"}{f.inscription_mad ? <span className="block text-[11px] font-semibold text-ink-mute">+ inscription <Prix mad={f.inscription_mad} /></span> : null}</b></div>)}
            </div>}
            {D && <div className="rounded-2xl bg-brand-50 p-3 text-[13px]"><span className="text-ink-mute">Coût total sur {D.years} an{D.years > 1 ? "s" : ""} (tout compris) :</span><b className="block text-brand-700"><Prix mad={D.total[0]} /> – <Prix mad={D.total[1]} /></b></div>}
            <Link href={`/devis/?etab=${e.id}`} className="btn-primary btn-shine py-2.5"><Calculator size={17} /> Obtenir le devis complet</Link>
            <span className="text-center text-xs text-ink-mute">Frais exacts transmis par l&apos;établissement sous 72 h via Navigoal</span>
          </div>
          {similar.length > 0 && <div className="card flex flex-col gap-2.5 rounded-[22px] p-5">
            <b>Établissements comparables</b>
            {similar.map((x) => <Link key={x.id} href={`/etablissements/${x.id}/`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200"><EtabLogo e={x} size={42} /><span className="min-w-0 flex-1"><b className="block text-[13px]">{x.sigle}</b><span className="text-xs text-ink-mute">{villesOf(x).join(" · ")}</span></span><span className="chip shrink-0 bg-[#e8f8ef] text-[#0f8a46]">{shared(x)} en commun</span></Link>)}
            <Link href={compare} className="btn-ghost py-2.5"><Scale size={16} /> Ouvrir le comparateur</Link>
          </div>}
          <div id="logement" className="card flex scroll-mt-28 flex-col gap-2.5 rounded-[22px] bg-gradient-to-br from-white to-[#fff7dd] p-5">
            <div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Logements à proximité</b></div>
            {res.map((r) => <div key={r.id} className="rounded-xl border border-[#f3e6bd] bg-white p-3 text-[13px]"><b>{r.nom}</b><span className="block text-ink-mute">{r.gestionnaire}</span></div>)}
            <span className="text-[13px] text-ink-mute">Studios et colocations vérifiés · dès <Prix mad={B.lignes[0].min} suffixe="/mois" /></span>
            <Link href={`/navilease/logements/?etablissement=${e.id}`} className="btn-primary py-2.5">Voir sur Navilease</Link>
          </div>
          <div className="card flex flex-col gap-2 rounded-[22px] p-5">
            <b>Étudier au {P.nom}</b><span className="text-[13px] text-ink-mute">Visa, coût de la vie, reconnaissance des diplômes.</span>
            <Link href="/pays/ma/" className="text-[13px] font-bold text-brand-600">Lire la fiche Maroc →</Link>
            {e.site?.contact.telephone && <a href={`tel:${e.site.contact.telephone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-[13px] font-bold text-ink-soft hover:text-brand-600"><Phone size={14} /> {e.site.contact.telephone}</a>}
            {e.site?.contact.email && <a href={`mailto:${e.site.contact.email}`} className="flex items-center gap-1.5 text-[13px] font-bold text-ink-soft hover:text-brand-600"><Mail size={14} /> {e.site.contact.email}</a>}
            {e.site_web && <a href={e.site_web} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-ink-soft hover:text-brand-600">Site officiel <ExternalLink size={14} /></a>}
          </div>
        </aside>
      </div>
    </>
  );
}
