import Link from "@/components/ui/Link";
import type { Metadata } from "next";
import { BadgeCheck, Building2, Clock, Cookie, Copyright, ExternalLink, FileSearch, Gift, History, Lock, Mail, Plane, School, Server, ShieldCheck, Sparkles, Stamp, UserRound, type LucideIcon } from "lucide-react";
import legal from "@/data/legal.json";
import { PAGES_LEGALES, SERVICES, SERVICES_LISTE, lienLegal, type PageLegale, type ServiceId } from "@/lib/services";
import { Markdown, headings, slugify } from "./markdown";
import { SommaireLegal, Imprimer } from "./SommaireLegal";

export const LEGAL_VERSION = { version: "2.0", date: "06/11/2026" };
type Texte = { titre: string; bref: string; corps: string };
const TEXTES = legal as Record<ServiceId, Record<PageLegale, Texte>>;

/** « L'essentiel en 30 secondes » : 3 points clés par page. */
const CARTES: Partial<Record<ServiceId, Partial<Record<PageLegale, [LucideIcon, string, string][]>>>> = {
  navigoal: {
    cgu: [[Gift, "Gratuit pour les familles", "Orientation, comparateur, devis et candidature sans frais d'inscription."], [ShieldCheck, "Vos documents protégés", "Transmis uniquement aux écoles où vous candidatez."], [School, "L'école décide", "L'admission et les frais exacts relèvent de l'établissement."]],
    confidentialite: [[Lock, "Jamais revendues", "Ni publicité ciblée, ni location de vos données."], [ShieldCheck, "Partage maîtrisé", "Une école ne voit votre dossier que si vous candidatez."], [UserRound, "Vos droits", "Accès, correction, suppression : contact@navigoal.net."]],
    "mentions-legales": [[Building2, "OAPS Consulting Group", "SARLU de droit gabonais, Libreville · RCCM GA-LBV-01-2021-B13-00360."], [Server, "Hébergé en Europe", "LWS (Paris) et Neon (Francfort)."], [Copyright, "Crédits et retraits", "Chaque photo est créditée ; retrait sur simple demande."]],
    cookies: [[Cookie, "Cookies internes seulement", "Connexion, préférences et source d'arrivée."], [ShieldCheck, "Aucun traceur", "Ni publicité, ni mesure d'audience tierce."], [FileSearch, "Vidéos au clic", "Les lecteurs vidéo ne se chargent que si vous cliquez."]],
  },
  navilease: {
    cgu: [[Lock, "Paiement en séquestre", "Le bailleur est payé après votre entrée dans les lieux."], [BadgeCheck, "Annonces vérifiées", "Chaque annonce est relue avant publication."], [ExternalLink, "Résidences : site officiel", "Réservation directe, sans paiement via Navilease."]],
    confidentialite: [[Lock, "Coordonnées masquées", "Révélées seulement après le paiement."], [ShieldCheck, "Pièces des bailleurs", "Vues par la modération, jamais publiées."], [UserRound, "Vos droits", "Accès, correction, suppression : contact@navigoal.net."]],
  },
  navitravel: {
    cgu: [[Plane, "Sur devis", "Chaque prestation est chiffrée et acceptée avant paiement."], [Stamp, "Visa : le consulat décide", "Nous préparons votre dossier, sans garantie d'obtention."], [Building2, "Agence de voyage", "Billets émis par OAPS Consulting Group."]],
    confidentialite: [[ShieldCheck, "Le strict nécessaire", "Passeport et dates, transmis à ceux qui exécutent la prestation."], [Lock, "Documents protégés", "Stockés dans votre espace, jamais envoyés par messagerie publique."], [UserRound, "Vos droits", "Accès, correction, suppression : contact@navigoal.net."]],
  },
};

export function legalMetadata(service: ServiceId, page: PageLegale): Metadata {
  const t = TEXTES[service][page];
  return { title: t.titre, description: t.bref, alternates: { canonical: lienLegal(service, page) + "/" } };
}

/** Pages légales de Navigoal, Navilease et NaviTravel (maquettes « Pages légales », novembre 2026). */
export function LegalPage({ service = "navigoal", page }: { service?: ServiceId; page: PageLegale }) {
  const s = SERVICES[service];
  const L = TEXTES[service][page];
  const toc = headings(L.corps).map((t) => ({ t: t.replace(/\*\*/g, ""), id: slugify(t) }));
  const cartes = CARTES[service]?.[page];
  const minutes = Math.max(2, Math.round(L.corps.split(/\s+/).length / 220));
  return (
    <div>
      <div className="border-b border-slate-200 print:hidden" style={{ background: s.fond }}>
        <div className="container flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-extrabold text-ink-mute">Service :</span>
            {SERVICES_LISTE.map((v) => (
              <Link key={v.id} href={lienLegal(v.id, page)} className={`chip px-3.5 py-2 text-[13px] ${v.id === service ? "text-white" : "border border-slate-200 bg-white text-ink-soft hover:border-slate-300"}`} style={v.id === service ? { background: v.c } : undefined}>{v.nom}</Link>
            ))}
            <span className="ml-auto hidden text-xs text-ink-mute sm:inline">Centre juridique · {s.nom}</span>
          </div>
          <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Pages légales">
            {PAGES_LEGALES.map((p) => (
              <Link key={p.id} href={lienLegal(service, p.id)} className="shrink-0 border-b-[3px] py-3 text-sm font-semibold" style={p.id === page ? { color: s.c, borderColor: s.c, fontWeight: 800 } : { color: "#5b6478", borderColor: "transparent" }}>{p.court}</Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="container grid items-start gap-8 pt-8 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_240px] xl:gap-10">
        <SommaireLegal toc={toc} couleur={s.c} fond={s.fond} />
        <article className="flex min-w-0 max-w-3xl flex-col gap-5">
          {service !== "navigoal" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.logoHorizontal} alt={s.nom} width={180} height={50} className="hidden h-[50px] w-auto self-start sm:block" />
          )}
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[44px] sm:leading-[1.1]">{L.titre}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-[#eef1f8] text-ink-soft">Version {LEGAL_VERSION.version}</span>
            <span className="chip" style={{ background: s.fond, color: s.c }}>En vigueur au {LEGAL_VERSION.date}</span>
            <span className="chip border border-slate-200 bg-white text-ink-mute"><Clock size={12} />Lecture : {minutes} min</span>
          </div>
          <section className="rounded-[22px] border border-slate-200 bg-white p-5" aria-label="L'essentiel">
            <div className="mb-2 flex items-center gap-2 font-extrabold"><Sparkles size={18} style={{ color: s.c }} />L&apos;essentiel en 30 secondes</div>
            <p className="text-[15.5px] leading-relaxed text-ink-soft">{L.bref}</p>
            {cartes && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {cartes.map(([I, t, d]) => (
                  <div key={t} className="flex gap-3 rounded-2xl border border-slate-200 p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: s.fond }}><I size={18} style={{ color: s.c }} /></span>
                    <span><b className="text-sm">{t}</b><span className="mt-0.5 block text-xs leading-snug text-ink-mute">{d}</span></span>
                  </div>
                ))}
              </div>
            )}
          </section>
          <Markdown text={L.corps} numeros couleur={s.c} />
        </article>
        <aside className="hidden flex-col gap-4 xl:sticky xl:top-28 xl:flex print:hidden">
          <div className="card flex flex-col gap-2 rounded-[22px] p-5">
            <Mail size={22} style={{ color: s.c }} />
            <b>Une question ?</b>
            <span className="text-[13px] leading-relaxed text-ink-mute">Données personnelles, réclamation, retrait d&apos;un contenu : nous répondons sous 10 jours ouvrés.</span>
            <a href={`mailto:contact@navigoal.net?subject=${encodeURIComponent(`${s.nom} · ${L.titre}`)}`} className="mt-1 rounded-xl py-2.5 text-center text-sm font-extrabold text-white" style={{ background: s.c }}>contact@navigoal.net</a>
          </div>
          <div className="flex flex-col gap-2 rounded-[22px] border border-slate-200 p-5">
            <History size={20} className="text-ink-mute" /><b className="text-sm">Historique</b>
            <span className="text-xs text-ink-mute">v2.0 · 06/11/2026 : réécriture complète, pages propres à Navilease et NaviTravel</span>
            <span className="text-xs text-ink-mute">v1.0 · 09/10/2026</span>
          </div>
          <Imprimer />
        </aside>
      </div>
    </div>
  );
}
