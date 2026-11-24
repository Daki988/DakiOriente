import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variante = "primary" | "secondary" | "accent";

export function Bouton({ variante = "primary", bloc, className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; bloc?: boolean }) {
  return <button type="button" className={`btn btn--${variante}${bloc ? " btn--bloc" : ""} ${className}`} {...p} />;
}

export function Badge({ children, attente }: { children: ReactNode; attente?: boolean }) {
  return <span className={`badge${attente ? " badge--attente" : ""}`}>{children}</span>;
}

export function ActionRapide({ glyphe, libelle, onClick, bientot }: { glyphe: string; libelle: string; onClick?: () => void; bientot?: boolean }) {
  return (
    <button type="button" className="qa" onClick={onClick} disabled={bientot} aria-disabled={bientot}>
      <span className="qa__icone" aria-hidden>{glyphe}</span>
      <span>{libelle}</span>
      {bientot && <span className="qa__bientot">Bientôt</span>}
    </button>
  );
}

export function BarreNavigation() {
  const items = ["Accueil", "Chercher", "Mes adresses", "Profil"];
  return (
    <nav className="nav" aria-label="Navigation principale">
      {items.map((l, i) => (
        <button key={l} type="button" className="nav__item" aria-current={i === 0 ? "page" : undefined} disabled={i !== 0}>
          {l}
        </button>
      ))}
    </nav>
  );
}
