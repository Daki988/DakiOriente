"use client";
import { useEffect, useState } from "react";
import { getOpenStatus, type OpenStatus as S } from "@/lib/hours";
import type { DayHours } from "@/lib/content";

/** Indicateur ouvert/fermé calculé à l'heure de Libreville (rafraîchi chaque minute). */
export function OpenStatus({ hours, className = "" }: { hours: DayHours[]; className?: string }) {
  const [status, setStatus] = useState<S | null>(null);
  useEffect(() => {
    const tick = () => setStatus(getOpenStatus(hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  return (
    <span
      className={`inline-flex min-h-8 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 text-xs font-medium backdrop-blur ${className}`}
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${status?.open ? "bg-accent pulse-dot" : status ? "bg-red-400" : "bg-white/30"}`}
      />
      {status?.label ?? "Horaires"}
    </span>
  );
}
