"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, FileDown, KeyRound, Receipt, Wallet } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { PAYS_NOM, etabById, formationById } from "@/lib/data";
import { COUTS, convert, devis, formationParDefaut } from "@/lib/devis";

// Démonstration : compte parent relié au dossier d'Amina (données fictives de suivi).
const EID = "ma-esa-casa";
const PAIEMENTS = [
  ["Frais de réservation", "Payé", "bg-[#e8f8ef] text-[#0f8a46]", "15/03/2027", "Airtel Money"],
  ["Scolarité · 1er semestre", "Payé", "bg-[#e8f8ef] text-[#0f8a46]", "05/09/2027", "Virement"],
  ["Loyer Navilease · octobre", "En séquestre", "bg-brand-50 text-brand-700", "01/10/2027", "Airtel Money"],
  ["Scolarité · 2nd semestre", "À venir", "bg-sun-100 text-[#a55a00]", "05/02/2028", "—"],
] as const;
const FAITES = 6;

export function EspaceParent() {
  const e = etabById[EID];
  const fid = formationParDefaut(EID);
  const D = devis(EID, fid, "GA");
  const C = COUTS[e.pays];
  const totalM = (convert(D.total[1], D.devise, "XAF") / 1e6).toFixed(1).replace(".", ",");
  const kpis = [["BUDGET TOTAL ESTIMÉ", `${totalM} M F CFA`, "text-ink", `sur ${D.years} ans (max.)`], ["DÉJÀ PAYÉ", "4,2 M F CFA", "text-[#0f8a46]", "3 paiements"], ["PROCHAINE ÉCHÉANCE", "05/02/2028", "text-[#a55a00]", "Scolarité 2nd semestre"], ["DÉMARCHES", `${FAITES} / ${C.demarches.length}`, "text-brand-600", "carte de séjour en cours"]] as const;
  const court = (t: string) => (t.length < 72 ? t : t.slice(0, 70).replace(/\s+\S*$/, "") + "…");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5"><span className="chip self-start bg-sun-100 text-[#a55a00]">Espace parent</span><h1 className="text-3xl font-extrabold tracking-tight">Bonjour M. Mba 👋</h1><span className="text-ink-mute">Suivi d&apos;Amina · {formationById[fid].intitule} · {e.sigle}, {e.ville}</span></div>
        <div className="flex flex-wrap gap-2.5"><Link href={`/devis/?etab=${EID}&f=${fid}&o=GA`} className="btn-ghost"><FileDown size={16} /> Devis PDF</Link><button className="btn-primary btn-shine"><Wallet size={16} /> Payer une échéance</button></div>
      </div>
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([a, b, c, s]) => <StaggerItem key={a} className="card flex flex-col gap-1.5 rounded-[20px] p-5"><span className="text-xs font-bold text-ink-mute">{a}</span><b className={`text-2xl ${c}`}>{b}</b><span className="text-xs text-ink-mute">{s}</span></StaggerItem>)}
      </Stagger>
      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="card flex flex-col gap-3 rounded-3xl p-6">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><h2 className="text-lg font-extrabold">Paiements</h2><span className="text-xs text-ink-mute">fonds Navilease protégés en séquestre</span></div>
          {PAIEMENTS.map(([t, s, c, d, m], k) => (
            <motion.div key={t} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + k * 0.08 }} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3">
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Receipt size={18} /></span>
              <span className="min-w-0 flex-1"><b className="block text-sm">{t}</b><span className="text-xs text-ink-mute">{d} · {m}</span></span><span className={`chip shrink-0 ${c}`}>{s}</span>
            </motion.div>
          ))}
        </div>
        <div className="card flex flex-col rounded-3xl p-6">
          <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-extrabold">Régularisation</h2><span className="chip bg-brand-50 text-brand-700">{PAYS_NOM[e.pays]}</span></div>
          {C.demarches.map((d, k) => (
            <div key={k} className="flex items-center gap-2.5 border-b border-[#f1f4fb] py-2 text-[13px] last:border-0">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + k * 0.06, type: "spring" }} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${k < FAITES ? "bg-[#0f8a46] text-white" : "bg-[#e8edfa] text-[#9aa3c0]"}`}><Check size={13} strokeWidth={3} /></motion.span>
              <span className={`flex-1 ${k < FAITES ? "" : "text-ink-mute"}`}>{court(d.etape)}</span><span className="shrink-0 text-[11px] text-ink-mute">{d.quand}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card flex items-center gap-4 rounded-[22px] p-5"><EtabPhoto e={e} className="h-[110px] w-[160px] shrink-0" /><div className="flex flex-col gap-1.5"><b>Résultats d&apos;Amina</b><span className="text-[13px] text-ink-mute">Semestre 1 : 14,6/20 · assiduité 97 %</span><span className="chip self-start bg-[#e8f8ef] text-[#0f8a46]">Partagé par l&apos;établissement</span></div></div>
        <div className="card flex items-center gap-4 rounded-[22px] bg-gradient-to-br from-white to-[#fff7dd] p-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun-400"><KeyRound size={22} /></span><div className="flex flex-col gap-1.5"><b>Logement : studio meublé, vérifié ✓</b><span className="text-[13px] text-ink-mute">Bail jusqu&apos;au 30/06/2028 · vous êtes garant · quittance d&apos;octobre disponible</span></div></div>
      </div>
      <p className="text-xs text-ink-mute">Espace de démonstration : les paiements et résultats affichés sont fictifs.</p>
    </div>
  );
}
