import type { ReactNode } from 'react';

/** Titre d'une page d'espace, avec un chapeau facultatif. */
export function TitreEspace({ titre, chapo, actions }: { titre: string; chapo?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="cj-pile">
      <h1 className="cj-espace__titre">{titre}</h1>
      {chapo && <p className="p-chapo" style={{ margin: 0 }}>{chapo}</p>}
      {actions && <div className="cj-actions">{actions}</div>}
    </header>
  );
}
