"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Clock3, Mail, Search, ShieldCheck } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert, Button, Chip, Empty, Loading } from "@/components/app/kit";
import { Input, Select } from "@/components/app/form";
import { useUser } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { ETAB_STATUS, type Etab, type Membership } from "./shared";

type Ctx = {
  eid: string; etab: Etab; role: string | null; isAdmin: boolean;
  /** Lien interne qui conserve ?eid= pour les administrateurs. */
  link: (path: string) => string;
  setEtab: (e: Etab) => void;
};
const EcoleCtx = createContext<Ctx | null>(null);
export function useEcole() {
  const c = useContext(EcoleCtx);
  if (!c) throw new Error("useEcole hors EcoleProvider");
  return c;
}

const STORE = "ng_ecole_eid";

/** Résout l'établissement géré (premier par défaut, sélecteur si plusieurs, ?eid= pour les administrateurs). */
export function EcoleProvider({ children }: { children: ReactNode }) {
  const user = useUser();
  const isAdmin = user.role === "admin";
  const qEid = useSearchParams().get("eid");
  const pathname = usePathname();
  const pending = user.status === "en_attente";
  const mine = useApi<Membership[]>(isAdmin || pending ? null : "/ecole");
  const adminEtab = useApi<Etab>(isAdmin && qEid ? `/etablissements/${encodeURIComponent(qEid)}` : null);
  const [picked, setPicked] = useState<string | null>(null);
  const [override, setOverride] = useState<Etab | null>(null);

  useEffect(() => { try { setPicked(localStorage.getItem(STORE)); } catch { /* stockage indisponible */ } }, []);

  const list = mine.data ?? [];
  const current: Membership | null = isAdmin
    ? adminEtab.data ? { e: adminEtab.data, role: "admin" } : null
    : list.find((m) => m.e.id === (qEid ?? picked)) ?? list[0] ?? null;
  const etab = override && current && override.id === current.e.id ? override : current?.e ?? null;

  const link = useCallback((p: string) => (isAdmin && qEid ? `${p}${p.includes("?") ? "&" : "?"}eid=${encodeURIComponent(qEid)}` : p), [isAdmin, qEid]);
  const choose = (id: string) => { setPicked(id); setOverride(null); try { localStorage.setItem(STORE, id); } catch { /* ignore */ } };
  const value = useMemo<Ctx | null>(() => etab ? { eid: etab.id, etab, role: current?.role ?? null, isAdmin, link, setEtab: setOverride } : null, [etab, current?.role, isAdmin, link]);

  if (pending || mine.error?.code === "en_attente") return <PendingAccount />;
  if (isAdmin && !qEid) return <AdminPicker />;
  if (mine.loading || adminEtab.loading) return <Loading label="Chargement de votre établissement…" />;
  const err = mine.error ?? adminEtab.error;
  if (err) return <Alert tone="error" title="Impossible de charger l'établissement" action={<Button variant="ghost" size="sm" onClick={() => (isAdmin ? adminEtab.reload() : mine.reload())}>Réessayer</Button>}>{err.message}</Alert>;
  if (!value) return <Empty icon={Building2} title="Aucun établissement rattaché" text="Votre compte n'est encore rattaché à aucun établissement. Contactez l'équipe Navigoal pour revendiquer votre fiche." />;

  return (
    <EcoleCtx.Provider value={value}>
      {(isAdmin || list.length > 1) && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#e3dbff] bg-[#f8f6ff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5 text-sm">
            <Building2 size={18} className="shrink-0 text-[#6a3df0]" />
            <span className="truncate">{isAdmin ? <>Vue administrateur · <b>{value.etab.nom}</b></> : <>Établissement géré : <b>{value.etab.sigle}</b></>}</span>
          </div>
          {isAdmin ? (
            <Link href={pathname} className="text-sm font-bold text-[#6a3df0] hover:underline">Changer d&apos;établissement</Link>
          ) : (
            <Select aria-label="Choisir l'établissement" value={value.eid} onChange={(e) => choose(e.target.value)} options={list.map((m) => [m.e.id, `${m.e.sigle} · ${m.e.ville}`])} className="py-2 sm:w-72" />
          )}
        </div>
      )}
      {children}
    </EcoleCtx.Provider>
  );
}

function PendingAccount() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-10 text-center">
      <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f1edff] text-[#6a3df0]">
        <Clock3 size={36} />
        <motion.span className="absolute inset-0 rounded-3xl border-2 border-[#6a3df0]/40" animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }} />
      </span>
      <div className="flex flex-col gap-2">
        <Chip tone="sun" className="mx-auto">Compte en cours de vérification</Chip>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Merci, votre demande est bien reçue</h1>
        <p className="text-ink-mute">L&apos;équipe Navigoal vérifie que vous représentez bien votre établissement (agrément, représentant légal). Cette étape prend en général moins de 48 heures ouvrées.</p>
      </div>
      <ol className="card grid w-full gap-4 rounded-[22px] p-5 text-left sm:grid-cols-3">
        {[[ShieldCheck, "Vérification", "Contrôle de vos justificatifs par notre équipe."], [Mail, "Confirmation", "Vous recevez un e-mail dès l'activation du compte."], [Building2, "Votre espace", "Fiche, formations, campagnes et candidatures."]].map(([I, t, d], i) => {
          const Icon = I as typeof ShieldCheck;
          return (
            <li key={i} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon size={18} /></span>
              <span className="flex flex-col"><b className="text-sm">{t as string}</b><span className="text-xs text-ink-mute">{d as string}</span></span>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-ink-mute">Une question ? Écrivez-nous à <a className="font-bold text-brand-600" href="mailto:etablissements@navigoal.com">etablissements@navigoal.com</a>.</p>
    </motion.div>
  );
}

/** Administrateur sans ?eid= : choisir l'établissement à consulter. */
function AdminPicker() {
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");
  const [deb, setDeb] = useState("");
  useEffect(() => { const t = setTimeout(() => setDeb(q.trim()), 300); return () => clearTimeout(t); }, [q]);
  const r = useApi<Etab[]>(`/etablissements${deb ? `?q=${encodeURIComponent(deb)}` : ""}`);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div><h1 className="text-2xl font-extrabold">Espace établissement</h1><p className="text-ink-mute">Choisissez l&apos;établissement à consulter en tant qu&apos;administrateur.</p></div>
      <div className="relative"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, sigle ou ville…" aria-label="Rechercher un établissement" className="pl-11" /></div>
      {r.loading ? <Loading /> : r.error ? <Alert tone="error">{r.error.message}</Alert> : (
        <ul className="card divide-y divide-[#f1f4fb] rounded-[20px]">
          {(r.data ?? []).slice(0, 30).map((e) => (
            <li key={e.id}><button onClick={() => router.push(`${path}?eid=${encodeURIComponent(e.id)}`)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-brand-50/50">
              <span className="min-w-0"><b className="block truncate text-sm">{e.nom}</b><span className="text-xs text-ink-mute">{e.sigle} · {e.ville} · {e.pays}</span></span>
              <Chip tone={ETAB_STATUS[e.status].tone}>{ETAB_STATUS[e.status].label}</Chip>
            </button></li>
          ))}
          {!r.data?.length && <li className="px-5 py-6 text-center text-sm text-ink-mute">Aucun établissement trouvé.</li>}
        </ul>
      )}
    </div>
  );
}
