"use client";
import { Send, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, Loading, since } from "@/components/app/kit";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useUser } from "@/components/app/Session";

export type Thread = { conversation: { id: string; subject: string; contextKind: string | null; contextId: string | null }; masked: boolean; messages: { m: { id: string; body: string; masked: boolean; createdAt: string; authorId: string }; a: { id: string; firstName: string; lastName: string; role: string } }[] };

/** Fil de discussion réutilisable (messagerie, candidature, réservation). Rafraîchi toutes les 15 s. */
export function ConversationThread({ id, compact }: { id: string; compact?: boolean }) {
  const me = useUser();
  const t = useApi<Thread>(`/conversations/${id}`, { refreshMs: 15000 });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [t.data?.messages.length]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setErr(null);
    try { await api(`/conversations/${id}/messages`, { body: { texte: text } }); setText(""); await t.reload(); } catch (x) { setErr(x instanceof Error ? x.message : "Message non envoyé."); } finally { setBusy(false); }
  };
  if (!t.data) return <Loading />;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {t.data.masked && <p className="mb-3 flex items-start gap-2 rounded-xl bg-[#fff7dd] px-3.5 py-2.5 text-xs text-[#8a4b00]"><ShieldAlert size={16} className="shrink-0" />Pour ta sécurité, téléphones, e-mails et liens sont masqués jusqu&apos;au paiement en séquestre. Ne paie jamais en dehors de Navilease.</p>}
      <div className={`flex flex-col gap-4 overflow-y-auto pr-1 ${compact ? "max-h-[420px]" : "min-h-[300px] flex-1"}`}>
        {!t.data.messages.length && <p className="py-6 text-center text-sm text-ink-mute">Aucun message pour l&apos;instant.</p>}
        {t.data.messages.map(({ m, a }) => {
          const mine = a.id === me.id;
          return (
            <div key={m.id} className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={`${a.firstName} ${a.lastName}`} size={32} />
              <div className={`flex max-w-[78%] flex-col gap-1 ${mine ? "items-end" : ""}`}>
                <span className="text-[11px] font-bold text-ink-mute">{mine ? "Moi" : `${a.firstName} ${a.lastName}`} · {since(m.createdAt)}</span>
                <p className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-[#f1f4fb]"}`}>{m.body}</p>
                {m.masked && <span className="text-[11px] font-semibold text-[#a55a00]">Coordonnées masquées automatiquement</span>}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="mt-3 flex items-end gap-2 border-t border-[#eef1f8] pt-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }} rows={1} placeholder="Écrire un message…" aria-label="Message" className="input max-h-32 min-h-[46px] flex-1 resize-none py-3" />
        <button disabled={busy || !text.trim()} className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white disabled:opacity-50" aria-label="Envoyer"><Send size={18} /></button>
      </form>
      {err && <p className="mt-1 text-xs font-semibold text-[#d42a50]">{err}</p>}
    </div>
  );
}
