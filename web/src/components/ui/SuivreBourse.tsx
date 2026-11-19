"use client";
import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "@/components/ui/Link";
import { api } from "@/lib/api";

/** Bouton « Suivre cette bourse » : alertes à l'ouverture et avant la date limite (compte élève, étudiant ou parent). */
export function SuivreBourse({ id }: { id: string }) {
  const [etat, setEtat] = useState<"?" | "anonyme" | "non" | "oui">("?");
  useEffect(() => {
    api<{ suivies: string[] }>("/moi/bourses/suivies").then((r) => setEtat(r.suivies.includes(id) ? "oui" : "non")).catch(() => setEtat("anonyme"));
  }, [id]);
  if (etat === "?") return null;
  if (etat === "anonyme") return <Link href={`/connexion/?suite=/bourses/${id}/`} className="btn-ghost min-h-[44px] px-4 text-[14px]"><Bell size={16} />Me connecter pour suivre cette bourse</Link>;
  const basculer = async () => {
    const oui = etat !== "oui";
    try { await api(`/moi/bourses/${id}/suivre`, { method: oui ? "POST" : "DELETE" }); setEtat(oui ? "oui" : "non"); } catch { /* compte non éligible : rien */ }
  };
  return <button type="button" onClick={basculer} aria-pressed={etat === "oui"} className={`${etat === "oui" ? "btn-primary" : "btn-ghost"} min-h-[44px] px-4 text-[14px]`}>{etat === "oui" ? <BellRing size={16} /> : <Bell size={16} />}{etat === "oui" ? "Bourse suivie : alertes activées" : "Suivre cette bourse"}</button>;
}
