"use client";
import { animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { fmt } from "@/lib/data";

/** Nombre qui s'anime de l'ancienne à la nouvelle valeur (recalculs en direct). */
export function AnimatedNumber({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const c = animate(prev.current, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => (node.textContent = fmt(v)) });
    prev.current = value;
    return () => c.stop();
  }, [value, duration]);
  return <span ref={ref}>{fmt(value)}</span>;
}
