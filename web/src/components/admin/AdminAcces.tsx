"use client";
/* eslint-disable @next/next/no-img-element -- logos déjà optimisés */
import { Copy, KeyRound, Mail, Pencil, Search, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Chip, Dialog, Kpi, Loading, Panel, dateFr, since, useToast } from "@/components/app/kit";
import { Field, FormError, Input } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api, apiUrl } from "@/lib/api";
import { AdminHeader, Confirm, LoadError } from "./shared";

type Compte = { id: string; email: string | null; firstName: string; lastName: string; status: string; lastLoginAt: string | null; mustChangePassword: boolean; createdAt: string; provisoire: boolean; etat: "actif" | "jamais_connecte" | string };
type Ecole = { id: string; sigle: string; nom: string; ville: string; logo: string | null; comptes: Compte[] };
type Liste = { items: Ecole[]; stats: { ecoles: number; avecAcces: number; connectees: number; jamais: number; emailACompleter: number } };
type Acces = { sigle: string; nom: string; email: string; motDePasse: string; provisoire: boolean };
const FILTRES: [string, string][] = [["", "Tous"], ["jamais", "Jamais connectés"], ["provisoire", "E-mail à compléter"], ["sans", "Sans accès"]];

/** Accès des établissements (maquettes « accès », écran 1) : un compte par école, mot de passe provisoire affiché une seule fois. */
export function AdminAcces() {
  const toast = useToast();
  const r = useApi<Liste>("/admin/acces");
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState("");
  const [montre, setMontre] = useState<Acces | null>(null);
  const [email, setEmail] = useState<{ c: Compte; v: string } | null>(null);
  const [collab, setCollab] = useState<{ e: Ecole; email: string; firstName: string; lastName: string } | null>(null);
  const [envoiTous, setEnvoiTous] = useState(false);
  const a = useAction();
  const creer = () => a.run(async () => {
    const res = await fetch(apiUrl("/admin/acces/creer"), { method: "POST", credentials: "same-origin" });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.error?.message ?? "Création impossible.");
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: u, download: `acces-etablissements-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(u); r.reload(); toast("Accès créés : fichier téléchargé (mots de passe provisoires affichés une seule fois)");
  });
  const reinit = (c: Compte) => a.run(async () => { setMontre(await api<Acces>(`/admin/acces/${c.id}/reinitialiser`, { method: "POST" })); r.reload(); });
  const envoyer = (c: Compte) => a.run(async () => { const x = await api<{ envoye: string }>(`/admin/acces/${c.id}/envoyer`, { method: "POST" }); r.reload(); toast(`Accès envoyé à ${x.envoye}`); });
  const tous = () => a.run(async () => { const x = await api<{ envoyes: number; ignores: number }>("/admin/acces/envoyer", { method: "POST" }); setEnvoiTous(false); r.reload(); toast(`${x.envoyes} accès envoyés${x.ignores ? ` · ${x.ignores} sans e-mail officiel` : ""}`); });
  const majEmail = () => email && a.run(async () => { await api(`/admin/acces/${email.c.id}`, { method: "PATCH", body: { email: email.v } }); setEmail(null); r.reload(); toast("Identifiant mis à jour"); });
  const ajouter = () => collab && a.run(async () => { setMontre(await api<Acces>(`/admin/etablissements/${collab.e.id}/collaborateurs`, { body: { email: collab.email, firstName: collab.firstName, lastName: collab.lastName } })); setCollab(null); r.reload(); });

  if (r.error) return <LoadError error={r.error} reload={r.reload} />;
  if (!r.data) return <Loading />;
  const s = r.data.stats;
  const lignes = r.data.items.filter((e) => (!q || `${e.sigle} ${e.nom} ${e.ville} ${e.comptes.map((c) => c.email).join(" ")}`.toLowerCase().includes(q.toLowerCase()))
    && (!filtre || (filtre === "sans" ? !e.comptes.length : filtre === "jamais" ? e.comptes.some((c) => c.etat === "jamais_connecte") : e.comptes.some((c) => c.provisoire))));
  const sans = r.data.items.filter((e) => !e.comptes.some((c) => c.status === "actif")).length;
  return (
    <div className="min-w-0">
      <AdminHeader title="Accès des établissements" sub={`${s.ecoles} établissements · ${s.avecAcces} accès créés · ${s.connectees} école${s.connectees > 1 ? "s" : ""} déjà connectée${s.connectees > 1 ? "s" : ""}`}
        actions={<>{sans > 0 && <Button icon={KeyRound} loading={a.pending} onClick={creer}>Créer les accès manquants ({sans})</Button>}<Button variant="ghost" icon={Mail} onClick={() => setEnvoiTous(true)} disabled={!s.jamais}>Envoyer les accès non utilisés</Button></>} />
      <FormError error={a.error} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={KeyRound} label="Accès créés" value={s.avecAcces} sub="1 compte par établissement" />
        <Kpi icon={ShieldCheck} tone="green" label="Déjà connectées" value={s.connectees} sub="mot de passe personnel choisi" />
        <Kpi icon={Mail} tone="sun" label="Jamais connectées" value={s.jamais} sub="à relancer" />
        <Kpi icon={Pencil} tone="rose" label="E-mail à compléter" value={s.emailACompleter} sub="pas d'adresse publique" />
      </div>
      <Panel>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Établissement, ville, e-mail…" className="pl-10" aria-label="Rechercher" /></div>
          {FILTRES.map(([k, t]) => <button key={k} onClick={() => setFiltre(k)} className={`chip px-3 py-2 ${filtre === k ? "bg-brand-600 text-white" : "bg-[#eef1f8] text-ink-soft"}`}>{t}</button>)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="border-b border-[#e6eaf3] text-left text-[11px] uppercase text-ink-mute">{["Établissement", "Identifiant (e-mail)", "État", "Dernière activité", "Actions"].map((h) => <th key={h} className="px-3 py-2.5 font-extrabold">{h}</th>)}</tr></thead>
            <tbody>{lignes.map((e) => (e.comptes.length ? e.comptes : [null]).map((c, k) => (
              <tr key={`${e.id}-${c?.id ?? "x"}`} className="border-b border-[#eef1f8] last:border-0">
                <td className="px-3 py-3">{k === 0 && <span className="flex items-center gap-2.5">{e.logo ? <img src={e.logo} alt="" className="h-8 w-8 rounded-lg border border-slate-100 object-contain" /> : <span className="h-8 w-8" />}<span><b>{e.sigle}</b><span className="block text-xs text-ink-mute">{e.ville}</span></span></span>}</td>
                <td className="px-3 py-3">{c ? <span className="font-medium">{c.email}{e.comptes.length > 1 && <span className="block text-xs text-ink-mute">{c.firstName} {c.lastName}</span>}</span> : <span className="text-ink-mute">Aucun accès</span>}</td>
                <td className="px-3 py-3">{!c ? <Chip tone="grey">Sans accès</Chip> : c.status !== "actif" ? <Chip tone="rose">{c.status === "suspendu" ? "Suspendu" : "En attente"}</Chip> : c.provisoire ? <Chip tone="rose">Adresse à compléter</Chip> : c.etat === "actif" ? <Chip tone="green">Actif</Chip> : <Chip tone="sun">Jamais connecté</Chip>}</td>
                <td className="px-3 py-3 text-ink-mute">{!c ? "—" : c.lastLoginAt ? `connecté ${since(c.lastLoginAt)}` : `créé le ${dateFr(c.createdAt)}`}</td>
                <td className="whitespace-nowrap px-3 py-3"><span className="flex gap-1.5">
                  {c && (c.provisoire
                    ? <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEmail({ c, v: "" })}>Modifier l&apos;e-mail</Button>
                    : <><Button size="sm" variant="ghost" icon={Mail} onClick={() => envoyer(c)} disabled={a.pending}>{c.etat === "actif" ? "Envoyer" : "Renvoyer"}</Button><Button size="sm" variant="quiet" onClick={() => setEmail({ c, v: c.email ?? "" })} aria-label="Modifier l'e-mail"><Pencil size={14} /></Button></>)}
                  {c && <Button size="sm" variant="ghost" onClick={() => reinit(c)} disabled={a.pending}>Réinitialiser</Button>}
                  {k === 0 && <Button size="sm" variant="quiet" icon={UserPlus} onClick={() => setCollab({ e, email: "", firstName: "", lastName: "" })} aria-label="Ajouter un collaborateur" title="Ajouter un collaborateur" />}
                </span></td>
              </tr>
            )))}</tbody>
          </table>
        </div>
      </Panel>
      <div className="mt-5"><Alert tone="info" title="Mot de passe provisoire">Affiché une seule fois (ou envoyé par e-mail à l&apos;adresse officielle de l&apos;école), à changer à la première connexion. Navigoal ne conserve jamais de mot de passe en clair. Le bouton <UserPlus size={13} className="inline" /> ajoute un collaborateur (2ᵉ compte pour la même école).</Alert></div>

      <Dialog open={!!montre} onClose={() => setMontre(null)} title={`Accès ${montre?.sigle ?? ""}`}>
        {montre && <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-mute">Transmettez ces informations à l&apos;école. Le mot de passe ne sera plus affiché après fermeture.</p>
          <div className="rounded-2xl bg-[#f6f8fe] p-4 font-mono text-sm"><div>Identifiant : <b>{montre.email}</b></div><div>Mot de passe provisoire : <b>{montre.motDePasse}</b></div><div>Connexion : https://navigoal.net/connexion/</div></div>
          <Button variant="ghost" icon={Copy} onClick={() => { navigator.clipboard?.writeText(`Navigoal · ${montre.nom}\nIdentifiant : ${montre.email}\nMot de passe provisoire : ${montre.motDePasse}\nConnexion : https://navigoal.net/connexion/`); toast("Copié"); }}>Copier</Button>
          {montre.provisoire && <Alert tone="warn">Identifiant provisoire : renseignez l&apos;e-mail officiel de l&apos;école pour qu&apos;elle puisse réinitialiser son mot de passe seule.</Alert>}
        </div>}
      </Dialog>
      <Dialog open={!!email} onClose={() => setEmail(null)} title="Identifiant de l'école">
        {email && <div className="flex flex-col gap-3">
          <Field label="E-mail officiel (devient l'identifiant de connexion)">{(id) => <Input id={id} type="email" value={email.v} onChange={(e) => setEmail({ ...email, v: e.target.value })} placeholder="admissions@ecole.ma" />}</Field>
          <FormError error={a.error} /><Button onClick={majEmail} loading={a.pending} disabled={!email.v.includes("@")}>Enregistrer</Button>
        </div>}
      </Dialog>
      <Dialog open={!!collab} onClose={() => setCollab(null)} title={`Ajouter un collaborateur · ${collab?.e.sigle ?? ""}`}>
        {collab && <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3"><Field label="Prénom">{(id) => <Input id={id} value={collab.firstName} onChange={(e) => setCollab({ ...collab, firstName: e.target.value })} />}</Field><Field label="Nom">{(id) => <Input id={id} value={collab.lastName} onChange={(e) => setCollab({ ...collab, lastName: e.target.value })} />}</Field></div>
          <Field label="E-mail">{(id) => <Input id={id} type="email" value={collab.email} onChange={(e) => setCollab({ ...collab, email: e.target.value })} />}</Field>
          <FormError error={a.error} /><Button icon={UserPlus} onClick={ajouter} loading={a.pending} disabled={!collab.email.includes("@") || !collab.firstName || !collab.lastName}>Créer l&apos;accès</Button>
        </div>}
      </Dialog>
      <Confirm open={envoiTous} onClose={() => setEnvoiTous(false)} title="Envoyer les accès non utilisés" confirm="Envoyer" onConfirm={tous} pending={a.pending} error={a.error}>
        Chaque école jamais connectée et dont l&apos;e-mail officiel est connu reçoit un nouveau mot de passe provisoire par e-mail, avec le lien de connexion. Les adresses provisoires sont ignorées.
      </Confirm>
    </div>
  );
}
