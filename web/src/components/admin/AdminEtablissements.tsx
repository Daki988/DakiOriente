"use client";
import Link from "next/link";
import { Award, BadgeCheck, Ban, Building2, Check as CheckIcon, ExternalLink, RotateCcw, Search, Star, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Dialog, Loading, Panel, StatusBadge, Table, Tabs, useToast } from "@/components/app/kit";
import { FormError, Input, Select } from "@/components/app/form";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { AdminHeader, Flag, LoadError, Pager, Reveal, Toggle, nf, qs, useDebounced } from "./shared";
import { LABELS, labelById, type Label } from "@/lib/data";

type E = { id: string; nom: string; sigle: string; pays: string; ville: string; typeLibelle: string; statut: string; siteWeb: string | null; email: string | null; phone: string | null; logo: string | null; status: "importe" | "revendique" | "verifie" | "suspendu"; featured: boolean; plan: string; updatedAt: string; label: Label | null; recognition: string | null };
type Row = { e: E; members: number; programs: number };
type Patch = { status?: E["status"]; featured?: boolean; plan?: string; label?: Label | null; recognition?: string | null };

const PLANS: { id: string; nom: string; prix: string; items: string[]; dark?: boolean }[] = [
  { id: "gratuit", nom: "Gratuit", prix: "0 MAD", items: ["Fiche vérifiée", "Candidatures en ligne", "Statistiques de base"] },
  { id: "partenaire", nom: "Partenaire", prix: "5 000 MAD / an", items: ["Mise en avant ville / domaine", "Campagnes & événements", "Statistiques avancées"], dark: true },
  { id: "premium", nom: "Premium", prix: "Sur devis", items: ["Page d'accueil", "Tournées & salons", "Chargé de compte"] },
];
const PLAN_OPTS: [string, string][] = PLANS.map((p) => [p.id, p.nom]);

export function AdminEtablissements() {
  const toast = useToast();
  const [tab, setTab] = useState<"" | "revendique" | "verifie" | "importe" | "suspendu">("");
  const [label, setLabel] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q.trim());
  const all = useApi<Row[]>("/admin/etablissements");
  const list = useApi<Row[]>(`/admin/etablissements${qs({ statut: tab, label, q: dq })}`);
  const [sel, setSel] = useState<Row | null>(null);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [tab, label, dq]);
  const act = useAction();

  const counts = useMemo(() => {
    const c: Record<string, number> = { "": 0, revendique: 0, verifie: 0, importe: 0, suspendu: 0 };
    all.data?.forEach((r) => { c[""]++; c[r.e.status]++; });
    return c;
  }, [all.data]);
  const plans = useMemo(() => { const c: Record<string, number> = {}; all.data?.forEach((r) => (c[r.e.plan] = (c[r.e.plan] ?? 0) + 1)); return c; }, [all.data]);
  const featured = useMemo(() => all.data?.filter((r) => r.e.featured) ?? [], [all.data]);

  const patch = async (r: Row, p: Patch, msg: string) => {
    const res = await act.run(() => api<E>(`/admin/etablissements/${r.e.id}`, { method: "PATCH", body: p }));
    if (res) {
      toast(msg);
      const upd = (rows?: Row[]) => rows?.map((x) => (x.e.id === r.e.id ? { ...x, e: { ...x.e, ...res } } : x));
      list.setData(upd); all.setData(upd);
      setSel((s) => (s && s.e.id === r.e.id ? { ...s, e: { ...s.e, ...res } } : s));
    }
    return !!res;
  };

  return (
    <div className="min-w-0">
      <AdminHeader title="Établissements" sub={all.data ? `${nf(counts[""])} établissements au catalogue · ${nf(counts.revendique)} revendication${counts.revendique > 1 ? "s" : ""} en attente` : "Catalogue, vérification, mise en avant et plans"} />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onChange={setTab} items={[["", `Tous (${counts[""]})`], ["revendique", `Revendiqués (${counts.revendique})`], ["verifie", `Vérifiés (${counts.verifie})`], ["importe", `Importés (${counts.importe})`], ["suspendu", `Suspendus (${counts.suspendu})`]]} />
        <div className="grid grid-cols-[1fr_auto] gap-2.5 sm:flex">
          <label className="relative sm:w-64"><span className="sr-only">Rechercher un établissement</span><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou sigle…" className="pl-10" /></label>
          <Select aria-label="Label" value={label} onChange={(e) => setLabel(e.target.value)} options={[...LABELS.map((l) => [l.id, l.court] as [string, string]), ["aucun", "Non publiés"]]} placeholder="Tous labels" className="w-44" />
        </div>
      </div>

      <Panel className="mb-5">
        {list.error ? <LoadError error={list.error} reload={list.reload} /> : list.loading && !list.data ? <Loading /> : list.data && (
          <><Table rows={list.data.slice((page - 1) * 20, page * 20)} rowKey={(r) => r.e.id} onRow={setSel} empty="Aucun établissement ne correspond." cols={[
            { h: "Établissement", c: (r) => <div className="flex items-center gap-3"><EtabLogo e={r.e} size={38} /><div className="flex min-w-0 flex-col"><b className="truncate">{r.e.sigle}</b><span className="max-w-[260px] truncate text-xs text-ink-mute">{r.e.nom}</span></div></div> },
            { h: "Ville", c: (r) => <span className="flex max-w-[180px] items-center gap-1.5" title={r.e.ville}><Flag code={r.e.pays} /><span className="truncate">{r.e.ville}</span></span> },
            { h: "Type", c: (r) => <span className="block max-w-[160px] text-xs text-ink-soft">{r.e.typeLibelle}</span> },
            { h: "Membres", className: "text-center", c: (r) => <b>{r.members}</b> },
            { h: "Formations", className: "text-center", c: (r) => <b>{r.programs}</b> },
            { h: "Plan", c: (r) => <Chip tone={r.e.plan === "gratuit" ? "grey" : r.e.plan === "partenaire" ? "sun" : "violet"}>{PLANS.find((p) => p.id === r.e.plan)?.nom ?? r.e.plan}</Chip> },
            { h: "Statut", c: (r) => <span className="flex items-center gap-1.5"><StatusBadge status={r.e.status} />{r.e.featured && <Star size={14} className="fill-sun-400 text-sun-500" aria-label="Mis en avant" />}</span> },
            { h: <span className="sr-only">Actions</span>, className: "text-right", c: (r) => r.e.status === "revendique" ? <Button size="sm" onClick={(ev) => { ev.stopPropagation(); setSel(r); }}>Examiner</Button> : <button className="text-[13px] font-bold text-brand-600" aria-label={`Gérer ${r.e.sigle}`}>Gérer</button> },
          ]} />
          {list.data.length > 20 && <Pager page={page} total={list.data.length} size={20} onPage={setPage} />}</>
        )}
      </Panel>

      <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Mise en avant" icon={Star} action={<Chip tone="sun">{featured.length}</Chip>}>
          {!featured.length ? <p className="text-sm text-ink-mute">Aucun établissement mis en avant. Ouvrez une fiche pour l&apos;activer.</p> : (
            <div className="grid gap-3 sm:grid-cols-3">
              {LABELS.map(({ id: p, court }) => (
                <div key={p} className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 p-3">
                  <b className="text-sm">{court}</b>
                  <div className="flex flex-wrap gap-1.5">{featured.filter((r) => r.e.label === p).map((r) => <button key={r.e.id} onClick={() => setSel(r)} title={r.e.nom}><EtabLogo e={r.e} size={34} /></button>)}{!featured.some((r) => r.e.label === p) && <span className="text-xs text-ink-mute">—</span>}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Plans" icon={Award}>
          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} i={i}>
                <div className={`flex h-full flex-col gap-2 rounded-2xl p-4 ${p.dark ? "bg-ink text-white" : "border border-slate-200/80"}`}>
                  <div className="flex items-center justify-between gap-2"><b>{p.nom}</b><span className={`chip ${p.dark ? "bg-sun-400 text-ink" : "bg-[#eef1f8] text-ink-soft"}`}>{nf(plans[p.id] ?? 0)}</span></div>
                  <b className="text-lg">{p.prix}</b>
                  <ul className="flex flex-col gap-1 text-xs">{p.items.map((it) => <li key={it} className="flex items-center gap-1.5"><CheckIcon size={13} className={p.dark ? "text-sun-400" : "text-[#0f8a46]"} />{it}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Panel>
      </div>

      <Dialog open={!!sel} onClose={() => { setSel(null); act.setError(null); }} title={sel ? `${sel.e.sigle} · ${sel.e.status === "revendique" ? "revendication" : "fiche"}` : ""} wide>
        {sel && <Detail r={sel} pending={act.pending} error={act.error} patch={patch} />}
      </Dialog>
    </div>
  );
}

function Detail({ r, pending, error, patch }: { r: Row; pending: boolean; error: string | null; patch: (r: Row, p: Patch, m: string) => Promise<boolean> }) {
  const e = r.e;
  const generic = e.email && /@(gmail|yahoo|hotmail|outlook)\./i.test(e.email);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <EtabLogo e={e} size={52} />
        <div className="min-w-0"><b className="block">{e.nom}</b><span className="text-sm text-ink-mute">{e.ville} · {e.typeLibelle} · {e.label ? labelById[e.label].libelle : "non publié"}</span></div>
        <div className="ml-auto"><StatusBadge status={e.status} /></div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        <Fact icon={Users} ok={r.members > 0} t={r.members ? `${r.members} membre${r.members > 1 ? "s" : ""} rattaché${r.members > 1 ? "s" : ""}` : "Aucun compte rattaché"} />
        <Fact icon={Building2} ok={r.programs > 0} t={`${r.programs} filière${r.programs > 1 ? "s" : ""} homologuée${r.programs > 1 ? "s" : ""} publiée${r.programs > 1 ? "s" : ""}`} />
        <Fact icon={BadgeCheck} ok={!!e.email && !generic} t={e.email ? (generic ? `${e.email} (domaine générique)` : e.email) : "E-mail non renseigné"} />
        <Fact icon={ExternalLink} ok={!!e.siteWeb} t={e.siteWeb ? e.siteWeb.replace(/^https?:\/\//, "") : "Site web non renseigné"} />
      </ul>
      {e.status === "revendique" && <p className="rounded-2xl bg-[#f1edff] px-4 py-3 text-sm text-[#4b2bb0]">Fiche revendiquée : l&apos;approbation attribue le badge « vérifié » et ouvre l&apos;accès complet à l&apos;espace établissement. Les comptes en attente se valident depuis <Link className="font-bold underline" href="/admin/utilisateurs?statut=en_attente">Utilisateurs</Link>.</p>}

      <LabelEditor r={r} pending={pending} patch={patch} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 p-3.5">
          <span className="flex flex-col"><b className="text-sm">Mise en avant</b><span className="text-xs text-ink-mute">Vitrine pays et page d&apos;accueil</span></span>
          <Toggle on={e.featured} disabled={pending} label="Mise en avant" onChange={(v) => patch(r, { featured: v }, v ? "Établissement mis en avant." : "Mise en avant retirée.")} />
        </label>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 p-3.5">
          <label htmlFor="plan" className="text-sm font-bold">Plan</label>
          <Select id="plan" value={e.plan} disabled={pending} onChange={(ev) => patch(r, { plan: ev.target.value }, "Plan mis à jour.")} options={PLAN_OPTS} className="!py-2" />
        </div>
      </div>
      <FormError error={error} />
      <div className="flex flex-wrap gap-2">
        {e.status !== "verifie" && <Button className="!bg-[#0f8a46] hover:!bg-[#0b7a3c]" icon={BadgeCheck} loading={pending} onClick={() => patch(r, { status: "verifie" }, "Établissement vérifié.")}>{e.status === "revendique" ? "Approuver" : e.status === "suspendu" ? "Réactiver (vérifié)" : "Marquer vérifié"}</Button>}
        {e.status === "revendique" && <Button variant="ghost" icon={RotateCcw} disabled={pending} onClick={() => patch(r, { status: "importe" }, "Revendication rejetée.")}>Rejeter la revendication</Button>}
        {e.status !== "suspendu" && <Button variant="ghost" className="!border-[#ffd0d9] !text-[#d42a50]" icon={Ban} disabled={pending} onClick={() => patch(r, { status: "suspendu" }, "Établissement suspendu.")}>Suspendre</Button>}
        <Link href={`/etablissements/${e.id}`} target="_blank" className="btn-ghost ml-auto px-3.5 py-2 text-[13px]"><ExternalLink size={15} />Fiche publique</Link>
      </div>
    </div>
  );
}

const Fact = ({ icon: I, ok, t }: { icon: typeof Users; ok: boolean; t: string }) => (
  <li className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 px-3 py-2.5 text-sm">
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${ok ? "bg-[#e8f8ef] text-[#0f8a46]" : "bg-sun-100 text-[#a55a00]"}`}><I size={16} /></span>
    <span className="min-w-0 truncate">{t}</span>
  </li>
);

/** Label Navigoal (publication) et référence de la reconnaissance par l'État. */
function LabelEditor({ r, pending, patch }: { r: Row; pending: boolean; patch: (r: Row, p: Patch, m: string) => Promise<boolean> }) {
  const [rec, setRec] = useState(r.e.recognition ?? "");
  useEffect(() => setRec(r.e.recognition ?? ""), [r.e.id, r.e.recognition]);
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200/80 p-3.5 sm:grid-cols-[220px_1fr]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="label" className="text-sm font-bold">Label</label>
        <Select id="label" value={r.e.label ?? ""} disabled={pending} onChange={(ev) => patch(r, { label: (ev.target.value || null) as Label | null }, ev.target.value ? "Label mis à jour : établissement publié." : "Établissement retiré de la publication.")} options={LABELS.map((l) => [l.id, l.libelle])} placeholder="Non publié" className="!py-2" />
        <span className="text-xs text-ink-mute">Seuls les établissements labellisés sont visibles des candidats.</span>
      </div>
      <form className="flex flex-col gap-1.5" onSubmit={(ev) => { ev.preventDefault(); patch(r, { recognition: rec.trim() || null }, "Référence enregistrée."); }}>
        <label htmlFor="recognition" className="text-sm font-bold">Référence officielle</label>
        <div className="flex gap-2"><Input id="recognition" value={rec} onChange={(ev) => setRec(ev.target.value)} placeholder="Décret de reconnaissance, autorisation, accréditation…" maxLength={300} /><Button size="sm" variant="ghost" disabled={pending || rec === (r.e.recognition ?? "")}>Enregistrer</Button></div>
      </form>
    </div>
  );
}
