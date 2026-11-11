"use client";
// Réglages des paiements (maquette « Paiements », écran 1) : E-Billing, Stripe, espèces. Les candidatures sont gratuites.
import { Banknote, CreditCard, Eye, EyeOff, PlugZap, Receipt, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Button, Loading, Panel, useToast } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { AdminHeader, LoadError, Toggle } from "./shared";

type Vue = {
  ebilling: { actif: boolean; env: "lab" | "production"; apiUrl: string; portailUrl: string; username: string; sharedKey: string | null };
  stripe: { actif: boolean; publishableKey: string; secretKey: string | null; webhookSecret: string | null };
  especes: { actif: boolean; instructions: string; delaiJours: number };
  webhooks: { ebilling: string; stripe: string }; recette: boolean;
};
const URLS = { lab: ["https://lab.billing-easy.net/api/v1", "https://test.billing-easy.net"], production: ["https://stg.billing-easy.com/api/v1", "https://staging.billing-easy.net"] } as const;

function Champ({ label, children, aide }: { label: string; children: ReactNode; aide?: ReactNode }) {
  return <label className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="text-[13px] font-bold">{label}</span>{children}{aide && <span className="text-xs text-ink-mute">{aide}</span>}</label>;
}
function Secret({ actuel, value, onChange, placeholder }: { actuel: string | null; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [voir, setVoir] = useState(false);
  return (
    <span className="relative flex">
      <input className="input pr-10" type={voir ? "text" : "password"} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder={actuel ? `Enregistrée (${actuel}) · laisser vide pour la garder` : placeholder} />
      <button type="button" onClick={() => setVoir(!voir)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-mute" aria-label={voir ? "Masquer" : "Afficher"}>{voir ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </span>
  );
}

export function AdminReglagesPaiement() {
  const toast = useToast();
  const r = useApi<Vue>("/admin/paiements/reglages");
  const [f, setF] = useState<Vue | null>(null);
  const [cles, setCles] = useState({ sharedKey: "", secretKey: "", webhookSecret: "" });
  const [tests, setTests] = useState<Record<string, { ok: boolean; message: string }>>({});
  const save = useAction();
  const test = useAction();
  useEffect(() => { if (r.data) setF(r.data); }, [r.data]);
  if (r.error) return <LoadError error={r.error} reload={r.reload} />;
  if (!f) return <Loading />;
  const set = <K extends keyof Vue>(k: K, v: Partial<Vue[K]>) => setF({ ...f, [k]: { ...(f[k] as object), ...v } });
  const enregistrer = () => save.run(async () => {
    const v = await api<Vue>("/admin/paiements/reglages", { method: "PUT", body: { ebilling: { ...f.ebilling, sharedKey: cles.sharedKey || undefined }, stripe: { ...f.stripe, secretKey: cles.secretKey || undefined, webhookSecret: cles.webhookSecret || undefined }, especes: f.especes } });
    r.setData(v); setCles({ sharedKey: "", secretKey: "", webhookSecret: "" }); toast("Réglages des paiements enregistrés");
  });
  const tester = (p: "ebilling" | "stripe") => test.run(async () => { const t = await api<{ ok: boolean; message: string }>("/admin/paiements/reglages/test", { body: { passerelle: p } }); setTests((x) => ({ ...x, [p]: t })); });
  const Res = ({ p }: { p: string }) => tests[p] ? <span className={`chip ${tests[p].ok ? "bg-[#e8f8ef] text-[#0f8a46]" : "bg-[#ffecef] text-[#d42a50]"}`}>{tests[p].message}</span> : null;

  return (
    <div className="min-w-0">
      <AdminHeader title="Réglages des paiements" sub="Passerelles de paiement et espèces (Navilease)" actions={<span className="chip bg-[#e8f8ef] text-[#0f8a46]"><ShieldCheck size={13} />Clés chiffrées, jamais réaffichées en clair</span>} />
      {f.recette && <div className="mb-4"><Alert tone="warn" title="Mode recette">PAYMENTS_MODE=sandbox : tous les paiements sont simulés, quels que soient ces réglages.</Alert></div>}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Mobile money (Gabon)" icon={Smartphone} action={<Toggle on={f.ebilling.actif} onChange={(v) => set("ebilling", { actif: v })} label="Activer le mobile money" />}>
          <p className="text-[13px] text-ink-mute">Passerelle E-Billing (Digitech Africa) : Airtel Money et Moov Money, paiements en F CFA. L&apos;élève reçoit la demande sur son téléphone et valide avec son code secret.</p>
          <div className="flex flex-wrap gap-3">
            <Champ label="Environnement"><select className="input" value={f.ebilling.env} onChange={(e) => { const env = e.target.value as "lab" | "production"; set("ebilling", { env, apiUrl: URLS[env][0], portailUrl: URLS[env][1] }); }}><option value="lab">Test (lab)</option><option value="production">Production</option></select></Champ>
            <Champ label="Adresse de l'API" aide="Fournie par Digitech Africa"><input className="input" value={f.ebilling.apiUrl} onChange={(e) => set("ebilling", { apiUrl: e.target.value })} /></Champ>
          </div>
          <div className="flex flex-wrap gap-3">
            <Champ label="Identifiant (username)"><input className="input" autoComplete="off" value={f.ebilling.username} onChange={(e) => set("ebilling", { username: e.target.value })} /></Champ>
            <Champ label="Clé partagée (shared key)"><Secret actuel={f.ebilling.sharedKey} value={cles.sharedKey} onChange={(v) => setCles({ ...cles, sharedKey: v })} placeholder="Clé partagée E-Billing" /></Champ>
          </div>
          <Champ label="Adresse de notification à déclarer chez E-Billing"><input className="input bg-[#f6f8fe]" readOnly value={f.webhooks.ebilling} onFocus={(e) => e.target.select()} /></Champ>
          <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" icon={PlugZap} loading={test.pending} onClick={() => tester("ebilling")}>Tester la connexion</Button><Res p="ebilling" /></div>
        </Panel>

        <Panel title="Carte bancaire (Stripe)" icon={CreditCard} action={<Toggle on={f.stripe.actif} onChange={(v) => set("stripe", { actif: v })} label="Activer la carte bancaire" />}>
          <p className="text-[13px] text-ink-mute">Visa, Mastercard. Paiement sur la page sécurisée de Stripe, dans la monnaie de l&apos;élève.</p>
          <Champ label="Clé publique"><input className="input" autoComplete="off" value={f.stripe.publishableKey} onChange={(e) => set("stripe", { publishableKey: e.target.value.trim() })} placeholder="pk_live_…" /></Champ>
          <Champ label="Clé secrète"><Secret actuel={f.stripe.secretKey} value={cles.secretKey} onChange={(v) => setCles({ ...cles, secretKey: v })} placeholder="sk_live_…" /></Champ>
          <Champ label="Secret du webhook" aide="Événements à envoyer : checkout.session.completed et checkout.session.expired"><Secret actuel={f.stripe.webhookSecret} value={cles.webhookSecret} onChange={(v) => setCles({ ...cles, webhookSecret: v })} placeholder="whsec_…" /></Champ>
          <Champ label="Adresse du webhook à déclarer chez Stripe"><input className="input bg-[#f6f8fe]" readOnly value={f.webhooks.stripe} onFocus={(e) => e.target.select()} /></Champ>
          <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" icon={PlugZap} loading={test.pending} onClick={() => tester("stripe")}>Tester la connexion</Button><Res p="stripe" /></div>
        </Panel>

        <Panel title="Espèces" icon={Banknote} action={<Toggle on={f.especes.actif} onChange={(v) => set("especes", { actif: v })} label="Accepter les espèces" />}>
          <p className="text-[13px] text-ink-mute">L&apos;élève paie au bureau ; vous confirmez la réception dans Paiements, filtre « À valider ».</p>
          <Champ label="Instructions affichées à l'élève"><textarea className="input min-h-[90px]" maxLength={800} value={f.especes.instructions} onChange={(e) => set("especes", { instructions: e.target.value })} /></Champ>
          <Champ label="Délai pour payer (jours)"><input className="input w-32" type="number" min={1} max={60} value={f.especes.delaiJours} onChange={(e) => set("especes", { delaiJours: Number(e.target.value) })} /></Champ>
        </Panel>

        <Panel title="Candidatures" icon={Receipt}>
          <p className="text-sm"><b>Les candidatures sont gratuites.</b> Aucun frais de dossier n&apos;est demandé aux élèves ni aux parents.</p>
          <p className="text-[13px] text-ink-mute">Les moyens de paiement réglés ici servent uniquement à Navilease (réservation d&apos;un logement, loyers).</p>
        </Panel>
      </div>
      <FormError error={save.error} />
      <div className="mt-5 flex justify-end"><Button onClick={enregistrer} loading={save.pending}>Enregistrer les réglages</Button></div>
    </div>
  );
}
