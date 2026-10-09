"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle, BadgeCheck, CalendarClock, Check, CircleDollarSign, Download, FileSignature, FileText, Home, KeyRound, Lock, LogOut, Mail, MapPin, MessageCircle, Phone, ReceiptText, ShieldCheck, Star, UserRound, UsersRound, X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Alert, Avatar, Button, Chip, Dialog, Loading, PageHeader, Panel, StatusBadge, Timeline, dateFr, money, useToast } from "@/components/app/kit";
import { Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useUser } from "@/components/app/Session";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { BOOKING_STATUS, COUNTRY_OF_CURRENCY, Cover, SEQUENCE, addMonths, monthFr, period, seqIndex, type Booking, type Housing, type Payment } from "./shared";
import { Stepper } from "./Stepper";

type Person = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null;
type Ev = { id: string; status: string; note: string | null; authorId: string | null; createdAt: string };
type D = { booking: Booking; events: Ev[]; payments: Payment[]; revealed: boolean; housing: Housing; tenant: Person; landlord: Person; guarantor: Person };
type Methods = Record<string, { id: string; label: string }[]>;
type Conv = { id: string; contextKind: string | null; contextId: string | null };

const STEP_SHORT = ["Demande", "Acceptée", "Paiement séquestre", "Contrat signé", "Entrée", "Fonds versés", "En cours", "Préavis", "Sortie", "Caution restituée"];
const full = (p: Person) => (p ? `${p.firstName} ${p.lastName}` : "—");

export function BookingDetail({ id }: { id: string }) {
  const { data, error, loading, reload } = useApi<D>(`/reservations/${id}`);
  if (loading) return <Loading label="Chargement de la réservation…" />;
  if (error || !data) return <Alert tone="error" title={error?.status === 403 ? "Accès refusé" : error?.status === 404 ? "Réservation introuvable" : "Chargement impossible"} action={<Link href="/navilease/reservations" className="btn-ghost py-2 text-[13px]">Mes réservations</Link>}>{error?.message}</Alert>;
  return <Detail d={data} reload={reload} />;
}

function Detail({ d, reload }: { d: D; reload: () => Promise<void> }) {
  const me = useUser();
  const router = useRouter();
  const toast = useToast();
  const b = d.booking, h = d.housing;
  const isTenant = me.id === b.tenantId;
  const isLandlord = me.id === b.landlordId || me.role === "admin";
  const isParent = me.role === "parent" && !isTenant && !isLandlord;
  const methods = useApi<Methods>("/paiements/moyens");
  const convs = useApi<Conv[]>("/conversations");
  const conv = convs.data?.find((c) => c.contextKind === "booking" && c.contextId === b.id);
  const country = COUNTRY_OF_CURRENCY[b.currency] ?? "GA";
  const opts: [string, string][] = (methods.data?.[country] ?? []).map((m) => [m.id, m.label]);
  const act = useAction();
  const [dialog, setDialog] = useState<null | "refuse" | "cancel" | "dispute" | "notice" | "checkout" | "review" | "rent">(null);
  const [rentPeriod, setRentPeriod] = useState("");

  const bad = ["refusee", "annulee", "litige"].includes(b.status);
  const idx = seqIndex(b.status, d.events);
  const end = addMonths(b.startDate, b.months);
  const first = b.rent + b.charges + b.deposit + b.serviceFee;
  const resa = d.payments.find((p) => p.kind === "reservation" && ["reussi", "rembourse"].includes(p.status));
  const pendingResa = d.payments.find((p) => p.kind === "reservation" && ["initie", "en_attente"].includes(p.status));
  const canCancel = (isTenant || isLandlord) && ["demande", "acceptee", "attente_garant", "paiement_sequestre"].includes(b.status);
  const canDispute = (isTenant || me.id === b.landlordId || me.id === b.guarantorId) && !["demande", "acceptee", "attente_garant", "refusee", "annulee", "litige"].includes(b.status);
  const other = isTenant ? d.landlord : d.tenant;

  const post = async (path: string, body: unknown, ok: string) => {
    const r = await act.run(() => api(`/reservations/${b.id}/${path}`, { body }));
    if (r !== undefined) { toast(ok); setDialog(null); await reload(); }
    return r;
  };
  const go = (redirectUrl?: string | null) => {
    if (!redirectUrl) { reload(); return; }
    const u = new URL(redirectUrl, window.location.origin);
    if (u.pathname.startsWith("/paiement/")) router.push(u.pathname + u.search); else window.location.href = redirectUrl;
  };
  const pay = async (moyen: string) => {
    const r = await act.run(() => api<{ redirectUrl?: string }>(`/reservations/${b.id}/paiement`, { body: { moyen } }));
    if (r) go(r.redirectUrl);
  };
  const payRent = async (moyen: string) => {
    const r = await act.run(() => api<{ redirectUrl?: string }>(`/reservations/${b.id}/loyer`, { body: { moyen, periode: rentPeriod } }));
    if (r) { setDialog(null); go(r.redirectUrl); }
  };

  const roleLine = isTenant ? `bailleur ${d.landlord?.firstName ?? ""}` : isLandlord ? `locataire ${full(d.tenant)}` : `pour ${full(d.tenant)}`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumbs={[[isLandlord && me.role !== "admin" ? "Demandes & réservations" : "Mes réservations", isLandlord && me.role !== "admin" ? "/bailleur/reservations" : "/navilease/reservations"], [`Réservation ${b.number}`]]}
        title={<span className="flex items-center gap-3"><span className="hidden h-14 w-20 overflow-hidden rounded-2xl sm:block"><Cover h={h} iconSize={22} /></span>{h.title}</span>}
        badge={<StatusBadge status={b.status} label={BOOKING_STATUS[b.status]} />}
        sub={`Réservation ${b.number} · du ${dateFr(b.startDate)} au ${dateFr(end)} · ${roleLine}`}
        actions={<>
          {conv && <Link href={`/messages/${conv.id}`} className="btn-ghost"><MessageCircle size={17} />{isTenant ? "Écrire au bailleur" : isLandlord ? "Écrire au locataire" : "Messagerie"}</Link>}
          {canDispute && <Button variant="ghost" icon={AlertTriangle} className="border-[#ffd0d9] text-[#d42a50] hover:border-[#d42a50] hover:bg-[#fff1f3]" onClick={() => setDialog("dispute")}>Signaler un incident</Button>}
        </>}
      />
      <Stepper steps={STEP_SHORT} current={idx} done={b.status === "caution_restituee"} bad={bad} />
      {b.status === "refusee" && <Alert tone="error" title="Demande refusée par le bailleur">{d.events.findLast((e) => e.status === "refusee")?.note ?? "Aucun paiement n'a été débité."} {isTenant && <Link href="/navilease/logements" className="font-bold underline">Voir d&apos;autres logements</Link>}</Alert>}
      {b.status === "annulee" && <Alert tone="warn" title="Réservation annulée">{d.events.findLast((e) => e.status === "annulee")?.note ?? ""} {resa ? "Le montant en séquestre est remboursé au payeur." : ""}</Alert>}
      {b.status === "litige" && <Alert tone="error" title="Litige en cours de médiation">L&apos;équipe Navilease examine le dossier sous 24 h ouvrées. Les fonds en séquestre restent bloqués jusqu&apos;à la décision.</Alert>}
      {b.status === "attente_garant" && <Alert tone="warn" title="En attente du garant">{isParent ? "Votre validation est requise avant le paiement." : "Le locataire est mineur : un parent ou tuteur doit se porter garant avant le paiement."}</Alert>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <div className="flex min-w-0 flex-col gap-5">
          {Actions()}
          {["paiement_sequestre", "contrat_signe", "entree", "fonds_verses", "en_cours", "preavis", "sortie", "caution_restituee", "litige"].includes(b.status) && d.revealed && Contract()}
          {["en_cours", "preavis", "sortie", "caution_restituee"].includes(b.status) && Rents()}
          {(isLandlord || isTenant) && Dossier()}
          <Panel title="Historique" icon={CalendarClock}>
            <Timeline steps={d.events.map((e, i) => ({ title: BOOKING_STATUS[e.status] ?? e.status, date: dateFr(e.createdAt, true), note: e.note, state: ["refusee", "annulee", "litige"].includes(e.status) ? "bad" : i === d.events.length - 1 && !["caution_restituee"].includes(e.status) ? "current" : "done" }))} />
            <p className="text-xs text-ink-mute">Séquence Navilease : {SEQUENCE.map(([, l]) => l).join(" → ")}.</p>
          </Panel>
        </div>

        <aside className="flex flex-col gap-5">
          {Escrow()}
          <Panel title={isTenant ? "Ton arrivée" : "Coordonnées"} icon={MapPin}>
            {d.revealed ? (
              <ul className="flex flex-col gap-2.5 text-sm">
                <li className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-ink-mute" />{[h.address, h.quartier, h.ville].filter(Boolean).join(", ")}</li>
                <li className="flex items-start gap-2.5"><KeyRound size={16} className="mt-0.5 shrink-0 text-ink-mute" />Entrée le {dateFr(b.startDate)}</li>
                {other && <li className="flex items-start gap-2.5"><UserRound size={16} className="mt-0.5 shrink-0 text-ink-mute" />{full(other)} ({isTenant ? "bailleur" : "locataire"})</li>}
                {other?.phone && <li className="flex items-start gap-2.5"><Phone size={16} className="mt-0.5 shrink-0 text-ink-mute" /><a href={`tel:${other.phone}`} className="font-semibold text-brand-700">{other.phone}</a></li>}
                {other?.email && <li className="flex items-start gap-2.5"><Mail size={16} className="mt-0.5 shrink-0 text-ink-mute" /><a href={`mailto:${other.email}`} className="break-all font-semibold text-brand-700">{other.email}</a></li>}
              </ul>
            ) : (
              <div className="flex flex-col gap-2 text-sm text-ink-mute">
                <p className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0" />{[h.quartier, h.ville].filter(Boolean).join(", ")} · adresse exacte après paiement</p>
                <p className="flex items-start gap-2.5"><Lock size={16} className="mt-0.5 shrink-0" />Coordonnées débloquées après le paiement en séquestre. D&apos;ici là, échangez via la messagerie Navilease.</p>
              </div>
            )}
          </Panel>
          <Panel title="Garant" icon={UsersRound} tone={d.guarantor ? "sun" : undefined}>
            {d.guarantor ? (
              <div className="flex items-center gap-3"><Avatar name={full(d.guarantor)} size={40} /><div><b className="text-sm">{full(d.guarantor)}</b><p className="text-xs text-ink-mute">Garant validé le {dateFr(b.guarantorApprovedAt)} · voit les paiements et quittances</p></div></div>
            ) : <p className="text-sm text-ink-mute">{isParent ? "Vous pouvez vous porter garant de cette réservation." : "Aucun garant pour l'instant. Un parent lié au compte peut se porter garant depuis son espace."}</p>}
          </Panel>
        </aside>
      </div>

      {/* Boîtes de dialogue */}
      <Dialog open={dialog === "refuse"} onClose={() => setDialog(null)} title="Refuser la demande"><NoteForm label="Motif (transmis au locataire)" cta="Refuser la demande" danger pending={act.pending} error={act.error} onSubmit={(note) => post("reponse", { accepter: false, note }, "Demande refusée.")} /></Dialog>
      <Dialog open={dialog === "cancel"} onClose={() => setDialog(null)} title="Annuler la réservation">
        <p className="mb-3 text-sm text-ink-mute">{b.status === "paiement_sequestre" ? "Le montant en séquestre sera intégralement remboursé au payeur." : "Aucun montant n'a été débité."}</p>
        <NoteForm label="Motif" cta="Confirmer l'annulation" danger pending={act.pending} error={act.error} onSubmit={(motif) => post("annulation", { motif }, "Réservation annulée.")} />
      </Dialog>
      <Dialog open={dialog === "notice"} onClose={() => setDialog(null)} title="Donner son préavis">
        <p className="mb-3 text-sm text-ink-mute">Le préavis prévient l&apos;autre partie de la fin de la location. L&apos;état des lieux de sortie déclenchera la restitution de la caution.</p>
        <NoteForm label="Date de départ souhaitée, précisions" cta="Envoyer le préavis" pending={act.pending} error={act.error} onSubmit={(note) => post("preavis", { note }, "Préavis envoyé.")} />
      </Dialog>
      <Dialog open={dialog === "dispute"} onClose={() => setDialog(null)} title="Signaler un incident"><DisputeForm pending={act.pending} error={act.error} onSubmit={(motif, description) => post("litige", { motif, description }, "Incident signalé : médiation Navilease sous 24 h.")} /></Dialog>
      <Dialog open={dialog === "checkout"} onClose={() => setDialog(null)} title="État des lieux de sortie"><CheckoutForm deposit={b.deposit} currency={b.currency} pending={act.pending} error={act.error} onSubmit={(notes, retenue) => post("sortie", { notes, retenue }, "Sortie enregistrée, caution restituée.")} /></Dialog>
      <Dialog open={dialog === "review"} onClose={() => setDialog(null)} title="Laisser un avis"><ReviewForm pending={act.pending} error={act.error} onSubmit={(note, commentaire) => post("avis", { note, commentaire }, "Merci pour ton avis !")} /></Dialog>
      <Dialog open={dialog === "rent"} onClose={() => setDialog(null)} title={`Payer le loyer · ${rentPeriod ? monthFr(new Date(rentPeriod + "-01T12:00:00")) : ""}`}>
        <PayForm amount={money(b.rent + b.charges, b.currency)} options={opts} loading={methods.loading} pending={act.pending} error={act.error} onPay={payRent} cta="Payer ce loyer" />
      </Dialog>
    </div>
  );

  // ------------------------------------------------------------ Carte d'action selon le statut et le rôle
  function Actions() {
    let body: ReactNode = null, title = "Prochaine étape", tone: "sun" | "green" | undefined = "sun", I = CalendarClock;
    const s = b.status;
    if (s === "demande" || s === "attente_garant") {
      if (isLandlord && s === "demande") {
        title = "Nouvelle demande à traiter"; I = Home;
        body = <>
          <p className="text-sm text-ink-soft">{full(d.tenant)} souhaite louer ce logement {b.months} mois à partir du {dateFr(b.startDate)}. Répondez sous 48 h. En acceptant, le locataire est invité à payer en séquestre ; vous êtes payé après son entrée.</p>
          {b.message && <blockquote className="rounded-2xl bg-[#f6f8fe] p-4 text-sm italic text-ink-soft">« {b.message} »</blockquote>}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button icon={Check} loading={act.pending} className="bg-[#0f8a46] hover:bg-[#0b6b37] sm:flex-1" onClick={() => post("reponse", { accepter: true }, "Demande acceptée : le locataire est invité à payer.")}>Accepter la demande</Button>
            <Button variant="ghost" icon={X} className="border-[#ffd0d9] text-[#d42a50] hover:bg-[#fff1f3]" onClick={() => setDialog("refuse")}>Refuser</Button>
          </div>
        </>;
      } else if (isParent && !b.guarantorApprovedAt) {
        title = "Validation du garant"; I = UsersRound;
        body = <>
          <p className="text-sm text-ink-soft">En vous portant garant, vous validez cette réservation pour {d.tenant?.firstName} et vous engagez à couvrir les loyers en cas d&apos;impayé. Vous pourrez régler le séquestre et suivre les quittances.</p>
          <Button icon={BadgeCheck} loading={act.pending} onClick={() => post("garant", {}, "Vous êtes désormais garant de cette réservation.")}>Valider et me porter garant</Button>
        </>;
      } else {
        title = s === "attente_garant" ? "En attente du garant" : "En attente de la réponse du bailleur";
        body = <p className="text-sm text-ink-soft">{s === "attente_garant"
          ? (isTenant ? "Ton parent ou tuteur a reçu une notification pour se porter garant. Le paiement sera possible dès sa validation." : "Le parent ou tuteur du locataire doit se porter garant ; le paiement sera possible dès sa validation.")
          : isTenant ? "Le bailleur a 48 h pour répondre. Tu seras notifié·e par SMS et e-mail. Aucun montant n'est débité avant son acceptation." : "Le bailleur a 48 h pour répondre. Aucun montant n'est débité avant son acceptation."}</p>;
      }
    } else if (s === "acceptee") {
      if (isTenant || isParent) {
        title = "Payer la réservation en séquestre"; I = Lock;
        body = <>
          <p className="text-sm text-ink-soft">Le bailleur a accepté. Réglez le premier loyer, les charges, la caution et les frais de service : Navilease conserve les fonds jusqu&apos;à {isTenant ? "ton " : "l'"}entrée dans les lieux.</p>
          {pendingResa && <Alert tone="info" title="Un paiement est déjà en cours" action={<Link href={`/paiement/${pendingResa.reference}/`} className="btn-ghost py-2 text-[13px]">Reprendre le paiement</Link>}>Référence {pendingResa.reference}</Alert>}
          {isParent && !b.guarantorApprovedAt && <Button variant="ghost" icon={BadgeCheck} onClick={() => post("garant", {}, "Vous êtes désormais garant de cette réservation.")}>Me porter garant</Button>}
          <PayForm amount={money(first, b.currency)} options={opts} loading={methods.loading} pending={act.pending} error={act.error} onPay={pay} cta="Payer en séquestre" />
        </>;
      } else {
        title = "Paiement attendu"; I = Lock;
        body = <p className="text-sm text-ink-soft">Demande acceptée. Le locataire (ou son garant) doit régler {money(first, b.currency)} en séquestre. Vous serez notifié pour signer le contrat.</p>;
      }
    } else if (s === "paiement_sequestre") {
      title = "Signature du contrat"; I = FileSignature;
      const mine = isTenant ? b.contract?.tenantSignedAt : me.id === b.landlordId ? b.contract?.landlordSignedAt : "n/a";
      body = <p className="text-sm text-ink-soft">{mine && mine !== "n/a" ? "Votre signature est enregistrée. En attente de l'autre partie." : isTenant || me.id === b.landlordId ? "Les fonds sont en séquestre. Relisez le contrat de location ci-dessous puis signez électroniquement." : "Les fonds sont en séquestre ; le locataire et le bailleur signent le contrat."}</p>;
    } else if (s === "contrat_signe") {
      title = isTenant ? "Déclare ton entrée dans les lieux" : "Entrée du locataire"; I = KeyRound;
      body = isTenant ? <CheckInForm pending={act.pending} error={act.error} onSubmit={(notes) => post("entree", { notes }, "Entrée déclarée : bienvenue chez toi !")} />
        : <p className="text-sm text-ink-soft">Contrat signé par les deux parties. Le premier loyer et les charges sont versés au bailleur dès que le locataire déclare son entrée avec l&apos;état des lieux. La caution reste en séquestre jusqu&apos;à la sortie.</p>;
    } else if (s === "en_cours" || s === "preavis" || s === "entree" || s === "fonds_verses") {
      tone = "green"; title = s === "preavis" ? "Préavis donné" : "Location en cours"; I = Home;
      body = <>
        <p className="text-sm text-ink-soft">{s === "preavis" ? "Le préavis a été transmis. Le bailleur réalise l'état des lieux de sortie, puis la caution est restituée." : isLandlord ? "Les loyers sont payés chaque mois via Navilease et vous sont reversés. Une quittance est émise automatiquement." : isTenant ? "Paye ton loyer chaque mois via Navilease : une quittance est émise automatiquement." : "Vous pouvez régler les loyers chaque mois via Navilease ; une quittance est émise automatiquement."}</p>
        <div className="flex flex-wrap gap-2.5">
          {s === "en_cours" && (isTenant || me.id === b.landlordId) && <Button variant="ghost" icon={CalendarClock} onClick={() => setDialog("notice")}>Donner un préavis</Button>}
          {isLandlord && <Button icon={LogOut} onClick={() => setDialog("checkout")}>État des lieux de sortie</Button>}
          {isTenant && <Button variant="ghost" icon={Star} onClick={() => setDialog("review")}>Laisser un avis</Button>}
        </div>
      </>;
    } else if (s === "sortie" || s === "caution_restituee") {
      tone = "green"; title = "Location terminée"; I = ShieldCheck;
      const ret = b.checkOut?.retenue ?? 0;
      body = <>
        <p className="text-sm text-ink-soft">Sortie le {dateFr(b.checkOut?.at)}. {ret ? `Caution restituée avec une retenue de ${money(ret, b.currency)} (${money(b.deposit - ret, b.currency)} rendus).` : `Caution de ${money(b.deposit, b.currency)} restituée intégralement.`}{ret && isTenant ? " Tu peux contester la retenue sous 15 jours en signalant un incident." : ""}</p>
        {b.checkOut?.notes && <blockquote className="rounded-2xl bg-[#f6f8fe] p-3 text-sm italic text-ink-soft">« {b.checkOut.notes} »</blockquote>}
        {isTenant && <Button variant="ghost" icon={Star} onClick={() => setDialog("review")}>Laisser un avis</Button>}
      </>;
    } else return null;
    return (
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`card flex flex-col gap-4 rounded-[22px] border-2 p-5 sm:p-6 ${tone === "green" ? "border-[#bfe9cf]" : "border-sun-300 bg-gradient-to-br from-white to-[#fffaf0]"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === "green" ? "bg-[#e8f8ef] text-[#0f8a46]" : "bg-sun-100 text-[#a55a00]"}`}><I size={18} /></span><h2 className="text-[17px] font-extrabold">{title}</h2></div>
          {canCancel && <button type="button" onClick={() => setDialog("cancel")} className="text-[13px] font-bold text-ink-mute hover:text-[#d42a50]">Annuler la réservation</button>}
        </div>
        {body}
      </motion.section>
    );
  }

  // ------------------------------------------------------------ Contrat
  function Contract() {
    const c = b.contract ?? {};
    const parties: [string, string, string | undefined, boolean][] = [
      [full(d.landlord), "bailleur", c.landlordSignedAt, me.id === b.landlordId],
      [full(d.tenant), "locataire", c.tenantSignedAt, isTenant],
    ];
    const canSign = b.status === "paiement_sequestre" && ((isTenant && !c.tenantSignedAt) || (me.id === b.landlordId && !c.landlordSignedAt));
    return (
      <Panel title="Contrat de location" icon={FileSignature} action={b.status === "paiement_sequestre" ? <Chip tone="sun">{canSign ? "Action requise" : "Signature en cours"}</Chip> : <Chip tone="green">Signé</Chip>}>
        <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)]">
          <a href={`/api/reservations/${b.id}/contrat.pdf`} target="_blank" rel="noreferrer" className="hidden flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 text-[8px] leading-tight text-ink-mute shadow-card transition hover:-translate-y-0.5 md:flex" aria-label="Ouvrir le contrat PDF">
            <b className="text-[9px] text-ink">CONTRAT DE BAIL MEUBLÉ ÉTUDIANT</b><span>Entre {full(d.landlord)} (le bailleur) et {full(d.tenant)} (le locataire)…</span><span>Art. 1 · Objet : {h.title}</span><span>Art. 2 · Durée : {b.months} mois à compter du {dateFr(b.startDate)}</span><span>Art. 3 · Loyer : {money(b.rent, b.currency)} + {money(b.charges, b.currency)} de charges</span><span>Art. 4 · Dépôt de garantie : {money(b.deposit, b.currency)}, conservé en séquestre Navilease</span>
          </a>
          <div className="flex flex-col gap-2.5">
            {parties.map(([n, r, at, mine]) => (
              <div key={r} className="flex items-center gap-3"><Avatar name={n} size={32} /><span className="min-w-0 flex-1 truncate text-sm"><b>{mine ? "Vous" : n}</b> · {r}</span>{at ? <Chip tone="green"><Check size={12} />Signé {new Date(at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</Chip> : <Chip tone="sun">À signer</Chip>}</div>
            ))}
            {d.guarantor && <div className="flex items-center gap-3"><Avatar name={full(d.guarantor)} size={32} /><span className="min-w-0 flex-1 truncate text-sm"><b>{full(d.guarantor)}</b> · garant</span><Chip tone="green"><Check size={12} />Validé</Chip></div>}
            {canSign && <Button icon={FileSignature} loading={act.pending} onClick={() => post("signature", {}, "Contrat signé.")} className="mt-1">Lire et signer électroniquement</Button>}
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-mute">
              <a href={`/api/reservations/${b.id}/contrat.pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline"><Download size={14} />Contrat PDF</a>
              <span>Signature électronique horodatée · copie PDF disponible pour toutes les parties</span>
            </div>
            {act.error && b.status === "paiement_sequestre" && <FormError error={act.error} />}
          </div>
        </div>
        {b.checkIn && <p className="rounded-2xl bg-[#effbf3] p-3 text-sm text-[#0b6b37]"><b>Entrée le {dateFr(b.checkIn.at)}</b>{b.checkIn.notes ? ` · état des lieux : ${b.checkIn.notes}` : ""}</p>}
      </Panel>
    );
  }

  // ------------------------------------------------------------ Loyers & quittances
  function Rents() {
    const rows = Array.from({ length: b.months }, (_, i) => {
      const dt = addMonths(b.startDate, i);
      const p = period(dt);
      const pays = d.payments.filter((x) => x.kind === "loyer" && (x.meta as { period?: string }).period === p);
      return { i, dt, p, paid: pays.find((x) => x.status === "reussi"), pending: pays.find((x) => ["initie", "en_attente"].includes(x.status)) };
    });
    const canPay = (isTenant || isParent || me.id === b.guarantorId) && ["en_cours", "preavis"].includes(b.status);
    const nextDue = rows.find((r) => r.i > 0 && !r.paid);
    return (
      <Panel title="Loyers & quittances" icon={ReceiptText} action={<span className="text-xs text-ink-mute">{rows.filter((r) => r.paid).length + 1} / {b.months} réglés</span>}>
        <div className="-mx-5 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b border-[#eef1f8] text-left text-[11px] font-extrabold uppercase text-ink-mute"><th className="px-5 py-2 sm:px-6">Mois</th><th className="px-3 py-2">Montant</th><th className="px-3 py-2">Statut</th><th className="px-5 py-2 text-right sm:px-6">Quittance</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.p} className="border-b border-[#f1f4fb] last:border-0">
                  <td className="px-5 py-2.5 font-bold capitalize sm:px-6">{monthFr(r.dt)}</td>
                  <td className="px-3 py-2.5">{money(b.rent + b.charges, b.currency)}</td>
                  <td className="px-3 py-2.5">{r.i === 0 ? <Chip tone="violet">Inclus au séquestre</Chip> : r.paid ? <Chip tone="green">Payé {dateFr(r.paid.paidAt)}</Chip> : r.pending ? <Link href={`/paiement/${r.pending.reference}/`}><Chip tone="sun">En attente · reprendre</Chip></Link> : <Chip tone="grey">À venir · {r.dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</Chip>}</td>
                  <td className="px-5 py-2.5 text-right sm:px-6">
                    {r.paid ? <a href={`/api/quittances/${r.paid.reference}.pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline"><Download size={14} />PDF</a>
                      : canPay && r.i > 0 && !r.pending && r === nextDue ? <Button size="sm" onClick={() => { act.setError(null); setRentPeriod(r.p); setDialog("rent"); }}>Payer</Button> : <span className="text-ink-mute">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-mute">{isTenant ? "Loyers payés via Navilease (mobile money, carte ou virement, par toi ou ton garant)." : "Loyers payés via Navilease (mobile money, carte ou virement, par le locataire ou son garant)."} Les quittances sont générées automatiquement.</p>
      </Panel>
    );
  }

  // ------------------------------------------------------------ Dossier locataire
  function Dossier() {
    return (
      <Panel title="Dossier locataire" icon={FileText}>
        {b.message && !(isLandlord && b.status === "demande") && <blockquote className="rounded-2xl bg-[#f6f8fe] p-3 text-sm italic text-ink-soft">« {b.message} »</blockquote>}
        {b.documentIds.length ? (
          <ul className="flex flex-wrap gap-2">
            {b.documentIds.map((doc, i) => <li key={doc}><a href={`/api/documents/${doc}/fichier/`} target="_blank" rel="noreferrer" className="chip border border-slate-200 bg-white py-1.5 text-ink-soft hover:border-brand-300"><FileText size={13} />Pièce jointe {i + 1}</a></li>)}
          </ul>
        ) : <p className="text-sm text-ink-mute">Aucune pièce jointe à la demande.</p>}
      </Panel>
    );
  }

  // ------------------------------------------------------------ Séquestre
  function Escrow() {
    const payer = resa ? [d.tenant, d.guarantor, d.landlord].find((p) => p?.id === resa.payerId) : null;
    return (
      <Panel title={resa ? (resa.escrow === "rembourse" ? "Paiement remboursé" : ["sortie", "caution_restituee"].includes(b.status) ? "Paiement de réservation" : "Fonds en séquestre") : "Montant de la réservation"} icon={Lock} tone={resa ? "green" : undefined}>
        <div><b className="text-[28px] leading-none">{money(resa?.amount ?? first, b.currency)}</b>{resa && <p className="mt-1 text-xs text-ink-mute">payés le {dateFr(resa.paidAt)}{payer ? ` par ${full(payer)}` : ""}</p>}</div>
        <dl className="flex flex-col gap-1.5 text-sm">
          {[["1er loyer + charges", b.rent + b.charges], ["Caution", b.deposit], ["Frais de service", b.serviceFee]].map(([l, v]) => <div key={l as string} className="flex justify-between"><dt className="text-ink-mute">{l}</dt><dd className="font-bold">{money(v as number, b.currency)}</dd></div>)}
        </dl>
        {resa ? (
          <>
            <p className={`flex items-start gap-2 rounded-xl p-3 text-xs ${resa.escrow === "libere" ? "bg-[#effbf3] text-[#0b6b37]" : resa.escrow === "rembourse" ? "bg-[#eef1f8] text-ink-soft" : "bg-[#f1edff] text-[#4c2bb8]"}`}>
              <ShieldCheck size={15} className="shrink-0" />
              {["sortie", "caution_restituee"].includes(b.status) ? `Loyer versé au bailleur ; caution restituée${b.checkOut?.retenue ? ` (retenue de ${money(b.checkOut.retenue, b.currency)})` : " intégralement"}.` : resa.escrow === "libere" ? `Loyer et charges versés au bailleur le ${dateFr(resa.releasedAt)} ; caution conservée jusqu'à la sortie.` : resa.escrow === "rembourse" ? "Montant remboursé au payeur." : resa.escrow === "litige" ? "Fonds gelés pendant la médiation." : "Fonds bloqués : versés au bailleur après l'entrée dans les lieux, sans incident signalé."}
            </p>
            <a href={`/api/paiements/${resa.reference}/recu.pdf`} target="_blank" rel="noreferrer" className="btn-ghost py-2.5 text-[13px]"><Download size={15} />Reçu de paiement</a>
          </>
        ) : <p className="flex items-start gap-2 text-xs text-ink-mute"><CircleDollarSign size={15} className="shrink-0" />À régler après l&apos;acceptation du bailleur. Loyers suivants : {money(b.rent + b.charges, b.currency)} / mois.</p>}
      </Panel>
    );
  }
}

// ------------------------------------------------------------ Formulaires
function PayForm({ amount, options, loading, pending, error, onPay, cta }: { amount: string; options: [string, string][]; loading: boolean; pending: boolean; error: string | null; onPay: (m: string) => void; cta: string }) {
  const [m, setM] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (!m) { setErr("Choisis un moyen de paiement."); return; } setErr(null); onPay(m); }}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field label="Moyen de paiement" required error={err}>{(id) => <Select id={id} value={m} onChange={(e) => setM(e.target.value)} options={options} placeholder={loading ? "Chargement…" : "Choisir…"} />}</Field>
        <Button type="submit" icon={Lock} loading={pending}>{cta} · {amount}</Button>
      </div>
      <FormError error={error} />
      <p className="text-xs text-ink-mute">Paiement sécurisé via notre agrégateur. Vous serez redirigé pour confirmer.</p>
    </form>
  );
}

function NoteForm({ label, cta, onSubmit, pending, error, danger }: { label: string; cta: string; onSubmit: (v: string) => void; pending: boolean; error: string | null; danger?: boolean }) {
  const [v, setV] = useState("");
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onSubmit(v.trim()); }}>
      <Field label={label}>{(id) => <Textarea id={id} value={v} onChange={(e) => setV(e.target.value)} maxLength={1000} />}</Field>
      <FormError error={error} />
      <Button type="submit" variant={danger ? "danger" : "primary"} loading={pending}>{cta}</Button>
    </form>
  );
}

const MOTIFS: [string, string][] = [["logement_non_conforme", "Logement non conforme à l'annonce"], ["plomberie_eau", "Plomberie / eau"], ["electricite", "Électricité"], ["securite", "Sécurité"], ["caution", "Retenue sur caution contestée"], ["impaye", "Loyer impayé"], ["comportement", "Comportement / voisinage"], ["autre", "Autre"]];
function DisputeForm({ onSubmit, pending, error }: { onSubmit: (m: string, d: string) => void; pending: boolean; error: string | null }) {
  const [m, setM] = useState(MOTIFS[0][0]);
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (desc.trim().length < 10) { setErr("Décris le problème (10 caractères minimum)."); return; } setErr(null); onSubmit(MOTIFS.find(([k]) => k === m)![1], desc.trim()); }}>
      <Field label="Catégorie" required>{(id) => <Select id={id} value={m} onChange={(e) => setM(e.target.value)} options={MOTIFS} />}</Field>
      <Field label="Description" required error={err}>{(id) => <Textarea id={id} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Décris le problème, depuis quand, ce qui a été tenté…" maxLength={3000} />}</Field>
      <p className="text-xs text-ink-mute">Urgence (fuite, sécurité) : l&apos;autre partie est alertée immédiatement ; médiation Navilease sous 24 h. Les fonds en séquestre sont gelés pendant la médiation.</p>
      <FormError error={error} />
      <Button type="submit" variant="danger" icon={AlertTriangle} loading={pending}>Envoyer le signalement</Button>
    </form>
  );
}

function CheckoutForm({ deposit, currency, onSubmit, pending, error }: { deposit: number; currency: string; onSubmit: (n: string, r: number) => void; pending: boolean; error: string | null }) {
  const [notes, setNotes] = useState("");
  const [ret, setRet] = useState("0");
  const n = Number(ret);
  const err = !Number.isFinite(n) || n < 0 ? "Montant invalide." : n > deposit ? `La retenue ne peut dépasser la caution (${money(deposit, currency)}).` : null;
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (!err) onSubmit(notes.trim(), Math.round(n)); }}>
      <Field label="Observations de l'état des lieux">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="État général, inventaire, clés rendues…" />}</Field>
      <Field label={`Retenue sur caution (${currency === "MAD" ? "MAD" : "F CFA"})`} error={err} hint={`Caution : ${money(deposit, currency)} · justifiez toute retenue, le locataire peut la contester sous 15 jours.`}>{(id) => <Input id={id} type="number" min={0} max={deposit} value={ret} onChange={(e) => setRet(e.target.value)} />}</Field>
      <FormError error={error} />
      <Button type="submit" icon={LogOut} loading={pending} disabled={!!err}>Valider la sortie et restituer {money(deposit - (err ? 0 : n), currency)}</Button>
    </form>
  );
}

function CheckInForm({ onSubmit, pending, error }: { onSubmit: (n: string) => void; pending: boolean; error: string | null }) {
  const [notes, setNotes] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (ok) onSubmit(notes.trim()); }}>
      <p className="text-sm text-ink-soft">Le jour de ton arrivée, fais le tour du logement pièce par pièce et note les éventuels défauts. Ta déclaration libère le premier loyer au bailleur ; la caution reste bloquée jusqu&apos;à ta sortie.</p>
      <Field label="État des lieux d'entrée" hint="Ex. : peinture abîmée près de la fenêtre, 2 clés remises, compteur électrique 1 245 kWh.">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
      <label className="flex items-start gap-2.5 text-sm text-ink-soft"><input type="checkbox" className="mt-0.5 h-[18px] w-[18px] accent-brand-600" checked={ok} onChange={(e) => setOk(e.target.checked)} />Je confirme être entré·e dans le logement et que celui-ci correspond à l&apos;annonce.</label>
      <FormError error={error} />
      <Button type="submit" icon={KeyRound} loading={pending} disabled={!ok}>Déclarer mon entrée</Button>
    </form>
  );
}

function ReviewForm({ onSubmit, pending, error }: { onSubmit: (n: number, c: string) => void; pending: boolean; error: string | null }) {
  const [n, setN] = useState(0);
  const [c, setC] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (!n) { setErr("Choisis une note."); return; } setErr(null); onSubmit(n, c.trim()); }}>
      <fieldset><legend className="mb-1.5 text-[13px] font-bold">Ta note</legend>
        <div className="flex gap-1" role="radiogroup">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" role="radio" aria-checked={n === i} aria-label={`${i} étoile${i > 1 ? "s" : ""}`} onClick={() => setN(i)} className="rounded-lg p-1 hover:bg-sun-50"><Star size={28} className={i <= n ? "fill-sun-400 text-sun-500" : "text-slate-300"} /></button>)}</div>
        {err && <span className="text-xs font-semibold text-[#d42a50]">{err}</span>}
      </fieldset>
      <Field label="Ton commentaire" hint="Propreté, communication, emplacement, rapport qualité-prix…">{(id) => <Textarea id={id} value={c} onChange={(e) => setC(e.target.value)} maxLength={2000} />}</Field>
      <FormError error={error} />
      <Button type="submit" icon={Star} loading={pending}>Publier mon avis</Button>
    </form>
  );
}
