"use client";
/* eslint-disable @next/next/no-img-element -- logos déjà optimisés */
import Link from "@/components/ui/Link";
import { CheckCircle2, Eye, MailOpen, ShieldCheck, Target, Users, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, dateFr, useToast } from "@/components/app/kit";
import { Check, Field, FormError, Input, Select } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { domaines, labelById, metiers, type Label } from "@/lib/data";

type Attentes = {
  serie: string | null; average: number | null; mention: string | null; bacYear: number | null; averageVerified: boolean; domain: string | null; targetJobs: string[]; startYear: number | null;
  villes: string[]; budgetAnnuel: number | null; devise: string; funding: { garant?: boolean; bourse?: boolean; pret?: boolean; autofinance?: boolean };
  visibleToSchools: boolean; mineur: boolean; parentConsent: boolean; parents: number; invitationsNonLues: number;
};
const AN = new Date().getFullYear();
const MENTIONS: [string, string][] = [["", "—"], ["passable", "Passable"], ["assez_bien", "Assez bien"], ["bien", "Bien"], ["tres_bien", "Très bien"]];
const DEVISES: [string, string][] = [["XAF", "F CFA (XAF)"], ["XOF", "F CFA (XOF)"], ["MAD", "Dirham (MAD)"], ["EUR", "Euro"]];

/** Profil : résultats, projet, financement et visibilité auprès des établissements (maquettes « Premium », écran 7). */
export function MesAttentes() {
  const toast = useToast();
  const r = useApi<Attentes>("/moi/attentes");
  const [f, setF] = useState<Attentes | null>(null);
  const a = useAction();
  useEffect(() => { if (r.data) setF(r.data); }, [r.data]);
  if (!f) return r.loading ? <Loading /> : null;
  const set = <K extends keyof Attentes>(k: K, v: Attentes[K]) => setF({ ...f, [k]: v });
  const enregistrer = (patch: Partial<Attentes> = {}) => a.run(async () => {
    const x = { ...f, ...patch };
    const d = await api<Attentes>("/moi/attentes", { method: "PATCH", body: { average: x.average, mention: x.mention || null, bacYear: x.bacYear, domain: x.domain, targetJobs: x.targetJobs, startYear: x.startYear, budgetAnnuel: x.budgetAnnuel, devise: x.devise, funding: x.funding, visibleToSchools: x.visibleToSchools } });
    setF(d); r.setData(d); toast("Profil enregistré");
  });
  const metiersDomaine = metiers.filter((m) => !f.domain || m.domaine === f.domain).map((m) => [m.id, m.nom] as [string, string]);
  return (
    <div className="mt-6 flex flex-col gap-5" id="attentes">
      <div className="grid items-start gap-5 xl:grid-cols-3">
        <Panel title="Mes résultats" icon={CheckCircle2}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Moyenne /20">{(id) => <Input id={id} type="number" step="0.01" min={0} max={20} value={f.average ?? ""} onChange={(e) => set("average", e.target.value === "" ? null : Number(e.target.value))} />}</Field>
            <Field label="Mention">{(id) => <Select id={id} value={f.mention ?? ""} onChange={(e) => set("mention", e.target.value || null)} options={MENTIONS} />}</Field>
            <Field label="Année du bac">{(id) => <Input id={id} type="number" min={2000} max={AN + 3} value={f.bacYear ?? ""} onChange={(e) => set("bacYear", e.target.value ? Number(e.target.value) : null)} />}</Field>
          </div>
          <p className="text-xs text-ink-mute">Série du bac : rubrique « Scolarité » ci-dessus.</p>
          {f.averageVerified ? <p className="flex items-center gap-1.5 text-xs font-bold text-[#0f8a46]"><CheckCircle2 size={14} />Vérifiée sur ton relevé de notes</p>
            : <p className="text-xs text-ink-mute">Dépose ton relevé de notes dans <Link href="/espace/documents" className="font-bold text-brand-600">Mes documents</Link> : l&apos;équipe Navigoal vérifie ta moyenne.</p>}
        </Panel>
        <Panel title="Mon projet" icon={Target}>
          <Field label="Domaine">{(id) => <Select id={id} value={f.domain ?? ""} onChange={(e) => set("domain", e.target.value || null)} options={[["", "—"], ...domaines.map((d) => [d.id, d.libelle] as [string, string])]} />}</Field>
          <Field label="Métier visé">{(id) => <Select id={id} value={f.targetJobs[0] ?? ""} onChange={(e) => set("targetJobs", e.target.value ? [e.target.value] : [])} options={[["", "—"], ...metiersDomaine]} />}</Field>
          <Field label="Rentrée souhaitée">{(id) => <Select id={id} value={String(f.startYear ?? "")} onChange={(e) => set("startYear", e.target.value ? Number(e.target.value) : null)} options={[["", "—"], ...[AN, AN + 1, AN + 2, AN + 3].map((n) => [String(n), String(n)] as [string, string])]} />}</Field>
        </Panel>
        <Panel title="Mon financement" icon={Wallet}>
          <div className="grid grid-cols-[1fr_130px] gap-2">
            <Field label="Budget par an (scolarité + vie)">{(id) => <Input id={id} type="number" min={0} value={f.budgetAnnuel ?? ""} onChange={(e) => set("budgetAnnuel", e.target.value ? Number(e.target.value) : null)} />}</Field>
            <Field label="Monnaie">{(id) => <Select id={id} value={f.devise} onChange={(e) => set("devise", e.target.value)} options={DEVISES} />}</Field>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Check checked={!!f.funding.garant} onChange={(v) => set("funding", { ...f.funding, garant: v })}>Un parent se porte garant</Check>
            <Check checked={!!f.funding.bourse} onChange={(v) => set("funding", { ...f.funding, bourse: v })}>Je cherche une bourse</Check>
            <Check checked={!!f.funding.pret} onChange={(v) => set("funding", { ...f.funding, pret: v })}>Prêt étudiant</Check>
            <Check checked={!!f.funding.autofinance} onChange={(v) => set("funding", { ...f.funding, autofinance: v })}>Je finance moi-même</Check>
          </div>
          <p className="text-xs text-ink-mute">Les écoles voient seulement si ton budget couvre leurs frais, jamais le montant.</p>
        </Panel>
      </div>
      <section className={`card flex flex-col gap-3 rounded-[22px] p-5 ${f.visibleToSchools ? "border-2 border-brand-500" : ""}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Eye size={20} className="text-brand-600" /><b className="flex-1 text-lg">Être visible des établissements</b>
          <button type="button" role="switch" aria-checked={f.visibleToSchools} aria-label="Être visible des établissements" onClick={() => enregistrer({ visibleToSchools: !f.visibleToSchools })}
            className={`relative h-7 w-12 rounded-full transition-colors ${f.visibleToSchools ? "bg-brand-600" : "bg-[#d5dbea]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${f.visibleToSchools ? "left-6" : "left-1"}`} /></button>
        </div>
        <p className="text-sm text-ink-mute">Les écoles reconnues peuvent t&apos;inviter à candidater. Ton nom et tes coordonnées restent cachés tant que tu n&apos;acceptes pas une invitation. Tu peux arrêter à tout moment.</p>
        {f.visibleToSchools && f.mineur && !f.parentConsent && <Alert tone="warn" title="Accord de ton parent nécessaire">{f.parents ? "Tu as moins de 18 ans : ton parent a reçu une demande de confirmation dans son espace." : "Tu as moins de 18 ans : invite d'abord un parent depuis ton profil, il devra confirmer."}</Alert>}
        {f.visibleToSchools && (!f.mineur || f.parentConsent) && <p className="flex items-center gap-1.5 text-sm font-bold text-[#0f8a46]"><ShieldCheck size={15} />Tu es visible des établissements Premium.</p>}
        {f.invitationsNonLues > 0 && <Link href="/espace/invitations" className="btn-ghost self-start text-[13px]"><MailOpen size={15} />{f.invitationsNonLues} invitation{f.invitationsNonLues > 1 ? "s" : ""} à lire</Link>}
      </section>
      <FormError error={a.error} />
      <Button className="self-start" loading={a.pending} onClick={() => enregistrer()}>Enregistrer mes attentes</Button>
    </div>
  );
}

type Invitation = { i: { id: string; status: string; createdAt: string }; p: { subject: string; body: string; link: string | null }; e: { id: string; nom: string; sigle: string; logo: string | null; label: string | null; ville: string }; offreLibelle: string; nouvelle: boolean; conversation: string | null };

export function Invitations() {
  const toast = useToast();
  const r = useApi<Invitation[]>("/moi/invitations");
  const a = useAction();
  const repondre = (id: string, interesse: boolean) => a.run(async () => { const x = await api<{ conversation: string | null }>(`/moi/invitations/${id}`, { body: { interesse } }); r.reload(); toast(interesse ? "L'école a reçu ta réponse et peut t'écrire" : "Invitation déclinée"); if (x.conversation) location.href = `/messages/${x.conversation}`; });
  const arreter = () => a.run(async () => { await api("/moi/visibilite/arreter", { method: "POST" }); toast("Les écoles ne pourront plus te contacter"); });
  return (
    <>
      <PageHeader title="Invitations des écoles" sub="Des établissements reconnus t'invitent à découvrir leurs formations, d'après ton profil." />
      <FormError error={a.error} />
      {r.loading ? <Loading /> : !r.data?.length ? <Empty icon={MailOpen} title="Aucune invitation pour l'instant" text="Active « Être visible des établissements » dans ton profil pour que les écoles puissent t'inviter." action={<Link href="/espace/profil#attentes" className="btn-primary">Mon profil</Link>} /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {r.data.map((x) => (
            <article key={x.i.id} className="card flex flex-col gap-3 rounded-[22px] p-5">
              <div className="flex items-center gap-3">{x.e.logo && <img src={x.e.logo} alt="" className="h-11 w-11 rounded-xl border border-slate-100 object-contain" />}
                <span className="min-w-0 flex-1"><b className="block">{x.e.nom}</b><span className="text-xs text-ink-mute">{x.offreLibelle} · {dateFr(x.i.createdAt)}</span></span>{x.nouvelle && <Chip>Nouvelle</Chip>}</div>
              <b className="text-sm">{x.p.subject}</b>
              <p className="whitespace-pre-wrap text-sm text-ink-soft">{x.p.body}</p>
              <div className="flex flex-wrap gap-1.5">{x.e.label && <Chip tone="green">{labelById[x.e.label as Label]?.libelle ?? x.e.label}</Chip>}<Chip tone="grey">{x.e.ville}</Chip></div>
              {x.i.status === "interessee" ? <div className="flex flex-wrap gap-2"><Chip tone="green">Tu es intéressé·e</Chip>{x.conversation && <Link href={`/messages/${x.conversation}`} className="btn-primary px-3.5 py-2 text-[13px]">Écrire à l&apos;école</Link>}</div>
                : x.i.status === "refusee" ? <Chip tone="grey">Invitation déclinée</Chip>
                : <div className="flex gap-2"><Button className="flex-1" onClick={() => repondre(x.i.id, true)} loading={a.pending}>Ça m&apos;intéresse</Button><Button variant="ghost" onClick={() => repondre(x.i.id, false)}>Non merci</Button></div>}
              <span className="flex flex-wrap gap-3 text-xs">{x.p.link && <Link href={x.p.link} className="font-bold text-brand-600">Voir la formation</Link>}<Link href={`/etablissements/${x.e.id}/`} className="font-bold text-brand-600">Voir l&apos;école</Link></span>
            </article>
          ))}
        </div>
      )}
      <Alert tone="info" title="Ta vie privée">En cliquant « Ça m&apos;intéresse », l&apos;école voit ton prénom, ton nom et ton profil, et peut t&apos;écrire dans ta messagerie Navigoal. Les autres écoles ne voient rien de plus.
        <button onClick={arreter} className="mt-2 block font-bold text-brand-600 underline-offset-2 hover:underline">Ne plus être contacté par les écoles</button></Alert>
    </>
  );
}

type Enfant = { id: string; firstName: string; birthYear: number | null; visible: boolean | null; accord: string | null };

/** Parent : accord de visibilité de l'enfant mineur auprès des écoles. */
export function VisibiliteEnfants() {
  const toast = useToast();
  const r = useApi<Enfant[]>("/parent/visibilite");
  const a = useAction();
  const enfants = (r.data ?? []).filter((e) => e.visible || e.accord);
  if (!enfants.length) return null;
  const decider = (id: string, accord: boolean) => a.run(async () => { await api(`/parent/enfants/${id}/visibilite`, { body: { accord } }); r.reload(); toast(accord ? "Accord enregistré" : "Visibilité retirée"); });
  return (
    <Panel title="Visibilité auprès des établissements" icon={Users} tone="blue">
      {enfants.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4">
          <span className="min-w-[200px] flex-1 text-sm"><b>{e.firstName}</b> souhaite que les écoles reconnues puissent l&apos;inviter à candidater. Son nom et ses coordonnées restent cachés tant qu&apos;il n&apos;accepte pas une invitation.</span>
          {e.accord ? <><Chip tone="green">Accord donné le {dateFr(e.accord)}</Chip><Button size="sm" variant="ghost" onClick={() => decider(e.id, false)}>Retirer</Button></>
            : <><Button size="sm" onClick={() => decider(e.id, true)} loading={a.pending}>Donner mon accord</Button><Button size="sm" variant="ghost" onClick={() => decider(e.id, false)}>Refuser</Button></>}
        </div>
      ))}
      <FormError error={a.error} />
    </Panel>
  );
}
