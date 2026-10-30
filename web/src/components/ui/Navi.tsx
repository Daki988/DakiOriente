"use client";
import { ArrowRight, Calculator, FileText, GraduationCap, Home, Mic, MessageCircle, RotateCcw, Scale, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@/components/ui/Link";
import { useDevise } from "@/components/ui/Devise";
import type { Carte } from "@/server/services/navi";

// Navi, l'assistant IA : bouton flottant sur toutes les pages, panneau de conversation (maquettes Figma validées).
// Il ne s'affiche que si le serveur a une clé API (GET /api/navi), comme le bouton Google.

type Msg = { role: "user" | "assistant"; texte: string; cartes?: Carte[]; erreur?: boolean };
const CLE = "navigoal-navi";
const lire = <T,>(k: string, d: T): T => { try { const v = sessionStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const ecrire = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

const SUGGESTIONS: { icone: ReactNode; texte: string }[] = [
  { icone: <GraduationCap size={15} />, texte: "Trouver ma formation" },
  { icone: <Calculator size={15} />, texte: "Combien ça coûte ?" },
  { icone: <FileText size={15} />, texte: "Où en est mon dossier ?" },
  { icone: <Home size={15} />, texte: "Trouver un logement" },
  { icone: <Scale size={15} />, texte: "Comparer des écoles" },
];

/** Question d'accroche selon la page ouverte. */
function accroche(path: string) {
  if (/^\/formations\/[^/]+/.test(path)) return "Une question sur cette formation ?";
  if (/^\/etablissements\/[^/]+/.test(path)) return "Une question sur cette école ?";
  if (/^\/metiers\/[^/]+/.test(path)) return "Comment devenir ce métier ?";
  if (path.startsWith("/devis")) return "Besoin d'aide pour le budget ?";
  if (path.startsWith("/espace/candidatures")) return "Où en est mon dossier ?";
  return null;
}

/** Gras (**…**) et listes simples ; aucun HTML interprété. */
function Texte({ v }: { v: string }) {
  const ligne = (l: string, k: number) => <span key={k}>{l.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-bold text-ink">{p.slice(2, -2)}</strong> : p))}</span>;
  return (
    <div className="space-y-2">
      {v.trim().split(/\n{2,}/).map((bloc, i) => {
        const lignes = bloc.split("\n");
        return lignes.every((l) => /^\s*[-•*]\s/.test(l))
          ? <ul key={i} className="list-disc space-y-1 pl-5">{lignes.map((l, k) => <li key={k}>{ligne(l.replace(/^\s*[-•*]\s/, ""), k)}</li>)}</ul>
          : <p key={i}>{lignes.map((l, k) => <span key={k}>{k > 0 && <br />}{ligne(l, k)}</span>)}</p>;
      })}
    </div>
  );
}

function Cartes({ cartes, whatsapp, resume, onSuggestion, fermer }: { cartes: Carte[]; whatsapp: string | null; resume: string; onSuggestion: (s: string) => void; fermer: () => void }) {
  return (
    <div className="mt-2.5 space-y-2.5">
      {cartes.map((c, i) => {
        if (c.type === "etablissement") return (
          <Link key={i} href={c.href} onClick={fermer} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element -- logos déjà optimisés, servis tels quels */}
              {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-contain" loading="lazy" /> : <GraduationCap size={18} className="text-brand-600" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-1.5 text-[14px] font-extrabold text-ink">{c.sigle}<span className="text-[12px] font-medium text-ink-mute">· {c.ville}</span>{c.badge && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[10.5px] font-bold text-[#a55a00]">{c.badge}</span>}</span>
              <span className="block truncate text-[12px] text-ink-mute">{c.nom}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px]"><span className="rounded-full bg-[#e8f8ef] px-2 py-0.5 font-bold text-[#0f8a46]">{c.label}</span>{c.parAn && <span className="font-bold text-brand-700">{c.parAn}</span>}</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-brand-600" />
          </Link>
        );
        if (c.type === "devis") return (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">{c.titre}</div>
            <div className="mt-1 text-[22px] font-extrabold leading-tight text-ink">{c.total}</div>
            <div className="text-[12px] text-ink-mute">{c.sousTotal}</div>
            <div className="mt-1 text-[12px] text-ink-soft">{c.detail}</div>
            <Link href={c.href} onClick={fermer} className="mt-2.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[13px] font-bold text-brand-700 hover:border-brand-300"><Calculator size={15} />Voir le devis complet (visa, billets…)</Link>
          </div>
        );
        if (c.type === "liens") return (
          <div key={i} className="flex flex-wrap gap-2">
            {c.liens.map((l) => <Link key={l.href} href={l.href} onClick={fermer} className={l.principal ? "inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-brand-700" : "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-bold text-brand-700 hover:border-brand-300"}>{l.libelle}<ArrowRight size={14} /></Link>)}
          </div>
        );
        if (c.type === "conseiller") return whatsapp
          ? <a key={i} href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je viens de Navi (assistant Navigoal). ${resume}`.slice(0, 900))}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[14px] font-extrabold text-ink"><MessageCircle size={17} />Continuer sur WhatsApp</a>
          : <a key={i} href={`mailto:contact@navigoal.net?subject=${encodeURIComponent("Question (depuis Navi)")}&body=${encodeURIComponent(resume.slice(0, 900))}`} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-bold text-brand-700"><MessageCircle size={17} />Écrire à un conseiller</a>;
        if (c.type === "suggestions") return (
          <div key={i} className="flex flex-wrap gap-1.5">
            {c.suggestions.map((s) => <button key={s} type="button" onClick={() => onSuggestion(s)} className="rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-bold text-brand-700 hover:bg-brand-100">{s}</button>)}
          </div>
        );
        return null;
      })}
    </div>
  );
}

const Avatar = () => <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white"><Sparkles size={14} /></span>;

export function Navi() {
  const path = usePathname() ?? "/";
  const { pays } = useDevise();
  const [actif, setActif] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [saisie, setSaisie] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [bulle, setBulle] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const fil = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);
  const annule = useRef<AbortController | null>(null);

  useEffect(() => {
    const memo = lire<boolean | null>(`${CLE}-actif`, null);
    if (memo !== null) setActif(memo);
    else fetch("/api/navi/").then((r) => r.json()).then((d) => { setActif(!!d.actif); ecrire(`${CLE}-actif`, !!d.actif); }).catch(() => {});
    setMsgs(lire<Msg[]>(`${CLE}-fil`, []));
  }, []);
  useEffect(() => { ecrire(`${CLE}-fil`, msgs.slice(-30)); }, [msgs]);
  useEffect(() => {
    if (!ouvert) return;
    fetch("/api/session/").then((r) => r.json()).then((d) => setConnecte(!!d?.user)).catch(() => setConnecte(false));
    fetch("/api/contact/").then((r) => r.json()).then((d) => setWhatsapp(d?.whatsapp ?? null)).catch(() => {});
    setTimeout(() => champ.current?.focus(), 50);
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(false); };
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [ouvert]);
  useEffect(() => { fil.current?.scrollTo({ top: fil.current.scrollHeight }); }, [msgs, ouvert]);
  // Bulle d'accroche contextuelle, une fois par page et par session.
  const question = accroche(path);
  useEffect(() => {
    if (!actif || !question || ouvert || lire(`${CLE}-bulle-${path}`, false)) return;
    const t = setTimeout(() => { setBulle(true); ecrire(`${CLE}-bulle-${path}`, true); }, 2500);
    const u = setTimeout(() => setBulle(false), 12000);
    return () => { clearTimeout(t); clearTimeout(u); setBulle(false); };
  }, [actif, question, path, ouvert]);

  const envoyer = useCallback(async (texte: string) => {
    const t = texte.trim();
    if (!t || envoi) return;
    const histo: Msg[] = [...msgs.filter((m) => !m.erreur), { role: "user", texte: t }];
    setMsgs([...msgs, { role: "user", texte: t }, { role: "assistant", texte: "" }]);
    setSaisie(""); setEnvoi(true); setBulle(false);
    const maj = (f: (m: Msg) => Msg) => setMsgs((xs) => [...xs.slice(0, -1), f(xs[xs.length - 1])]);
    const ctrl = new AbortController();
    annule.current = ctrl;
    try {
      const r = await fetch("/api/navi/", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", signal: ctrl.signal,
        body: JSON.stringify({ messages: histo.slice(-12).map((m) => ({ role: m.role, texte: m.texte.slice(0, 4000) })), page: { chemin: window.location.pathname + window.location.search, titre: document.title }, pays }),
      });
      if (!r.ok || !r.body) {
        const d = await r.json().catch(() => null);
        maj((m) => ({ ...m, texte: d?.error?.message ?? "Navi est momentanément indisponible. Réessaie dans un instant.", erreur: true, cartes: r.status === 429 ? [{ type: "conseiller" }] : undefined }));
        return;
      }
      const lecteur = r.body.getReader();
      const dec = new TextDecoder();
      let tampon = "", base = "", tour = "";
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        tampon += dec.decode(value, { stream: true });
        const lignes = tampon.split("\n");
        tampon = lignes.pop() ?? "";
        for (const l of lignes) {
          if (!l.trim()) continue;
          const e = JSON.parse(l) as { t: string; v?: unknown };
          if (e.t === "etape") { if (tour.trim()) base = `${base}${base ? "\n\n" : ""}${tour.trim()}`; tour = ""; }
          else if (e.t === "texte") tour += e.v as string;
          else if (e.t === "efface") tour = "";
          else if (e.t === "cartes") maj((m) => ({ ...m, cartes: [...(m.cartes ?? []), ...(e.v as Carte[])] }));
          else if (e.t === "erreur") maj((m) => ({ ...m, texte: e.v as string, erreur: true }));
          if (e.t === "texte" || e.t === "efface" || e.t === "etape") { const v = `${base}${base && tour.trim() ? "\n\n" : ""}${tour}`; maj((m) => ({ ...m, texte: v })); }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") maj((m) => ({ ...m, texte: "Connexion interrompue. Réessaie.", erreur: true }));
    } finally {
      setEnvoi(false);
      annule.current = null;
    }
  }, [envoi, msgs, pays]);

  const dicter = () => {
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "fr-FR"; rec.interimResults = false;
    rec.onresult = (ev) => setSaisie((s) => `${s}${s ? " " : ""}${ev.results[0][0].transcript}`);
    rec.onend = () => setEcoute(false);
    setEcoute(true); rec.start();
  };
  const dictee = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  if (!actif) return null;
  const resume = msgs.filter((m) => m.role === "user").slice(-3).map((m) => m.texte).join(" / ");
  const fermer = () => setOuvert(false);

  return (
    <>
      {!ouvert && (
        <div className="fixed bottom-24 right-4 z-40 flex items-center gap-3 lg:bottom-6 lg:right-6 print:hidden">
          {bulle && question && <button type="button" onClick={() => { setOuvert(true); void envoyer(question); }} className="hidden rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13.5px] font-bold text-ink shadow-[0_10px_30px_-12px_rgba(11,21,51,.35)] sm:block">{question}</button>}
          <button type="button" onClick={() => setOuvert(true)} aria-label="Ouvrir Navi, l'assistant Navigoal" className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_14px_34px_-10px_rgba(26,71,245,.6)] transition hover:scale-105">
            <Sparkles size={24} />
          </button>
        </div>
      )}
      {ouvert && (
        <section role="dialog" aria-label="Navi, assistant Navigoal" className="fixed inset-0 z-50 flex flex-col bg-[#f6f8fe] sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(700px,calc(100vh-48px))] sm:w-[410px] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-[0_30px_80px_-20px_rgba(11,21,51,.45)] print:hidden">
          <header className="flex items-center gap-3 border-b border-slate-200/80 bg-white px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><Sparkles size={18} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[15.5px] font-extrabold text-ink">Navi</div>
              <div className="flex items-center gap-1.5 truncate text-[12px] text-ink-mute"><span className="h-2 w-2 shrink-0 rounded-full bg-[#22c55e]" /><span className="truncate">Répond avec les données Navigoal</span></div>
            </div>
            {msgs.length > 0 && !envoi && <button type="button" onClick={() => setMsgs([])} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="rounded-lg p-1.5 text-ink-mute hover:bg-slate-100"><RotateCcw size={17} /></button>}
            <button type="button" onClick={fermer} aria-label="Fermer" className="rounded-lg p-1.5 text-ink-soft hover:bg-slate-100"><X size={20} /></button>
          </header>

          <div ref={fil} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 text-[14.5px] leading-relaxed text-ink-soft">
            <div className="flex gap-2.5">
              <Avatar />
              <div className="rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-3.5 py-2.5">Bonjour 👋 Je suis Navi, l&apos;assistant de Navigoal. Dis-moi ton projet en une phrase, je te montre directement les formations, les écoles et le budget qui te correspondent.</div>
            </div>
            {msgs.length === 0 && (
              <div className="pl-[38px]">
                <div className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Suggestions</div>
                <div className="flex flex-col items-start gap-2">
                  {question && <button type="button" onClick={() => envoyer(question)} className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-2 text-[13.5px] font-bold text-brand-700"><Sparkles size={15} />{question}</button>}
                  {SUGGESTIONS.filter((s) => s.texte !== question).map((s) => <button key={s.texte} type="button" onClick={() => envoyer(s.texte)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13.5px] font-bold text-ink hover:border-brand-300"><span className="text-brand-600">{s.icone}</span>{s.texte}</button>)}
                </div>
                {connecte === false && (
                  <div className="mt-4 flex gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/70 p-3 text-[12.5px] text-ink-soft">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
                    <span><Link href={`/connexion/?suite=${encodeURIComponent(path)}`} onClick={fermer} className="font-bold text-ink underline-offset-2 hover:underline">Connecte-toi</Link> pour que Navi suive tes candidatures, tes paiements et ton logement.</span>
                  </div>
                )}
              </div>
            )}
            {msgs.map((m, i) => m.role === "user"
              ? <div key={i} className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2.5 text-white">{m.texte}</div></div>
              : (
                <div key={i} className="flex gap-2.5">
                  <Avatar />
                  <div className="min-w-0 flex-1">
                    <div className={`rounded-2xl rounded-tl-md border px-3.5 py-2.5 ${m.erreur ? "border-[#ffd0da] bg-[#fff5f7]" : "border-slate-200/80 bg-white"}`}>
                      {m.texte ? <Texte v={m.texte} /> : <span className="inline-flex gap-1 py-1" aria-label="Navi réfléchit"><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:240ms]" /></span>}
                    </div>
                    {m.cartes && <Cartes cartes={m.cartes} whatsapp={whatsapp} resume={resume} onSuggestion={envoyer} fermer={fermer} />}
                  </div>
                </div>
              ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); void envoyer(saisie); }} className="border-t border-slate-200/80 bg-white px-3.5 pb-3 pt-3">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-brand-400">
              <textarea ref={champ} value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={1500} rows={1} placeholder={msgs.length ? "Pose ta question…" : "Ex. : bac D, je veux devenir infirmière…"}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void envoyer(saisie); } }}
                className="max-h-28 min-h-[36px] flex-1 resize-none border-0 bg-transparent py-1.5 shadow-none outline-none ring-0 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-[16px] text-ink placeholder:text-ink-mute sm:text-[14.5px]" aria-label="Ton message pour Navi" />
              {dictee && <button type="button" onClick={dicter} aria-label="Dicter" className={`rounded-lg p-2 ${ecoute ? "text-[#d42a50]" : "text-ink-mute hover:text-ink"}`}><Mic size={18} /></button>}
              {envoi
                ? <button type="button" onClick={() => annule.current?.abort()} aria-label="Arrêter" className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-white"><X size={16} /></button>
                : <button type="submit" disabled={!saisie.trim()} aria-label="Envoyer" className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white disabled:opacity-40"><Send size={16} /></button>}
            </div>
            <p className="mt-2 text-center text-[11px] leading-snug text-ink-mute">Réponses générées par une IA à partir des données Navigoal. Vérifie toujours avant de payer.</p>
          </form>
        </section>
      )}
    </>
  );
}

type SpeechRec = { lang: string; interimResults: boolean; start: () => void; onresult: (ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void; onend: () => void };
