"use client";
import { useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, Circle, FileText, Landmark, ShieldCheck, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Button, Chip, Loading, PageHeader, Panel, dateFr, useToast } from "@/components/app/kit";
import { Field, FileDrop, FormError, Input, Select, docLabel, type Doc } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import type { LandlordInfo } from "@/app/(app)/bailleur/landlord";
import { KycChip, PAYOUT_METHODS } from "./common";

const KYC_TYPES: [string, string][] = [["kyc_identite", "Pièce d'identité"], ["kyc_propriete", "Titre de propriété ou mandat"]];

export function LandlordKyc({ info }: { info: LandlordInfo | null }) {
  const router = useRouter();
  const toast = useToast();
  const docs = useApi<Doc[]>("/documents");
  const kycDocs = useMemo(() => (docs.data ?? []).filter((d) => d.type.startsWith("kyc_")), [docs.data]);
  const [picked, setPicked] = useState<string[] | null>(null);
  const sel = picked ?? kycDocs.map((d) => d.id);
  const [method, setMethod] = useState(info?.payoutMethod ?? "");
  const [account, setAccount] = useState("");
  const [edit, setEdit] = useState(!info || ["non_soumis", "refuse"].includes(info.kycStatus));
  const [touched, setTouched] = useState(false);
  const act = useAction();
  const status = info?.kycStatus ?? "non_soumis";
  const has = (t: string) => kycDocs.some((d) => d.type === t && sel.includes(d.id));
  const errs = { identite: !has("kyc_identite") ? "Ajoutez une pièce d'identité." : null, propriete: !has("kyc_propriete") ? "Ajoutez un titre de propriété ou un mandat de gestion." : null, method: !method ? "Choisissez un moyen de versement." : null, account: account.trim().length < 6 ? "Indiquez le numéro de téléphone ou l'IBAN (6 caractères minimum)." : null };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    const r = await act.run(() => api("/bailleur/verification", { body: { documents: sel, versement: { method, account: account.trim() } } }));
    if (r !== undefined) { toast("Vérification envoyée : réponse sous 48 h ouvrées."); setEdit(false); router.refresh(); }
  };

  const steps: [string, boolean][] = [["Pièce d'identité", status !== "non_soumis" || has("kyc_identite")], ["Titre de propriété / mandat", status !== "non_soumis" || has("kyc_propriete")], ["Moyen de versement", !!info?.payoutMethod], ["Validation Navilease", status === "valide"]];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Vérification & versements" sub="Vérifiez votre identité pour publier en confiance et recevoir vos loyers." crumbs={[["Espace bailleur", "/bailleur"], ["Vérification & versements"]]} badge={<KycChip status={status} />} />
      {status === "valide" && <Alert tone="success" title="Identité vérifiée">Vos annonces portent le badge « Identité vérifiée » et sont visibles par tous les étudiants, y compris mineurs.</Alert>}
      {status === "en_revue" && <Alert tone="warn" title="Vérification en cours">Notre équipe conformité examine vos pièces sous 48 h ouvrées. Vous serez notifié du résultat.</Alert>}
      {status === "refuse" && <Alert tone="error" title="Vérification refusée">{info?.kycNote ?? "Vos pièces n'ont pas pu être validées. Déposez des documents lisibles et à jour."}</Alert>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <Panel title="Pièces justificatives et versement" icon={ShieldCheck}>
          {!edit ? (
            <div className="flex flex-col gap-3 text-sm">
              <p className="text-ink-soft">Moyen de versement : <b>{PAYOUT_METHODS.find(([k]) => k === info?.payoutMethod)?.[1] ?? "—"}</b>{info?.payoutAccount ? ` · ${info.payoutAccount}` : ""}</p>
              <p className="text-ink-mute">{info?.kycDocs ?? 0} pièce{(info?.kycDocs ?? 0) > 1 ? "s" : ""} transmise{(info?.kycDocs ?? 0) > 1 ? "s" : ""}. Données chiffrées, consultées uniquement par l&apos;équipe conformité.</p>
              <Button variant="ghost" onClick={() => setEdit(true)} className="self-start">Mettre à jour mes informations</Button>
              {status === "valide" && <p className="text-xs text-ink-mute">Une mise à jour repasse votre dossier en vérification.</p>}
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
              <p className="text-sm text-ink-mute">Obligatoire pour publier et recevoir des paiements. Données chiffrées, consultées uniquement par l&apos;équipe conformité Navilease.</p>
              <div className="flex flex-col gap-2.5">
                <b className="text-[13px]">Mes pièces</b>
                {docs.loading ? <Loading /> : docs.error ? <FormError error={docs.error.message} /> : kycDocs.length ? (
                  <ul className="flex flex-col gap-2">{kycDocs.map((d) => {
                    const on = sel.includes(d.id);
                    return <li key={d.id}><label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 ${on ? "border-[#bfe9cf] bg-[#f6fdf8]" : "border-slate-200/70"}`}>
                      <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f8a46]" checked={on} onChange={() => setPicked(on ? sel.filter((x) => x !== d.id) : [...sel, d.id])} />
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><FileText size={17} /></span>
                      <span className="min-w-0 flex-1"><b className="block text-sm">{docLabel(d.type)}</b><span className="block truncate text-xs text-ink-mute">{d.fileName} · {dateFr(d.createdAt)}</span></span>
                      <Chip tone={on ? "green" : "grey"}>{on ? "Jointe" : "Non jointe"}</Chip>
                    </label></li>;
                  })}</ul>
                ) : <p className="text-sm text-ink-mute">Aucune pièce déposée pour l&apos;instant.</p>}
                {touched && (errs.identite || errs.propriete) && <span className="text-xs font-semibold text-[#d42a50]" role="alert">{errs.identite ?? errs.propriete}</span>}
                <FileDrop types={KYC_TYPES} onUploaded={(d) => { docs.setData([d, ...(docs.data ?? [])]); setPicked([...sel, d.id]); toast(`${docLabel(d.type)} ajouté.`); }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Moyen de versement" required error={touched ? errs.method : null}>{(id) => <Select id={id} value={method} onChange={(e) => setMethod(e.target.value)} options={PAYOUT_METHODS} placeholder="Choisir…" />}</Field>
                <Field label={method === "virement" ? "IBAN / RIB" : "Numéro de téléphone"} required error={touched ? errs.account : null} hint={info?.payoutAccount ? `Actuel : ${info.payoutAccount}` : "Les versements sont faits à votre nom uniquement."}>{(id) => <Input id={id} value={account} onChange={(e) => setAccount(e.target.value)} placeholder={method === "virement" ? "MA64 0000 0000 0000 0000 0000 000" : "+241 77 00 00 00"} autoComplete="off" />}</Field>
              </div>
              <FormError error={act.error} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" icon={BadgeCheck} loading={act.pending} className="bg-[#0f8a46] hover:bg-[#0b6b37]">Envoyer pour vérification</Button>
                {info && !["non_soumis", "refuse"].includes(info.kycStatus) && <Button type="button" variant="ghost" onClick={() => setEdit(false)}>Annuler</Button>}
              </div>
            </form>
          )}
        </Panel>

        <aside className="flex flex-col gap-5">
          <Panel title="Progression" icon={ShieldCheck} tone="green">
            <ul className="flex flex-col gap-2.5 text-sm">{steps.map(([l, ok]) => <li key={l} className="flex items-center gap-2.5">{ok ? <CheckCircle2 size={17} className="text-[#0f8a46]" /> : <Circle size={17} className="text-ink-mute" />}<span className={ok ? "" : "text-ink-mute"}>{l}</span></li>)}</ul>
          </Panel>
          <Panel title="Niveaux de confiance" icon={Star}>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              <li><b>Identité vérifiée</b> · après validation KYC</li>
              <li><b>Visité par Navilease</b> · visite gratuite du logement par notre équipe</li>
              <li><b>Partenaire certifié</b> · résidences et agences sous contrat</li>
            </ul>
            <p className="text-xs text-ink-mute">Les annonces vérifiées remontent en tête des recherches et sont seules visibles par les élèves mineurs.</p>
          </Panel>
          <Panel title="Versements" icon={Landmark}>
            <p className="text-sm text-ink-mute">Le premier loyer est versé après l&apos;entrée du locataire ; les loyers suivants à chaque paiement mensuel. La caution reste en séquestre jusqu&apos;à l&apos;état des lieux de sortie.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
