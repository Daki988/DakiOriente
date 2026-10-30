"use client";
/* eslint-disable @next/next/no-img-element -- logos déjà optimisés */
import { Crown, Download, LifeBuoy, Pencil, Plus, Search, Star, TentTree, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Button, Chip, Dialog, Kpi, Loading, Panel, dateFr, useToast, type Tone } from "@/components/app/kit";
import { Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api, apiUrl } from "@/lib/api";
import { AdminHeader, Confirm, LoadError, Toggle } from "./shared";

type Prix = { months: number; amount: number | null };
type Service = { code: string; name: string; description: string; effect: string; prices: Prix[]; active: boolean; ecoles: number };
type Etat = "actif" | "expire_bientot" | "expire" | "a_venir" | "arrete";
type Abo = { id: string; serviceCode: string; service: string; months: number; startsAt: string; endsAt: string; amount: number | null; paymentMethod: string | null; paymentRef: string | null; note: string | null; createdAt: string; etat: Etat;
  etablissement: { id: string; sigle: string; nom: string; logo: string | null; ville: string } };
type Vue = { services: Service[]; items: Abo[]; stats: { actifs: number; encaisseAnnee: number; expirentBientot: number; misesEnAvant: number } };

const nf = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const duree = (m: number) => (m % 12 === 0 ? `${m / 12} an${m > 12 ? "s" : ""}` : `${m} mois`);
const prixTxt = (p: Prix[]) => p.map((x) => `${x.amount == null ? "sur devis" : `${nf(x.amount)} MAD`} / ${duree(x.months)}`).join(" · ");
const ICONE: Record<string, typeof Crown> = { premium: Crown, mise_en_avant: Star, une_accueil: Star, salons: TentTree, accompagnement: LifeBuoy };
const ETAT: Record<Etat, [string, Tone]> = { actif: ["Actif", "green"], expire_bientot: ["Expire bientôt", "rose"], expire: ["Expiré", "grey"], a_venir: ["À venir", "blue"], arrete: ["Arrêté", "grey"] };
const MOYENS: [string, string][] = [["virement", "Virement bancaire"], ["mobile_money", "Mobile money"], ["cheque", "Chèque"], ["especes", "Espèces"], ["carte", "Carte bancaire"], ["offert", "Offert"]];
const FILTRES: [string, string][] = [["", "Tous"], ["actifs", "Actifs"], ["expire_bientot", "Expirent sous 30 j"], ["expire", "Expirés"]];
const jours = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

/** Offres et abonnements des établissements (maquettes « offres », écrans 1 et 2). */
export function AdminOffres() {
  const toast = useToast();
  const r = useApi<Vue>("/admin/offres");
  const ecoles = useApi<{ id: string; sigle: string; nom: string; ville: string }[]>("/admin/offres/etablissements");
  const [filtre, setFiltre] = useState("");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Service | null>(null);
  const [act, setAct] = useState<{ etablissement: string; service: string; months: number; amount: string; method: string; reference: string; note: string } | null>(null);
  const [arret, setArret] = useState<Abo | null>(null);
  const a = useAction();
  const items = useMemo(() => (r.data?.items ?? []).filter((x) => (!filtre || (filtre === "actifs" ? x.etat === "actif" || x.etat === "expire_bientot" : x.etat === filtre))
    && (!q || `${x.etablissement.sigle} ${x.etablissement.nom} ${x.paymentRef ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [r.data, filtre, q]);
  if (r.error) return <LoadError error={r.error} reload={r.reload} />;
  if (!r.data) return <Loading />;
  const { services, stats } = r.data;
  const svc = (c: string) => services.find((s) => s.code === c);
  const ouvrir = (etablissement = "", service = "premium") => { const s = svc(service); const p = s?.prices[s.prices.length - 1]; setAct({ etablissement, service, months: p?.months ?? 12, amount: p?.amount != null ? String(p.amount) : "", method: "virement", reference: "", note: "" }); };
  const choisir = (patch: Partial<NonNullable<typeof act>>) => setAct((x) => {
    if (!x) return x;
    const n = { ...x, ...patch };
    if (patch.service || patch.months) { const s = svc(n.service); const p = s?.prices.find((y) => y.months === n.months) ?? s?.prices[0]; if (patch.service && p) n.months = p.months; n.amount = p?.amount != null ? String(p.amount) : ""; }
    return n;
  });
  const encours = act ? r.data.items.find((x) => x.etablissement.id === act.etablissement && x.serviceCode === act.service && (x.etat === "actif" || x.etat === "expire_bientot")) : null;
  const activer = () => act && a.run(async () => {
    await api("/admin/offres/abonnements", { body: { etablissement: act.etablissement, service: act.service, months: act.months, amount: act.amount === "" ? null : Number(act.amount), method: act.method, reference: act.reference || null, note: act.note || null } });
    setAct(null); r.reload(); toast(encours ? "Service prolongé, l'école est prévenue" : "Service activé, l'école est prévenue");
  });
  const enregistrer = () => edit && a.run(async () => { await api(`/admin/offres/services/${edit.code}`, { method: "PATCH", body: { name: edit.name, description: edit.description, prices: edit.prices, active: edit.active } }); setEdit(null); r.reload(); toast("Catalogue mis à jour"); });
  const arreter = () => arret && a.run(async () => { await api(`/admin/offres/abonnements/${arret.id}/arreter`, { method: "POST" }); setArret(null); r.reload(); toast("Abonnement arrêté"); });

  return (
    <div className="min-w-0">
      <AdminHeader title="Offres et abonnements" sub="Services payants des établissements : activation, échéances, encaissements"
        actions={<><a href={apiUrl("/admin/offres/export.csv")} className="btn-ghost"><Download size={17} />Exporter (CSV)</a><Button icon={Plus} onClick={() => ouvrir()}>Activer un service</Button></>} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Crown} label="Abonnements actifs" value={stats.actifs} sub={services.filter((s) => s.ecoles).map((s) => `${s.ecoles} ${s.name.toLowerCase()}`).join(" · ") || "aucun"} />
        <Kpi tone="green" label={`Encaissé en ${new Date().getFullYear()}`} value={`${nf(stats.encaisseAnnee)} MAD`} sub="saisi à chaque activation" />
        <Kpi tone="rose" label="Expirent sous 30 jours" value={stats.expirentBientot} sub="rappel e-mail à J-30 et J-7" />
        <Kpi icon={Star} tone="sun" label="Écoles mises en avant" value={stats.misesEnAvant} sub="visibles sur le site public" />
      </div>
      <b className="mb-2 block text-[12px] uppercase text-ink-mute">Catalogue et tarifs</b>
      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {services.map((s) => {
          const I = ICONE[s.code] ?? Star;
          return (
            <div key={s.code} className={`card flex flex-col gap-2 rounded-[20px] p-4 ${s.code === "premium" ? "border-2 border-sun-300 bg-[#fffbea]" : ""} ${s.active ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={17} /></span><b className="flex-1">{s.name}</b>
                <button onClick={() => setEdit(JSON.parse(JSON.stringify(s)))} aria-label={`Modifier ${s.name}`} className="rounded-lg p-1.5 text-ink-mute hover:bg-white"><Pencil size={15} /></button></div>
              <b className="text-[15px]">{prixTxt(s.prices)}</b>
              <p className="text-xs leading-relaxed text-ink-mute">{s.description}</p>
              <span className="mt-auto flex items-center justify-between text-xs"><b className="text-brand-600">{s.ecoles} école{s.ecoles > 1 ? "s" : ""}</b>{!s.active && <Chip tone="grey">Désactivé</Chip>}{s.effect === "aucun" && <span className="text-ink-mute">suivi manuel</span>}</span>
            </div>
          );
        })}
      </div>
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          {FILTRES.map(([k, t]) => <button key={k} onClick={() => setFiltre(k)} className={`chip px-3 py-2 ${filtre === k ? "bg-brand-600 text-white" : k === "expire_bientot" ? "bg-[#ffecef] text-[#d42a50]" : "bg-[#eef1f8] text-ink-soft"}`}>{t}</button>)}
          <div className="relative ml-auto min-w-[240px]"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Établissement, référence…" className="py-2 pl-10" aria-label="Rechercher" /></div>
        </div>
        {!items.length ? <p className="py-8 text-center text-sm text-ink-mute">Aucun abonnement. Cliquez sur « Activer un service » pour en saisir un.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead><tr className="border-b border-[#e6eaf3] text-left text-[11px] uppercase text-ink-mute">{["École", "Service", "Début", "Fin", "État", "Montant · référence", ""].map((h) => <th key={h} className="px-3 py-2.5 font-extrabold">{h}</th>)}</tr></thead>
              <tbody>{items.map((x) => (
                <tr key={x.id} className="border-b border-[#eef1f8] last:border-0">
                  <td className="px-3 py-3"><span className="flex items-center gap-2.5">{x.etablissement.logo && <img src={x.etablissement.logo} alt="" className="h-7 w-7 rounded-lg border border-slate-100 object-contain" />}<b>{x.etablissement.sigle}</b></span></td>
                  <td className="px-3 py-3">{x.service} · {duree(x.months)}</td>
                  <td className="px-3 py-3 text-ink-mute">{dateFr(x.startsAt)}</td>
                  <td className="px-3 py-3 font-bold">{dateFr(x.endsAt)}</td>
                  <td className="px-3 py-3"><Chip tone={ETAT[x.etat][1]}>{x.etat === "expire_bientot" ? `Expire dans ${jours(x.endsAt)} j` : ETAT[x.etat][0]}</Chip></td>
                  <td className="px-3 py-3">{x.amount != null ? `${nf(x.amount)} MAD` : "—"}<span className="block text-xs text-ink-mute">{[MOYENS.find(([k]) => k === x.paymentMethod)?.[1], x.paymentRef].filter(Boolean).join(" · ")}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    {(x.etat === "actif" || x.etat === "expire_bientot" || x.etat === "expire") && <Button size="sm" variant="ghost" onClick={() => ouvrir(x.etablissement.id, x.serviceCode)}>Prolonger</Button>}
                    {(x.etat === "actif" || x.etat === "expire_bientot" || x.etat === "a_venir") && <Button size="sm" variant="quiet" aria-label="Arrêter" onClick={() => setArret(x)}><Trash2 size={14} /></Button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
      <div className="mt-5"><Alert tone="info">À l&apos;échéance, le service s&apos;arrête tout seul (plus de badge « Partenaire Navigoal », plus d&apos;accès Premium) ; l&apos;école et l&apos;équipe sont prévenues 30 et 7 jours avant. Une prolongation saisie avant la fin évite toute interruption.</Alert></div>

      <Dialog open={!!act} onClose={() => setAct(null)} title={encours ? "Prolonger un service" : "Activer un service"}>
        {act && (() => {
          const s = svc(act.service);
          const debut = encours ? new Date(encours.endsAt) : new Date();
          const fin = new Date(debut); fin.setMonth(fin.getMonth() + act.months);
          return (
            <div className="flex flex-col gap-3.5">
              <Field label="Établissement">{(id) => <Select id={id} value={act.etablissement} onChange={(e) => choisir({ etablissement: e.target.value })} options={[["", "Choisir…"], ...(ecoles.data ?? []).map((e) => [e.id, `${e.sigle} · ${e.ville}`] as [string, string])]} />}</Field>
              <div><b className="mb-1.5 block text-[13px]">Service</b><div className="flex flex-wrap gap-2">{services.filter((x) => x.active).map((x) => <button key={x.code} type="button" onClick={() => choisir({ service: x.code })} className={`chip px-3 py-2 ${act.service === x.code ? "bg-brand-600 text-white" : "bg-[#eef1f8] text-ink-soft"}`}>{x.name}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Durée">{(id) => <Select id={id} value={String(act.months)} onChange={(e) => choisir({ months: Number(e.target.value) })} options={(s?.prices ?? []).map((p) => [String(p.months), duree(p.months)] as [string, string])} />}</Field>
                <Field label="Période">{() => <p className="input bg-[#f6f8fe] text-sm">{dateFr(debut)} → {dateFr(fin)}</p>}</Field>
              </div>
              {encours && <p className="-mt-1 text-xs font-bold text-brand-600">Prolongation : la période démarre à la fin de l&apos;abonnement en cours ({dateFr(encours.endsAt)}).</p>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Montant encaissé (MAD)" hint="Vide : sur devis ou offert">{(id) => <Input id={id} type="number" min={0} value={act.amount} onChange={(e) => setAct({ ...act, amount: e.target.value })} />}</Field>
                <Field label="Règlement">{(id) => <Select id={id} value={act.method} onChange={(e) => setAct({ ...act, method: e.target.value })} options={MOYENS} />}</Field>
              </div>
              <Field label="Référence du règlement">{(id) => <Input id={id} value={act.reference} maxLength={80} onChange={(e) => setAct({ ...act, reference: e.target.value })} placeholder="Ex. : VIR-2026-131" />}</Field>
              <Field label="Note interne">{(id) => <Input id={id} value={act.note} maxLength={1000} onChange={(e) => setAct({ ...act, note: e.target.value })} placeholder="Ex. : remise salon de Libreville…" />}</Field>
              {s?.effect === "aucun" ? <Alert tone="warn">Service suivi manuellement : il n&apos;active rien automatiquement sur le site, mais il apparaît dans « Mon offre » de l&apos;école et dans les exports.</Alert>
                : <Alert tone="info">L&apos;école est prévenue par e-mail ; {s?.effect === "premium" ? "les fonctions Premium et le badge « Partenaire Navigoal » s'activent" : "le badge « Partenaire Navigoal » et la mise en avant s'activent"} {encours ? "sans interruption" : "immédiatement"}.</Alert>}
              <FormError error={a.error} />
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAct(null)}>Annuler</Button><Button loading={a.pending} disabled={!act.etablissement} onClick={activer}>{encours ? "Prolonger" : "Activer"} jusqu&apos;au {dateFr(fin)}</Button></div>
            </div>
          );
        })()}
      </Dialog>

      <Dialog open={!!edit} onClose={() => setEdit(null)} title={`Modifier · ${edit?.name ?? ""}`}>
        {edit && (
          <div className="flex flex-col gap-3.5">
            <Field label="Nom">{(id) => <Input id={id} value={edit.name} maxLength={80} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />}</Field>
            <Field label="Description (affichée aux écoles)">{(id) => <Textarea id={id} value={edit.description} maxLength={600} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />}</Field>
            <div><b className="mb-1.5 block text-[13px]">Tarifs</b>
              <div className="flex flex-col gap-2">{edit.prices.map((p, k) => (
                <div key={k} className="flex items-center gap-2">
                  <Input type="number" min={1} max={36} value={p.months} onChange={(e) => setEdit({ ...edit, prices: edit.prices.map((x, j) => (j === k ? { ...x, months: Number(e.target.value) } : x)) })} className="w-24" aria-label="Mois" /><span className="text-sm text-ink-mute">mois</span>
                  <Input type="number" min={0} value={p.amount ?? ""} placeholder="sur devis" onChange={(e) => setEdit({ ...edit, prices: edit.prices.map((x, j) => (j === k ? { ...x, amount: e.target.value === "" ? null : Number(e.target.value) } : x)) })} className="flex-1" aria-label="Montant" /><span className="text-sm text-ink-mute">MAD</span>
                  <Button size="sm" variant="quiet" aria-label="Retirer ce tarif" disabled={edit.prices.length < 2} onClick={() => setEdit({ ...edit, prices: edit.prices.filter((_, j) => j !== k) })}><Trash2 size={14} /></Button>
                </div>))}</div>
              {edit.prices.length < 6 && <Button size="sm" variant="ghost" className="mt-2" icon={Plus} onClick={() => setEdit({ ...edit, prices: [...edit.prices, { months: 12, amount: null }] })}>Ajouter une durée</Button>}</div>
            <label className="flex items-center gap-3 text-sm font-semibold"><Toggle on={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Service proposé" />Service proposé aux écoles</label>
            <p className="text-xs text-ink-mute">Un nouveau tarif s&apos;applique aux prochaines activations ; les abonnements en cours ne changent pas.</p>
            <FormError error={a.error} />
            <Button loading={a.pending} onClick={enregistrer}>Enregistrer</Button>
          </div>
        )}
      </Dialog>
      <Confirm open={!!arret} onClose={() => setArret(null)} title="Arrêter cet abonnement ?" confirm="Arrêter maintenant" tone="danger" onConfirm={arreter} pending={a.pending} error={a.error}>
        {arret && <>Le service « {arret.service} » de {arret.etablissement.nom} cesse immédiatement (badge, mise en avant, Premium). À utiliser pour une résiliation ou une erreur de saisie.</>}
      </Confirm>
    </div>
  );
}
