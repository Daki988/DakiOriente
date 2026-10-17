"use client";

import { useActionState } from "react";
import { addMember, type SaveState } from "@/app/admin/actions";

export function AddMemberForm() {
  const [state, action, pending] = useActionState<SaveState, FormData>(addMember, {});
  return (
    <form action={action} className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <input name="email" type="email" required placeholder="e-mail" aria-label="E-mail" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 outline-none focus:border-brand" />
        <select name="role" aria-label="Rôle" className="rounded-xl border border-line bg-paper px-3 py-2.5">
          <option value="atelier">Atelier</option>
          <option value="admin">Administrateur</option>
        </select>
        <button disabled={pending} className="rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Ajouter</button>
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm text-ok">{state.ok}</p>}
    </form>
  );
}
