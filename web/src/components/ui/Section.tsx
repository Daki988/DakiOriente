import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

export function SectionTitle({ eyebrow, title, action, center = false, sub }: { eyebrow: string; title: ReactNode; action?: ReactNode; center?: boolean; sub?: ReactNode }) {
  return (
    <Reveal className={`flex flex-col gap-4 ${center ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"}`}>
      <div className={`flex flex-col gap-3 ${center ? "items-center" : ""}`}>
        <span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-brand-600">{eyebrow}</span>
        <h2 className="h-section">{title}</h2>
        {sub && <p className="max-w-2xl text-ink-mute">{sub}</p>}
      </div>
      {action}
    </Reveal>
  );
}
