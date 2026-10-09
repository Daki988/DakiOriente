"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Info, KeyRound, Lock, RotateCcw, Send, ShieldCheck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Button, Chip, Loading, PageHeader, Panel, money, useToast } from "@/components/app/kit";
import { Check, Field, FileDrop, FormError, Textarea, docLabel, type Doc } from "@/components/app/form";
import { useUser } from "@/components/app/Session";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { Cover, SERVICE_FEE, VERIF, addMonths, etabName, isoDay, modeLabel, toEur, type Booking, type Housing } from "./shared";
import { Stepper } from "./Stepper";

const TENANT_DOCS: [string, string][] = [["attestation_admission", "Attestation d'admission"], ["identite", "Pièce d'identité / passeport"], ["attestation_scolarite", "Attestation de scolarité"], ["piece_garant", "Pièce d'identité du garant"], ["justificatif_ressources", "Justificatif de ressources"], ["autre", "Autre document"]];

export function BookingRequest() {
  const sp = useSearchParams();
  const id = sp.get("logement");
  const user = useUser();
  const { data, error, loading } = useApi<{ housing: Housing; landlord: { firstName: string; company: string | null } }>(id ? `/logements/${id}` : null);
  if (!id) return <Alert tone="warn" title="Aucun logement sélectionné" action={<Link href="/navilease/logements" className="btn-ghost py-2 text-[13px]">Chercher un logement</Link>}>Choisis d&apos;abord un logement sur Navilease.</Alert>;
  if (!["eleve", "etudiant"].includes(user.role)) return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Demande de réservation" crumbs={[["Navilease", "/navilease/logements"], ["Demande de réservation"]]} />
      <Alert tone="info" title="Réservation réservée aux élèves et étudiants" action={<Link href={`/navilease/logements/${id}`} className="btn-ghost py-2 text-[13px]">Retour à l&apos;annonce</Link>}>
        {user.role === "parent" ? "La demande est faite par votre enfant depuis son compte. Vous serez notifié pour vous porter garant et pourrez régler le séquestre." : "Seuls les comptes élève ou étudiant peuvent demander une réservation de logement."}
      </Alert>
    </div>
  );
  if (loading) return <Loading label="Chargement du logement…" />;
  if (error || !data) return <Alert tone="error" title="Logement indisponible">{error?.message ?? "Annonce introuvable."}</Alert>;
  return <Form h={data.housing} landlord={data.landlord.company ?? data.landlord.firstName} initStart={sp.get("entree")} initMonths={Number(sp.get("duree")) || 0} />;
}

function Form({ h, landlord, initStart, initMonths }: { h: Housing; landlord: string; initStart: string | null; initMonths: number }) {
  const router = useRouter();
  const toast = useToast();
  const today = isoDay(new Date());
  const [start, setStart] = useState(initStart && initStart >= today ? initStart : h.availableFrom && h.availableFrom > today ? h.availableFrom.slice(0, 10) : today);
  const [months, setMonths] = useState(Math.max(h.minMonths, initMonths || 10));
  const [message, setMessage] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [okRules, setOkRules] = useState(false);
  const [okContact, setOkContact] = useState(false);
  const [touched, setTouched] = useState(false);
  const docs = useApi<Doc[]>("/documents");
  const { pending, error, run } = useAction();
  const fee = Math.round(h.rent * SERVICE_FEE);
  const total = h.rent + h.charges + h.deposit + fee;
  const eur = toEur(total, h.currency);
  const end = addMonths(start, months);
  const sorted = useMemo(() => [...(docs.data ?? [])].filter((d) => !d.type.startsWith("kyc")).sort((a, b) => (TENANT_DOCS.findIndex(([k]) => k === a.type) + 99) % 99 - (TENANT_DOCS.findIndex(([k]) => k === b.type) + 99) % 99), [docs.data]);
  const dateErr = start < today ? "La date d'entrée est passée." : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (dateErr || !okRules || !okContact) return;
    const b = await run(() => api<Booking>("/reservations", { body: { housingId: h.id, startDate: start, months, message: message.trim() || undefined, documentIds: picked } }));
    if (b) { toast("Demande envoyée au bailleur."); router.push(`/navilease/reservations/${b.id}`); }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Demande de réservation" crumbs={[["Mes réservations", "/navilease/reservations"], [h.title, `/navilease/logements/${h.id}`], ["Demande"]]} />
      <Stepper steps={["Demande", "Acceptée", "Paiement séquestre", "Contrat signé", "Entrée"]} current={0} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <form onSubmit={submit} className="card flex flex-col gap-5 rounded-[24px] p-5 sm:p-7" noValidate>
          <div>
            <h2 className="text-xl font-extrabold">Ta demande de réservation</h2>
            <p className="text-sm text-ink-mute">Le bailleur a 48 h pour répondre. Aucun paiement n&apos;est débité avant son acceptation.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Date d'entrée" required error={touched ? dateErr : null}>{(fid) => <input id={fid} type="date" className="input" min={today} value={start} onChange={(e) => setStart(e.target.value)} required />}</Field>
            <Field label="Durée" required hint={`Minimum ${h.minMonths} mois`}>{(fid) => (
              <select id={fid} className="input" value={months} onChange={(e) => setMonths(Number(e.target.value))}>{Array.from({ length: 25 - h.minMonths }, (_, i) => h.minMonths + i).map((m) => <option key={m} value={m}>{m} mois</option>)}</select>
            )}</Field>
            <Field label="Date de sortie">{(fid) => <div id={fid} className="input flex items-center gap-2 bg-[#f6f8fe]"><CalendarDays size={16} className="text-ink-mute" />{end.toLocaleDateString("fr-FR")}</div>}</Field>
          </div>
          <Field label="Message au bailleur" hint="Présente-toi : établissement, rentrée, garant… Les numéros et e-mails sont masqués automatiquement.">{(fid) => (
            <Textarea id={fid} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, je suis admise en Bachelor pour la rentrée. Je suis calme et non-fumeuse ; mon père sera garant. Merci !" />
          )}</Field>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between"><b className="text-[13px]">Pièces du dossier locataire</b><span className="text-xs text-ink-mute">{picked.length} jointe{picked.length > 1 ? "s" : ""}</span></div>
            {docs.loading ? <Loading label="Chargement de ton coffre-fort…" /> : docs.error ? <FormError error={docs.error.message} /> : sorted.length ? (
              <ul className="flex flex-col gap-2">
                {sorted.map((d) => {
                  const on = picked.includes(d.id);
                  return (
                    <li key={d.id}>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${on ? "border-brand-300 bg-brand-50/50" : "border-slate-200/70 hover:border-brand-200"}`}>
                        <input type="checkbox" className="h-[18px] w-[18px] accent-brand-600" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== d.id) : [...picked, d.id])} />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FileText size={17} /></span>
                        <span className="min-w-0 flex-1"><b className="block truncate text-sm">{d.label ?? docLabel(d.type)}</b><span className="block truncate text-xs text-ink-mute">{d.fileName}</span></span>
                        {on ? <Chip tone="green">Jointe</Chip> : <Chip tone="grey">Joindre</Chip>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="rounded-2xl bg-[#f6f8fe] p-3 text-sm text-ink-mute">Ton coffre-fort est vide. Ajoute ton attestation d&apos;admission et ta pièce d&apos;identité : les bailleurs acceptent plus vite les dossiers complets.</p>}
            <FileDrop compact types={TENANT_DOCS} onUploaded={(d) => { docs.setData([d, ...(docs.data ?? [])]); setPicked((p) => [...p, d.id]); toast("Document ajouté et joint à la demande."); }} />
          </div>

          <div className="flex flex-col gap-2.5">
            <Check checked={okRules} onChange={setOkRules}>J&apos;ai lu le règlement du logement et les conditions d&apos;annulation Navilease.</Check>
            <Check checked={okContact} onChange={setOkContact}>Je comprends que l&apos;adresse exacte et les coordonnées seront partagées après le paiement en séquestre.</Check>
            {touched && (!okRules || !okContact) && <span className="text-xs font-semibold text-[#d42a50]" role="alert">Coche les deux cases pour envoyer ta demande.</span>}
          </div>
          <FormError error={error} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Link href={`/navilease/logements/${h.id}`} className="btn-ghost"><ArrowLeft size={16} />Retour à l&apos;annonce</Link>
            <Button type="submit" icon={Send} loading={pending}>Envoyer la demande</Button>
          </div>
        </form>

        <aside className="flex flex-col gap-5">
          <section className="card flex flex-col gap-3 overflow-hidden rounded-[24px] p-4">
            <div className="h-36 overflow-hidden rounded-2xl"><Cover h={h} /></div>
            <div><b className="text-lg">{h.title}</b><p className="text-xs text-ink-mute">{landlord} · {VERIF[h.verification].label}{h.nearEstablishments[0] ? ` · ${h.nearEstablishments[0].minutes} min ${modeLabel(h.nearEstablishments[0].mode)} de ${etabName(h.nearEstablishments[0].id)}` : ""}</p></div>
            <dl className="flex flex-col gap-1.5 text-sm">
              {[["Premier loyer", h.rent], ["Charges", h.charges], ["Caution", h.deposit], ["Frais de service (5 %)", fee]].map(([l, v]) => <div key={l as string} className="flex justify-between"><dt className="text-ink-mute">{l}</dt><dd className="font-bold">{money(v as number, h.currency)}</dd></div>)}
            </dl>
            <div className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 text-white"><b className="text-sm">Total en séquestre</b><b className="text-lg">{money(total, h.currency)}</b></div>
            <p className="text-xs text-ink-mute">{eur ? `≈ ${eur.toLocaleString("fr-FR")} € (indicatif) · ` : ""}loyers suivants payés chaque mois ({money(h.rent + h.charges, h.currency)})</p>
          </section>
          <Panel title="Comment marche le séquestre ?" icon={ShieldCheck}>
            <ol className="flex flex-col gap-3">
              {[[Wallet, "Tu paies", "Après acceptation du bailleur, par mobile money, carte ou virement (toi ou ton parent)."], [Lock, "Fonds bloqués", "Navilease conserve le montant en séquestre sur un compte dédié."], [KeyRound, "Tu entres", "Tu déclares ton entrée avec l'état des lieux."], [ShieldCheck, "Bailleur payé", "Loyer et charges versés au bailleur ; la caution reste bloquée jusqu'à la sortie."]].map(([I, t, x], i) => {
                const Ic = I as typeof Wallet;
                return <li key={i} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><Ic size={16} /></span><div><b className="text-sm">{t as string}</b><p className="text-xs text-ink-mute">{x as string}</p></div></li>;
              })}
            </ol>
          </Panel>
          <Panel title="Annulation" icon={RotateCcw}>
            <p className="text-sm text-ink-mute">Gratuite tant que le contrat n&apos;est pas signé : le séquestre t&apos;est intégralement remboursé. Après signature, un litige peut être ouvert avec médiation Navilease.</p>
            <p className="flex items-start gap-2 text-xs text-ink-mute"><Info size={14} className="mt-0.5 shrink-0" />Si tu es mineur·e, ton parent ou tuteur devra se porter garant avant le paiement.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
