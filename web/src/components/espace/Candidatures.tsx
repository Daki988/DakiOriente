"use client";
import Link from "@/components/ui/Link";
import { motion } from "framer-motion";
import { FileText, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { Empty, Loading, PageHeader, StatusBadge, Tabs, dateFr } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { etabById } from "@/lib/data";
import { AppProgress } from "./AppProgress";
import type { AppRow } from "./types";

type Tab = "toutes" | "en_cours" | "acceptees" | "refusees";
const groupOf = (s: string): Exclude<Tab, "toutes"> => (s === "acceptee" ? "acceptees" : s === "refusee" || s === "desistee" ? "refusees" : "en_cours");

/** « Mes candidatures » (planche) : onglets et suivi visuel par étapes pour chaque dossier. */
export function Candidatures() {
  const { data, loading } = useApi<AppRow[]>("/candidatures");
  const [tab, setTab] = useState<Tab>("toutes");
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ?? []).filter((r) => (tab === "toutes" || groupOf(r.a.status) === tab) && (!q || `${r.p.title} ${r.e.nom} ${r.e.sigle} ${r.a.number} ${r.a.campus ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [data, tab, q]);
  const count = (g: Tab) => (data ?? []).filter((r) => groupOf(r.a.status) === g).length;
  return (
    <>
      <PageHeader title="Mes candidatures" sub="Suis l'état de tes candidatures en temps réel." actions={<Link href="/formations" className="btn-primary min-h-[44px]"><Plus size={17} />Nouvelle candidature</Link>} />
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onChange={setTab} items={[["toutes", `Toutes (${data?.length ?? 0})`], ["en_cours", `En cours (${count("en_cours")})`], ["acceptees", `Acceptées (${count("acceptees")})`], ["refusees", `Refusées (${count("refusees")})`]]} />
        <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 lg:w-72"><Search size={16} className="text-ink-mute" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Formation, établissement, numéro…" className="w-full bg-transparent text-[15px] outline-none sm:text-sm" aria-label="Rechercher une candidature" /></label>
      </div>
      {loading ? <Loading /> : !rows.length ? (
        <Empty icon={FileText} title={data?.length ? "Aucune candidature dans cette catégorie" : "Tu n'as pas encore de candidature"} text="Choisis une formation dans le catalogue, puis clique sur « Candidater maintenant »." action={<Link href="/formations" className="btn-primary">Rechercher une formation</Link>} />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r, k) => {
            const e = etabById[r.e.id];
            const href = r.a.status === "brouillon" ? `/espace/candidatures/nouvelle?id=${r.a.id}` : `/espace/candidatures/${r.a.id}`;
            return (
              <motion.article key={r.a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.04 }} className="card flex flex-col gap-4 rounded-[20px] p-4 sm:p-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:w-[38%]">
                  {e ? <EtabPhoto e={e} className="hidden h-[72px] w-[96px] shrink-0 sm:block" rounded="rounded-xl" /> : null}
                  <span className="sm:hidden"><EtabLogo e={e ?? r.e} size={48} /></span>
                  <div className="min-w-0">
                    <b className="line-clamp-2 leading-snug">{r.p.title}</b>
                    <span className="block truncate text-[13px] text-ink-mute">{r.e.nom}{r.a.campus ? ` · campus de ${r.a.campus}` : ""}</span>
                    <span className="text-xs text-ink-mute">n° {r.a.number}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 lg:w-[150px] lg:flex-col lg:items-start">
                  <StatusBadge status={r.a.status} />
                  <span className="text-xs text-ink-mute">{r.a.submittedAt ? `envoyée le ${dateFr(r.a.submittedAt)}` : `modifiée le ${dateFr(r.a.updatedAt)}`}</span>
                </div>
                <div className="min-w-0 flex-1"><AppProgress status={r.a.status} fee={r.p.applicationFee > 0} compact /></div>
                <Link href={href} className="btn-ghost min-h-[42px] shrink-0 px-4 py-2 text-[13px]">{r.a.status === "brouillon" ? "Reprendre" : "Voir le détail"}</Link>
              </motion.article>
            );
          })}
        </div>
      )}
    </>
  );
}
