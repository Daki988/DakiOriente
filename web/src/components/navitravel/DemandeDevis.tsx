"use client";
// Demande de devis NaviTravel : enregistrée comme demande de rendez-vous conseiller (visible dans « Mes demandes »).
import Link from "@/components/ui/Link";
import { Check, CircleCheck, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { SERVICES } from "@/lib/services";

const BESOINS = ["Billet d'avion", "Visa", "Accueil à l'arrivée", "Assurance"];
const s = SERVICES.navitravel;

export function DemandeDevis() {
  const [me, setMe] = useState<{ role: string } | null | undefined>(undefined);
  const [besoins, setBesoins] = useState<string[]>(["Billet d'avion", "Visa", "Accueil à l'arrivée"]);
  const [f, setF] = useState({ depart: "", arrivee: "", ecole: "", details: "" });
  const [etat, setEtat] = useState<"" | "envoi" | "ok">("");
  const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/session/").then((r) => (r.ok ? r.json() : null)).then((d) => setMe(d?.user ?? null)).catch(() => setMe(null)); }, []);
  const champ = (k: keyof typeof f, label: string, ph: string) => (
    <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ink-soft">{label}</span>
      <input className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} maxLength={120} /></label>
  );
  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!besoins.length) return setErr("Choisis au moins une prestation.");
    if (!f.depart.trim()) return setErr("Indique ta ville de départ.");
    setEtat("envoi");
    const notes = [`Prestations : ${besoins.join(", ")}`, `Départ : ${f.depart}`, f.arrivee && `Arrivée souhaitée : ${f.arrivee}`, f.ecole && `École : ${f.ecole}`, f.details && `Précisions : ${f.details}`].filter(Boolean).join("\n");
    const r = await fetch("/api/rendez-vous/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic: `NaviTravel · demande de devis (${besoins.join(", ")})`.slice(0, 300), channel: "whatsapp", notes }) }).catch(() => null);
    if (r?.ok) setEtat("ok");
    else { setEtat(""); setErr((await r?.json().catch(() => null))?.error?.message ?? "L'envoi a échoué. Réessaie ou écris à contact@navigoal.net."); }
  };
  if (etat === "ok") return (
    <div className="card flex flex-col items-center gap-3 rounded-[26px] p-8 text-center">
      <CircleCheck size={44} style={{ color: s.c }} />
      <b className="text-xl">Demande envoyée !</b>
      <p className="text-ink-soft">Un conseiller NaviTravel te répond sous 48 h ouvrées avec un devis détaillé. Tu retrouves ta demande dans « Mes demandes ».</p>
      <Link href="/espace/conseiller" className="rounded-xl px-5 py-3 font-extrabold text-white" style={{ background: s.c }}>Voir mes demandes</Link>
    </div>
  );
  const peut = me && ["eleve", "etudiant", "parent"].includes(me.role);
  return (
    <form onSubmit={envoyer} className="card flex flex-col gap-4 rounded-[26px] p-6 sm:p-7">
      <b className="text-xl">Demander un devis</b>
      {champ("depart", "Ville de départ", "Libreville (LBV)")}
      {champ("arrivee", "Date d'arrivée souhaitée", "Début septembre 2027")}
      {champ("ecole", "École", "Nom de l'école et ville")}
      <div className="flex flex-col gap-2"><span className="text-xs font-extrabold text-ink-soft">De quoi as-tu besoin ?</span>
        <div className="flex flex-wrap gap-2">{BESOINS.map((b) => { const on = besoins.includes(b); return (
          <button type="button" key={b} onClick={() => setBesoins(on ? besoins.filter((x) => x !== b) : [...besoins, b])} aria-pressed={on}
            className={`chip px-3 py-2 text-[13px] ${on ? "text-white" : "border border-slate-200 bg-white text-ink-soft"}`} style={on ? { background: s.c } : undefined}>{on ? <Check size={13} /> : <Plus size={13} />}{b}</button>); })}</div>
      </div>
      <label className="flex flex-col gap-1.5"><span className="text-xs font-extrabold text-ink-soft">Précisions (facultatif)</span>
        <textarea className="input min-h-[80px]" value={f.details} maxLength={800} onChange={(e) => setF({ ...f, details: e.target.value })} placeholder="Nationalité, bagages, accompagnement d'un parent…" /></label>
      {err && <p className="rounded-xl bg-[#ffecef] px-3 py-2 text-sm text-[#b3123a]">{err}</p>}
      {me === null ? (
        <div className="flex flex-col gap-2 rounded-2xl p-4 text-sm" style={{ background: s.fond }}>
          <span>Connecte-toi pour envoyer ta demande : ton conseiller la suivra dans ton espace.</span>
          <div className="flex gap-2"><Link href={`/connexion?suite=${encodeURIComponent("/navitravel/#devis")}`} className="rounded-xl px-4 py-2.5 font-extrabold text-white" style={{ background: s.c }}>Se connecter</Link><Link href="/inscription" className="btn-ghost py-2.5">Créer un compte</Link></div>
        </div>
      ) : me && !peut ? (
        <p className="text-sm text-ink-mute">Les demandes de devis sont réservées aux élèves, étudiants et parents. Écris-nous à contact@navigoal.net.</p>
      ) : (
        <button disabled={etat === "envoi" || me === undefined} className="rounded-xl py-3.5 font-extrabold text-white transition hover:brightness-110 disabled:opacity-60" style={{ background: s.c }}>{etat === "envoi" ? "Envoi…" : "Recevoir mon devis"}</button>
      )}
      <span className="text-center text-xs text-ink-mute">Devis gratuit et sans engagement · réponse d&apos;un conseiller sous 48 h ouvrées</span>
    </form>
  );
}
