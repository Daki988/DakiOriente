"use client";
import { useEffect, useState } from "react";
import { Counter } from "@/components/motion/Counter";
import { PROFILE_KEY } from "./OrientationTest";

/** Compatibilité métier ↔ profil RIASEC enregistré (test d'orientation). */
export function CompatCard({ riasec, niveau }: { riasec: string[]; niveau: string }) {
  const [top, setTop] = useState<string[] | null>(null);
  useEffect(() => { try { setTop(JSON.parse(localStorage.getItem(PROFILE_KEY) || "null")?.top ?? null); } catch { /* ignore */ } }, []);
  const score = top ? Math.round(55 + (riasec.filter((c) => top.includes(c)).length / Math.max(1, riasec.length)) * 40) : null;
  return (
    <div className="card flex shrink-0 flex-col gap-1.5 rounded-[18px] px-5 py-4">
      <span className="text-xs font-bold text-ink-mute">COMPATIBILITÉ AVEC TON PROFIL</span>
      {score !== null ? <b className="text-[34px] font-extrabold text-[#0f8a46]"><Counter to={score} suffix=" %" /></b> : <a href="/orientation" className="text-sm font-bold text-brand-600">Passe le test pour la connaître →</a>}
      <span className="text-xs text-ink-mute">Profil {riasec.join("·")} · {niveau}</span>
    </div>
  );
}
