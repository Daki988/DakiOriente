"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AtSign, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button, Tabs } from "@/components/app/kit";
import { Field, FormError, Input, PasswordInput } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction } from "@/hooks/useApi";

type Me = { user: { role: string } };
const HOME: Record<string, string> = { eleve: "/espace", etudiant: "/espace", parent: "/parent", etablissement: "/etablissement", bailleur: "/bailleur", conseiller: "/conseiller", admin: "/admin" };

export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"mdp" | "sms">("mdp");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const a = useAction();
  const go = (r: Me) => { const suite = params.get("suite"); router.push(suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : HOME[r.user.role] ?? "/"); router.refresh(); };

  const submitPw = (e: React.FormEvent) => { e.preventDefault(); a.run(async () => go(await api<Me>("/auth/connexion", { body: { identifiant: id, motDePasse: pw } }))); };
  const sendCode = () => a.run(async () => { const r = await api<{ devCode?: string }>("/auth/code", { body: { cible: id, objet: "login" } }); setSent(r.devCode ?? ""); });
  const submitCode = (e: React.FormEvent) => { e.preventDefault(); a.run(async () => go(await api<Me>("/auth/code/connexion", { body: { cible: id, code } }))); };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-6">
      <div><h1 className="text-[34px] font-extrabold tracking-tight">Bon retour 👋</h1><p className="text-ink-mute">Connecte-toi pour suivre ton orientation, tes candidatures et ton logement.</p></div>
      <Tabs value={mode} onChange={(m) => { setMode(m); a.setError(null); }} items={[["mdp", "Mot de passe"], ["sms", "Code par SMS"]]} />
      {mode === "mdp" ? (
        <form onSubmit={submitPw} className="flex flex-col gap-4">
          <Field label="E-mail ou numéro de téléphone">{(i) => <div className="relative"><AtSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input id={i} value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" required className="pl-10" placeholder="amina@email.com ou +241 07 41 22 48" /></div>}</Field>
          <Field label="Mot de passe">{(i) => <PasswordInput id={i} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />}</Field>
          <div className="flex justify-end"><Link href="/mot-de-passe-oublie" className="text-sm font-bold text-brand-600">Mot de passe oublié ?</Link></div>
          <FormError error={a.error} />
          <Button loading={a.pending} className="py-3.5">Se connecter <ArrowRight size={18} /></Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="flex flex-col gap-4">
          <Field label="Numéro de téléphone ou e-mail" hint="Un code à 6 chiffres arrive par SMS (ou e-mail).">{(i) => <div className="relative"><Smartphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input id={i} value={id} onChange={(e) => setId(e.target.value)} required className="pl-10" placeholder="+241 07 41 22 48" /></div>}</Field>
          {sent !== null && <Field label="Code reçu" hint={sent ? `Code de test : ${sent}` : undefined}>{(i) => <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input id={i} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required className="pl-10 tracking-[.4em]" /></div>}</Field>}
          <FormError error={a.error} />
          {sent === null ? <Button type="button" onClick={sendCode} loading={a.pending} disabled={!id}>Recevoir le code</Button> : <Button loading={a.pending}>Se connecter <ArrowRight size={18} /></Button>}
        </form>
      )}
      <p className="text-center text-sm text-ink-mute">Pas encore de compte ? <Link href="/inscription" className="font-bold text-brand-600">Créer un compte gratuitement</Link></p>
      <p className="flex items-center justify-center gap-1.5 text-xs text-ink-mute"><ShieldCheck size={14} className="text-[#0f8a46]" />Connexion chiffrée · tes données ne sont jamais revendues</p>
    </div>
  );
}
