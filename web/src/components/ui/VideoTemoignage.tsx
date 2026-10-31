"use client";
import { useState } from "react";
import { Info, Play } from "lucide-react";
import { plateforme } from "@/lib/plateforme-video";

// Vidéo d'un témoignage lue sur Navigoal (maquettes « temoignages », écran 4) : lecteur officiel de la plateforme,
// chargé seulement au clic (aucune connexion ni cookie tiers avant), avec la mention de non-propriété et la source.

export function VideoTemoignage({ video, titre, media, couleur }: { video: string; titre: string; media: string; couleur: string }) {
  const [lue, setLue] = useState(false);
  const p = plateforme(video);
  const src = `${video}${video.includes("?") ? "&" : "?"}autoplay=1`;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video overflow-hidden rounded-[14px] bg-black">
        {lue ? (
          <iframe src={src} title={titre} className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        ) : (
          <button type="button" onClick={() => setLue(true)} aria-label={`Lire la vidéo : ${titre}`} className="group absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center text-white" style={{ background: `linear-gradient(135deg, ${couleur}, #0b1533)` }}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition group-hover:scale-110"><Play size={28} style={{ color: couleur }} className="ml-1" fill={couleur} /></span>
            <b className="text-sm">Lire la vidéo ici</b>
            <span className="text-[11.5px] opacity-80">Lecteur officiel {p} · chargé seulement si vous cliquez</span>
          </button>
        )}
      </div>
      <p className="flex gap-1.5 rounded-[10px] bg-[#f6f8fe] px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-mute"><Info size={13} className="mt-0.5 shrink-0" /><span>Vidéo diffusée avec le lecteur officiel de {p}. Navigoal n&apos;en est pas propriétaire : tous les droits appartiennent à son auteur. Source officielle : <b className="text-brand-600">{media}</b>.</span></p>
    </div>
  );
}
