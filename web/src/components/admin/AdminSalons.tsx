"use client";
// Back-office : salons virtuels à valider (forfait réglé, publication, annonce par Navi) et commandes de fiches contact.
import { Check, Contact, Plus, Presentation, Send, X } from "lucide-react";
import { useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Button, Chip, Dialog, Empty, Loading, PageHeader, Panel, useToast } from "@/components/app/kit";
import { FormError, Input, Check as Coche } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { etablissements } from "@/lib/data";
import { Demande } from "@/components/etablissement/Salons";

const ECOLES: [string, string][] = etablissements.map((e) => [e.id, e.sigle ? `${e.sigle} · ${e.nom}` : e.nom] as [string, string]).sort((x, y) => x[1].localeCompare(y[1], "fr"));
type Apercu = { aInviter: number; mineurs: number; inscrits: number; dejaInvites: number; places: number; criteres: string[]; ciblePays: string[]; cibleNiveaux: string[]; cibleDomaines: string[] };

type Salon = { id: string; ecole: string; titre: string; debut: string; dureeMin: number; statut: string; cibleNiveaux: string[]; ciblePays: string[]; criteres: string[]; prixFiche: number; inscrits: number; forfaitMad: number | null; paiementRef: string | null; creeParAdmin: boolean; invitesEnvoyees: number; invitesLe: string | null };
type Fiche = { id: string; ecole: string; salon: string; nb: number; prixUnitMad: number; montantMad: number; statut: string; paiementRef: string | null; createdAt: string };
const quand = (d: string) => new Date(d).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const STATUT: Record<string, [string, "sun" | "green" | "rose" | "grey"]> = { demande: ["À valider", "sun"], publie: ["Publié", "green"], refuse: ["Refusé", "rose"], annule: ["Annulé", "grey"] };

export function AdminSalons() {
  const { data, loading, error, reload } = useApi<{ salons: Salon[]; fiches: Fiche[] }>("/admin/salons");
  const toast = useToast();
  const a = useAction();
  const [valider, setValider] = useState<{ s: Salon; forfait: string; ref: string; navi: boolean } | null>(null);
  const [refuser, setRefuser] = useState<{ s: Salon; motif: string } | null>(null);
  const [payer, setPayer] = useState<{ f: Fiche; ref: string } | null>(null);
  const [creer, setCreer] = useState(false);
  const [invit, setInvit] = useState<{ s: Salon; ap: Apercu | null } | null>(null);
  const ouvrirInvit = async (s: Salon) => { setInvit({ s, ap: null }); try { setInvit({ s, ap: await api<Apercu>(`/admin/salons/${s.id}/invitations`) }); } catch { setInvit(null); toast("Aperçu indisponible"); } };
  const envoyerInvit = async () => { if (!invit) return; const r = await a.run(() => api<{ envoyes: number; restants: number }>(`/admin/salons/${invit.s.id}/invitations`, { method: "POST" })); if (r) { toast(`${r.envoyes} invitation${r.envoyes > 1 ? "s" : ""} envoyée${r.envoyes > 1 ? "s" : ""}${r.restants ? ` · ${r.restants} restantes : relancez l'envoi` : ""}`); setInvit(null); reload(); } };
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur de chargement."}</Alert>;
  const ok = async (fn: () => Promise<unknown>, msg: string) => { if (await a.run(fn)) { toast(msg); setValider(null); setRefuser(null); setPayer(null); reload(); } };
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Salons virtuels" sub="Une demande validée enregistre le forfait réglé et publie le salon ; Navi peut l'annoncer aux élèves ciblés. L'équipe peut aussi créer un salon pour une école et inviter les élèves qui correspondent à ses options. Les fiches contact sont débloquées pour l'école quand leur règlement est enregistré." actions={!creer ? <Button icon={Plus} onClick={() => setCreer(true)}>Créer un salon</Button> : <Button variant="ghost" icon={X} onClick={() => setCreer(false)}>Fermer</Button>} />
      {creer && <Demande eid="" ecoles={ECOLES} apres={() => { setCreer(false); reload(); }} />}
      {!data.salons.length ? <Empty icon={Presentation} title="Aucune demande de salon" text="Les écoles demandent leurs salons depuis leur espace (« Salons virtuels »)." />
        : <div className="card overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink-mute"><th className="p-3">École et salon</th><th className="p-3">Date</th><th className="p-3">Public visé</th><th className="p-3">Fiches</th><th className="p-3">Statut</th><th className="p-3" /></tr></thead>
          <tbody>{data.salons.map((s) => { const [l, t] = STATUT[s.statut] ?? [s.statut, "grey"]; return (
            <tr key={s.id} className="border-t border-[#eef1f8]">
              <td className="p-3"><b>{s.ecole}</b><span className="block text-xs text-ink-mute">{s.titre}</span></td>
              <td className="p-3 text-xs">{quand(s.debut)} · {s.dureeMin} min</td>
              <td className="p-3 text-xs">{[...s.cibleNiveaux.map((n) => n.replace("niv-", "")), ...s.ciblePays].join(", ") || "tous"}</td>
              <td className="p-3 text-xs">{s.prixFiche} MAD{s.criteres.length ? ` · ${s.criteres.length} critère${s.criteres.length > 1 ? "s" : ""}` : ""}</td>
              <td className="p-3"><Chip tone={t}>{l}</Chip>{s.creeParAdmin && <span className="mt-1 block text-[11px] font-bold text-brand-600">créé par l&apos;équipe</span>}{s.statut === "publie" && <span className="mt-1 block text-[11px] text-ink-mute">{s.inscrits} inscrits{s.forfaitMad != null ? ` · ${s.forfaitMad} MAD` : ""}{s.invitesEnvoyees ? ` · ${s.invitesEnvoyees} invités` : ""}</span>}</td>
              <td className="p-3 text-right">{s.statut === "demande" ? <span className="flex justify-end gap-2"><Button size="sm" icon={Check} onClick={() => setValider({ s, forfait: "", ref: "", navi: true })}>Valider</Button><Button size="sm" variant="ghost" onClick={() => setRefuser({ s, motif: "" })}>Refuser</Button></span>
                : s.statut === "publie" ? <span className="flex items-center justify-end gap-3">{new Date(s.debut) > new Date() && <Button size="sm" variant="ghost" icon={Send} onClick={() => ouvrirInvit(s)}>Inviter les élèves</Button>}<Link href={`/salons/${s.id}/`} className="text-sm font-bold text-brand-600">Page</Link></span> : null}</td>
            </tr>); })}</tbody></table></div>}
      <Panel title="Commandes de fiches contact" icon={Contact}>
        {!data.fiches.length ? <p className="text-sm text-ink-mute">Aucune commande.</p>
          : <ul className="flex flex-col gap-2 text-sm">{data.fiches.map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f6f8fe] p-3">
              <span><b>{f.ecole}</b> · {f.salon}<span className="block text-xs text-ink-mute">{f.nb} fiche{f.nb > 1 ? "s" : ""} × {f.prixUnitMad} MAD = {f.montantMad.toLocaleString("fr-FR")} MAD{f.paiementRef ? ` · ${f.paiementRef}` : ""}</span></span>
              {f.statut === "en_attente" ? <Button size="sm" onClick={() => setPayer({ f, ref: "" })}>Règlement reçu</Button> : <Chip tone={f.statut === "payee" ? "green" : "grey"}>{f.statut === "payee" ? "Réglée, débloquée" : "Annulée"}</Chip>}
            </li>)}</ul>}
      </Panel>
      <Dialog open={!!valider} onClose={() => setValider(null)} title={`Valider « ${valider?.s.titre ?? ""} »`}>
        {valider && <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1.5"><b>Forfait réglé (MAD)</b><Input inputMode="numeric" value={valider.forfait} onChange={(e) => setValider({ ...valider, forfait: e.target.value.replace(/\D/g, "") })} placeholder="Tarif convenu avec l'école" /></label>
          <label className="flex flex-col gap-1.5"><b>Référence du règlement</b><Input value={valider.ref} onChange={(e) => setValider({ ...valider, ref: e.target.value })} placeholder="Virement · VIR-2026-1204" /></label>
          <Coche checked={valider.navi} onChange={(v) => setValider({ ...valider, navi: v })}>Navi peut annoncer ce salon aux élèves ciblés</Coche>
          <p className="text-xs text-ink-mute">Fiches contact : {valider.s.prixFiche} MAD la fiche, facturées après le salon selon le nombre commandé.</p>
          <FormError error={a.error} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setValider(null)}>Annuler</Button><Button loading={a.pending} disabled={!valider.forfait || valider.ref.trim().length < 2} onClick={() => ok(() => api(`/admin/salons/${valider.s.id}/valider`, { body: { forfaitMad: Number(valider.forfait), paiementRef: valider.ref, naviAnnonce: valider.navi } }), "Salon publié")}>Valider et publier</Button></div>
        </div>}
      </Dialog>
      <Dialog open={!!invit} onClose={() => setInvit(null)} title={`Inviter les élèves · ${invit?.s.titre ?? ""}`}>
        {invit && (!invit.ap ? <Loading /> : <div className="flex flex-col gap-3 text-sm">
          <p>Élèves et étudiants inscrits sur Navigoal qui correspondent aux options de l&apos;école :</p>
          <ul className="flex flex-col gap-1 rounded-xl bg-[#f6f8fe] p-3 text-[13px] text-ink-soft">
            <li><b>Pays :</b> {invit.ap.ciblePays.join(", ") || "tous"}</li>
            <li><b>Niveaux :</b> {invit.ap.cibleNiveaux.map((n) => n.replace("niv-", "")).join(", ") || "tous"}</li>
            <li><b>Domaines :</b> {invit.ap.cibleDomaines.join(", ") || "ceux de l'école"}</li>
            <li><b>Critères :</b> {invit.ap.criteres.join(", ") || "aucun"}</li>
          </ul>
          <p className="text-[15px]"><b>{invit.ap.aInviter}</b> élève{invit.ap.aInviter > 1 ? "s" : ""} à inviter{invit.ap.mineurs ? <> dont {invit.ap.mineurs} mineur{invit.ap.mineurs > 1 ? "s" : ""} (leurs parents sont prévenus aussi)</> : null}.</p>
          <p className="text-xs text-ink-mute">Déjà invités : {invit.ap.dejaInvites} · déjà inscrits : {invit.ap.inscrits} · places : {invit.ap.places}. Notification et e-mail, une seule invitation par élève et par salon, 500 par envoi.</p>
          <FormError error={a.error} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setInvit(null)}>Annuler</Button><Button icon={Send} loading={a.pending} disabled={!invit.ap.aInviter} onClick={envoyerInvit}>Envoyer {Math.min(invit.ap.aInviter, 500)} invitation{invit.ap.aInviter > 1 ? "s" : ""}</Button></div>
        </div>)}
      </Dialog>
      <Dialog open={!!refuser} onClose={() => setRefuser(null)} title="Refuser la demande">
        {refuser && <div className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1.5"><b>Motif (envoyé à l&apos;école)</b><Input value={refuser.motif} onChange={(e) => setRefuser({ ...refuser, motif: e.target.value })} placeholder="Ex. : date trop proche, proposez une autre date" /></label>
          <FormError error={a.error} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setRefuser(null)}>Annuler</Button><Button variant="danger" icon={X} loading={a.pending} disabled={refuser.motif.trim().length < 5} onClick={() => ok(() => api(`/admin/salons/${refuser.s.id}/refuser`, { body: { motif: refuser.motif } }), "Demande refusée")}>Refuser</Button></div>
        </div>}
      </Dialog>
      <Dialog open={!!payer} onClose={() => setPayer(null)} title="Règlement des fiches reçu">
        {payer && <div className="flex flex-col gap-3 text-sm">
          <p>{payer.f.ecole} · {payer.f.nb} fiches · <b>{payer.f.montantMad.toLocaleString("fr-FR")} MAD</b></p>
          <label className="flex flex-col gap-1.5"><b>Référence du règlement</b><Input value={payer.ref} onChange={(e) => setPayer({ ...payer, ref: e.target.value })} /></label>
          <FormError error={a.error} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPayer(null)}>Annuler</Button><Button loading={a.pending} disabled={payer.ref.trim().length < 2} onClick={() => ok(() => api(`/admin/fiches/${payer.f.id}/payee`, { body: { paiementRef: payer.ref } }), "Fiches débloquées pour l'école")}>Débloquer les fiches</Button></div>
        </div>}
      </Dialog>
    </div>
  );
}
