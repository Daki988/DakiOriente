import type { ReactNode } from "react";

export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`group mask-fade-x overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
        {children}
        <div aria-hidden className="flex gap-4">{children}</div>
      </div>
    </div>
  );
}
