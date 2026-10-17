import type { ReactNode } from 'react';
import { Icone, type NomIcone } from './Icone';

export type LienEspace = { href: string; libelle: string; icone: NomIcone; compteur?: number };

/**
 * Navigation latérale des espaces connectés (DSH) : colonne sur ordinateur, bandeau défilant sur téléphone.
 * Le lien de la page courante porte aria-current (WCAG 2.4.8).
 */
export function NavEspace({ liens, courant, libelle = 'Navigation de l’espace' }: { liens: LienEspace[]; courant: string; libelle?: string }) {
  return (
    <nav className="cj-nav-espace" aria-label={libelle}>
      <ul>
        {liens.map((l) => {
          const actif = l.href === courant || (l.href !== '/espace' && courant.startsWith(`${l.href}/`));
          return (
            <li key={l.href}>
              <a href={l.href} aria-current={actif ? 'page' : undefined}>
                <Icone nom={l.icone} taille={20} />
                <span>{l.libelle}</span>
                {l.compteur ? <span className="cj-nav-espace__compteur">{l.compteur}<span className="cj-visuellement-masque"> en attente</span></span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Identité de la personne connectée, avec le profil et l'action de déconnexion. */
export function CarteUtilisateur({ nom, profil, action }: { nom: string; profil: string; action?: ReactNode }) {
  return (
    <div className="cj-carte-utilisateur">
      <span className="cj-carte-utilisateur__initiales" aria-hidden="true">
        {nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase()}
      </span>
      <span className="cj-carte-utilisateur__textes">
        <strong>{nom}</strong>
        <small>{profil}</small>
      </span>
      {action}
    </div>
  );
}

/** Ligne de description (libellé / valeur) pour les fiches de dossier. */
export function ListeDescription({ elements }: { elements: { terme: ReactNode; valeur: ReactNode }[] }) {
  return (
    <dl className="cj-description">
      {elements.map((e, i) => (
        <div key={i}><dt>{e.terme}</dt><dd>{e.valeur}</dd></div>
      ))}
    </dl>
  );
}
