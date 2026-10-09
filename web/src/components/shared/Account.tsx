"use client";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button, PageHeader, Panel, useToast } from "@/components/app/kit";
import { Field, FormError, PasswordInput } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction } from "@/hooks/useApi";
import { useUser } from "@/components/app/Session";

export function Account() {
  const u = useUser();
  const toast = useToast();
  const a = useAction();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const submit = (e: React.FormEvent) => { e.preventDefault(); a.run(async () => { await api("/moi/mot-de-passe", { body: { actuel: cur, nouveau: next } }); setCur(""); setNext(""); toast("Mot de passe modifié"); }); };
  return (
    <>
      <PageHeader title="Compte et sécurité" />
      <div className="grid max-w-4xl gap-6 md:grid-cols-2">
        <Panel title="Identifiants" icon={ShieldCheck}>
          <div className="text-sm"><span className="text-ink-mute">Nom</span><b className="block">{u.firstName} {u.lastName}</b></div>
          {u.email && <div className="text-sm"><span className="text-ink-mute">E-mail</span><b className="block">{u.email}</b></div>}
          {u.phone && <div className="text-sm"><span className="text-ink-mute">Téléphone</span><b className="block">{u.phone}</b></div>}
          <p className="text-xs text-ink-mute">Pour modifier ces identifiants ou supprimer ton compte, écris à contact@navigoal.com (vérification d&apos;identité).</p>
        </Panel>
        <Panel title="Changer de mot de passe" icon={KeyRound}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Mot de passe actuel">{(i) => <PasswordInput id={i} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />}</Field>
            <Field label="Nouveau mot de passe" hint="8 caractères minimum, une lettre et un chiffre">{(i) => <PasswordInput id={i} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required minLength={8} />}</Field>
            <FormError error={a.error} />
            <Button loading={a.pending}>Mettre à jour</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
