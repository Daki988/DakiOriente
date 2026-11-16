"use client";
// Dossier d'un compte dans le back-office : identité, profil et projet, test d'orientation, parents, candidatures, pièces, Navi.
// Ouvert depuis Utilisateurs ou depuis « En ce moment » (Audience). Chaque consultation est journalisée.
import { ArrowLeft, Bot, CalendarClock, Download, FileText, GraduationCap, Heart, Mail, MessageCircle, Phone, Send, Target, User as UserIcon, Users } from "lucide-react";
import Link from "@/components/ui/Link";
import { Chip, Loading, Panel, StatusBadge } from "@/components/app/kit";
import { DOC_TYPES } from "@/components/app/form";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/lib/api";
import { metierById, riasec, serieById } from "@/lib/data";
import { AdminHeader, Flag, LoadError, ROLE_LABEL, ROLE_TONE } from "./shared";

type Dossier = {
  incomplet: { partie: string; erreur: string }[];
  compte: { id: string; prenom: string; nom: string; email: string | null; telephone: string | null; role: string; statut: string; pays: string | null; ville: string | null; anneeNaissance: number | null; emailVerifie: boolean; telephoneVerifie: boolean; inscritLe: string; derniereConnexion: string | null; acquisition: Record<string, string> | null };
  profil: null | { niveau: string | null; serie: string | null; etablissementActuel: string | null; diplome: string | null; domaine: string | null; interets: string[]; competences: string[]; projet: string | null; preferences: { pays?: string[]; villes?: string[]; budgetAnnuel?: number; devise?: string }; moyenne: number | null; mention: string | null; anneeBac: number | null; moyenneVerifiee: boolean; metiersVises: string[]; rentree: number | null; financement: Record<string, boolean>; visibleEcoles: boolean; riasec: { top: string[] } | null };
  tests: { top: string[]; le: string }[];
  liens: { id: string; sens: "enfant" | "parent"; relation: string; statut: string; consentement: string | null; personne: { id: string; prenom: string; nom: string; role: string } | null; invite: string | null }[];
  candidatures: { id: string; numero: string; statut: string; campus: string | null; soumise: string | null; decidee: string | null; creee: string; pieces: string[]; demandees: string[]; etablissementId: string; etablissement: string; sigle: string; ville: string; programme: string }[];
  pieces: { id: string; type: string; label: string | null; fichier: string; taille: number; statut: string; le: string }[];
  rendezVous: { id: string; sujet: string; statut: string; prevu: string | null; souhaite: string | null; le: string }[];
  navi: { questions: number; dernieres: { id: string; at: string; question: string }[] };
  favoris: { kind: string; itemId: string }[];
};
const DOC = Object.fromEntries(DOC_TYPES);
const date = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
const RIASEC = Object.fromEntries(riasec.map((r) => [r.code, r.nom]));
const FIN: Record<string, string> = { garant: "Garant", bourse: "Bourse", pret: "Prêt", autofinance: "Autofinancement" };
const ko = (n: number) => (n > 1e6 ? `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo` : `${Math.max(1, Math.round(n / 1e3))} Ko`);

function Ligne({ k, v }: { k: string; v: React.ReactNode }) {
  if (v == null || v === false || v === "" || (Array.isArray(v) && !v.length)) return null;
  return <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:gap-3"><dt className="shrink-0 text-xs font-bold text-ink-mute sm:w-40 sm:text-[13px]">{k}</dt><dd className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{v}</dd></div>;
}

export function AdminDossier({ id }: { id: string }) {
  const d = useApi<Dossier>(`/admin/utilisateurs/${id}`);
  if (d.error) return <LoadError error={d.error} reload={d.reload} />;
  if (!d.data) return <Loading />;
  const { compte: c, profil: p, candidatures, pieces } = d.data;
  const tel = c.telephone?.replace(/[^\d+]/g, "");
  const age = c.anneeNaissance ? new Date().getFullYear() - c.anneeNaissance : null;
  const parPiece = new Map(pieces.map((x) => [x.id, x]));

  return (
    <div className="min-w-0 max-w-full">
      <Link href="/admin/utilisateurs" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-600"><ArrowLeft size={15} />Utilisateurs</Link>
      <AdminHeader eyebrow={`Dossier · ${ROLE_LABEL[c.role] ?? c.role}`} title={`${c.prenom} ${c.nom}`}
        sub={<span className="flex flex-wrap items-center gap-x-2 gap-y-1"><Chip tone={ROLE_TONE[c.role]}>{ROLE_LABEL[c.role] ?? c.role}</Chip><StatusBadge status={c.statut} />{c.pays && <Flag code={c.pays} withName />}{c.ville && <span>· {c.ville}</span>}{age && <span>· {age} ans</span>}</span>} />

      {d.data.incomplet.length > 0 && (
        <div className="mb-4 rounded-2xl border border-[#ffd0d9] bg-[#fff5f7] p-3 text-[13px] text-[#a3173a]">
          <b>Une partie du dossier n&apos;a pas pu être chargée.</b> Le reste est à jour. Détail (à transmettre pour correction) :
          <ul className="mt-1 list-disc pl-5">{d.data.incomplet.map((x) => <li key={x.partie}><b>{x.partie}</b> : {x.erreur}</li>)}</ul>
        </div>
      )}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {c.email && <a href={`mailto:${c.email}`} className="btn-ghost min-h-[44px] justify-center px-3 text-[13px]"><Mail size={16} />E-mail</a>}
        {tel && <a href={`tel:${tel}`} className="btn-ghost min-h-[44px] justify-center px-3 text-[13px]"><Phone size={16} />Appeler</a>}
        {tel && <a href={`https://wa.me/${tel.replace(/^\+/, "")}`} target="_blank" rel="noopener noreferrer" className="btn-ghost min-h-[44px] justify-center px-3 text-[13px]"><MessageCircle size={16} />WhatsApp</a>}
        <Link href="/admin/messagerie" className="btn-ghost min-h-[44px] justify-center px-3 text-[13px]"><Send size={16} />Messagerie</Link>
      </div>

      <div className="grid items-start gap-5 [&>*]:min-w-0 xl:grid-cols-2">
        <Panel title="Identité et compte" icon={UserIcon}>
          <dl className="flex flex-col gap-2.5">
            <Ligne k="E-mail" v={c.email && <>{c.email} {c.emailVerifie ? <span className="text-xs text-[#0f8a46]">✓ vérifié</span> : <span className="text-xs text-ink-mute">non vérifié</span>}</>} />
            <Ligne k="Téléphone" v={c.telephone && <>{c.telephone} {c.telephoneVerifie ? <span className="text-xs text-[#0f8a46]">✓ vérifié</span> : <span className="text-xs text-ink-mute">non vérifié</span>}</>} />
            <Ligne k="Année de naissance" v={c.anneeNaissance && `${c.anneeNaissance}${age != null && age < 18 ? " (mineur)" : ""}`} />
            <Ligne k="Inscrit le" v={date(c.inscritLe)} />
            <Ligne k="Dernière connexion" v={c.derniereConnexion ? new Date(c.derniereConnexion).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "Jamais"} />
            <Ligne k="Arrivé par" v={c.acquisition && [c.acquisition.utm_source, c.acquisition.utm_content, c.acquisition.ref && `parrainage ${c.acquisition.ref}`].filter(Boolean).join(" · ")} />
          </dl>
        </Panel>

        {p && (
          <Panel title="Profil et projet" icon={Target}>
            <dl className="flex flex-col gap-2.5">
              <Ligne k="Niveau" v={[p.niveau, p.serie && (serieById[p.serie]?.intitule ?? p.serie)].filter(Boolean).join(" · ")} />
              <Ligne k="Établissement actuel" v={p.etablissementActuel} />
              <Ligne k="Résultats" v={p.moyenne != null && <>{p.moyenne.toLocaleString("fr-FR")}/20{p.mention ? ` · ${p.mention}` : ""}{p.anneeBac ? ` · bac ${p.anneeBac}` : ""} {p.moyenneVerifiee && <span className="text-xs text-[#0f8a46]">✓ vérifiée</span>}</>} />
              <Ligne k="Métiers visés" v={p.metiersVises.map((m) => metierById[m]?.nom ?? m).join(" · ")} />
              <Ligne k="Projet" v={p.projet} />
              <Ligne k="Rentrée souhaitée" v={p.rentree} />
              <Ligne k="Villes souhaitées" v={p.preferences.villes?.join(", ")} />
              <Ligne k="Budget annuel" v={p.preferences.budgetAnnuel && `${p.preferences.budgetAnnuel.toLocaleString("fr-FR")} ${p.preferences.devise ?? "MAD"}`} />
              <Ligne k="Financement" v={Object.entries(p.financement ?? {}).filter(([, v]) => v).map(([k]) => FIN[k] ?? k).join(" · ")} />
              <Ligne k="Visible des écoles" v={p.visibleEcoles ? "Oui (vivier Premium)" : "Non"} />
            </dl>
          </Panel>
        )}

        <Panel title="Test d'orientation" icon={GraduationCap}>
          {d.data.tests.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {d.data.tests.map((t, i) => <li key={i} className="flex flex-wrap items-center gap-1.5"><span className="text-xs text-ink-mute">{date(t.le)}</span>{t.top.map((x) => <Chip key={x} tone="violet">{RIASEC[x] ?? x}</Chip>)}</li>)}
            </ul>
          ) : <p className="text-sm text-ink-mute">Test pas encore passé.</p>}
        </Panel>

        {d.data.liens.length > 0 && (
          <Panel title={c.role === "parent" ? "Enfants suivis" : "Parents et garants"} icon={Users}>
            <ul className="flex flex-col gap-2 text-sm">
              {d.data.liens.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2">
                  {l.personne ? <Link href={`/admin/utilisateurs/${l.personne.id}`} className="font-bold text-brand-700">{l.personne.prenom} {l.personne.nom}</Link> : <span className="font-bold">{l.invite ?? "Invitation"}</span>}
                  <span className="text-xs text-ink-mute">{l.relation} · {l.statut === "actif" ? "lien actif" : l.statut === "invite" ? "invitation envoyée" : "refusé"}{l.consentement ? ` · consentement le ${date(l.consentement)}` : ""}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <Panel title={`Candidatures (${candidatures.length})`} icon={FileText} className="mt-5">
        {candidatures.length ? (
          <ul className="divide-y divide-slate-100">
            {candidatures.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <b className="block text-sm">{a.programme}</b>
                  <span className="block text-xs text-ink-mute">{a.sigle || a.etablissement} · {a.campus ?? a.ville} · n° {a.numero} · {a.soumise ? `envoyée le ${date(a.soumise)}` : `créée le ${date(a.creee)}`}{a.decidee ? ` · décision le ${date(a.decidee)}` : ""}</span>
                  {a.pieces.length > 0 && <span className="mt-1 block text-xs text-ink-soft">{a.pieces.length} pièce{a.pieces.length > 1 ? "s" : ""} jointe{a.pieces.length > 1 ? "s" : ""}{a.demandees.length ? ` · demandée${a.demandees.length > 1 ? "s" : ""} : ${a.demandees.map((t) => DOC[t] ?? t).join(", ")}` : ""}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={a.statut} />
                  {a.pieces.some((x) => parPiece.has(x)) && <a href={apiUrl(`/ecole/candidatures/${a.id}/dossier.zip`)} className="btn-ghost min-h-[40px] px-3 text-[13px]"><Download size={15} />Dossier ZIP</a>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink-mute">Aucune candidature.</p>}
      </Panel>

      <Panel title={`Pièces déposées (${pieces.length})`} icon={Download} className="mt-5">
        {pieces.length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {pieces.map((x) => (
              <li key={x.id} className="min-w-0">
                <a href={apiUrl(`/documents/${x.id}/fichier`)} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40">
                  <FileText size={20} className="shrink-0 text-brand-600" />
                  <span className="min-w-0 flex-1"><b className="block truncate text-sm">{x.label || DOC[x.type] || x.type}</b><span className="block truncate text-xs text-ink-mute">{x.fichier}</span><span className="block text-xs text-ink-mute">{ko(x.taille)} · {date(x.le)}{x.statut === "valide" ? " · validée" : x.statut === "refuse" ? " · refusée" : ""}</span></span>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink-mute">Aucune pièce déposée.</p>}
      </Panel>

      <div className="mt-5 grid items-start gap-5 [&>*]:min-w-0 xl:grid-cols-3">
        <Panel title="Rendez-vous conseiller" icon={CalendarClock}>
          {d.data.rendezVous.length ? d.data.rendezVous.map((r) => <p key={r.id} className="text-sm"><b>{r.sujet}</b> <span className="text-xs text-ink-mute">· {r.statut} · {date(r.prevu ?? r.souhaite ?? r.le)}</span></p>) : <p className="text-sm text-ink-mute">Aucun rendez-vous.</p>}
        </Panel>
        <Panel title={`Navi (${d.data.navi.questions} question${d.data.navi.questions > 1 ? "s" : ""})`} icon={Bot}>
          {d.data.navi.dernieres.length ? d.data.navi.dernieres.map((q) => <p key={q.id} className="line-clamp-2 break-words text-sm [overflow-wrap:anywhere]"><span className="text-xs text-ink-mute">{date(q.at)} · </span>{q.question}</p>) : <p className="text-sm text-ink-mute">Aucune question à Navi (90 derniers jours).</p>}
          {d.data.navi.questions > 0 && <Link href="/admin/navi" className="text-[13px] font-bold text-brand-600">Voir dans le suivi de Navi →</Link>}
        </Panel>
        <Panel title={`Favoris (${d.data.favoris.length})`} icon={Heart}>
          {d.data.favoris.length ? <p className="text-sm">{(["metier", "formation", "etablissement", "program", "logement"] as const).map((k) => [k, d.data!.favoris.filter((f) => f.kind === k).length] as const).filter(([, n]) => n).map(([k, n]) => `${n} ${({ metier: "métier", formation: "formation", etablissement: "école", program: "programme", logement: "logement" })[k]}${n > 1 ? "s" : ""}`).join(" · ")}</p> : <p className="text-sm text-ink-mute">Aucun favori.</p>}
        </Panel>
      </div>
      <p className="mt-4 text-xs text-ink-mute">Consultation enregistrée dans le journal d&apos;audit. Données personnelles : à n&apos;utiliser que pour accompagner cet utilisateur.</p>
    </div>
  );
}
