"use client";
// Suivi des accréditations : filières en mention « renouvellement non encore publié », propositions de l'assistant IA,
// saisie des renouvellements publiés au Bulletin officiel (services/accreditations.ts).
import { AlarmClock, BadgeCheck, Bot, ExternalLink, FileX2, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Button, Kpi, Loading, Panel, Tabs, useToast } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { AdminHeader, LoadError, nf } from "./shared";

type Ligne = { etablissement_id: string; etablissement: string; filiere: string; composante: string; fin: string; texte: string; retrait_prevu?: string; renouvellement?: { fin: string; arrete: string; reporte: boolean } | null };
type Proposition = { etablissement_id: string; filiere: string; composante?: string; fin: string; arrete: string; bulletin_officiel: string; date_publication?: string; source?: string; extrait?: string; trouve_le?: string };
type Saisie = { id: string; etablissementId: string; filiere: string; fin: string; arrete: string; bulletinOfficiel: string; statut: string; origine: string; le: string; reporte: boolean };
type Vue = { meta: { date: string; annee_reference: string; regle: string }; en_mention: Ligne[]; a_echeance: Ligne[]; retirees: Ligne[]; propositions: Proposition[]; saisies: Saisie[] };
type Onglet = "propositions" | "mention" | "echeance" | "retirees" | "saisies";

const rentree = (a?: string) => (a ? `rentrée ${a.slice(0, 4)}` : "—");

function FormRenouvellement({ l, fini }: { l: Ligne; fini: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ fin: "", arrete: "", bulletinOfficiel: "", datePublication: "", source: "" });
  const save = useAction();
  const envoyer = () => save.run(async () => {
    await api("/admin/accreditations", { body: { etablissementId: l.etablissement_id, filiere: l.filiere, composante: l.composante, ...f } });
    toast("Renouvellement enregistré : candidatures à jour, site public au prochain passage du robot");
    fini();
  });
  return (
    <div className="mt-3 grid gap-2 rounded-2xl bg-[#f6f8fe] p-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-[13px] font-bold">Nouvelle fin d&apos;accréditation<input className="input" placeholder="2030-2031" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} /></label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">N° de l&apos;arrêté<input className="input" placeholder="1234.26" value={f.arrete} onChange={(e) => setF({ ...f, arrete: e.target.value })} /></label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">N° du Bulletin officiel<input className="input" inputMode="numeric" placeholder="7550" value={f.bulletinOfficiel} onChange={(e) => setF({ ...f, bulletinOfficiel: e.target.value })} /></label>
      <label className="flex flex-col gap-1 text-[13px] font-bold">Date de publication (facultatif)<input className="input" type="date" value={f.datePublication} onChange={(e) => setF({ ...f, datePublication: e.target.value })} /></label>
      <label className="flex flex-col gap-1 text-[13px] font-bold sm:col-span-2">Lien de la source (facultatif)<input className="input" placeholder="https://www.sgg.gov.ma/…" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></label>
      <div className="sm:col-span-2"><FormError error={save.error} /></div>
      <div className="flex gap-2 sm:col-span-2"><Button onClick={envoyer} loading={save.pending}>Enregistrer le renouvellement</Button><Button variant="quiet" onClick={fini}>Annuler</Button></div>
    </div>
  );
}

export function AdminAccreditations() {
  const toast = useToast();
  const v = useApi<Vue>("/admin/accreditations");
  const [onglet, setOnglet] = useState<Onglet>("propositions");
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const action = useAction();
  const filtre = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (L: Ligne[]) => (t ? L.filter((l) => `${l.etablissement} ${l.filiere} ${l.composante}`.toLowerCase().includes(t)) : L);
  }, [q]);
  if (v.error) return <LoadError error={v.error} reload={v.reload} />;
  if (!v.data) return <Loading />;
  const d = v.data;
  const decider = (p: Proposition, ok: boolean) => action.run(async () => {
    const body = { etablissementId: p.etablissement_id, filiere: p.filiere, composante: p.composante ?? "", fin: p.fin, arrete: p.arrete, bulletinOfficiel: p.bulletin_officiel, datePublication: p.date_publication, source: p.source, origine: "ia" };
    await api(ok ? "/admin/accreditations" : "/admin/accreditations/rejet", { body });
    toast(ok ? "Renouvellement validé" : "Proposition écartée"); v.reload();
  });
  const Liste = ({ L, action: avecAction }: { L: Ligne[]; action?: boolean }) => (
    <ul className="divide-y divide-slate-100">
      {filtre(L).slice(0, 300).map((l) => { const k = `${l.etablissement_id}|${l.composante}|${l.filiere}`; return (
        <li key={k} className="py-2.5 text-sm">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1"><b>{l.filiere}</b>{l.composante && <span className="text-ink-mute"> · {l.composante}</span>}<span className="block text-xs text-ink-mute">{l.etablissement} · échéance {l.fin}{l.retrait_prevu ? ` · retrait prévu à la ${rentree(l.retrait_prevu)}` : ""} · {l.texte}</span></div>
            {l.renouvellement ? <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><BadgeCheck size={13} />Renouvelée jusqu&apos;en {l.renouvellement.fin}{l.renouvellement.reporte ? "" : " · site public bientôt à jour"}</span>
              : avecAction && <Button variant="ghost" size="sm" onClick={() => setOuvert(ouvert === k ? null : k)}>Renouvellement publié</Button>}
          </div>
          {ouvert === k && <FormRenouvellement l={l} fini={() => { setOuvert(null); v.reload(); }} />}
        </li>
      ); })}
      {!filtre(L).length && <li className="py-3 text-sm text-ink-mute">Aucune filière.</li>}
    </ul>
  );
  return (
    <>
      <AdminHeader title="Accréditations" sub={`Année universitaire ${d.meta.annee_reference} · données du ${new Date(d.meta.date).toLocaleDateString("fr-FR")} · vérification automatique chaque trimestre`} />
      <div className="mb-4"><Alert tone="info" title="Règle appliquée">{d.meta.regle} Un renouvellement saisi ici vaut tout de suite pour les candidatures ; le site public est mis à jour par le robot dans les 24 heures.</Alert></div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Propositions de l'IA" value={nf(d.propositions.length)} icon={Bot} tone="violet" sub="à valider ou écarter" />
        <Kpi label="En mention" value={nf(d.en_mention.length)} icon={ShieldAlert} tone="sun" sub="renouvellement non encore publié" />
        <Kpi label="À échéance cette année" value={nf(d.a_echeance.length)} icon={AlarmClock} sub={`fin ${d.meta.annee_reference}`} />
        <Kpi label="Retirées cette année" value={nf(d.retirees.length)} icon={FileX2} tone="rose" sub="délai d'un an dépassé" />
      </div>
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={onglet} onChange={setOnglet} items={[["propositions", `Propositions IA (${d.propositions.length})`], ["mention", `En mention (${d.en_mention.length})`], ["echeance", "À échéance"], ["retirees", "Retirées"], ["saisies", "Saisies"]]} />
          {onglet !== "propositions" && onglet !== "saisies" && <label className="relative ml-auto min-w-0 flex-1 sm:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" /><input className="input pl-9" placeholder="École ou filière…" value={q} onChange={(e) => setQ(e.target.value)} /></label>}
        </div>
        <FormError error={action.error} />
        {onglet === "propositions" && (d.propositions.length ? (
          <ul className="divide-y divide-slate-100">
            {d.propositions.map((p) => (
              <li key={`${p.etablissement_id}|${p.filiere}|${p.arrete}`} className="flex flex-col gap-2 py-3 text-sm">
                <div><b>{p.filiere}</b>{p.composante && <span className="text-ink-mute"> · {p.composante}</span>}<span className="block text-xs text-ink-mute">{p.etablissement_id} · arrêté {p.arrete} (BO n° {p.bulletin_officiel}{p.date_publication ? ` du ${p.date_publication}` : ""}) · accréditée jusqu&apos;en {p.fin}{p.trouve_le ? ` · trouvé le ${p.trouve_le}` : ""}</span></div>
                {p.extrait && <blockquote className="rounded-xl bg-[#f6f8fe] px-3 py-2 text-[13px] text-ink-soft">« {p.extrait} »</blockquote>}
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => decider(p, true)} loading={action.pending}>Valider</Button>
                  <Button size="sm" variant="ghost" onClick={() => decider(p, false)} loading={action.pending}>Écarter</Button>
                  {p.source && /^https?:\/\//.test(p.source) && <a href={p.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">Voir la source <ExternalLink size={13} /></a>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="py-3 text-sm text-ink-mute">Aucune proposition en attente. L&apos;assistant IA cherche les nouveaux arrêtés chaque trimestre ; vérifiez toujours la source avant de valider.</p>)}
        {onglet === "mention" && <Liste L={d.en_mention} action />}
        {onglet === "echeance" && <Liste L={d.a_echeance} />}
        {onglet === "retirees" && <Liste L={d.retirees} />}
        {onglet === "saisies" && (
          <ul className="divide-y divide-slate-100">
            {d.saisies.map((s) => (
              <li key={s.id} className="py-2.5 text-sm"><b>{s.filiere}</b> <span className="text-ink-mute">· {s.etablissementId}</span>
                <span className="block text-xs text-ink-mute">{s.statut === "valide" ? `Validé : arrêté ${s.arrete} (BO n° ${s.bulletinOfficiel}), jusqu'en ${s.fin}` : "Proposition écartée"} · {s.origine === "ia" ? "trouvé par l'assistant IA" : "saisi à la main"} · {new Date(s.le).toLocaleDateString("fr-FR")}{s.statut === "valide" ? (s.reporte ? " · en ligne" : " · site public bientôt à jour") : ""}</span></li>
            ))}
            {!d.saisies.length && <li className="py-3 text-sm text-ink-mute">Aucune saisie pour l&apos;instant.</li>}
          </ul>
        )}
      </Panel>
    </>
  );
}
