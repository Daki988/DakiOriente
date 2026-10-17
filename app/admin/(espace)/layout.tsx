import type { Metadata } from "next";
import { LogoutButton } from "@/components/admin/AuthForms";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/Logo";
import { ROLE_LABEL, requireAdmin } from "@/lib/admin";
import { hasSupabase } from "@/lib/supabase";

export const metadata: Metadata = { title: "Back-office", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabase) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper p-6">
        <p className="max-w-md rounded-2xl bg-warn-soft p-5 text-warn">Back-office indisponible : la base de données n’est pas encore branchée. Suivez docs/SUPABASE.md.</p>
      </main>
    );
  }
  const me = await requireAdmin();
  return (
    <div className="min-h-dvh bg-[#f7f6f3] md:grid md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-5 bg-ink px-3.5 py-4 text-white md:sticky md:top-0 md:h-dvh md:py-5" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between px-1.5"><Logo light className="h-10 w-auto" /></div>
        <AdminNav role={me.role} />
        <div className="mt-auto hidden gap-1 border-t border-white/10 px-2 pt-3 text-sm md:grid">
          <span className="truncate font-semibold">{me.email}</span>
          <span className="text-white/55">{ROLE_LABEL[me.role]}</span>
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0 px-4 py-5 md:px-7 md:py-6">{children}</div>
    </div>
  );
}
