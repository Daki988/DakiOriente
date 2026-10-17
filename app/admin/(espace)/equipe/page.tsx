import { removeMember } from "@/app/admin/actions";
import { AddMemberForm } from "@/components/admin/AddMemberForm";
import { ROLE_LABEL, requireAdmin, type Role } from "@/lib/admin";
import { supabaseService } from "@/lib/supabase";

export default async function Equipe() {
  const me = await requireAdmin(["super_admin"]);
  const { data } = await supabaseService().from("admins").select("email, role, created_at").order("created_at");
  const team = (data ?? []) as { email: string; role: Role }[];

  return (
    <div className="grid max-w-2xl gap-5">
      <h1 className="text-[28px] font-extrabold">Équipe</h1>
      <ul className="divide-y divide-[#efece4] overflow-hidden rounded-2xl border border-line bg-white">
        {team.map((m) => (
          <li key={m.email} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1"><b className="block truncate">{m.email}</b><span className="text-xs text-muted">{ROLE_LABEL[m.role]}</span></span>
            {m.role !== "super_admin" && m.email !== me.email && (
              <form action={removeMember.bind(null, m.email)}><button className="text-sm font-semibold text-danger">Retirer l’accès</button></form>
            )}
          </li>
        ))}
      </ul>
      <section className="grid gap-3 rounded-2xl border border-line bg-white p-4">
        <h2 className="text-lg font-extrabold">Ajouter une personne</h2>
        <p className="text-sm text-muted"><b>Administrateur</b> : commandes et prix. <b>Atelier</b> : commandes seulement.</p>
        <AddMemberForm />
      </section>
    </div>
  );
}
