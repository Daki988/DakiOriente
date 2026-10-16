"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Tabs } from "@/components/app/kit";
import { Field, FormError, PasswordInput } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction } from "@/hooks/useApi";
import { CodeBoxes } from "./Otp";
import { IdentifierInput } from "./inputs";
import { GoogleButton, MESSAGES_GOOGLE } from "./Google";

type Me = { user: { role: string } };
export const HOME: Record<string, string> = { eleve: "/espace", etudiant: "/espace", parent: "/parent", etablissement: "/etablissement", bailleur: "/bailleur", conseiller: "/conseiller", admin: "/admin" };
/** Destination après connexion : page demandée (interne uniquement) ou espace du rôle. */
export const destination = (suite: string | null, role: string) => (suite && suite.startsWith("/") && !suite.startsWith("//") && !suite.startsWith("/\\") ? suite : HOME[role] ?? "/");

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"mdp" | "code">("mdp");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const a = useAction();
  const onId = useCallback((v: string) => setId(v), []);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const go = (r: Me) => { router.replace(destination(params.get("suite"), r.user.role)); router.refresh(); };
  const submitPw = (e: React.FormEvent) => { e.preventDefault(); a.run(async () => go(await api<Me>("/auth/connexion", { body: { identifiant: id, motDePasse: pw } }))); };
  const sendCode = () => a.run(async () => {
    if (!id) throw new Error("Saisis ton e-mail ou ton numéro de téléphone.");
    const r = await api<{ devCode?: string }>("/auth/code", { body: { cible: id, objet: "login" } });
    setSent(r.devCode ?? ""); setCode(""); setWait(45);
  });
  const submitCode = (e?: React.FormEvent) => { e?.preventDefault(); a.run(async () => go(await api<Me>("/auth/code/connexion", { body: { cible: id, code } }))); };
  useEffect(() => { if (mode === "code" && sent !== null && code.length === 6 && !a.pending) submitCode(); /* envoi automatique du code complet */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const notice = params.get("session") === "expiree" ? { tone: "warn" as const, t: "Ta session a expiré. Reconnecte-toi pour continuer." }
    : params.get("reinitialise") ? { tone: "success" as const, t: "Mot de passe modifié. Connecte-toi avec ton nouveau mot de passe." }
    : params.get("deconnexion") ? { tone: "info" as const, t: "Tu es déconnecté·e. À bientôt !" }
    : MESSAGES_GOOGLE[params.get("google") ?? ""] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px]">Bon retour 👋</h1>
        <p className="text-ink-mute">Connecte-toi pour suivre ton orientation, tes candidatures et ton logement.</p>
      </div>
      {notice && <Alert tone={notice.tone}>{notice.t}</Alert>}
      <GoogleButton suite={params.get("suite")} />
      <Tabs value={mode} onChange={(m) => { setMode(m); a.setError(null); setSent(null); }} items={[["mdp", "Mot de passe"], ["code", "Code par SMS ou e-mail"]]} />
      {mode === "mdp" ? (
        <form onSubmit={submitPw} className="flex flex-col gap-4" noValidate>
          <Field label="E-mail ou numéro de téléphone" hint="Numéro : choisis l'indicatif de ton pays.">{(i) => <IdentifierInput id={i} onValue={onId} autoFocus />}</Field>
          <Field label="Mot de passe">{(i) => <PasswordInput id={i} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required className="text-[15px] sm:text-sm" />}</Field>
          <div className="-mt-1 flex justify-end"><Link href={`/mot-de-passe-oublie${id ? `?cible=${encodeURIComponent(id)}` : ""}`} className="py-1 text-sm font-bold text-brand-600">Mot de passe oublié ?</Link></div>
          <FormError error={a.error} />
          <Button loading={a.pending} disabled={!id || !pw} className="min-h-[48px]">Se connecter <ArrowRight size={18} /></Button>
        </form>
      ) : sent === null ? (
        <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="flex flex-col gap-4" noValidate>
          <Field label="Numéro de téléphone ou e-mail" hint="Tu reçois un code à 6 chiffres, valable 10 minutes.">{(i) => <IdentifierInput id={i} onValue={onId} placeholder="Numéro de téléphone ou e-mail" autoFocus />}</Field>
          <FormError error={a.error} />
          <Button loading={a.pending} disabled={!id} className="min-h-[48px]">Recevoir le code</Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">Si un compte correspond à <b className="text-ink">{id}</b>, un code vient d&apos;être envoyé.</p>
          <CodeBoxes value={code} onChange={setCode} />
          {sent && <span className="text-center text-xs text-ink-mute">Code de test (hors production) : <b>{sent}</b></span>}
          <FormError error={a.error} />
          <Button loading={a.pending} disabled={code.length < 6} className="min-h-[48px]">Se connecter <ArrowRight size={18} /></Button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setSent(null); a.setError(null); }} className="flex min-h-[40px] items-center gap-1 font-bold text-ink-mute"><ArrowLeft size={15} />Modifier</button>
            {wait > 0 ? <span className="text-ink-mute">Renvoyer dans {wait} s</span> : <button type="button" onClick={sendCode} className="min-h-[40px] font-bold text-brand-600">Renvoyer le code</button>}
          </div>
        </form>
      )}
      <p className="text-center text-sm text-ink-mute">Pas encore de compte ? <Link href={`/inscription${params.get("suite") ? `?suite=${encodeURIComponent(params.get("suite")!)}` : ""}`} className="font-bold text-brand-600">Créer un compte gratuitement</Link></p>
      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-mute"><ShieldCheck size={14} className="text-[#0f8a46]" />Connexion chiffrée · tes données ne sont jamais revendues</p>
    </div>
  );
}
