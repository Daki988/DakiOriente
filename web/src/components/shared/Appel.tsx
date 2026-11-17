"use client";
// Appel audio ou vidéo (Daily Prebuilt) : plein écran, salle d'attente pour tester caméra et micro, aucun enregistrement.
// On entre avec un jeton nominatif demandé au serveur (participants du fil, équipe Navigoal, parents d'un élève du fil).
import { ArrowLeft, PhoneOff, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { Loading } from "@/components/app/kit";
import { api } from "@/lib/api";

// Raison donnée par Daily, traduite quand on la reconnaît (le détail d'origine reste affiché pour le dépannage).
function expliquer(brut: string) {
  const t = brut.toLowerCase();
  if (/not ?allowed|permission|denied/.test(t)) return "La caméra ou le micro a été refusé. Autorise-les dans les réglages du navigateur, puis réessaie.";
  if (/does not exist|no room|not found/.test(t)) return "Cette salle d'appel n'existe pas ou plus. Demande un nouvel appel dans la conversation.";
  if (/token|unauthori|not allowed to join|eject/.test(t)) return "L'accès à cet appel a été refusé ou a expiré. Recharge la page pour réessayer.";
  if (/expired|exp\b/.test(t)) return "Cet appel est terminé. Demande un nouvel appel dans la conversation.";
  if (/unsupported|not supported/.test(t)) return "Ce navigateur ne permet pas l'appel. Essaie avec Chrome ou Safari à jour.";
  return "L'appel n'a pas pu s'ouvrir. Vérifie ta connexion, puis réessaie.";
}

type Infos = { id: string; conversationId: string; sujet: string; audioSeul: boolean; expire: string } & ({ termine: true } | { termine: false; url: string; jeton: string });

export function Appel({ id }: { id: string }) {
  const [infos, setInfos] = useState<Infos | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [quitte, setQuitte] = useState(false);
  const [essai, setEssai] = useState(0);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => { api<Infos>(`/appels/${id}`).then(setInfos).catch((e) => setErreur(e instanceof Error ? e.message : "Appel introuvable.")); }, [id]);

  useEffect(() => {
    if (!infos || infos.termine || quitte || erreur || !zone.current) return;
    let appel: { destroy: () => Promise<void> } | null = null;
    let annule = false;
    let raison = "";
    const echec = (brut: string) => { console.error("Appel Daily :", brut); setDetail(brut.slice(0, 200)); setErreur(expliquer(brut)); };
    (async () => {
      const Daily = (await import("@daily-co/daily-js")).default;
      if (annule || !zone.current) return;
      const frame = Daily.createFrame(zone.current, { iframeStyle: { width: "100%", height: "100%", border: "0" }, showLeaveButton: true, showFullscreenButton: true, lang: "fr" });
      appel = frame;
      frame.on("left-meeting", () => { setQuitte(true); void frame.destroy(); });
      frame.on("error", (e) => { raison = e?.errorMsg ?? (e?.error ? JSON.stringify(e.error) : "erreur inconnue"); echec(raison); });
      await frame.join({ url: infos.url, token: infos.jeton });
    })().catch((e) => echec(raison || (e instanceof Error ? `${e.name} : ${e.message}` : String(e))));
    return () => { annule = true; void appel?.destroy(); };
  }, [infos, quitte, essai, erreur]);

  const retour = infos ? `/messages/${infos.conversationId}/` : "/messages/";
  if (erreur || quitte || infos?.termine) return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eef1f8] text-ink-soft">{quitte || infos?.termine ? <PhoneOff size={24} /> : <Video size={24} />}</span>
      <h1 className="text-xl font-extrabold">{erreur ? "Appel indisponible" : quitte ? "Tu as quitté l'appel" : "Cet appel est terminé"}</h1>
      <p className="text-sm text-ink-soft">{erreur ?? (quitte ? "Tu peux le rejoindre à nouveau tant qu'il est ouvert." : "Demande un nouvel appel dans la messagerie si besoin.")}</p>
      {detail && <p className="break-all text-[11px] text-ink-mute">Détail technique : {detail}</p>}
      <div className="flex flex-wrap justify-center gap-2">
        {(quitte || erreur) && !infos?.termine && infos && <button type="button" onClick={() => { setErreur(null); setDetail(null); setQuitte(false); setEssai((n) => n + 1); }} className="btn-primary"><Video size={16} />Rejoindre à nouveau</button>}
        <Link href={retour} className="btn-ghost"><ArrowLeft size={16} />Retour à la conversation</Link>
      </div>
    </div>
  );
  if (!infos) return <Loading />;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0b1533]">
      <div className="flex items-center gap-3 px-3 py-2 text-white">
        <Link href={retour} className="rounded-lg p-2 hover:bg-white/10" aria-label="Retour à la conversation"><ArrowLeft size={18} /></Link>
        <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-bold">{infos.sujet}</div><div className="text-[11.5px] text-white/70">{infos.audioSeul ? "Appel audio" : "Appel vidéo"} · non enregistré · Navigoal</div></div>
      </div>
      <div ref={zone} className="min-h-0 flex-1" />
    </div>
  );
}
