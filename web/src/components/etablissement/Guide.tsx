"use client";
import Link from "@/components/ui/Link";
import { BookOpen, ChevronDown, CheckCircle2, Circle, Crown, FileDown, Inbox, LifeBuoy, MessageCircle, MessagesSquare, ShieldCheck, Users, Video } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Loading, PageHeader, Panel } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { PRIX_PREMIUM_MAD } from "@/lib/premium";
import { useEcole } from "./EcoleContext";

type Progres = { etapes: Record<"fiche" | "formations" | "campagne" | "candidature" | "message", boolean>; faites: number; total: number };
const ETAPES: [keyof Progres["etapes"], string, string, string][] = [
  ["fiche", "Compléter la fiche de l'établissement", "Présentation, adresse, contacts, photos", "/etablissement/fiche"],
  ["formations", "Vérifier vos formations et leurs frais", "Frais de scolarité et de dossier confirmés", "/etablissement/formations"],
  ["campagne", "Publier une campagne d'admission", "Dates, places, pièces demandées", "/etablissement/campagnes"],
  ["candidature", "Traiter votre première candidature", "Vérifier, demander une pièce, décider", "/etablissement/candidatures"],
  ["message", "Répondre à un candidat", "Messagerie intégrée, copie par e-mail", "/messages"],
];
const prix = PRIX_PREMIUM_MAD.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const FICHES: [typeof Inbox, string, string, ReactNode][] = [
  [Inbox, "Traiter une candidature", "Les statuts pas à pas : envoyée → en vérification → dossier complet → décision.", <>
    <p>Chaque candidature arrive avec les pièces du candidat (identité, relevés de notes, diplôme, photo) et, le cas échéant, le paiement des frais de dossier.</p>
    <ol className="list-decimal space-y-1 pl-5"><li><b>En vérification</b> : vous contrôlez les pièces.</li><li><b>Pièce demandée</b> : choisissez la pièce manquante ; le candidat est prévenu par e-mail et SMS et la dépose depuis son espace.</li><li><b>Dossier complet</b>, puis <b>en traitement</b> (comité, entretien, concours).</li><li><b>Décision</b> : acceptée, liste d&apos;attente ou refusée, avec un message au candidat.</li></ol>
    <p>Le bordereau PDF et l&apos;export CSV sont disponibles depuis la liste des candidatures.</p></>],
  [MessagesSquare, "Échanger avec les candidats", "Un fil de discussion par candidature, copie par e-mail.", <>
    <p>Le candidat (et ses parents) peuvent vous écrire depuis leur candidature. Vous répondez dans <b>Messages</b> ; ils sont prévenus par e-mail.</p>
    <p>Répondez sous 48 h : c&apos;est ce qui rassure le plus les familles et transforme une candidature en inscription.</p></>],
  [LifeBuoy, "Le mode accompagné Navigoal", "L'équipe Navigoal vous aide pendant votre prise en main.", <>
    <p>Sur votre demande, l&apos;équipe Navigoal répond aux candidats et fait avancer les dossiers <b>en votre nom</b>, avec la mention « Équipe Navigoal, pour le compte de » votre établissement.</p>
    <p>Vous êtes prévenu de chaque action, vous voyez tous les échanges et vous reprenez la main quand vous voulez.</p></>],
  [Crown, `L'offre Premium (${prix} MAD / an)`, "Choisir et attirer les bons profils.", <>
    <ul className="list-disc space-y-1 pl-5"><li><b>Sélection</b> des candidatures par résultats scolaires, projet et capacité de financement, avec un score d&apos;adéquation.</li><li><b>Vivier de candidats</b> : élèves qui ont accepté d&apos;être visibles des écoles (profils anonymes jusqu&apos;à leur réponse).</li><li><b>Campagnes de prospection</b> relues par Navigoal, avec statistiques.</li></ul>
    <p><Link href="/etablissement/vivier" className="font-bold text-brand-600">Découvrir l&apos;offre</Link></p></>],
  [Users, "Ajouter un collaborateur", "Un identifiant par personne de votre service admissions.", <>
    <p>Écrivez à <a className="font-bold text-brand-600" href="mailto:etablissements@navigoal.net">etablissements@navigoal.net</a> avec le nom et l&apos;e-mail de la personne : nous créons son accès, rattaché à votre établissement.</p></>],
  [ShieldCheck, "Sécurité et données", "Des données réservées à l'admission.", <>
    <p>Les données et pièces des candidats ne servent qu&apos;à l&apos;étude de leur candidature : pas de réutilisation hors Navigoal, pas de transmission à des tiers.</p>
    <p>Changez votre mot de passe depuis <Link href="/compte" className="font-bold text-brand-600">Paramètres</Link> ; chaque collaborateur a son propre accès.</p></>],
];
const FAQ: [string, ReactNode][] = [
  ["Combien coûte Navigoal pour un établissement ?", <>La fiche, les formations, la réception et le traitement des candidatures et la messagerie sont <b>gratuits</b>. L&apos;offre Premium ({prix} MAD par an) ajoute la sélection avancée, le vivier de candidats et la prospection.</>],
  ["Qui voit les candidatures et les documents des candidats ?", "Uniquement les comptes de votre établissement et l'équipe Navigoal (pour le support et le mode accompagné). Les autres écoles ne voient rien."],
  ["Comment sont fixés les frais de dossier et quand sont-ils versés ?", "Vous fixez les frais de dossier de chaque formation (rubrique Formations). Le candidat les règle en ligne lors de l'envoi de sa candidature. Pour les modalités de reversement, écrivez à etablissements@navigoal.net."],
  ["Un candidat dit ne pas avoir reçu de réponse : que faire ?", "Ouvrez sa candidature et répondez dans le fil de discussion ; il reçoit votre message par e-mail. Si vous manquez de temps, demandez le mode accompagné : l'équipe Navigoal répondra pour vous."],
];

function Repliable({ titre, children, ouvert = false }: { titre: ReactNode; children: ReactNode; ouvert?: boolean }) {
  const [o, setO] = useState(ouvert);
  return (
    <div className="border-b border-[#eef1f8] last:border-0">
      <button type="button" onClick={() => setO(!o)} aria-expanded={o} className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold print:pointer-events-none">{titre}<ChevronDown size={16} className={`shrink-0 text-ink-mute transition print:hidden ${o ? "rotate-180" : ""}`} /></button>
      <div className={`pb-4 text-sm text-ink-soft ${o ? "" : "hidden print:block"}`}>{children}</div>
    </div>
  );
}

/** Guide de la plateforme (maquettes « accès », écran 3) : premiers pas suivis, fiches pratiques, questions fréquentes. */
export function GuidePlateforme() {
  const { eid, link } = useEcole();
  const p = useApi<Progres>(`/ecole/${eid}/guide`);
  const contact = useApi<{ whatsapp: string | null }>("/contact");
  const [fiche, setFiche] = useState<number | null>(null);
  const ecrire = contact.data?.whatsapp ? `https://wa.me/${contact.data.whatsapp}?text=${encodeURIComponent("Bonjour, j'ai une question sur l'espace établissement Navigoal.")}` : "mailto:etablissements@navigoal.net";
  return (
    <>
      <PageHeader title="Guide de la plateforme" sub="Tout ce qu'il faut pour recevoir et traiter vos candidatures sur Navigoal."
        actions={<><button onClick={() => window.print()} className="btn-ghost"><FileDown size={17} />Télécharger le guide (PDF)</button><a href={ecrire} target="_blank" rel="noopener noreferrer" className="btn-sun"><MessageCircle size={17} />Une question ? Écrire à Navigoal</a></>} />
      <div className="grid items-start gap-5 xl:grid-cols-[400px_1fr]">
        <Panel title="Premiers pas" icon={BookOpen} action={p.data && <span className="chip bg-brand-50 text-brand-700">{p.data.faites} / {p.data.total}</span>}>
          {!p.data ? <Loading /> : <>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e6eaf3]"><span className="block h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(p.data.faites / p.data.total) * 100}%` }} /></div>
            <ul className="flex flex-col gap-4">{ETAPES.map(([k, t, d, h]) => {
              const ok = p.data!.etapes[k];
              return (
                <li key={k} className="flex items-start gap-3">
                  {ok ? <CheckCircle2 size={22} className="shrink-0 text-[#0f8a46]" /> : <Circle size={22} className="shrink-0 text-[#c3c9d6]" />}
                  <span className="flex-1"><b className={`block text-sm ${ok ? "text-ink-mute line-through" : ""}`}>{t}</b><span className="text-xs text-ink-mute">{d}</span></span>
                  {!ok && <Link href={link(h)} className="btn-ghost px-3 py-1.5 text-xs print:hidden">Faire</Link>}
                </li>
              );
            })}</ul>
          </>}
          <a href={ecrire} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 rounded-2xl border border-[#ffe59a] bg-[#fffbea] p-4 text-[13px]"><Video size={17} className="mt-0.5 shrink-0 text-[#a55a00]" /><span><b>Démonstration en visio (30 min)</b> avec l&apos;équipe Navigoal pour votre service admissions. <span className="font-extrabold text-brand-600">Réserver un créneau</span></span></a>
        </Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {FICHES.map(([I, t, d, contenu], i) => (
            <article key={t} className="card flex flex-col gap-3 rounded-[20px] p-5">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={18} /></span><b>{t}</b></div>
              <p className="text-[13px] text-ink-mute">{d}</p>
              <div className={`flex flex-col gap-2 text-[13px] text-ink-soft ${fiche === i ? "" : "hidden print:flex"}`}>{contenu}</div>
              <button onClick={() => setFiche(fiche === i ? null : i)} className="self-start text-[13px] font-extrabold text-brand-600 print:hidden">{fiche === i ? "Refermer" : "Lire la fiche →"}</button>
            </article>
          ))}
        </div>
      </div>
      <Panel title="Questions fréquentes" className="mt-5">
        <div>{FAQ.map(([q, r]) => <Repliable key={q} titre={q}>{r}</Repliable>)}</div>
      </Panel>
    </>
  );
}
