"use client";
// Espace école : salons virtuels (maquettes design/maquettes/salons.py, écrans 1 et 6, validées le 21/11/2026).
import { Contact, Download, Plus, Presentation, Send, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, useToast } from "@/components/app/kit";
import { FormError, Input, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api, apiUrl } from "@/lib/api";
import { domaines } from "@/lib/data";
import { useEcole } from "./EcoleContext";

const NIVEAUX: [string, string][] = [["niv-lycee", "Lycée, terminale"], ["niv-bac", "Bachelier"], ["niv-bac2", "Bac+2"], ["niv-bac3", "Bac+3"], ["niv-bac5", "Bac+5"]];
const PAYS: [string, string][] = [["GA", "Gabon"], ["CM", "Cameroun"], ["SN", "Sénégal"], ["CI", "Côte d'Ivoire"], ["CG", "Congo"], ["CD", "RD Congo"], ["BJ", "Bénin"], ["TG", "Togo"], ["ML", "Mali"], ["BF", "Burkina Faso"], ["GN", "Guinée"], ["TD", "Tchad"], ["NE", "Niger"], ["MR", "Mauritanie"], ["DJ", "Djibouti"], ["KM", "Comores"]];
const CRITERES: [string, string][] = [["metier", "Métier ou domaine visé"], ["formation", "Formation qui l'intéresse"], ["admission", "Admission possible"], ["budget", "Budget compatible"]];
const STATUT: Record<string, [string, "sun" | "green" | "rose" | "blue" | "grey"]> = { demande: ["En attente de validation", "sun"], publie: ["Publié", "green"], refuse: ["Non retenu", "rose"], annule: ["Annulé", "grey"] };
const quand = (d: string) => new Date(d).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fcfa = (mad: number) => Math.round(mad * 59.643).toLocaleString("fr-FR");

type Salon = { id: string; titre: string; debut: string; dureeMin: number; places: number; statut: string; motifRefus: string | null; criteres: string[]; inscrits: number; presents: number; accords: number; prixFiche: number };

function Pastilles({ options, valeur, onChange }: { options: [string, string][]; valeur: string[]; onChange: (v: string[]) => void }) {
  return <div className="flex flex-wrap gap-1.5">{options.map(([k, l]) => { const on = valeur.includes(k); return <button key={k} type="button" aria-pressed={on} onClick={() => onChange(on ? valeur.filter((x) => x !== k) : [...valeur, k])} className={`chip min-h-[34px] px-3 text-[12.5px] ${on ? "bg-brand-600 text-white" : "bg-[#f1f4fb] text-ink-soft hover:bg-brand-50"}`}>{l}</button>; })}</div>;
}

/** Formulaire « Demander un salon » avec le prix des fiches selon les critères choisis.
 *  Avec `ecoles` (back-office) : l'équipe choisit l'école, enregistre le forfait et publie directement. */
export function Demande({ eid: eidEcole, apres, ecoles }: { eid: string; apres: () => void; ecoles?: [string, string][] }) {
  const toast = useToast();
  const a = useAction();
  const [f, setF] = useState({ titre: "", description: "", jour: "", heure: "17:00", dureeMin: 60, places: 100, programme: "", presentateurs: "", cibleNiveaux: ["niv-lycee"] as string[], ciblePays: ["GA", "CM", "SN"] as string[], cibleDomaines: [] as string[], criteres: [] as string[] });
  const [adm, setAdm] = useState({ ecole: "", forfait: "", ref: "", navi: true });
  const eid = ecoles ? adm.ecole : eidEcole;
  const [prix, setPrix] = useState<number | null>(null);
  useEffect(() => { api<{ prix: number }>(`/ecole/salons/prix-fiche?n=${f.criteres.length}`).then((r) => setPrix(r.prix)).catch(() => setPrix(null)); }, [f.criteres.length]);
  const envoyer = async () => {
    const debut = new Date(`${f.jour}T${f.heure}:00`);
    const programme = f.programme.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const m = l.match(/^(\d{1,2}[:h]\d{2})\s*[-–·:]?\s*(.+)$/); return m ? { heure: m[1].replace("h", ":"), texte: m[2] } : { heure: "", texte: l }; });
    const presentateurs = f.presentateurs.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [nom, ...r] = l.split(/\s*[-–,]\s*/); return { nom, role: r.join(", ") }; });
    const corps = { titre: f.titre, description: f.description, debut: debut.toISOString(), dureeMin: f.dureeMin, places: f.places, programme, presentateurs, cibleNiveaux: f.cibleNiveaux, ciblePays: f.ciblePays, cibleDomaines: f.cibleDomaines, criteres: f.criteres };
    if (await a.run(() => ecoles
      ? api("/admin/salons", { body: { ...corps, establishmentId: adm.ecole, forfaitMad: Number(adm.forfait || 0), paiementRef: adm.ref, naviAnnonce: adm.navi } })
      : api(`/ecole/${eid}/salons`, { body: corps }))) {
      toast(ecoles ? "Salon créé et publié : l'école est prévenue" : "Demande envoyée : l'équipe Navigoal vous confirme le salon et le règlement"); apres();
    }
  };
  return (
    <Panel title={ecoles ? "Créer un salon pour une école" : "Demander un salon"} icon={Plus}>
      <div className="flex flex-col gap-4">
        {ecoles
          ? <label className="flex flex-col gap-1.5 text-sm"><b>École organisatrice</b><select className="input" value={adm.ecole} onChange={(e) => setAdm({ ...adm, ecole: e.target.value })}><option value="">Choisir l&apos;école…</option>{ecoles.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}</select></label>
          : <p className="-mt-2 text-sm text-ink-mute">Forfait du salon, plus les fiches contact si vous les souhaitez. L&apos;équipe Navigoal valide le salon et le règlement, puis le publie.</p>}
        <label className="flex flex-col gap-1.5 text-sm"><b>Titre</b><Input value={f.titre} maxLength={120} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. : Journée portes ouvertes en ligne" /></label>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2"><b>Date</b><Input type="date" value={f.jour} onChange={(e) => setF({ ...f, jour: e.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><b>Heure</b><Input type="time" value={f.heure} onChange={(e) => setF({ ...f, heure: e.target.value })} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><b>Durée</b><select className="input" value={f.dureeMin} onChange={(e) => setF({ ...f, dureeMin: Number(e.target.value) })}>{[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}</select></label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm"><b>Présentation</b><Textarea value={f.description} maxLength={1500} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ce que les élèves vont découvrir : filières, vie sur le campus, bourses, questions en direct…" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm"><b>Programme <span className="font-normal text-ink-mute">(une ligne par étape)</span></b><Textarea value={f.programme} onChange={(e) => setF({ ...f, programme: e.target.value })} placeholder={"17:00 Présentation de l'école\n17:20 Nos filières\n18:05 Vos questions"} /></label>
          <label className="flex flex-col gap-1.5 text-sm"><b>Présentateurs <span className="font-normal text-ink-mute">(nom - rôle, un par ligne)</span></b><Textarea value={f.presentateurs} onChange={(e) => setF({ ...f, presentateurs: e.target.value })} placeholder={"Salma B. - Responsable des admissions"} /></label>
        </div>
        <div className="flex flex-col gap-2 text-sm"><b>Public visé <span className="font-normal text-ink-mute">(Navi invite ces élèves)</span></b>
          <Pastilles options={NIVEAUX} valeur={f.cibleNiveaux} onChange={(v) => setF({ ...f, cibleNiveaux: v })} />
          <Pastilles options={PAYS} valeur={f.ciblePays} onChange={(v) => setF({ ...f, ciblePays: v })} />
          <Pastilles options={domaines.map((d) => [d.id, d.libelle.split(",")[0]])} valeur={f.cibleDomaines} onChange={(v) => setF({ ...f, cibleDomaines: v })} />
        </div>
        <label className="flex max-w-[200px] flex-col gap-1.5 text-sm"><b>Places</b><Input type="number" min={10} max={300} value={f.places} onChange={(e) => setF({ ...f, places: Number(e.target.value) })} /></label>
        <div className="rounded-2xl bg-[#f6f8fe] p-4">
          <div className="flex items-center justify-between"><b className="text-sm">Fiches contact des participants</b><Chip tone="sun">facultatif</Chip></div>
          <p className="mt-1 text-xs text-ink-mute">Seulement les participants qui acceptent d&apos;être recontactés (et un parent pour un mineur). Chaque critère ajoute 25 % au prix de la fiche.</p>
          <div className="mt-3"><Pastilles options={CRITERES} valeur={f.criteres} onChange={(v) => setF({ ...f, criteres: v })} /></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm"><span className="text-ink-mute">Prix par fiche · {f.criteres.length} critère{f.criteres.length > 1 ? "s" : ""}</span><b>{prix != null ? <>{prix} MAD <span className="font-semibold text-ink-mute">≈ {fcfa(prix)} F CFA</span></> : "…"}</b></div>
          <div className="mt-1 flex justify-between text-sm"><span className="text-ink-mute">Forfait du salon</span><b>fixé à la validation</b></div>
        </div>
        {ecoles && <div className="grid gap-3 rounded-2xl border border-brand-100 p-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm"><b>Forfait réglé (MAD)</b><Input inputMode="numeric" value={adm.forfait} onChange={(e) => setAdm({ ...adm, forfait: e.target.value.replace(/\D/g, "") })} placeholder="0 si le salon est offert" /></label>
          <label className="flex flex-col gap-1.5 text-sm"><b>Référence du règlement</b><Input value={adm.ref} onChange={(e) => setAdm({ ...adm, ref: e.target.value })} placeholder="Virement · VIR-2026-1204" /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" className="h-5 w-5 accent-brand-600" checked={adm.navi} onChange={(e) => setAdm({ ...adm, navi: e.target.checked })} />Navi peut annoncer ce salon aux élèves ciblés</label>
        </div>}
        <FormError error={a.error} />
        <div className="flex justify-end"><Button icon={Send} loading={a.pending} disabled={f.titre.trim().length < 5 || !f.jour || (!!ecoles && (!adm.ecole || (Number(adm.forfait || 0) > 0 && adm.ref.trim().length < 2)))} onClick={envoyer}>{ecoles ? "Créer et publier" : "Envoyer la demande"}</Button></div>
      </div>
    </Panel>
  );
}

/** Liste des salons de l'école et demande d'un nouveau salon. */
export function SalonsEcole() {
  const { eid } = useEcole();
  const { data, loading, error, reload } = useApi<Salon[]>(`/ecole/${eid}/salons`);
  const [form, setForm] = useState(false);
  if (loading) return <Loading />;
  if (error) return <Alert tone="error">{error.message}</Alert>;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Salons virtuels" sub="Présentez votre école en direct à des élèves de toute l'Afrique. Navigoal valide le salon, le publie, et Navi invite les élèves dont le profil correspond."
        actions={!form ? <Button icon={Plus} onClick={() => setForm(true)}>Demander un salon</Button> : <Button variant="ghost" icon={X} onClick={() => setForm(false)}>Fermer</Button>} />
      {form && <Demande eid={eid} apres={() => { setForm(false); reload(); }} />}
      {!data?.length ? !form && <Empty icon={Presentation} title="Aucun salon pour l'instant" text="Un salon virtuel : une page publique, des inscriptions, des rappels, l'invitation des élèves ciblés par Navi, une salle en direct jusqu'à 2 h, puis le bilan de présence." action={<Button icon={Plus} onClick={() => setForm(true)}>Demander un salon</Button>} />
        : <div className="card overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink-mute"><th className="p-3">Salon</th><th className="p-3">Statut</th><th className="p-3">Participants</th><th className="p-3" /></tr></thead>
            <tbody>{data.map((s) => { const [l, t] = STATUT[s.statut] ?? [s.statut, "grey"]; const fini = new Date(s.debut).getTime() + s.dureeMin * 60e3 < Date.now(); return (
              <tr key={s.id} className="border-t border-[#eef1f8] align-top">
                <td className="p-3"><b>{s.titre}</b><span className="block text-xs text-ink-mute">{quand(s.debut)} · {s.dureeMin} min</span>{s.motifRefus && <span className="mt-1 block text-xs text-[#b8213f]">{s.motifRefus}</span>}</td>
                <td className="p-3"><Chip tone={fini && s.statut === "publie" ? "blue" : t}>{fini && s.statut === "publie" ? "Terminé" : l}</Chip></td>
                <td className="p-3 text-xs">{s.statut === "publie" ? (fini ? `${s.presents} présents · ${s.inscrits} inscrits` : `${s.inscrits} inscrits / ${s.places}`) : "—"}</td>
                <td className="p-3 text-right">{s.statut === "publie" && <span className="flex justify-end gap-2"><Link href={`/salons/${s.id}/`} className="btn-ghost py-2 text-[13px]">Page</Link><Link href={`/etablissement/salons/${s.id}/`} className="btn-primary py-2 text-[13px]">{fini ? "Bilan" : "Suivi"}</Link></span>}</td>
              </tr>); })}</tbody>
          </table></div>}
      <p className="flex items-start gap-2 rounded-2xl border border-[#f6dd9a] bg-[#fffaf0] p-4 text-sm"><Sparkles size={18} className="mt-0.5 shrink-0 text-[#a55a00]" /><span><b>Ce qui est inclus :</b> page publique du salon, inscriptions, rappels aux inscrits, invitations par Navi aux élèves ciblés, salle en direct jusqu&apos;à 2 h, bilan de présence.</span></p>
    </div>
  );
}

type Bilan = {
  salon: Salon & { questions: number; repondues: number; establishmentId: string };
  prixFiche: number; criteres: string[];
  participants: { prenom: string; initiale: string; pays: string | null; niveau: string | null; serie: string | null; present: boolean; viaNavi: boolean; candidature: boolean; accord: boolean }[];
  candidatures: number; fichesDisponibles: number; montantFiches: number;
  commandes: { id: string; nb: number; montantMad: number; statut: string; createdAt: string }[];
};

/** Bilan d'un salon : présence, questions, candidatures, fiches contact, messages aux participants. */
export function BilanSalon({ id }: { id: string }) {
  const { data, loading, error, reload } = useApi<Bilan>(`/ecole/salons/${id}/bilan`);
  const toast = useToast();
  const a = useAction();
  const [msg, setMsg] = useState<{ cible: string; texte: string } | null>(null);
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur de chargement."}</Alert>;
  const s = data.salon;
  const nbViaNavi = data.participants.filter((p) => p.viaNavi).length;
  const commander = async () => { if (await a.run(() => api(`/ecole/salons/${id}/fiches`, { body: {} }))) { toast("Commande envoyée : les fiches sont débloquées dès le règlement enregistré"); reload(); } };
  const envoyer = async () => { if (!msg) return; const r = await a.run(() => api<{ envoyes: number }>(`/ecole/salons/${id}/message`, { body: msg })); if (r) { toast(`Message envoyé à ${r.envoyes} participant(s)`); setMsg(null); } };
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={`Salon : ${s.titre}`} sub={`${quand(s.debut as unknown as string)} · ${s.dureeMin} min`} crumbs={[["Salons virtuels", "/etablissement/salons"], [s.titre]]}
        actions={<Link href={`/salons/${id}/direct/`} className="btn-primary"><Presentation size={16} />Ouvrir la salle</Link>} />
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Inscrits", s.inscrits, nbViaNavi ? `dont ${nbViaNavi} invités par Navi` : `${s.places} places`], ["Présents", s.presents, s.inscrits ? `${Math.round((s.presents / s.inscrits) * 100)} % des inscrits` : ""], ["Questions", s.questions, `${s.repondues} répondues`], ["Candidatures depuis", data.candidatures, "à votre école"]].map(([t, n, d]) => (
          <div key={t as string} className="card p-4"><span className="text-xs text-ink-mute">{t}</span><b className="block text-[28px]">{n}</b><span className="text-xs text-ink-mute">{d}</span></div>
        ))}
      </div>
      {data.participants.length ? <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink-mute"><th className="p-3">Participant</th><th className="p-3">Profil</th><th className="p-3">Présence</th><th className="p-3">Suite</th></tr></thead>
        <tbody>{data.participants.map((p, i) => <tr key={i} className="border-t border-[#eef1f8]"><td className="p-3 font-bold">{p.prenom} {p.initiale}</td><td className="p-3 text-xs">{[p.pays, p.niveau?.replace("niv-", "").replace("bac", "Bac+").replace("Bac++", "Bac+"), p.serie].filter(Boolean).join(" · ")}</td>
          <td className="p-3"><Chip tone={p.present ? "blue" : "grey"}>{p.present ? "Présent" : "Absent"}</Chip></td><td className="p-3">{p.candidature ? <Chip tone="green">Candidature envoyée</Chip> : p.accord ? <Chip tone="sun">Accepte d&apos;être recontacté</Chip> : null}</td></tr>)}</tbody>
      </table></div> : <Empty icon={Presentation} title="Pas encore d'inscrits" text="Les inscriptions s'affichent ici dès que le salon est publié." />}
      <div className="card flex flex-col gap-3 border-2 border-sun-400 p-5 sm:flex-row sm:items-center">
        <Contact size={26} className="shrink-0 text-[#a55a00]" />
        <span className="flex-1"><b>Fiches contact</b><span className="block text-xs text-ink-mute">{s.accords} participant{s.accords > 1 ? "s ont" : " a"} accepté d&apos;être recontacté{s.accords > 1 ? "s" : ""} · {data.fichesDisponibles} nouvelle{data.fichesDisponibles > 1 ? "s" : ""} fiche{data.fichesDisponibles > 1 ? "s" : ""} correspond{data.fichesDisponibles > 1 ? "ent" : ""} à vos critères{data.criteres.length ? ` (${data.criteres.join(", ").toLowerCase()})` : ""}</span></span>
        {data.fichesDisponibles > 0 && <><span className="text-right"><b className="text-lg">{data.fichesDisponibles} × {data.prixFiche} MAD = {data.montantFiches.toLocaleString("fr-FR")} MAD</b><span className="block text-xs text-ink-mute">≈ {fcfa(data.montantFiches)} F CFA</span></span>
          <Button variant="sun" loading={a.pending} onClick={commander}>Commander les {data.fichesDisponibles} fiches</Button></>}
      </div>
      {!!data.commandes.length && <Panel title="Mes commandes de fiches" icon={Download}>
        <ul className="flex flex-col gap-2 text-sm">{data.commandes.map((c) => <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f6f8fe] p-3">
          <span>{c.nb} fiche{c.nb > 1 ? "s" : ""} · {c.montantMad.toLocaleString("fr-FR")} MAD</span>
          {c.statut === "payee" ? <a href={apiUrl(`/ecole/fiches/${c.id}/fiches.csv`)} className="btn-primary py-2 text-[13px]"><Download size={15} />Télécharger (CSV)</a> : <Chip tone={c.statut === "annulee" ? "grey" : "sun"}>{c.statut === "annulee" ? "Annulée" : "En attente du règlement"}</Chip>}
        </li>)}</ul>
      </Panel>}
      {msg ? <Panel title="Écrire aux participants" icon={Send}>
          <div className="flex flex-col gap-3"><Textarea value={msg.texte} maxLength={1000} onChange={(e) => setMsg({ ...msg, texte: e.target.value })} placeholder="Merci d'avoir participé ! Les candidatures pour la rentrée 2027 sont ouvertes…" />
            <FormError error={a.error} /><div className="flex gap-2"><Button icon={Send} loading={a.pending} disabled={msg.texte.trim().length < 10} onClick={envoyer}>Envoyer</Button><Button variant="ghost" onClick={() => setMsg(null)}>Annuler</Button></div></div></Panel>
        : <div className="flex flex-wrap gap-2"><Button icon={Send} onClick={() => setMsg({ cible: "presents", texte: "" })}>Écrire aux participants</Button><Button variant="ghost" icon={Send} onClick={() => setMsg({ cible: "absents", texte: "" })}>Écrire aux absents</Button></div>}
      <p className="text-xs text-ink-mute">Les messages passent par Navigoal (notification et e-mail). Les coordonnées ne sont transmises que dans les fiches réglées, et seulement pour les élèves qui l&apos;ont accepté.</p>
    </div>
  );
}
