"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Download, Lock, ShieldCheck, Smartphone, XCircle } from "lucide-react";
import { useEffect } from "react";
import { Brand } from "@/components/ui/Brand";
import { Alert, Button, Loading, dateFr, money } from "@/components/app/kit";
import { api, apiUrl } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";

type P = { reference: string; kind: string; amount: number; currency: string; method: string; status: string; escrow: string; provider: string; applicationId: string | null; bookingId: string | null; payerId: string; meta: { description?: string; escrow?: boolean }; paidAt: string | null; createdAt: string };
type Methods = Record<string, { id: string; label: string }[]>;
const EUR: Record<string, number> = { XAF: 655.957, XOF: 655.957, MAD: 10.9 };

/** Page de paiement : bac à sable (confirmation simulée) ou retour de l'agrégateur, puis reçu (maquette 25). */
export function PaymentPage({ reference }: { reference: string }) {
  const router = useRouter();
  const p = useApi<P>(`/paiements/${reference}`);
  const methods = useApi<Methods>("/paiements/moyens");
  const a = useAction();
  // Retour d'un agrégateur réel : le statut est revérifié toutes les 5 s tant qu'il est en attente.
  useEffect(() => {
    if (p.data?.status !== "en_attente" || p.data.provider === "sandbox") return;
    const t = setInterval(p.reload, 5000);
    return () => clearInterval(t);
  }, [p.data, p.reload]);
  const label = Object.values(methods.data ?? {}).flat().find((m) => m.id === p.data?.method)?.label ?? p.data?.method;
  const back = p.data?.applicationId ? `/espace/candidatures/${p.data.applicationId}` : p.data?.bookingId ? `/navilease/reservations/${p.data.bookingId}` : "/";
  const confirm = (ok: boolean) => a.run(async () => { await api(`/paiements/${reference}/simulation`, { body: { succes: ok } }); await p.reload(); });

  return (
    <div className="min-h-screen bg-[#f6f8fe]">
      <header className="border-b border-slate-200/70 bg-white"><div className="container flex h-[72px] items-center justify-between gap-4"><Brand /><span className="hidden items-center gap-2 text-sm font-bold text-[#0f8a46] sm:flex"><Lock size={16} />Paiement sécurisé · chiffrement TLS</span><button onClick={() => router.push(back)} className="text-sm font-bold text-ink-mute">Revenir</button></div></header>
      <main className="container flex justify-center py-10">
        {p.error ? <Alert tone="error" title="Paiement introuvable">{p.error.message}</Alert> : !p.data ? <Loading /> : p.data.status === "reussi" ? (
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card flex w-full max-w-md flex-col items-center gap-5 rounded-3xl p-8 text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 12 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f8ef] text-[#0f8a46]"><CheckCircle2 size={42} /></motion.span>
            <div><h1 className="text-[28px] font-extrabold">Paiement réussi !</h1><p className="text-sm text-ink-mute">{p.data.meta.escrow ? "Les fonds sont conservés en séquestre Navilease jusqu'à ton entrée dans les lieux." : "Ton paiement est confirmé ; le reçu est aussi envoyé par e-mail."}</p></div>
            <div className="flex w-full flex-col gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-left text-[13px]">
              {[["Reçu n°", p.data.reference], ["Objet", p.data.meta.description ?? p.data.kind], ["Montant", money(p.data.amount, p.data.currency)], ["Moyen", label ?? ""], ["Date", dateFr(p.data.paidAt, true)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><span className="text-ink-mute">{k}</span><b className="text-right">{v}</b></div>)}
            </div>
            <a href={apiUrl(p.data.kind === "loyer" ? `/quittances/${p.data.reference}.pdf` : `/paiements/${reference}/recu.pdf`)} target="_blank" className="btn-primary w-full"><Download size={17} />Télécharger le {p.data.kind === "loyer" ? "quittance" : "reçu"} PDF</a>
            <Link href={back} className="btn-ghost w-full">{p.data.applicationId ? "Voir ma candidature" : p.data.bookingId ? "Voir ma réservation" : "Retour"}</Link>
          </motion.div>
        ) : (
          <div className="grid w-full max-w-4xl items-start gap-6 md:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-4">
              <div><span className="chip bg-brand-50 text-brand-700">{p.data.reference}</span><h1 className="mt-2 text-[30px] font-extrabold tracking-tight">Finaliser le paiement</h1><p className="text-ink-mute">{p.data.meta.description}</p></div>
              {p.data.status === "echoue" && <Alert tone="error" title="Le paiement n'a pas abouti">Aucun montant n&apos;a été débité. Tu peux relancer le paiement depuis ta candidature ou ta réservation.</Alert>}
              {p.data.status === "en_attente" && p.data.provider === "sandbox" ? (
                <div className="card flex flex-col gap-4 rounded-3xl p-6">
                  <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sun-100 text-[#a55a00]"><Smartphone size={22} /></span><span><b className="block">{label}</b><span className="text-[13px] text-ink-mute">Une demande de confirmation est envoyée sur ton téléphone.</span></span></div>
                  <Alert tone="warn" title="Mode recette">Les paiements sont simulés tant que le compte de l&apos;agrégateur n&apos;est pas activé : confirme ou refuse la transaction ci-dessous.</Alert>
                  <div className="flex flex-col gap-2 sm:flex-row"><Button className="flex-1" loading={a.pending} onClick={() => confirm(true)}><ShieldCheck size={17} />Confirmer le paiement</Button><Button variant="ghost" className="flex-1" disabled={a.pending} onClick={() => confirm(false)}><XCircle size={17} />Refuser</Button></div>
                  {a.error && <p className="text-sm font-semibold text-[#d42a50]">{a.error}</p>}
                </div>
              ) : p.data.status === "en_attente" ? <div className="card flex items-center gap-3 rounded-3xl p-6"><Loading label="En attente de la confirmation de l'opérateur…" /></div> : null}
            </div>
            <aside className="card flex flex-col gap-3 rounded-3xl p-6">
              <b>Récapitulatif</b>
              <div className="flex justify-between text-sm"><span className="text-ink-mute">Montant</span><b>{money(p.data.amount, p.data.currency)}</b></div>
              <div className="flex justify-between text-sm"><span className="text-ink-mute">Équivalent</span><span>{Math.round(p.data.amount / (EUR[p.data.currency] ?? 1))} €</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-mute">Frais opérateur</span><span>0</span></div>
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-950 to-brand-700 px-4 py-3.5 text-white"><span className="font-bold">Total</span><b className="text-xl">{money(p.data.amount, p.data.currency)}</b></div>
              {p.data.meta.escrow && <p className="text-xs text-ink-mute">Fonds protégés en séquestre : versés au bailleur après l&apos;état des lieux d&apos;entrée.</p>}
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
