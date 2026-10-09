import Link from "next/link";
import { ArrowRight, BarChart3, Briefcase, Code2, Cog, HardHat, Heart, Landmark, Pickaxe, Scale, Sprout, Stethoscope, Megaphone, GraduationCap, Plane, BookOpen, Palette, Users, Shield, Hotel, Building2, MapPin, Clock, Sparkles, type LucideIcon } from "lucide-react";
import { EtabLogo } from "./EtabLogo";
import { EtabPhoto } from "./EtabPhoto";
import { Tilt } from "@/components/motion/Tilt";
import { LABELS, PAYS_NOM, competenceLabel, etabById, etablissements, labelById, niveauLabel, type Formation, type Label, type Metier, type PaysCode } from "@/lib/data";

export const DOMAIN_STYLE: Record<string, { icon: LucideIcon; bg: string; fg: string; solid: string }> = {
  "dom-sante": { icon: Stethoscope, bg: "#ffecef", fg: "#d42a50", solid: "#d42a50" },
  "dom-numerique": { icon: Code2, bg: "#eef4ff", fg: "#1a47f5", solid: "#1a47f5" },
  "dom-ingenierie": { icon: Cog, bg: "#f1edff", fg: "#6a3df0", solid: "#6a3df0" },
  "dom-btp": { icon: HardHat, bg: "#fff3c4", fg: "#a55a00", solid: "#c27803" },
  "dom-energie-mines": { icon: Pickaxe, bg: "#fef0e6", fg: "#c2410c", solid: "#c2410c" },
  "dom-agri-env": { icon: Sprout, bg: "#e8f8ef", fg: "#0f8a46", solid: "#0f8a46" },
  "dom-gestion": { icon: Briefcase, bg: "#eef4ff", fg: "#1336e0", solid: "#1336e0" },
  "dom-finance": { icon: Landmark, bg: "#e6f6fb", fg: "#0e7490", solid: "#0e7490" },
  "dom-commerce": { icon: Megaphone, bg: "#fff1f2", fg: "#e11d48", solid: "#e11d48" },
  "dom-droit": { icon: Scale, bg: "#f3f4f6", fg: "#374151", solid: "#374151" },
  "dom-admin-publique": { icon: Landmark, bg: "#eef2ff", fg: "#4338ca", solid: "#4338ca" },
  "dom-lettres-langues": { icon: BookOpen, bg: "#fdf4ff", fg: "#a21caf", solid: "#a21caf" },
  "dom-shs": { icon: Users, bg: "#ecfeff", fg: "#0e7490", solid: "#0891b2" },
  "dom-education": { icon: GraduationCap, bg: "#fefce8", fg: "#a16207", solid: "#ca8a04" },
  "dom-communication": { icon: Megaphone, bg: "#fff7ed", fg: "#c2410c", solid: "#ea580c" },
  "dom-arts-design": { icon: Palette, bg: "#fdf2f8", fg: "#be185d", solid: "#db2777" },
  "dom-sciences": { icon: BarChart3, bg: "#eef4ff", fg: "#1a47f5", solid: "#2563eb" },
  "dom-transport-logistique": { icon: Plane, bg: "#f0f9ff", fg: "#0369a1", solid: "#0284c7" },
  "dom-tourisme": { icon: Hotel, bg: "#fff7ed", fg: "#b45309", solid: "#d97706" },
  "dom-securite-defense": { icon: Shield, bg: "#f1f5f9", fg: "#334155", solid: "#475569" },
};
export const domStyle = (d: string) => DOMAIN_STYLE[d] ?? DOMAIN_STYLE["dom-gestion"];

/** Couleurs des labels Navigoal (diplômes homologués par l'État). */
export const LABEL_STYLE: Record<Label, string> = {
  reconnu_etat: "bg-[#e8f8ef] text-[#0f8a46]",
  diplomes_homologues: "bg-brand-50 text-brand-700",
  professionnel: "bg-sun-100 text-[#a55a00]",
};
export function LabelChip({ label, court = false }: { label: Label; court?: boolean }) {
  const l = labelById[label];
  if (!l) return null;
  return <span className={`chip ${LABEL_STYLE[label]}`} title={l.description}><Shield size={12} /> {court ? l.court : l.libelle}</span>;
}

export function MetierCard({ m }: { m: Metier }) {
  const s = domStyle(m.domaine);
  const Icon = s.icon;
  return (
    <Tilt className="h-full">
      <Link href={`/metiers/${m.id}/`} className="card group flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-lift">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-white" style={{ background: s.solid }}><Icon size={24} /></div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f8fe] text-ink-mute transition group-hover:bg-[#ffecef] group-hover:text-[#d42a50]"><Heart size={17} /></span>
        </div>
        <div className="font-extrabold">{m.nom}</div>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-mute">{m.description}</p>
        <div className="flex flex-wrap gap-1.5">{m.competences.slice(0, 2).map((c) => <span key={c} className="chip block max-w-full truncate bg-brand-50 text-brand-700">{competenceLabel(c)}</span>)}</div>
        <div className="mt-auto flex items-center justify-between border-t border-[#eef1f8] pt-3 text-xs">
          <span className="text-ink-mute">Profil {m.riasec.join("·")} · {niveauLabel(m.niveau_min)}</span>
          <span className="font-bold text-brand-600 transition group-hover:translate-x-1">Voir la fiche →</span>
        </div>
      </Link>
    </Tilt>
  );
}

export const PAYS_STYLE: Record<PaysCode, { villes: string; tint: string; flag: JSX.Element }> = {
  GA: { villes: "Libreville · Franceville · Moanda", tint: "#009e60", flag: <div className="flex h-9 w-[54px] flex-col overflow-hidden rounded-lg shadow"><div className="flex-1 bg-[#009e60]" /><div className="flex-1 bg-[#fcd116]" /><div className="flex-1 bg-[#3a75c4]" /></div> },
  MA: { villes: "Rabat · Casablanca · Marrakech · Fès", tint: "#c1272d", flag: <div className="flex h-9 w-[54px] items-center justify-center overflow-hidden rounded-lg bg-[#c1272d] shadow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006233" strokeWidth="2.5"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7z" /></svg></div> },
  SN: { villes: "Dakar · Thiès · Saint-Louis · Ziguinchor", tint: "#00853f", flag: <div className="flex h-9 w-[54px] overflow-hidden rounded-lg shadow"><div className="flex-1 bg-[#00853f]" /><div className="flex flex-1 items-center justify-center bg-[#fdef42] text-[10px] text-[#00853f]">★</div><div className="flex-1 bg-[#e31b23]" /></div> },
};

export function PaysCard({ code }: { code: PaysCode }) {
  const st = PAYS_STYLE[code];
  const etabs = etablissements.filter((e) => e.pays === code);
  const withLogo = etabs.filter((e) => e.logo).slice(0, 5);
  return (
    <Tilt className="h-full">
      <div id={code} className="card relative flex h-full scroll-mt-28 flex-col gap-5 overflow-hidden rounded-3xl p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[.08]" style={{ background: st.tint }} />
        <div className="flex items-center gap-4">{st.flag}<div><div className="text-[22px] font-extrabold">{PAYS_NOM[code]}</div><div className="text-[13px] text-ink-mute">{st.villes}</div></div></div>
        <div className="flex gap-6">
          <div><div className="text-2xl font-extrabold">{etabs.length}</div><div className="text-xs text-ink-mute">établissements homologués</div></div>
          <div><div className="text-2xl font-extrabold">{etabs.reduce((n, e) => n + e.filieres.length, 0)}</div><div className="text-xs text-ink-mute">filières homologuées</div></div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex pl-2">{withLogo.map((e) => <EtabLogo key={e.id} e={e} size={38} className="-ml-2 shadow-sm" />)}</div>
          <Link href={`/pays/${code.toLowerCase()}/`} className="btn-ghost px-3.5 py-2.5">Découvrir <ArrowRight size={16} /></Link>
        </div>
      </div>
    </Tilt>
  );
}

export function FormationOfferCard({ f, etabId, score, highlight = false }: { f: Formation; etabId: string; score: number; highlight?: boolean }) {
  const e = etabById[etabId];
  const s = domStyle(f.domaine);
  const Icon = s.icon;
  return (
    <div className={`card flex flex-col gap-5 p-4 transition-all hover:-translate-y-1 hover:shadow-lift sm:flex-row ${highlight ? "border-brand-200 shadow-lift" : ""}`}>
      <div className="relative flex h-28 w-full shrink-0 items-center justify-center rounded-2xl sm:w-36" style={{ background: `linear-gradient(135deg, ${s.solid}, ${s.fg}99)` }}>
        <Icon size={46} className="text-white/75" strokeWidth={1.6} />
        <div className="absolute -bottom-3 left-3"><EtabLogo e={e} size={44} className="shadow" /></div>
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-2 sm:pt-0">
        <div className="flex items-start justify-between gap-3">
          <div><Link href={`/formations/${f.id}/`} className="text-[17px] font-extrabold hover:text-brand-600">{f.intitule}</Link><div className="text-sm font-semibold text-ink-soft">{e.nom}</div></div>
          <button aria-label="Ajouter aux favoris" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f8fe] text-ink-mute transition hover:bg-[#ffecef] hover:text-[#d42a50]"><Heart size={17} /></button>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-ink-mute"><MapPin size={14} />{e.ville}, Maroc</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="chip bg-brand-50 text-brand-700">{f.diplome}</span>
            <span className="chip bg-[#f6f8fe] text-ink-soft"><Clock size={12} /> {f.duree_annees} ans</span>
            <LabelChip label={e.label} court />
            <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><Sparkles size={12} /> {score} % compatible</span>
          </div>
          <Link href={`/formations/${f.id}/?etab=${e.id}`} className={highlight ? "btn-primary py-2.5" : "btn-ghost py-2.5"}>Voir la formation</Link>
        </div>
      </div>
    </div>
  );
}

export function EtabCard({ id }: { id: string }) {
  const e = etabById[id];
  return (
    <Tilt className="h-full">
      <Link href={`/etablissements/${e.id}/`} className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
        <div className="relative h-28 overflow-hidden"><EtabPhoto e={e} rounded="rounded-none" className="h-full w-full transition duration-700 group-hover:scale-105" />{e.photos.length > 1 && <span className="absolute right-2.5 top-2.5 rounded-full bg-ink/60 px-2 py-0.5 text-[11px] font-bold text-white">{e.photos.length} photos</span>}</div>
        <div className="relative flex flex-1 flex-col gap-4 px-5 pb-5 pt-9">
          <EtabLogo e={e} size={56} className="absolute -top-7 left-4 shadow-sm" />
          <div className="min-w-0"><div className="font-extrabold">{e.sigle}</div><div className="line-clamp-2 text-[13px] text-ink-soft">{e.nom}</div></div>
          <div className="flex flex-wrap gap-1.5"><LabelChip label={e.label} court /><span className="chip bg-[#f6f8fe] text-ink-soft">{e.type_libelle}</span></div>
          <div className="mt-auto flex items-center justify-between border-t border-[#eef1f8] pt-3 text-[13px]">
            <span className="flex items-center gap-1.5 text-ink-mute"><Building2 size={14} />{e.ville}</span>
            <span className="font-bold text-brand-600">{e.filieres.length} filière{e.filieres.length > 1 ? "s" : ""} homologuée{e.filieres.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}

/** Carte d'un label Navigoal : nombre d'établissements, logos et lien vers la liste filtrée. */
export function LabelCard({ label }: { label: Label }) {
  const l = LABELS.find((x) => x.id === label)!;
  const etabs = etablissements.filter((e) => e.label === label);
  const withLogo = etabs.filter((e) => e.logo).slice(0, 5);
  return (
    <Tilt className="h-full">
      <div className="card relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-6">
        <LabelChip label={label} />
        <div><div className="text-2xl font-extrabold">{etabs.length} établissements</div><p className="mt-1 text-[13px] leading-relaxed text-ink-mute">{l.description}</p></div>
        <div className="mt-auto flex items-center justify-between">
          <div className="flex pl-2">{withLogo.map((e) => <EtabLogo key={e.id} e={e} size={38} className="-ml-2 shadow-sm" />)}</div>
          <Link href={`/etablissements/?label=${label}`} className="btn-ghost px-3.5 py-2.5">Voir <ArrowRight size={16} /></Link>
        </div>
      </div>
    </Tilt>
  );
}
