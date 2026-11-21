"use client";
import { Phone, Send, ShieldAlert, Video } from "lucide-react";
import Link from "@/components/ui/Link";
import { useEffect, useRef, useState } from "react";
import { Avatar, Loading, since } from "@/components/app/kit";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useUser } from "@/components/app/Session";
import { CarteRdv, PlanifierRdv } from "@/components/shared/RendezVous";

export type Thread = { conversation: { id: string; subject: string; contextKind: string | null; contextId: string | null }; masked: boolean; messages: { m: { id: string; body: string; masked: boolean; createdAt: string; authorId: string; onBehalfOf?: string | null; internal?: boolean }; a: { id: string; firstName: string; lastName: string; role: string } }[] };

// Lien d'appel posté dans le fil (« /appel/<id>/ ») : affiché comme un bouton « Rejoindre l'appel ».
const LIEN_APPEL = /(\/appel\/[0-9a-f-]{36}\/)/;
export function CorpsMessage({ body }: { body: string }) {
  // Rendez-vous planifié (« 📅 … /appel/<id>/ ») : carte avec la date, le rappel, l'agenda et « Rejoindre ».
  const rdv = body.startsWith("📅") ? body.match(/\/appel\/([0-9a-f-]{36})\//) : null;
  if (rdv) return <>{body.startsWith("📅 Rendez-vous déplacé") && <span className="block font-semibold">Rendez-vous déplacé</span>}<CarteRdv id={rdv[1]} /></>;
  const morceaux = body.split(LIEN_APPEL);
  if (morceaux.length === 1) return <>{body}</>;
  return <>{morceaux.map((x, i) => LIEN_APPEL.test(x)
    ? <Link key={i} href={x} className="my-1 inline-flex items-center gap-1.5 rounded-xl bg-[#0f8a46] px-3.5 py-2 text-[13px] font-bold text-white no-underline hover:bg-[#0b6e38]"><Video size={15} />Rejoindre l&apos;appel</Link>
    : <span key={i}>{x}</span>)}</>;
}

/** Bouton d'appel (Daily) pour les professionnels et l'équipe : appel vidéo ou audio seul, annoncé dans le fil. */
export function LancerAppel({ conversationId, apres }: { conversationId: string; apres?: () => void }) {
  const actif = useApi<{ actif: boolean }>("/appels");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!actif.data?.actif) return null;
  const lancer = async (audioSeul: boolean) => {
    setBusy(true); setErr(null);
    try { const a = await api<{ id: string }>(`/conversations/${conversationId}/appel`, { body: { audioSeul } }); apres?.(); window.open(`/appel/${a.id}/`, "_blank", "noopener"); }
    catch (x) { setErr(x instanceof Error ? x.message : "Appel impossible."); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={() => lancer(false)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0f8a46] px-3 text-[13px] font-bold text-white disabled:opacity-60"><Video size={16} />Appel vidéo</button>
      <button type="button" disabled={busy} onClick={() => lancer(true)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#bfe9cf] bg-white px-3 text-[13px] font-bold text-[#0b7a3d] disabled:opacity-60"><Phone size={15} />Audio seul</button>
      <PlanifierRdv conversationId={conversationId} apres={apres} />
      {err && <span className="w-full text-xs font-semibold text-[#b8213f]">{err}</span>}
    </div>
  );
}

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
      {["etablissement", "bailleur", "conseiller"].includes(me.role) && <div className="mb-3"><LancerAppel conversationId={id} apres={t.reload} /></div>}
      {t.data.masked && <p className="mb-3 flex items-start gap-2 rounded-xl bg-[#fff7dd] px-3.5 py-2.5 text-xs text-[#8a4b00]"><ShieldAlert size={16} className="shrink-0" />Pour ta sécurité, téléphones, e-mails et liens sont masqués jusqu&apos;au paiement en séquestre. Ne paie jamais en dehors de Navilease.</p>}
      <div className={`flex flex-col gap-4 overflow-y-auto pr-1 ${compact ? "max-h-[420px]" : "min-h-[300px] flex-1"}`}>
        {!t.data.messages.length && <p className="py-6 text-center text-sm text-ink-mute">Aucun message pour l&apos;instant.</p>}
        {t.data.messages.map(({ m, a }) => {
          const mine = a.id === me.id;
          // Équipe Navigoal (relais) : signée comme telle, jamais au nom de l'école ; notes internes en jaune (professionnels seulement).
          const equipe = a.role === "admin";
          const nom = mine ? "Moi" : equipe ? `${a.firstName}, équipe Navigoal${m.onBehalfOf ? ` · pour le compte de ${m.onBehalfOf}` : ""}` : `${a.firstName} ${a.lastName}`;
          const bulle = m.internal ? "rounded-bl-md border border-[#ffe59a] bg-[#fff7dd]" : mine ? "rounded-br-md bg-brand-600 text-white" : equipe ? "rounded-bl-md border border-[#c9d6ff] bg-brand-50" : "rounded-bl-md bg-[#f1f4fb]";
          return (
            <div key={m.id} className={`flex items-end gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={`${a.firstName} ${a.lastName}`} size={32} />
              <div className={`flex max-w-[78%] flex-col gap-1 ${mine ? "items-end" : ""}`}>
                <span className="text-[11px] font-bold text-ink-mute">{nom} · {since(m.createdAt)}{equipe && !mine && <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] text-brand-700">NAVIGOAL</span>}{m.internal && <span className="ml-1.5 rounded-full bg-sun-100 px-1.5 py-0.5 text-[10px] text-[#a55a00]">NOTE INTERNE</span>}</span>
                <p className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${bulle}`}><CorpsMessage body={m.body} /></p>
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
      {err && <p className="mt-1 text-xs font-semibold text-[#b8213f]">{err}</p>}
    </div>
  );
}
