"use client";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button, Empty, Loading, PageHeader, Panel, since } from "@/components/app/kit";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";

type N = { id: string; kind: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string };

export function Notifications() {
  const n = useApi<{ items: N[]; unread: number }>("/notifications");
  const read = async (id?: string) => { await api("/notifications/lues", { body: id ? { id } : {} }); n.reload(); };
  return (
    <>
      <PageHeader title="Notifications" sub={n.data ? `${n.data.unread} non lue${n.data.unread > 1 ? "s" : ""}` : undefined} actions={<Button variant="ghost" icon={CheckCheck} onClick={() => read()} disabled={!n.data?.unread}>Tout marquer comme lu</Button>} />
      <Panel>
        {n.loading ? <Loading /> : !n.data?.items.length ? <Empty icon={Bell} title="Aucune notification" text="Candidatures, paiements, messages et logement : tu seras prévenu·e ici, par e-mail et par SMS." /> : (
          <div className="flex flex-col">
            {n.data.items.map((x) => {
              const body = <><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${x.readAt ? "bg-transparent" : "bg-brand-600"}`} /><span className="min-w-0 flex-1"><b className={`block text-sm ${x.readAt ? "font-semibold text-ink-soft" : ""}`}>{x.title}</b>{x.body && <span className="block text-[13px] text-ink-mute">{x.body}</span>}</span><span className="shrink-0 text-xs text-ink-mute">{since(x.createdAt)}</span></>;
              return x.link
                ? <Link key={x.id} href={x.link} onClick={() => !x.readAt && read(x.id)} className="flex items-start gap-3 border-b border-[#f1f4fb] px-1 py-3.5 last:border-0 hover:bg-[#fbfcff]">{body}</Link>
                : <button key={x.id} onClick={() => !x.readAt && read(x.id)} className="flex items-start gap-3 border-b border-[#f1f4fb] px-1 py-3.5 text-left last:border-0">{body}</button>;
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
