"use client";
// Salons virtuels côté public (maquettes design/maquettes/salons.py, écrans 3 et 5, validées le 21/11/2026) :
// inscription avec l'accord facultatif « l'école peut me recontacter », salle en direct avec questions écrites.
import { ArrowLeft, CalendarPlus, Check, Hand, Presentation, Send, Ticket } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { Loading } from "@/components/app/kit";
import { api } from "@/lib/api";

type Etat = { inscription: { accordContact: boolean; accordParent: string } | null; organisateur: boolean; termine: boolean; placesRestantes: number; statut: string };

/** Encadré « Réserve ta place » de la page d'un salon. */
export function InscriptionSalon({ id, ecole }: { id: string; ecole: string }) {
  // Session lue dans le navigateur : la page publique reste en cache sans donnée personnelle.
  const [user, setUser] = useState<{ role: string } | null | undefined>(undefined);
  useEffect(() => { fetch("/api/session/").then((r) => (r.ok ? r.json() : null)).then((d) => setUser(d?.user ?? null)).catch(() => setUser(null)); }, []);
  const [etat, setEtat] = useState<Etat | null>(null);
  const [contact, setContact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const charger = useCallback(() => { api<Etat>(`/salons/${id}`).then((e) => { setEtat(e); if (e.inscription) setContact(e.inscription.accordContact); }).catch(() => setEtat(null)); }, [id]);
  useEffect(charger, [charger]);
  const inscrire = async () => {
    setBusy(true); setErr(null);
    try { await api(`/salons/${id}/inscription`, { body: { accordContact: contact } }); charger(); } catch (x) { setErr(x instanceof Error ? x.message : "Inscription impossible."); } finally { setBusy(false); }
  };
  const desinscrire = async () => { setBusy(true); try { await api(`/salons/${id}/inscription`, { method: "DELETE" }); charger(); } finally { setBusy(false); } };
  const ici = `/salons/${id}/`;
  if (!etat || user === undefined) return <Loading />;
  if (etat.termine) return <p className="text-sm text-ink-mute">Ce salon est terminé.</p>;
  if (etat.organisateur) return <Link href={`/salons/${id}/direct/`} className="btn-sun w-full justify-center"><Presentation size={17} />Ouvrir la salle (présentateur)</Link>;
  if (!user) return (
    <div className="flex flex-col gap-2">
      <Link href={`/inscription/?suite=${encodeURIComponent(ici)}`} className="btn-sun w-full justify-center"><Ticket size={17} />Créer mon compte et m&apos;inscrire</Link>
      <Link href={`/connexion/?suite=${encodeURIComponent(ici)}`} className="btn-ghost w-full justify-center">J&apos;ai déjà un compte</Link>
      <p className="text-xs text-ink-mute">Compte Navigoal gratuit : tu reçois le lien, un rappel le matin et 15 minutes avant.</p>
    </div>
  );
  if (!["eleve", "etudiant", "parent"].includes(user.role)) return <p className="text-sm text-ink-mute">L&apos;inscription est réservée aux élèves, étudiants et parents.</p>;
  if (etat.inscription) return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 font-bold text-[#0b7a3d]"><Check size={18} />Tu es inscrit·e</p>
      <Link href={`/salons/${id}/direct/`} className="btn-sun w-full justify-center"><Presentation size={17} />Entrer dans la salle</Link>
      <a href={`/api/salons/${id}/agenda.ics`} className="btn-ghost w-full justify-center"><CalendarPlus size={16} />Ajouter à mon agenda</a>
      {etat.inscription.accordParent === "en_attente" && <p className="text-xs text-[#a55a00]">Accord de ton parent demandé pour que {ecole} puisse te recontacter.</p>}
      <label className="flex items-start gap-2 text-xs text-ink-soft"><input type="checkbox" checked={contact} onChange={(e) => setContact(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" /><span>{ecole} peut me recontacter (facultatif)</span></label>
      {contact !== etat.inscription.accordContact && <button type="button" disabled={busy} onClick={inscrire} className="text-left text-xs font-bold text-brand-600">Enregistrer ce choix</button>}
      <button type="button" disabled={busy} onClick={desinscrire} className="text-left text-xs font-bold text-ink-mute hover:text-[#b8213f]">Me désinscrire</button>
    </div>
  );
  if (etat.placesRestantes <= 0) return <p className="text-sm font-bold text-[#b8213f]">Ce salon est complet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {user.role !== "parent" && <label className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-soft"><input type="checkbox" checked={contact} onChange={(e) => setContact(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-brand-600" />
        <span>J&apos;accepte que <b className="text-ink">{ecole}</b> reçoive mes coordonnées pour me recontacter <span className="text-ink-mute">(facultatif ; l&apos;accord d&apos;un parent est demandé si tu as moins de 18 ans)</span></span></label>}
      <button type="button" disabled={busy} onClick={inscrire} className="btn-sun w-full justify-center"><Ticket size={17} />{busy ? "Un instant…" : "Je m'inscris"}</button>
      {err && <p className="text-xs font-bold text-[#b8213f]">{err}</p>}
    </div>
  );
}

type Salle = { id: string; titre: string; ecole: string; debut: string; dureeMin: number; presentateur: boolean } & ({ termine: true } | { termine: false; aVenir: true; ouvreLe: string } | { termine: false; aVenir?: undefined; url: string; jeton: string });
type Questions = { presentateur: boolean; questions: { id: string; texte: string; main: boolean; repondue: boolean; auteur: string; moi: boolean }[] };

/** Salle du salon : vidéo Daily (participants micro et caméra coupés), questions écrites et main levée. */
export function SalleSalon({ id }: { id: string }) {
  const [s, setS] = useState<Salle | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);
  const [q, setQ] = useState<Questions | null>(null);
  const [texte, setTexte] = useState("");
  const zone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api<Salle>(`/salons/${id}/direct`).then(setS).catch((e) => {
      // Pas connecté : connexion, puis retour dans la salle.
      if ((e as { status?: number })?.status === 401) { window.location.href = `/connexion/?suite=${encodeURIComponent(`/salons/${id}/direct/`)}`; return; }
      setErreur(e instanceof Error ? e.message : "Salon introuvable.");
    });
  }, [id, essai]);
  useEffect(() => { if (s && !s.termine && "aVenir" in s && s.aVenir) { const t = setTimeout(() => setEssai((n) => n + 1), Math.max(30000, Math.min(new Date(s.ouvreLe).getTime() - Date.now() + 1000, 2 ** 31 - 1))); return () => clearTimeout(t); } }, [s]);
  const lireQ = useCallback(() => { api<Questions>(`/salons/${id}/questions`).then(setQ).catch(() => {}); }, [id]);
  useEffect(() => { if (!s || s.termine || ("aVenir" in s && s.aVenir)) return; lireQ(); const t = setInterval(lireQ, 6000); return () => clearInterval(t); }, [s, lireQ]);
  useEffect(() => {
    if (!s || s.termine || !("url" in s) || !zone.current) return;
    let appel: { destroy: () => Promise<void> } | null = null, annule = false;
    (async () => {
      const Daily = (await import("@daily-co/daily-js")).default;
      if (annule || !zone.current) return;
      const f = Daily.createFrame(zone.current, { iframeStyle: { width: "100%", height: "100%", border: "0" }, showLeaveButton: true, showFullscreenButton: true, lang: "fr" });
      appel = f;
      f.on("error", (e) => setErreur(e?.errorMsg ?? "L'appel n'a pas pu s'ouvrir."));
      await f.join({ url: s.url, token: s.jeton });
    })().catch(() => setErreur("La salle n'a pas pu s'ouvrir. Vérifie ta connexion, puis recharge la page."));
    return () => { annule = true; void appel?.destroy(); };
  }, [s]);
  const envoyer = async (main = false) => {
    if (!main && texte.trim().length < 3) return;
    try { await api(`/salons/${id}/questions`, { body: { texte: main ? "" : texte, main } }); setTexte(""); lireQ(); } catch (e) { setErreur(e instanceof Error ? e.message : "Question non envoyée."); }
  };
  const repondue = async (qid: string) => { await api(`/salons/${id}/questions/${qid}/repondue`, { body: {} }).catch(() => {}); lireQ(); };
  if (erreur && !s) return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-extrabold">Salle indisponible</h1><p className="mt-2 text-sm text-ink-soft">{erreur}</p><Link href={`/salons/${id}/`} className="btn-ghost mt-4"><ArrowLeft size={16} />Page du salon</Link></div>;
  if (!s) return <Loading />;
  if (s.termine) return <div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-xl font-extrabold">Ce salon est terminé</h1><p className="mt-2 text-sm text-ink-soft">Merci d&apos;y avoir participé. L&apos;école peut te recontacter si tu l&apos;as accepté.</p><Link href={`/etablissements/`} className="btn-ghost mt-4">Voir les écoles</Link></div>;
  if ("aVenir" in s && s.aVenir) return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <Presentation size={30} className="text-brand-600" /><h1 className="text-xl font-extrabold">{s.titre}</h1>
      <p className="text-sm text-ink-soft">{s.ecole} · {new Date(s.debut).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
      <p className="text-sm text-ink-mute">La salle s&apos;ouvre à {new Date(s.ouvreLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Cette page se mettra à jour toute seule.</p>
      <Link href={`/salons/${id}/`} className="btn-ghost"><ArrowLeft size={16} />Page du salon</Link>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0b1533] lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 px-3 py-2 text-white">
          <Link href={`/salons/${id}/`} className="rounded-lg p-2 hover:bg-white/10" aria-label="Retour"><ArrowLeft size={18} /></Link>
          <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{s.titre} · {s.ecole}</div><div className="text-[11.5px] text-white/70"><span className="font-bold text-[#ff7a93]">● En direct</span> · {s.presentateur ? "vous présentez" : "micro et caméra coupés"} · non enregistré</div></div>
        </div>
        <div ref={zone} className="min-h-[50vh] flex-1" />
      </div>
      <aside className="flex max-h-[45vh] w-full flex-col gap-2 bg-white p-4 lg:max-h-none lg:w-[360px]">
        <b>Questions</b>
        <p className="text-xs text-ink-mute">{s.presentateur ? "Marquez une question comme répondue une fois traitée. Une main levée : donnez la parole dans la salle." : "Pose ta question : les présentateurs y répondent, et peuvent te donner la parole."}</p>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {(q?.questions ?? []).map((x) => (
            <div key={x.id} className={`rounded-xl p-2.5 text-[13px] ${x.repondue ? "bg-brand-50" : x.main ? "bg-sun-100" : "bg-[#f6f8fe]"}`}>
              <b>{x.auteur}</b>{x.main && <Hand size={13} className="ml-1 inline text-[#a55a00]" />}<span className="block text-ink-soft">{x.texte}</span>
              {x.repondue ? <span className="chip mt-1 bg-brand-600 text-white">Répondue</span> : q?.presentateur && <button type="button" onClick={() => repondue(x.id)} className="mt-1 text-xs font-bold text-brand-600">Marquer comme répondue</button>}
            </div>
          ))}
          {!q?.questions.length && <p className="text-xs text-ink-mute">Aucune question pour l&apos;instant.</p>}
        </div>
        {erreur && <p className="text-xs font-bold text-[#b8213f]">{erreur}</p>}
        {!s.presentateur && <div className="flex gap-2">
          <input className="input flex-1 py-2" maxLength={500} value={texte} onChange={(e) => setTexte(e.target.value)} onKeyDown={(e) => e.key === "Enter" && envoyer()} placeholder="Écrire une question…" aria-label="Question" />
          <button type="button" onClick={() => envoyer()} className="rounded-xl bg-brand-600 px-3 text-white" aria-label="Envoyer"><Send size={16} /></button>
          <button type="button" onClick={() => envoyer(true)} className="rounded-xl bg-sun-100 px-3 text-[#a55a00]" aria-label="Lever la main" title="Lever la main"><Hand size={16} /></button>
        </div>}
      </aside>
    </div>
  );
}
