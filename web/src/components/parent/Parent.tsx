"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calculator, CheckCircle2, FileText, KeyRound, Link2, ShieldCheck, UsersRound, Wallet } from "lucide-react";
import { useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Alert, Avatar, Button, Empty, Kpi, Loading, PageHeader, Panel, StatusBadge, dateFr, money, useToast } from "@/components/app/kit";
import { Check, FormError } from "@/components/app/form";
import { CodeBoxes } from "@/components/auth/Otp";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { useUser } from "@/components/app/Session";
import { COUTS } from "@/lib/devis";
import { PAYS_NOM, etabById, type PaysCode } from "@/lib/data";
import type { AppRow, Payment } from "@/components/espace/types";

type Child = { link: { id: string; consentAt: string | null; relation: string }; child: { id: string; firstName: string; lastName: string; birthYear: number | null; country: string | null; city: string | null } };
type Booking = { b: { id: string; number: string; status: string; tenantId: string; guarantorId: string | null }; h: { title: string; ville: string } };

function useChildApps(id: string | null) {
  const r = useApi<AppRow[]>(id ? `/parent/enfants/${id}/candidatures` : null);
  // Les brouillons restent privés à l'élève.
  return { ...r, data: r.data?.filter((a) => a.a.status !== "brouillon") };
}

/** Vue d'ensemble parent (maquette 16 avec données réelles). */
export function ParentHome() {
  const user = useUser();
  const kids = useApi<Child[]>("/parent/enfants");
  const pays = useApi<Payment[]>("/paiements");
  const books = useApi<Booking[]>("/reservations");
  const first = kids.data?.[0]?.child ?? null;
  const apps = useChildApps(first?.id ?? null);
  if (kids.loading) return <Loading />;
  if (!kids.data?.length) return (
    <>
      <PageHeader title={`Bonjour ${user.firstName} 👋`} sub="Espace parent / tuteur" />
      <Empty icon={UsersRound} title="Liez le compte de votre enfant" text="Votre enfant vous invite depuis son profil Navigoal : saisissez le code reçu par SMS ou e-mail pour suivre son orientation, ses candidatures et son logement." action={<Link href="/parent/enfants" className="btn-primary"><Link2 size={16} />Lier mon enfant</Link>} />
    </>
  );
  const toPay = (pays.data ?? []).filter((p) => p.status === "en_attente" && p.payerId === user.id);
  const paid = (pays.data ?? []).filter((p) => p.status === "reussi");
  const guarantee = (books.data ?? []).filter((b) => b.b.status === "attente_garant" || (b.b.status === "demande" && !b.b.guarantorId));
  const admitted = (apps.data ?? []).find((a) => a.a.status === "acceptee");
  const dem = admitted ? COUTS[admitted.e.pays as PaysCode]?.demarches ?? [] : [];
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Bonjour ${user.firstName} 👋`} sub={first ? `Suivi de ${first.firstName}${admitted ? ` · admis·e en ${admitted.p.title} · ${admitted.e.sigle}` : ""}` : undefined}
        actions={<><Link href="/devis" className="btn-ghost"><Calculator size={16} />Devis études</Link>{toPay[0] && <Link href={`/paiement/${toPay[0].reference}`} className="btn-primary btn-shine"><Wallet size={16} />Payer une échéance</Link>}</>} />
      {toPay.length > 0 && <Alert tone="warn" title={`${toPay.length} paiement${toPay.length > 1 ? "s" : ""} en attente`} action={<Link href={`/paiement/${toPay[0].reference}`} className="btn-sun py-2.5">Payer</Link>}>{toPay.map((p) => `${p.meta.description} (${money(p.amount, p.currency)})`).join(" · ")}</Alert>}
      {guarantee.length > 0 && <Alert tone="info" title="Validation de garant demandée" action={<Link href={`/navilease/reservations/${guarantee[0].b.id}`} className="btn-primary py-2.5">Examiner</Link>}>{guarantee[0].h.title} ({guarantee[0].h.ville}) · réservation {guarantee[0].b.number}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={FileText} label="Candidatures" value={(apps.data ?? []).filter((a) => a.a.status !== "brouillon").length} sub={admitted ? "dont 1 admission" : "en cours de traitement"} />
        <Kpi icon={Wallet} tone="green" label="Déjà payé" value={paid.length ? [...new Set(paid.map((p) => p.currency))].map((c) => money(paid.filter((p) => p.currency === c).reduce((s, p) => s + p.amount, 0), c)).join(" · ") : "—"} sub={`${paid.length} paiement${paid.length > 1 ? "s" : ""}`} />
        <Kpi icon={Wallet} tone="sun" label="À régler" value={toPay.length} sub="demandes de paiement" />
        <Kpi icon={KeyRound} tone="violet" label="Logement" value={(books.data ?? []).length ? <StatusBadge status={books.data![0].b.status} /> : "—"} sub={(books.data ?? [])[0]?.h.title ?? "aucune réservation"} />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={`Candidatures de ${first?.firstName}`} icon={FileText}>
          {apps.loading ? <Loading /> : !(apps.data ?? []).length ? <p className="text-sm text-ink-mute">Aucune candidature pour l&apos;instant.</p> : apps.data!.map((r) => (
            <Link key={r.a.id} href={`/parent/candidatures/${r.a.id}`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 hover:border-brand-200">
              <EtabLogo e={etabById[r.e.id] ?? r.e} size={42} /><span className="min-w-0 flex-1"><b className="block text-sm">{r.p.title}</b><span className="text-xs text-ink-mute">{r.e.nom} · n° {r.a.number}</span></span><StatusBadge status={r.a.status} />
            </Link>
          ))}
        </Panel>
        <Panel title="Régularisation" icon={ShieldCheck} action={admitted && <span className="chip bg-brand-50 text-brand-700">{PAYS_NOM[admitted.e.pays as PaysCode]}</span>}>
          {!admitted ? <p className="text-sm text-ink-mute">Les démarches de visa et de séjour s&apos;affichent ici dès l&apos;admission.</p> : dem.map((d, k) => (
            <motion.div key={k} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: k * 0.05 }} className="flex items-start gap-2.5 border-b border-[#f1f4fb] py-2 text-[13px] last:border-0"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-300" /><span className="flex-1">{d.etape}</span><span className="shrink-0 text-[11px] text-ink-mute">{d.quand}</span></motion.div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

/** Lier un enfant avec son code d'invitation + consentement parental (maquette 29). */
export function ParentChildren() {
  const toast = useToast();
  const kids = useApi<Child[]>("/parent/enfants");
  const a = useAction();
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const link = () => a.run(async () => { await api("/parent/enfants", { body: { code, consentement: consent } }); setCode(""); setConsent(false); kids.reload(); toast("Compte lié"); });
  const toggle = (c: Child) => a.run(async () => { await api(`/parent/enfants/${c.child.id}/consentement`, { body: { consentement: !c.link.consentAt } }); kids.reload(); toast(c.link.consentAt ? "Consentement retiré" : "Consentement enregistré"); });
  return (
    <>
      <PageHeader title="Mes enfants" sub="Suivez le parcours de vos enfants et validez les étapes sensibles." />
      <div className="grid items-start gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Lier un enfant" icon={Link2} tone="sun">
          <p className="text-[13px] text-ink-mute">Votre enfant vous invite depuis son profil (rubrique « Parent / tuteur ») : vous recevez un code à 6 chiffres par SMS ou e-mail.</p>
          <CodeBoxes value={code} onChange={setCode} />
          <div className="rounded-2xl bg-white p-4"><Check checked={consent} onChange={setConsent}><b>Je donne mon consentement parental</b> : mon enfant mineur peut candidater, effectuer des paiements et réserver un logement sur Navigoal. Je peux le retirer à tout moment.</Check></div>
          <FormError error={a.error} />
          <Button onClick={link} loading={a.pending} disabled={code.length < 6}>Lier le compte</Button>
        </Panel>
        <div className="flex flex-col gap-4">
          {kids.loading ? <Loading /> : !kids.data?.length ? <Empty icon={UsersRound} title="Aucun enfant lié" text="Saisissez le code d'invitation reçu pour commencer." /> : kids.data.map((c) => (
            <section key={c.link.id} className="card flex flex-col gap-4 rounded-[22px] p-5 sm:flex-row sm:items-center">
              <Avatar name={`${c.child.firstName} ${c.child.lastName}`} size={56} />
              <span className="flex-1"><b className="block text-lg">{c.child.firstName} {c.child.lastName}</b><span className="text-[13px] text-ink-mute">{c.child.birthYear ? `${new Date().getFullYear() - c.child.birthYear} ans · ` : ""}{[c.child.city, c.child.country && PAYS_NOM[c.child.country as PaysCode]].filter(Boolean).join(", ")} · lié depuis {dateFr(c.link.consentAt ?? undefined)}</span></span>
              <span className="flex flex-wrap items-center gap-2">
                {c.link.consentAt ? <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><CheckCircle2 size={13} className="mr-1 inline" />Consentement donné</span> : <span className="chip bg-sun-100 text-[#a55a00]">Consentement en attente</span>}
                <Button size="sm" variant="ghost" onClick={() => toggle(c)}>{c.link.consentAt ? "Retirer" : "Donner mon consentement"}</Button>
                <Link href="/parent" className="btn-primary px-3.5 py-2 text-[13px]">Suivre</Link>
              </span>
            </section>
          ))}
          <p className="flex items-center gap-2 text-xs text-ink-mute"><ShieldCheck size={14} />Conforme aux lois de protection des données du Gabon (loi 001/2011), du Maroc (loi 09-08) et du Sénégal (loi 2008-12).</p>
        </div>
      </div>
    </>
  );
}
