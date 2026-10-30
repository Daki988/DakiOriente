"use client";
import { useState } from "react";
import { Button } from "@/components/app/kit";
import { Field, FormError, PasswordInput } from "@/components/app/form";
import { useAction } from "@/hooks/useApi";
import { api } from "@/lib/api";

/** Première connexion d'un accès créé par Navigoal : choix du mot de passe personnel (maquettes « accès », écran 2). */
export function PremiereConnexion({ nom, suite }: { nom: string; suite: string }) {
  const [mdp, setMdp] = useState("");
  const [conf, setConf] = useState("");
  const a = useAction();
  const force = [mdp.length >= 8, /\d/.test(mdp) && /[A-Za-z]/.test(mdp), mdp.length >= 12, /[^A-Za-z0-9]/.test(mdp)].filter(Boolean).length;
  const valider = (e: React.FormEvent) => { e.preventDefault(); a.run(async () => {
    if (mdp !== conf) throw new Error("Les deux mots de passe ne sont pas identiques.");
    await api("/moi/premier-mot-de-passe", { body: { nouveau: mdp } });
    location.assign(suite);
  }); };
  return (
    <form onSubmit={valider} className="card flex w-full max-w-[480px] flex-col gap-4 rounded-[24px] p-6 sm:p-8">
      <div><b className="text-xl">Bienvenue, {nom}</b><p className="text-sm text-ink-mute">Première connexion à votre espace établissement</p></div>
      <p className="text-sm">Choisissez votre mot de passe personnel : le mot de passe provisoire ne fonctionnera plus ensuite.</p>
      <Field label="Nouveau mot de passe" hint="8 caractères minimum, dont une lettre et un chiffre">{(id) => <PasswordInput id={id} value={mdp} onChange={(e) => setMdp(e.target.value)} autoComplete="new-password" autoFocus />}</Field>
      <div className="-mt-2 flex gap-1.5" aria-hidden>{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < force ? (force >= 3 ? "bg-[#0f8a46]" : "bg-[#f9a806]") : "bg-[#e6eaf3]"}`} />)}</div>
      <Field label="Confirmation">{(id) => <PasswordInput id={id} value={conf} onChange={(e) => setConf(e.target.value)} autoComplete="new-password" />}</Field>
      <FormError error={a.error} />
      <Button type="submit" loading={a.pending} disabled={mdp.length < 8 || !conf}>Enregistrer et découvrir mon espace</Button>
      <p className="text-center text-xs text-ink-mute">Le guide de la plateforme s&apos;ouvre ensuite pour vous accompagner pas à pas.</p>
    </form>
  );
}
