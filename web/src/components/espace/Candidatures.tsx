"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Empty, Loading, PageHeader, StatusBadge, Tabs, dateFr } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { etabById } from "@/lib/data";
import type { AppRow } from "./types";

const STEPS = ["brouillon", "soumise", "en_verification", "complet", "en_traitement", "decision"];
const stepOf = (s: string) => ({ brouillon: 0, soumise: 1, paiement_confirme: 1, en_verification: 2, piece_demandee: 2, complet: 3, en_traitement: 4, liste_attente: 4, acceptee: 5, refusee: 5, desistee: 5 } as Record<string, number>)[s] ?? 0;
const GROUP: Record<string, string> = { brouillon: "brouillons", acceptee: "decisions", refusee: "decisions", desistee: "decisions" };

export function Candidatures() {
  const { data, loading } = useApi<AppRow[]>("/candidatures");
  const [tab, setTab] = useState<"toutes" | "en_cours" | "brouillons" | "decisions">("toutes");
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ?? []).filter((r) => (tab === "toutes" || (GROUP[r.a.status] ?? "en_cours") === tab) && (!q || `${r.p.title} ${r.e.nom} ${r.e.sigle} ${r.a.number}`.toLowerCase().includes(q.toLowerCase()))), [data, tab, q]);
  const count = (g: string) => (data ?? []).filter((r) => (GROUP[r.a.status] ?? "en_cours") === g).length;
  return (
    <>
      <PageHeader title="Mes candidatures" sub="Suis l'avancement de tes dossiers en temps réel." actions={<Link href="/formations" className="btn-primary"><Plus size={17} />Nouvelle candidature</Link>} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onChange={setTab} items={[["toutes", `Toutes (${data?.length ?? 0})`], ["en_cours", `En cours (${count("en_cours")})`], ["brouillons", `Brouillons (${count("brouillons")})`], ["decisions", `Décisions (${count("decisions")})`]]} />
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:w-72"><Search size={16} className="text-ink-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Formation, école, numéro…" className="w-full bg-transparent text-sm outline-none" aria-label="Rechercher" /></label>
      </div>
      {loading ? <Loading /> : !rows.length ? (
        <Empty icon={FileText} title={data?.length ? "Aucune candidature dans cette catégorie" : "Tu n'as pas encore de candidature"} text="Choisis une formation dans le catalogue ou le comparateur, puis clique sur « Candidater »." action={<Link href="/formations" className="btn-primary">Explorer les formations</Link>} />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r, k) => {
            const st = stepOf(r.a.status);
            const bad = r.a.status === "refusee" || r.a.status === "desistee";
            return (
              <motion.div key={r.a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }}>
                <Link href={r.a.status === "brouillon" ? `/espace/candidatures/nouvelle?id=${r.a.id}` : `/espace/candidatures/${r.a.id}`} className="card flex flex-col gap-4 rounded-[20px] p-4 transition hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center sm:p-5">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <EtabLogo e={etabById[r.e.id] ?? r.e} size={52} />
                    <div className="min-w-0"><b className="block">{r.p.title}</b><span className="text-[13px] text-ink-mute">{r.e.nom} · {r.e.ville} · n° {r.a.number}</span></div>
                  </div>
                  <div className="flex flex-col gap-2 sm:w-[300px]">
                    <div className="flex items-center justify-between gap-2"><StatusBadge status={r.a.status} /><span className="text-xs text-ink-mute">maj {dateFr(r.a.updatedAt)}</span></div>
                    <div className="flex gap-1" aria-label={`Étape ${st + 1} sur ${STEPS.length}`}>{STEPS.map((_, j) => <span key={j} className={`h-1.5 flex-1 rounded-full ${j <= st ? (bad && j === st ? "bg-[#d42a50]" : r.a.status === "acceptee" ? "bg-[#0f8a46]" : "bg-brand-600") : "bg-[#e8edfa]"}`} />)}</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
