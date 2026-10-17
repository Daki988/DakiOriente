"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const browser = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const input = "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-[16px] outline-none focus:border-brand";
const btn = "rounded-full bg-brand px-6 py-3.5 font-bold text-white disabled:opacity-60";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ tone: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await browser().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setMsg({ tone: "err", text: "E-mail ou mot de passe incorrect." });
    router.replace("/admin");
    router.refresh();
  }

  async function forgot() {
    if (!email.trim()) return setMsg({ tone: "err", text: "Saisissez d’abord votre e-mail." });
    setBusy(true);
    await browser().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/admin/mot-de-passe` });
    setBusy(false);
    setMsg({ tone: "ok", text: "Si ce compte existe, un e-mail vient d’être envoyé pour choisir un nouveau mot de passe." });
  }

  return (
    <form onSubmit={login} className="grid gap-3">
      <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-muted">E-mail</span>
        <input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-muted">Mot de passe</span>
        <input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {msg && <p role="alert" className={`rounded-xl p-3 text-sm ${msg.tone === "err" ? "bg-danger-soft text-danger" : "bg-ok-soft text-ok"}`}>{msg.text}</p>}
      <button className={btn} disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
      <button type="button" onClick={forgot} className="text-sm font-semibold text-muted underline">Mot de passe oublié ou première connexion</button>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return setErr("10 caractères minimum.");
    if (pw !== pw2) return setErr("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    const { error } = await browser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr("Le lien a expiré. Recommencez « Mot de passe oublié ».");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-3">
      <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-muted">Nouveau mot de passe (10 caractères minimum)</span>
        <input className={input} type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      <label className="grid gap-1.5"><span className="text-[13px] font-semibold text-muted">Confirmer</span>
        <input className={input} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
      {err && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{err}</p>}
      <button className={btn} disabled={busy}>Enregistrer</button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button type="button" className="text-left text-sm text-white/60 hover:text-white"
      onClick={async () => { await browser().auth.signOut(); router.replace("/admin/connexion"); router.refresh(); }}>
      Se déconnecter
    </button>
  );
}
