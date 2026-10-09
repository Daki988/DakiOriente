"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Empty, Loading, Tabs, since } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { ConversationThread } from "@/components/espace/Conversation";

type Conv = { id: string; subject: string; contextKind: string | null; contextId: string | null; lastMessageAt: string; unread: number; participants: { id: string; firstName: string; lastName: string; role: string }[]; last: { body: string } | null };
const KIND: Record<string, [string, string]> = { application: ["Écoles", "bg-brand-50 text-brand-700"], booking: ["Logement", "bg-sun-100 text-[#a55a00]"], conseil: ["Conseiller", "bg-[#e8f8ef] text-[#0f8a46]"] };

/** Messagerie (maquette 27) : liste filtrable + fil sélectionné. */
export function Messages({ id }: { id?: string }) {
  const list = useApi<Conv[]>("/conversations", { refreshMs: 30000 });
  const [tab, setTab] = useState<"tous" | "application" | "booking" | "conseil">("tous");
  const path = usePathname();
  const rows = useMemo(() => (list.data ?? []).filter((c) => tab === "tous" || c.contextKind === tab), [list.data, tab]);
  const current = list.data?.find((c) => c.id === id);
  return (
    <div className="grid gap-5 lg:h-[calc(100vh-140px)] lg:grid-cols-[360px_1fr]">
      <section className={`card flex min-h-0 flex-col gap-3 rounded-[22px] p-4 ${id ? "hidden lg:flex" : ""}`}>
        <h1 className="px-1 text-2xl font-extrabold">Messages</h1>
        <Tabs value={tab} onChange={setTab} items={[["tous", "Tous"], ["application", "Écoles"], ["booking", "Logement"], ["conseil", "Conseiller"]]} />
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
          {list.loading ? <Loading /> : !rows.length ? <p className="py-8 text-center text-sm text-ink-mute">Aucune conversation.</p> : rows.map((c) => {
            const who = c.participants.map((p) => `${p.firstName} ${p.lastName}`).join(", ") || "Navigoal";
            const on = path.includes(c.id);
            return (
              <Link key={c.id} href={`/messages/${c.id}`} className={`flex gap-3 rounded-2xl p-3 transition ${on ? "bg-brand-50" : "hover:bg-[#f6f8fe]"}`}>
                <Avatar name={who} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2"><b className="truncate text-sm">{who}</b><span className="shrink-0 text-[11px] text-ink-mute">{since(c.lastMessageAt)}</span></span>
                  {c.contextKind && KIND[c.contextKind] && <span className={`chip my-0.5 ${KIND[c.contextKind][1]}`}>{c.subject.split(" · ")[0]}</span>}
                  <span className="flex items-center justify-between gap-2"><span className="truncate text-xs text-ink-mute">{c.last?.body ?? c.subject}</span>{c.unread > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className={`card flex min-h-[70vh] flex-col rounded-[22px] p-5 lg:min-h-0 ${id ? "" : "hidden lg:flex"}`}>
        {id ? (
          <>
            <div className="mb-3 flex items-center gap-3 border-b border-[#eef1f8] pb-3">
              <Link href="/messages" className="text-sm font-bold text-brand-600 lg:hidden">←</Link>
              <span className="min-w-0"><b className="block truncate">{current ? current.participants.map((p) => `${p.firstName} ${p.lastName}`).join(", ") : "Conversation"}</b><span className="block truncate text-xs text-ink-mute">{current?.subject}</span></span>
              {current?.contextKind === "booking" && <Link href={`/navilease/reservations/${current.contextId}`} className="ml-auto shrink-0 text-[13px] font-bold text-brand-600">Voir la réservation</Link>}
              {current?.contextKind === "application" && <Link href={`/espace/candidatures/${current.contextId}`} className="ml-auto shrink-0 text-[13px] font-bold text-brand-600">Voir la candidature</Link>}
            </div>
            <ConversationThread id={id} />
          </>
        ) : <div className="flex flex-1 items-center justify-center"><Empty icon={MessageCircle} title="Choisis une conversation" text="Les échanges avec les écoles, les bailleurs et les conseillers sont rattachés à leur dossier." /></div>}
      </section>
    </div>
  );
}
