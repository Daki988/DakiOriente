import type { ReactNode } from "react";

export function Marquee({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`group mask-fade-x overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
        {children}
        {/* Copie pour la boucle : cachée aux lecteurs d'écran et hors du parcours au clavier (inert). */}
        <div aria-hidden inert className="flex gap-4">{children}</div>
      </div>
    </div>
  );
}
