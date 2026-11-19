"use client";
import { Flag } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";

/** Lien discret « Signaler » sous un avis : motif envoyé à l'équipe (compte connecté requis). */
export function SignalerAvis({ id }: { id: string }) {
  const [etat, setEtat] = useState<"repos" | "saisie" | "envoye" | "erreur">("repos");
  const [motif, setMotif] = useState("");
  const [msg, setMsg] = useState("");
  const envoyer = async () => {
    try { await api(`/avis-ecoles/${id}/signaler`, { method: "POST", body: { motif } }); setEtat("envoye"); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Erreur."); setEtat("erreur"); }
  };
  if (etat === "envoye") return <span className="text-xs text-ink-mute">Signalement envoyé à l&apos;équipe, merci.</span>;
  if (etat === "repos") return <button type="button" onClick={() => setEtat("saisie")} className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-[#b8213f]"><Flag size={12} />Signaler</button>;
  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={1000} placeholder="Pourquoi cet avis pose-t-il problème ? (propos injurieux, faux, données personnelles…)" className="input min-h-[80px] text-sm" aria-label="Motif du signalement" />
      {etat === "erreur" && <span className="text-xs text-[#b8213f]">{msg.includes("Connexion") || msg.includes("connect") ? "Connectez-vous pour signaler un avis." : msg}</span>}
      <div className="flex gap-2"><button type="button" onClick={envoyer} className="btn-ghost min-h-[40px] px-3 text-[13px]">Envoyer</button><button type="button" onClick={() => setEtat("repos")} className="text-[13px] text-ink-mute">Annuler</button></div>
    </div>
  );
}
