"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Eye, Inbox, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Button, Empty, Loading, PageHeader, StatusBadge, dateFr } from "@/components/app/kit";
import { Input, Select } from "@/components/app/form";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/lib/api";
import { useEcole } from "./EcoleContext";
import { CountryTag, PAYS_LABEL, TODO_STATUSES, type AppRow, type AppStatus, type Program } from "./shared";

type TabKey = "toutes" | "a_traiter" | AppStatus;
const TABS: [TabKey, string, (s: AppStatus) => boolean][] = [
  ["toutes", "Toutes", () => true],
  ["a_traiter", "À traiter", (s) => TODO_STATUSES.includes(s)],
  ["piece_demandee", "Pièce demandée", (s) => s === "piece_demandee"],
  ["en_traitement", "En traitement", (s) => s === "en_traitement"],
  ["acceptee", "Acceptées", (s) => s === "acceptee"],
  ["liste_attente", "Liste d'attente", (s) => s === "liste_attente"],
  ["refusee", "Refusées", (s) => s === "refusee"],
  ["desistee", "Désistements", (s) => s === "desistee"],
];
const PER_PAGE = 15;

export function Candidatures() {
  const { eid, link } = useEcole();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("toutes");
  const [q, setQ] = useState("");
  const [deb, setDeb] = useState("");
  const [formation, setFormation] = useState("");
  const [pays, setPays] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => setDeb(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => setPage(1), [tab, deb, formation, pays]);

  const params = new URLSearchParams();
  if (deb) params.set("q", deb);
  if (formation) params.set("formation", formation);
  if (pays) params.set("pays", pays);
  const qs = params.toString();
  const r = useApi<AppRow[]>(`/ecole/${eid}/candidatures${qs ? `?${qs}` : ""}`);
  const progs = useApi<Program[]>(`/ecole/${eid}/formations`);

  const all = useMemo(() => r.data ?? [], [r.data]);
  const counts = useMemo(() => Object.fromEntries(TABS.map(([k, , f]) => [k, all.filter((x) => f(x.a.status)).length])), [all]);
  const rows = all.filter((x) => TABS.find(([k]) => k === tab)![2](x.a.status));
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const filtered = !!(deb || formation || pays || tab !== "toutes");

  const csv = new URLSearchParams(params);
  csv.set("format", "csv");
  if (tab !== "toutes" && tab !== "a_traiter") csv.set("statut", tab);
  const open = (id: string) => router.push(link(`/etablissement/candidatures/${id}`));
  const reset = () => { setQ(""); setFormation(""); setPays(""); setTab("toutes"); };

  return (
    <>
      <PageHeader title="Candidatures" sub={r.data ? `${all.length} candidature${all.length > 1 ? "s" : ""} · ${counts.a_traiter} à traiter` : "Dossiers reçus via Navigoal"}
        actions={<a href={apiUrl(`/ecole/${eid}/candidatures?${csv.toString()}`)} className="btn-ghost"><Download size={17} />Exporter CSV</a>} />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrer par statut">
        {TABS.filter(([k]) => k !== "desistee" || counts.desistee > 0).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-bold transition ${tab === k ? "border-[#d9cffd] bg-[#f1edff] text-[#6a3df0]" : "border-slate-200 bg-white text-ink-soft hover:border-[#b9a6fb]"}`}>
            {l} <span className="ml-1 opacity-60">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, prénom, n° de dossier…" aria-label="Rechercher une candidature" className="pl-11" />
        </div>
        <Select aria-label="Filtrer par formation" value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="Formation : toutes" options={(progs.data ?? []).map((p) => [p.id, p.title])} />
        <Select aria-label="Filtrer par pays" value={pays} onChange={(e) => setPays(e.target.value)} placeholder="Pays : tous" options={Object.entries(PAYS_LABEL)} />
        {filtered && <Button variant="quiet" icon={X} onClick={reset}>Réinitialiser</Button>}
      </div>

      <section className="card overflow-hidden rounded-[22px]">
        {r.loading && !r.data ? <div className="px-6"><Loading /></div> : r.error ? <div className="p-5"><Alert tone="error" action={<Button size="sm" variant="ghost" onClick={r.reload}>Réessayer</Button>}>{r.error.message}</Alert></div> : rows.length === 0 ? (
          <div className="p-5"><Empty icon={Inbox} title={filtered ? "Aucune candidature ne correspond" : "Aucune candidature reçue"} text={filtered ? "Modifiez ou réinitialisez les filtres." : "Les dossiers envoyés par les candidats apparaîtront ici, avec leurs pièces justificatives."} action={filtered ? <Button variant="ghost" size="sm" onClick={reset}>Réinitialiser les filtres</Button> : undefined} /></div>
        ) : (
          <>
            {/* Bureau : tableau */}
            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#eef1f8] text-left text-[11px] font-extrabold uppercase text-ink-mute">
                  <th className="px-5 py-3">N° dossier</th><th className="px-3">Candidat</th><th className="px-3">Formation</th><th className="px-3">Statut</th><th className="px-3 text-center">Pièces</th><th className="px-3">Envoyée le</th><th className="px-5 text-right"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {shown.map((x, i) => (
                    <motion.tr key={x.a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} onClick={() => open(x.a.id)} className="cursor-pointer border-b border-[#f1f4fb] last:border-0 hover:bg-[#f8f6ff]">
                      <td className="px-5 py-3 font-bold text-[#6a3df0]">#{x.a.number}</td>
                      <td className="px-3 py-3"><div className="flex items-center gap-3"><Avatar name={`${x.s.firstName} ${x.s.lastName}`} size={36} /><div className="flex flex-col"><b>{x.s.firstName} {x.s.lastName}</b><CountryTag code={x.s.country} /></div></div></td>
                      <td className="max-w-[240px] px-3 py-3 text-ink-soft">{x.p.title}</td>
                      <td className="px-3 py-3"><StatusBadge status={x.a.status} /></td>
                      <td className="px-3 py-3 text-center"><Pieces row={x} /></td>
                      <td className="px-3 py-3 text-ink-mute">{dateFr(x.a.submittedAt)}</td>
                      <td className="px-5 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); open(x.a.id); }} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-white hover:text-[#6a3df0]" aria-label={`Ouvrir le dossier ${x.a.number}`}><Eye size={17} /></button></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile : cartes */}
            <ul className="divide-y divide-[#f1f4fb] md:hidden">
              {shown.map((x) => (
                <li key={x.a.id}><button onClick={() => open(x.a.id)} className="flex w-full flex-col gap-2 px-4 py-4 text-left hover:bg-[#f8f6ff]">
                  <div className="flex items-center gap-3"><Avatar name={`${x.s.firstName} ${x.s.lastName}`} size={38} /><div className="flex min-w-0 flex-1 flex-col"><b className="truncate">{x.s.firstName} {x.s.lastName}</b><span className="text-xs font-bold text-[#6a3df0]">#{x.a.number}</span></div><StatusBadge status={x.a.status} /></div>
                  <span className="text-sm text-ink-soft">{x.p.title}</span>
                  <div className="flex items-center justify-between text-xs text-ink-mute"><CountryTag code={x.s.country} /><span>{dateFr(x.a.submittedAt)}</span></div>
                </button></li>
              ))}
            </ul>
            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eef1f8] px-5 py-3 text-sm text-ink-mute sm:flex-row">
              <span>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, rows.length)} sur {rows.length}</span>
              {pages > 1 && (
                <nav className="flex items-center gap-1.5" aria-label="Pagination">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40" aria-label="Page précédente"><ChevronLeft size={16} /></button>
                  {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((n) => (
                    <button key={n} onClick={() => setPage(n)} aria-current={n === page ? "page" : undefined} className={`h-9 min-w-[36px] rounded-lg px-2 font-bold ${n === page ? "bg-[#6a3df0] text-white" : "border border-slate-200 text-ink-soft"}`}>{n}</button>
                  ))}
                  <button disabled={page === pages} onClick={() => setPage(page + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40" aria-label="Page suivante"><ChevronRight size={16} /></button>
                </nav>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function Pieces({ row }: { row: AppRow }) {
  const req = row.p.requiredDocuments.length;
  const n = row.a.documentIds.length;
  const ok = row.a.status !== "piece_demandee" && n >= req;
  return <span className={`chip ${ok ? "bg-[#e8f8ef] text-[#0f8a46]" : "bg-[#ffecef] text-[#d42a50]"}`} title={`${n} pièce${n > 1 ? "s" : ""} jointe${n > 1 ? "s" : ""}`}>{n}{req ? `/${Math.max(req, n)}` : ""}</span>;
}
