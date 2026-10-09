"use client";
import { CheckCircle2, GraduationCap, KeyRound, Save, Sparkles, UserRound, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Button, Loading, PageHeader, Panel, StatusBadge, useToast } from "@/components/app/kit";
import { Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { PAYS_NOM, competences, pays, series, type PaysCode } from "@/lib/data";

type Me = { firstName: string; lastName: string; email: string | null; phone: string | null; birthYear: number | null; country: string | null; city: string | null; emailVerifiedAt: string | null; phoneVerifiedAt: string | null;
  profile: { level: string | null; serie: string | null; currentSchool: string | null; diploma: string | null; skills: string[]; interests: string[]; goals: string | null; riasec: { top: string[] } | null; preferences: { pays?: string[]; budgetAnnuel?: number; devise?: string; logement?: { budget?: number; type?: string; colocation?: boolean } } } | null };
type Guardian = { link: { id: string; status: string; consentAt: string | null; inviteEmail: string | null; invitePhone: string | null; relation: string }; parent: { firstName: string; lastName: string } | null }[];
const LEVELS: [string, string][] = [["3e", "3e / fin de collège"], ["2nde", "Seconde"], ["1re", "Première"], ["terminale", "Terminale"], ["bachelier", "Bachelier·ère"], ["bac+1", "Bac+1"], ["bac+2", "Bac+2"], ["bac+3", "Bac+3"], ["bac+4", "Bac+4 / 5"]];

export function Profile() {
  const toast = useToast();
  const me = useApi<Me>("/moi");
  const g = useApi<Guardian>("/moi/tuteurs");
  const save = useAction();
  const inv = useAction();
  const [f, setF] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [prefPays, setPrefPays] = useState<string[]>([]);
  const [coloc, setColoc] = useState(false);
  const [contact, setContact] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  useEffect(() => {
    const d = me.data;
    if (!d) return;
    const p = d.profile;
    setF({ firstName: d.firstName, lastName: d.lastName, birthYear: d.birthYear ? String(d.birthYear) : "", country: d.country ?? "", city: d.city ?? "", level: p?.level ?? "", serie: p?.serie ?? "", currentSchool: p?.currentSchool ?? "", diploma: p?.diploma ?? "", goals: p?.goals ?? "", budgetAnnuel: p?.preferences.budgetAnnuel ? String(p.preferences.budgetAnnuel) : "", logementBudget: p?.preferences.logement?.budget ? String(p.preferences.logement.budget) : "", logementType: p?.preferences.logement?.type ?? "" });
    setSkills(p?.skills ?? []); setPrefPays(p?.preferences.pays ?? []); setColoc(!!p?.preferences.logement?.colocation);
  }, [me.data]);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const fields = [f.country, f.city, f.birthYear, f.level, f.serie, f.currentSchool, skills.length ? "x" : "", prefPays.length ? "x" : ""];
  const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const seriesPays = useMemo(() => series.filter((s) => !f.country || s.pays === f.country), [f.country]);
  const villes = pays.find((p) => p.id === f.country)?.villes_universitaires ?? [];
  const minor = !!f.birthYear && new Date().getFullYear() - Number(f.birthYear) < 18;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.run(async () => {
      await api("/moi", { method: "PATCH", body: {
        firstName: f.firstName, lastName: f.lastName, birthYear: f.birthYear ? Number(f.birthYear) : undefined, country: f.country || undefined, city: f.city || undefined,
        level: f.level || undefined, serie: f.serie || undefined, currentSchool: f.currentSchool || undefined, diploma: f.diploma || undefined, goals: f.goals || undefined, skills,
        preferences: { pays: prefPays, budgetAnnuel: f.budgetAnnuel ? Number(f.budgetAnnuel) : undefined, logement: { budget: f.logementBudget ? Number(f.logementBudget) : undefined, type: f.logementType || undefined, colocation: coloc } },
      } });
      toast("Profil enregistré");
      me.reload();
    });
  };
  const invite = () => inv.run(async () => { const r = await api<{ devCode?: string }>("/moi/tuteurs", { body: { contact } }); setDevCode(r.devCode ?? null); setContact(""); g.reload(); toast("Invitation envoyée"); });

  if (!me.data) return <Loading />;
  return (
    <form onSubmit={submit}>
      <PageHeader title="Mon profil" sub="Plus ton profil est complet, plus tes recommandations sont justes." actions={<Button icon={Save} loading={save.pending}>Enregistrer</Button>} />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Panel title="Identité" icon={UserRound}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Prénom">{(i) => <Input id={i} value={f.firstName ?? ""} onChange={set("firstName")} required />}</Field>
              <Field label="Nom">{(i) => <Input id={i} value={f.lastName ?? ""} onChange={set("lastName")} required />}</Field>
              <Field label="Année de naissance">{(i) => <Input id={i} type="number" value={f.birthYear ?? ""} onChange={set("birthYear")} />}</Field>
              <Field label="Pays">{(i) => <Select id={i} value={f.country ?? ""} onChange={(e) => setF((x) => ({ ...x, country: e.target.value, serie: "" }))} placeholder="Choisir…" options={(["GA", "MA", "SN"] as const).map((c) => [c, PAYS_NOM[c]])} />}</Field>
              <Field label="Ville">{(i) => <><Input id={i} list="villes-p" value={f.city ?? ""} onChange={set("city")} /><datalist id="villes-p">{villes.map((v) => <option key={v} value={v} />)}</datalist></>}</Field>
              <Field label="Contact">{(i) => <Input id={i} value={me.data!.email ?? me.data!.phone ?? ""} disabled />}</Field>
            </div>
          </Panel>
          <Panel title="Scolarité" icon={GraduationCap}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Niveau">{(i) => <Select id={i} value={f.level ?? ""} onChange={set("level")} placeholder="Choisir…" options={LEVELS} />}</Field>
              <Field label="Série">{(i) => <Select id={i} value={f.serie ?? ""} onChange={set("serie")} placeholder="Choisir…" options={seriesPays.map((s) => [s.id, `${s.code} — ${s.intitule}`])} />}</Field>
              <Field label="Établissement actuel">{(i) => <Input id={i} value={f.currentSchool ?? ""} onChange={set("currentSchool")} />}</Field>
              <Field label="Dernier diplôme">{(i) => <Input id={i} value={f.diploma ?? ""} onChange={set("diploma")} placeholder="Ex. BEPC, baccalauréat…" />}</Field>
            </div>
            <Field label="Compétences" hint="Choisis jusqu'à 12 compétences.">{() => (
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-3">
                {competences.map((c) => { const on = skills.includes(c.id); return <button type="button" key={c.id} onClick={() => setSkills((s) => on ? s.filter((x) => x !== c.id) : s.length < 12 ? [...s, c.id] : s)} className={`chip ${on ? "bg-brand-600 text-white" : "bg-[#f1f4fb] text-ink-soft hover:bg-brand-50"}`}>{c.libelle}</button>; })}
              </div>)}</Field>
            <Field label="Mon projet professionnel">{(i) => <Textarea id={i} value={f.goals ?? ""} onChange={set("goals")} placeholder="Ex. devenir ingénieur logiciel dans une fintech africaine." />}</Field>
          </Panel>
          <Panel title="Préférences d'études et de logement" icon={KeyRound}>
            <Field label="Pays envisagés">{() => <div className="flex gap-2">{(["GA", "MA", "SN"] as PaysCode[]).map((c) => { const on = prefPays.includes(c); return <button type="button" key={c} onClick={() => setPrefPays((s) => on ? s.filter((x) => x !== c) : [...s, c])} className={`chip px-3 py-1.5 ${on ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"}`}>{PAYS_NOM[c]}</button>; })}</div>}</Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Budget scolarité / an">{(i) => <Input id={i} type="number" value={f.budgetAnnuel ?? ""} onChange={set("budgetAnnuel")} placeholder="en devise locale" />}</Field>
              <Field label="Budget logement / mois">{(i) => <Input id={i} type="number" value={f.logementBudget ?? ""} onChange={set("logementBudget")} />}</Field>
              <Field label="Type de logement">{(i) => <Select id={i} value={f.logementType ?? ""} onChange={set("logementType")} placeholder="Indifférent" options={[["studio", "Studio"], ["chambre", "Chambre"], ["colocation", "Colocation"], ["residence", "Résidence"]]} />}</Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={coloc} onChange={(e) => setColoc(e.target.checked)} className="h-4 w-4 accent-brand-600" />J&apos;accepte la colocation</label>
          </Panel>
          <FormError error={save.error} />
        </div>
        <div className="flex flex-col gap-6">
          <section className="card flex flex-col items-center gap-3 rounded-[22px] p-6 text-center">
            <Avatar name={`${f.firstName ?? ""} ${f.lastName ?? ""}`} size={72} />
            <b className="text-lg">{f.firstName} {f.lastName}</b>
            <div className="w-full"><div className="mb-1 flex justify-between text-xs font-bold"><span>Profil complété</span><span>{completion} %</span></div><div className="h-2 rounded-full bg-[#e8edfa]"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${completion}%` }} /></div></div>
            {me.data.profile?.riasec ? <span className="chip bg-[#f1edff] text-[#6a3df0]"><Sparkles size={13} className="mr-1 inline" />Profil {me.data.profile.riasec.top.join("·")}</span> : <a href="/orientation" className="text-sm font-bold text-brand-600">Passer le test d&apos;orientation →</a>}
            {(me.data.emailVerifiedAt || me.data.phoneVerifiedAt) && <span className="flex items-center gap-1 text-xs font-bold text-[#0f8a46]"><CheckCircle2 size={14} />Coordonnées vérifiées</span>}
          </section>
          <section id="parent" className="scroll-mt-24">
            <Panel title="Parent / tuteur" icon={UsersRound} tone="sun">
              {(g.data ?? []).map((x) => (
                <div key={x.link.id} className="flex items-center justify-between gap-2 rounded-xl bg-white p-3 text-[13px]">
                  <span><b className="block">{x.parent ? `${x.parent.firstName} ${x.parent.lastName}` : x.link.inviteEmail ?? x.link.invitePhone}</b><span className="text-ink-mute">{x.link.status === "actif" ? (x.link.consentAt ? "Consentement donné" : "Lié · consentement en attente") : "Invitation envoyée"}</span></span>
                  <StatusBadge status={x.link.status === "actif" ? "actif" : "en_attente"} label={x.link.status === "actif" ? "Lié" : "Invité"} />
                </div>
              ))}
              {minor && !(g.data ?? []).some((x) => x.link.consentAt) && <Alert tone="warn">Tu as moins de 18 ans : le consentement de ton parent est nécessaire pour candidater, payer et réserver.</Alert>}
              <div className="flex flex-col gap-2">
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="E-mail ou téléphone de ton parent" aria-label="Contact du parent" />
                <Button type="button" variant="sun" onClick={invite} loading={inv.pending} disabled={!contact}>Inviter mon parent</Button>
                {devCode && <span className="text-xs text-ink-mute">Code d&apos;invitation (test) : <b>{devCode}</b></span>}
                <FormError error={inv.error} />
              </div>
            </Panel>
          </section>
        </div>
      </div>
    </form>
  );
}
