"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/app/kit";
import { FormError } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction } from "@/hooks/useApi";

const HOME: Record<string, string> = { eleve: "/espace", etudiant: "/espace", parent: "/parent", etablissement: "/etablissement", bailleur: "/bailleur", conseiller: "/conseiller", admin: "/admin" };

/** Six cases pour un code OTP, collage et retour arrière gérés. */
export function CodeBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={(e) => { const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(t.length, 5)]?.focus(); } }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} value={value[i] ?? ""} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Chiffre ${i + 1}`} maxLength={1}
          onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(-1); const arr = value.padEnd(6, " ").split(""); arr[i] = d || " "; onChange(arr.join("").trimEnd()); if (d) refs.current[i + 1]?.focus(); }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !value[i]) refs.current[i - 1]?.focus(); }}
          className={`h-14 w-11 rounded-2xl border-2 text-center text-2xl font-extrabold outline-none transition sm:h-16 sm:w-14 ${value[i] ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"} focus:border-brand-600 focus:ring-4 focus:ring-brand-100`} />
      ))}
    </div>
  );
}

export function Verification() {
  const router = useRouter();
  const p = useSearchParams();
  const cible = p.get("cible") ?? "";
  const objet = p.get("objet") === "verify_phone" ? "verify_phone" : "verify_email";
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(45);
  const [dev, setDev] = useState<string | null>(null);
  const a = useAction();
  useEffect(() => { const t = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000); return () => clearInterval(t); }, []);
  const next = async () => { const me = await api<{ role: string }>("/moi").catch(() => null); router.push(me ? HOME[me.role] : "/connexion"); router.refresh(); };
  const submit = (e?: React.FormEvent) => { e?.preventDefault(); a.run(async () => { await api("/auth/code/verifier", { body: { cible, objet, code } }); await next(); }); };
  useEffect(() => {
    if (code.length === 6) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  const resend = () => a.run(async () => { const r = await api<{ devCode?: string }>("/auth/code", { body: { cible, objet } }); setDev(r.devCode ?? null); setWait(45); });
  return (
    <form onSubmit={submit} className="card mx-auto flex w-full max-w-[480px] flex-col items-center gap-5 rounded-3xl p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600"><MailCheck size={30} /></span>
      <div><h1 className="text-2xl font-extrabold">Vérifie ton {objet === "verify_email" ? "adresse e-mail" : "numéro"}</h1><p className="mt-1 text-sm text-ink-mute">Saisis le code à 6 chiffres envoyé à <b className="text-ink">{cible}</b>.</p></div>
      <CodeBoxes value={code} onChange={setCode} />
      {dev && <span className="text-xs text-ink-mute">Code de test : {dev}</span>}
      <FormError error={a.error} />
      <Button loading={a.pending} disabled={code.length < 6} className="w-full">Valider</Button>
      <div className="flex flex-col gap-1 text-sm">
        {wait > 0 ? <span className="text-ink-mute">Renvoyer le code dans {wait} s</span> : <button type="button" onClick={resend} className="font-bold text-brand-600">Renvoyer le code</button>}
        <button type="button" onClick={next} className="text-ink-mute underline">Plus tard, accéder à mon espace</button>
      </div>
    </form>
  );
}

export function ForgotPassword() {
  const router = useRouter();
  const [cible, setCible] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [dev, setDev] = useState<string | null>(null);
  const a = useAction();
  return (
    <div className="card mx-auto flex w-full max-w-[480px] flex-col gap-5 rounded-3xl p-8">
      <div><h1 className="text-2xl font-extrabold">Réinitialiser le mot de passe</h1><p className="mt-1 text-sm text-ink-mute">Saisis ton e-mail ou ton numéro : tu recevras un code valable 10 minutes.</p></div>
      {!sent ? (
        <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { const r = await api<{ devCode?: string }>("/auth/code", { body: { cible, objet: "reset_password" } }); setDev(r.devCode ?? null); setSent(true); }); }} className="flex flex-col gap-4">
          <input className="input" value={cible} onChange={(e) => setCible(e.target.value)} placeholder="E-mail ou +241 07 41 22 48" aria-label="E-mail ou téléphone" required />
          <FormError error={a.error} /><Button loading={a.pending}>Recevoir le code</Button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); a.run(async () => { await api("/auth/mot-de-passe/reinitialiser", { body: { cible, code, motDePasse: pw } }); router.push("/connexion/?reinitialise=1"); }); }} className="flex flex-col gap-4">
          <p className="text-sm">Si un compte existe pour <b>{cible}</b>, un code vient d&apos;être envoyé.</p>
          <CodeBoxes value={code} onChange={setCode} />
          {dev && <span className="text-center text-xs text-ink-mute">Code de test : {dev}</span>}
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nouveau mot de passe" aria-label="Nouveau mot de passe" autoComplete="new-password" required minLength={8} />
          <FormError error={a.error} /><Button loading={a.pending} disabled={code.length < 6}>Changer le mot de passe</Button>
        </form>
      )}
    </div>
  );
}
