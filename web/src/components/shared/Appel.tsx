"use client";
// Appel audio ou vidéo (Daily Prebuilt) : plein écran, salle d'attente pour tester caméra et micro, aucun enregistrement.
// On entre avec un jeton nominatif demandé au serveur (participants du fil, équipe Navigoal, parents d'un élève du fil).
import { ArrowLeft, PhoneOff, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/Link";
import { Loading } from "@/components/app/kit";
import { api } from "@/lib/api";

type Infos = { id: string; conversationId: string; sujet: string; audioSeul: boolean; expire: string } & ({ termine: true } | { termine: false; url: string; jeton: string });

export function Appel({ id }: { id: string }) {
  const [infos, setInfos] = useState<Infos | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [quitte, setQuitte] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => { api<Infos>(`/appels/${id}`).then(setInfos).catch((e) => setErreur(e instanceof Error ? e.message : "Appel introuvable.")); }, [id]);

  useEffect(() => {
    if (!infos || infos.termine || quitte || !zone.current) return;
    let appel: { destroy: () => Promise<void> } | null = null;
    let annule = false;
    (async () => {
      const Daily = (await import("@daily-co/daily-js")).default;
      if (annule || !zone.current) return;
      const frame = Daily.createFrame(zone.current, { iframeStyle: { width: "100%", height: "100%", border: "0" }, showLeaveButton: true, showFullscreenButton: true, lang: "fr" });
      appel = frame;
      frame.on("left-meeting", () => { setQuitte(true); void frame.destroy(); });
      frame.on("error", (e) => setErreur(e?.errorMsg ?? "L'appel a été interrompu."));
      await frame.join({ url: infos.url, token: infos.jeton });
    })().catch(() => setErreur("Impossible d'ouvrir l'appel sur cet appareil. Vérifie ta connexion et l'accès à la caméra et au micro."));
    return () => { annule = true; void appel?.destroy(); };
  }, [infos, quitte]);

  const retour = infos ? `/messages/${infos.conversationId}/` : "/messages/";
  if (erreur || quitte || infos?.termine) return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#eef1f8] text-ink-soft">{quitte || infos?.termine ? <PhoneOff size={24} /> : <Video size={24} />}</span>
      <h1 className="text-xl font-extrabold">{erreur ? "Appel indisponible" : quitte ? "Tu as quitté l'appel" : "Cet appel est terminé"}</h1>
      <p className="text-sm text-ink-soft">{erreur ?? (quitte ? "Tu peux le rejoindre à nouveau tant qu'il est ouvert." : "Demande un nouvel appel dans la messagerie si besoin.")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {quitte && <button type="button" onClick={() => setQuitte(false)} className="btn-primary"><Video size={16} />Rejoindre à nouveau</button>}
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
