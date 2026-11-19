"use client";
import { BellRing, CheckCircle2, CircleHelp, GraduationCap, XCircle } from "lucide-react";
import { useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Empty, Loading, PageHeader, Panel, dateFr } from "@/components/app/kit";
import { useUser } from "@/components/app/Session";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type B = { id: string; nom: string; organisme: string; date_limite: string | null; statut: "eligible" | "a_verifier" | "non_eligible"; raisons: string[] };
type D = { profils: { id: string; prenom: string; manque: string[]; bourses: B[] }[]; suivies: string[]; campagnes: { id: string; eid: string; ecole: string; titre: string; fin: string; conditions: string | null }[] };
const STATUT = {
  eligible: { l: "Tu sembles éligible", Icon: CheckCircle2, c: "text-[#0b7a3d] bg-[#e8f8ef]" },
  a_verifier: { l: "À vérifier", Icon: CircleHelp, c: "text-[#a55a00] bg-sun-100" },
  non_eligible: { l: "Non éligible", Icon: XCircle, c: "text-[#b8213f] bg-[#fff1f3]" },
};

/** « Bourses pour toi » : bourses classées selon le profil (élève) ou celui de chaque enfant (parent), suivi et alertes. */
export function BoursesPourToi() {
  const u = useUser();
  const parent = u.role === "parent";
  const { data, loading, error, setData } = useApi<D>("/moi/bourses");
  const [err, setErr] = useState<string | null>(null);
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur de chargement."}</Alert>;
  const suivre = async (id: string) => {
    const oui = !data.suivies.includes(id);
    try { await api(`/moi/bourses/${id}/suivre`, { method: oui ? "POST" : "DELETE" }); setData({ ...data, suivies: oui ? [...data.suivies, id] : data.suivies.filter((x) => x !== id) }); }
    catch (e) { setErr(e instanceof Error ? e.message : "Erreur."); }
  };
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={parent ? "Bourses pour mes enfants" : "Bourses pour toi"} sub="Classées selon le profil : nationalité, âge, moyenne. Indication seulement : la décision appartient toujours à l'organisme. Suis une bourse pour être prévenu·e de l'ouverture et avant la date limite." crumbs={[[parent ? "Espace parent" : "Mon espace", parent ? "/parent" : "/espace"], ["Bourses"]]}
        actions={<Link href="/bourses/" className="btn-ghost min-h-[44px] px-4 text-[14px]">Toutes les bourses</Link>} />
      {err && <Alert tone="error">{err}</Alert>}
      {!data.profils.length && <Empty icon={GraduationCap} title="Aucun enfant lié" text="Liez le compte de votre enfant depuis « Mes enfants » pour voir les bourses qui le concernent." action={<Link href="/parent/enfants/" className="btn-primary min-h-[44px] px-4 text-[14px]">Mes enfants</Link>} />}
      {data.profils.map((p) => (
        <Panel key={p.id} title={parent ? `Pour ${p.prenom}` : undefined}>
          <div className="flex flex-col gap-3">
            {!!p.manque.length && <Alert tone="warn">Pour un classement plus juste, {parent ? `${p.prenom} doit compléter` : "complète"} {parent ? "son" : "ton"} profil : {p.manque.join(", ")}. {!parent && <Link href="/espace/profil/" className="font-bold text-brand-600">Compléter mon profil</Link>}</Alert>}
            {p.bourses.map((b) => {
              const S = STATUT[b.statut];
              return (
                <div key={b.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0"><span className="text-xs font-bold text-brand-600">{b.organisme}</span><Link href={`/bourses/${b.id}/`} className="block font-extrabold hover:text-brand-600">{b.nom}</Link></div>
                    <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${S.c}`}><S.Icon size={14} />{parent && b.statut === "eligible" ? "Semble éligible" : S.l}</span>
                  </div>
                  <ul className="flex flex-col gap-1 text-sm text-ink-soft">{b.raisons.map((r) => <li key={r}>• {r}</li>)}</ul>
                  <div className="flex flex-wrap items-center gap-3">
                    {b.statut !== "non_eligible" && <button type="button" onClick={() => suivre(b.id)} aria-pressed={data.suivies.includes(b.id)} className={`${data.suivies.includes(b.id) ? "btn-primary" : "btn-ghost"} min-h-[40px] px-3 text-[13px]`}><BellRing size={15} />{data.suivies.includes(b.id) ? "Suivie : alertes activées" : "Suivre"}</button>}
                    {b.date_limite && <span className="text-xs text-ink-mute">Date limite : {dateFr(b.date_limite)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}
      <Panel title="Bourses et réductions des écoles">
        {data.campagnes.length ? <ul className="flex flex-col divide-y divide-slate-100">{data.campagnes.map((c) => (
          <li key={c.id} className="flex flex-col gap-0.5 py-3"><Link href={`/etablissements/${c.eid}/#frais`} className="font-bold hover:text-brand-600">{c.ecole} : {c.titre}</Link>{c.conditions && <span className="text-sm text-ink-soft">{c.conditions}</span>}<span className="text-xs text-ink-mute">Jusqu&apos;au {dateFr(c.fin)}</span></li>
        ))}</ul> : <p className="text-sm text-ink-soft">Aucune bourse d&apos;école ouverte en ce moment : elles apparaîtront ici dès qu&apos;une école en publie.</p>}
      </Panel>
    </div>
  );
}
