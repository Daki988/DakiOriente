"use client";
import { useEffect, useMemo, useState } from "react";
import { Globe2, Plane, ShieldCheck } from "lucide-react";
import { useSession } from "@/components/app/Session";
import { REGIONS, VISA_AVERTISSEMENT, VISA_LABEL, paysOrigine, paysOrigineById, visaResume } from "@/lib/pays-origine";

const VISA_STYLE: Record<string, string> = { national: "bg-[#e8f8ef] text-[#0f8a46]", dispense: "bg-[#e8f8ef] text-[#0f8a46]", evisa: "bg-brand-50 text-brand-700", visa: "bg-sun-100 text-[#a55a00]" };

/** « Venir étudier au Maroc depuis ton pays » : régime d'entrée selon la nationalité, puis carte de séjour. */
export function VenirAuMaroc() {
  const user = useSession();
  const [c, setC] = useState("");
  useEffect(() => { if (!c && user?.country && paysOrigineById[user.country]) setC(user.country); }, [user, c]);
  const p = c ? paysOrigineById[c] : undefined;
  const afrique = useMemo(() => paysOrigine.filter((x) => x.continent === "afrique" && x.id !== "MA"), []);
  const dispenses = afrique.filter((x) => x.visa === "dispense");
  return (
    <div className="card flex flex-col gap-4 rounded-[22px] p-6">
      <div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Globe2 size={20} /></span><h2 className="text-lg font-extrabold">Venir étudier au Maroc depuis ton pays</h2></div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">Ta nationalité
        <select value={c} onChange={(e) => setC(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold">
          <option value="">Choisir un pays…</option>
          <optgroup label="Afrique">{paysOrigine.filter((x) => x.continent === "afrique").map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</optgroup>
          <optgroup label="Autres pays">{paysOrigine.filter((x) => x.continent === "autre").map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</optgroup>
        </select>
      </label>
      {p ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#f6f8fe] p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2"><b className="text-base">{p.nom}</b>{p.visa && <span className={`chip ${VISA_STYLE[p.visa] ?? "bg-[#eef1f8] text-ink-soft"}`}>{VISA_LABEL[p.visa]}</span>}{p.aevm && <span className="chip bg-brand-50 text-brand-700">AEVM obligatoire</span>}<span className="chip bg-white text-ink-soft">{REGIONS[p.region]}</span></div>
          <p className="flex items-start gap-2 text-ink-soft"><Plane size={16} className="mt-0.5 shrink-0 text-brand-600" />{visaResume(p.id)}.</p>
          {p.note && <p className="text-ink-soft">{p.note}</p>}
          {p.visa !== "national" && <p className="flex items-start gap-2 text-ink-soft"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#0f8a46]" />{p.sejour ?? "Sur place, demande la carte de séjour étudiant à la DGSN dans les 90 jours suivant l'arrivée."}</p>}
          {p.diplome && <p className="text-ink-soft">Diplôme d&apos;accès : <b>{p.diplome}</b> (ou équivalent), à faire légaliser avant le départ.</p>}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Sans visa pour {dispenses.length} pays d&apos;Afrique ({dispenses.slice(0, 6).map((x) => x.nom).join(", ")}…) ; e-Visa ou visa consulaire pour les autres. Choisis ta nationalité pour voir les démarches.</p>
      )}
      <p className="text-xs text-ink-mute">{VISA_AVERTISSEMENT}</p>
    </div>
  );
}
