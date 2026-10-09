"use client";
import Link from "next/link";
import { CalendarClock, Headset, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button, Empty, Loading, PageHeader, Panel, StatusBadge, dateFr, useToast } from "@/components/app/kit";
import { Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { api } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";

type Appt = { a: { id: string; topic: string; channel: string; status: string; preferredAt: string | null; scheduledAt: string | null; notes: string | null; createdAt: string } };
const TOPICS = ["Choisir ma série", "Choisir une formation", "Étudier à l'étranger (visa, budget)", "Préparer ma candidature", "Logement et installation", "Autre"];

export function Conseiller() {
  const toast = useToast();
  const list = useApi<Appt[]>("/rendez-vous");
  const convs = useApi<{ id: string; contextKind: string | null; contextId: string | null }[]>("/conversations");
  const a = useAction();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [detail, setDetail] = useState("");
  const [when, setWhen] = useState("");
  const [channel, setChannel] = useState("visio");
  const submit = (e: React.FormEvent) => { e.preventDefault(); a.run(async () => { await api("/rendez-vous", { body: { topic: detail ? `${topic} — ${detail}` : topic, preferredAt: when || undefined, channel } }); toast("Demande envoyée : un conseiller te confirme le créneau."); setDetail(""); list.reload(); }); };
  return (
    <>
      <PageHeader title="Conseiller d'orientation" sub="Un accompagnement humain, en visio, par téléphone ou sur WhatsApp." />
      <div className="grid items-start gap-6 xl:grid-cols-[420px_1fr]">
        <Panel title="Prendre rendez-vous" icon={CalendarClock}>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Sujet">{(i) => <Select id={i} value={topic} onChange={(e) => setTopic(e.target.value)} options={TOPICS.map((t) => [t, t])} />}</Field>
            <Field label="Précisions">{(i) => <Textarea id={i} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ta situation, tes questions…" />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Créneau souhaité">{(i) => <Input id={i} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}</Field>
              <Field label="Canal">{(i) => <Select id={i} value={channel} onChange={(e) => setChannel(e.target.value)} options={[["visio", "Visio"], ["telephone", "Téléphone"], ["whatsapp", "WhatsApp"]]} />}</Field>
            </div>
            <FormError error={a.error} />
            <Button loading={a.pending}>Demander un rendez-vous</Button>
          </form>
        </Panel>
        <Panel title="Mes rendez-vous" icon={Headset}>
          {list.loading ? <Loading /> : !list.data?.length ? <Empty icon={Headset} title="Aucun rendez-vous" text="Ta première séance permet de faire le point sur ton profil et ton projet." /> : list.data.map(({ a: x }) => {
            const conv = convs.data?.find((c) => c.contextKind === "conseil" && c.contextId === x.id);
            return (
              <div key={x.id} className="flex flex-col gap-2 rounded-2xl border border-[#eef1f8] p-4 sm:flex-row sm:items-center sm:justify-between">
                <span><b className="block text-sm">{x.topic}</b><span className="text-xs text-ink-mute">{x.scheduledAt ? `Confirmé le ${dateFr(x.scheduledAt, true)}` : x.preferredAt ? `Souhaité le ${dateFr(x.preferredAt, true)}` : `Demandé le ${dateFr(x.createdAt)}`} · {x.channel}</span></span>
                <span className="flex items-center gap-2"><StatusBadge status={x.status} />{conv && <Link href={`/messages/${conv.id}`} className="flex items-center gap-1 text-[13px] font-bold text-brand-600"><MessageCircle size={14} />Échanger</Link>}</span>
              </div>
            );
          })}
        </Panel>
      </div>
    </>
  );
}
