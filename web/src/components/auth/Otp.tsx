"use client";
import Link from "@/components/ui/Link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, MailCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/app/kit";
import { Field, FormError, PasswordInput } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction } from "@/hooks/useApi";
import { IdentifierInput } from "./inputs";

const HOME: Record<string, string> = { eleve: "/espace", etudiant: "/espace", parent: "/parent", etablissement: "/etablissement", bailleur: "/bailleur", conseiller: "/conseiller", admin: "/admin" };
/** Code de test transmis par l'inscription (hors production uniquement). */
export const DEV_CODE_KEY = "navigoal.devcode";

/** Six cases pour un code OTP, collage et retour arrière gérés. */
export function CodeBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div className="flex justify-center gap-1.5 sm:gap-3" onPaste={(e) => { const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (t) { e.preventDefault(); onChange(t); refs.current[Math.min(t.length, 5)]?.focus(); } }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} value={value[i] ?? ""} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Chiffre ${i + 1} du code`}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits.length > 1) { const v = (value.slice(0, i) + digits).slice(0, 6); onChange(v); refs.current[Math.min(v.length, 5)]?.focus(); return; } // saisie automatique du code complet
            const arr = value.padEnd(6, " ").split(""); arr[i] = digits || " "; onChange(arr.join("").replace(/\s+$/, "")); if (digits) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !value[i]) refs.current[i - 1]?.focus(); }}
          className={`h-14 w-11 rounded-2xl border-2 text-center text-2xl font-extrabold outline-none transition sm:h-16 sm:w-14 ${value[i] && value[i] !== " " ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"} focus:border-brand-600 focus:ring-4 focus:ring-brand-100`} />
      ))}
    </div>
  );
}

function useCountdown(start: number) {
  const [wait, setWait] = useState(start);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  return [wait, setWait] as const;
}

export function Verification() {
  const router = useRouter();
  const p = useSearchParams();
  const cible = p.get("cible") ?? "";
  const objet = p.get("objet") === "verify_phone" ? "verify_phone" : "verify_email";
  const [code, setCode] = useState("");
  const [wait, setWait] = useCountdown(45);
  const [dev, setDev] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const a = useAction();
  useEffect(() => { try { setDev(sessionStorage.getItem(DEV_CODE_KEY)); sessionStorage.removeItem(DEV_CODE_KEY); } catch { /* stockage indisponible */ } }, []);
  const next = useCallback(async () => {
    const me = await api<{ user: { role: string } | null }>("/session").catch(() => ({ user: null }));
    router.replace(me.user ? HOME[me.user.role] ?? "/" : "/connexion"); router.refresh();
  }, [router]);
  const submit = (e?: React.FormEvent) => { e?.preventDefault(); a.run(async () => { await api("/auth/code/verifier", { body: { cible, objet, code } }); setDone(true); setTimeout(next, 900); }); };
  useEffect(() => { if (code.length === 6 && !a.pending && !done) submit(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  const resend = () => a.run(async () => { const r = await api<{ devCode?: string }>("/auth/code", { body: { cible, objet } }); setDev(r.devCode ?? null); setWait(45); setCode(""); });
  const I = objet === "verify_email" ? MailCheck : Smartphone;
  if (!cible) return (
    <div className="card mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 rounded-3xl p-6 text-center sm:p-8">
      <b>Lien de vérification incomplet.</b><Link href="/connexion" className="btn-primary">Se connecter</Link>
    </div>
  );
  return (
    <form onSubmit={submit} className="card mx-auto flex w-full max-w-[480px] flex-col items-center gap-5 rounded-3xl p-5 text-center sm:p-8">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600"><I size={30} /></span>
      <div><h1 className="text-2xl font-extrabold">Vérifie ton {objet === "verify_email" ? "adresse e-mail" : "numéro de téléphone"}</h1><p className="mt-1 text-sm text-ink-mute">Saisis le code à 6 chiffres envoyé à <b className="break-all text-ink">{cible}</b>. Il est valable 10 minutes.</p></div>
      <CodeBoxes value={code} onChange={setCode} />
      {dev && <span className="text-xs text-ink-mute">Code de test (hors production) : <b>{dev}</b></span>}
      {done ? <p className="rounded-xl bg-[#effbf3] px-4 py-3 text-sm font-semibold text-[#0b6b37]" role="status">Vérification réussie ! Redirection vers ton espace…</p> : <FormError error={a.error} />}
      <Button loading={a.pending} disabled={code.length < 6 || done} className="min-h-[48px] w-full">Valider</Button>
      <div className="flex flex-col gap-1 text-sm">
        {wait > 0 ? <span className="py-2 text-ink-mute">Renvoyer le code dans {wait} s</span> : <button type="button" onClick={resend} className="min-h-[40px] font-bold text-brand-600">Renvoyer le code</button>}
        <button type="button" onClick={next} className="min-h-[40px] text-ink-mute underline">Plus tard, accéder à mon espace</button>
      </div>
    </form>
  );
}

export function ForgotPassword() {
  const router = useRouter();
  const params = useSearchParams();
  const [cible, setCible] = useState(params.get("cible") ?? "");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [dev, setDev] = useState<string | null>(null);
  const [wait, setWait] = useCountdown(0);
  const a = useAction();
  const onId = useCallback((v: string) => setCible(v), []);
  const ask = () => a.run(async () => {
    if (!cible) throw new Error("Saisis ton e-mail ou ton numéro de téléphone.");
    const r = await api<{ devCode?: string }>("/auth/code", { body: { cible, objet: "reset_password" } });
    setDev(r.devCode ?? null); setSent(true); setWait(45); setCode("");
  });
  const strong = pw.length >= 8 && /\d/.test(pw) && /[A-Za-z]/.test(pw);
  return (
    <div className="card mx-auto flex w-full max-w-[480px] flex-col gap-5 rounded-3xl p-5 sm:p-8">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sun-100 text-[#a55a00]"><KeyRound size={26} /></span>
      <div><h1 className="text-2xl font-extrabold">Mot de passe oublié</h1><p className="mt-1 text-sm text-ink-mute">{sent ? "Saisis le code reçu et choisis un nouveau mot de passe." : "Saisis ton e-mail ou ton numéro : tu recevras un code valable 10 minutes."}</p></div>
      {!sent ? (
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex flex-col gap-4" noValidate>
          <Field label="E-mail ou numéro de téléphone">{(i) => <IdentifierInput id={i} initial={params.get("cible") ?? ""} onValue={onId} autoFocus />}</Field>
          <FormError error={a.error} /><Button loading={a.pending} disabled={!cible} className="min-h-[48px]">Recevoir le code</Button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); a.run(async () => {
          if (pw !== pw2) throw new Error("Les deux mots de passe ne correspondent pas.");
          await api("/auth/mot-de-passe/reinitialiser", { body: { cible, code, motDePasse: pw } });
          router.replace("/connexion/?reinitialise=1");
        }); }} className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">Si un compte existe pour <b className="break-all text-ink">{cible}</b>, un code vient d&apos;être envoyé.</p>
          <CodeBoxes value={code} onChange={setCode} />
          {dev && <span className="text-center text-xs text-ink-mute">Code de test (hors production) : <b>{dev}</b></span>}
          <Field label="Nouveau mot de passe" hint={pw && !strong ? "8 caractères minimum, avec au moins une lettre et un chiffre." : "8 caractères minimum, une lettre et un chiffre."}>{(i) => <PasswordInput id={i} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" required minLength={8} className="text-[15px] sm:text-sm" />}</Field>
          <Field label="Confirme le mot de passe" error={pw2 && pw2 !== pw ? "Les deux mots de passe ne correspondent pas." : null}>{(i) => <PasswordInput id={i} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required className="text-[15px] sm:text-sm" />}</Field>
          <FormError error={a.error} /><Button loading={a.pending} disabled={code.length < 6 || !strong || pw !== pw2} className="min-h-[48px]">Changer le mot de passe</Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setSent(false); a.setError(null); }} className="flex min-h-[40px] items-center gap-1 font-bold text-ink-mute"><ArrowLeft size={15} />Modifier</button>
            {wait > 0 ? <span className="text-ink-mute">Renvoyer dans {wait} s</span> : <button type="button" onClick={ask} className="min-h-[40px] font-bold text-brand-600">Renvoyer le code</button>}
          </div>
        </form>
      )}
      <Link href="/connexion" className="text-center text-sm font-bold text-brand-600">Retour à la connexion</Link>
    </div>
  );
}
