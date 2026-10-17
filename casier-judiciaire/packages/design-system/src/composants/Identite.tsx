import type { ReactNode } from 'react';
import { Icone } from './Icone';

/** Filet aux couleurs nationales (vert, jaune, bleu). */
export function FiletTricolore() {
  return (
    <div className="cj-filet" aria-hidden="true">
      <span /><span /><span />
    </div>
  );
}

/** ENV-01 : bandeau permanent de démonstration. */
export function BandeauDemo({ children }: { children?: ReactNode }) {
  return (
    <div className="cj-bandeau-demo" role="note">
      <div className="cj-conteneur">
        <Icone nom="triangle-alert" taille={18} />
        <p>
          {children ?? (
            <>
              <strong>Démonstration — service non officiel.</strong> N’y saisissez aucune donnée réelle.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Emblème neutre imposé en démonstration tant que l’usage des armoiries n’est pas autorisé (VIS-02). */
export function EmblemeNeutre({ taille = 50 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      <circle cx="28" cy="28" r="27" fill="#0F1D36" stroke="#FCD116" strokeWidth="2" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" transform="translate(14 14) scale(1.1667)">
        <path d="M12 3v18" /><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" />
        <path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M7 21h10" />
      </g>
    </svg>
  );
}

export type Embleme = 'officiel' | 'neutre';

/**
 * Bloc institutionnel (VIS-02) : emblème, « République gabonaise », devise, ministère.
 * Armoiries officielles en production uniquement, après autorisation du Ministère.
 */
export function BlocMarque({ embleme, inverse = false, srcArmoiries = '/emblemes/armoiries.svg', href }: {
  embleme: Embleme; inverse?: boolean; srcArmoiries?: string; href?: string;
}) {
  const contenu = (
    <>
      <span className="cj-bloc-marque__embleme">
        {embleme === 'officiel'
          ? <img src={srcArmoiries} alt="" width={52} height={50} />
          : <EmblemeNeutre />}
      </span>
      <span className="cj-bloc-marque__separateur" aria-hidden="true" />
      <span className="cj-bloc-marque__textes">
        <span className="cj-bloc-marque__republique">République gabonaise</span>
        <span className="cj-bloc-marque__devise">Union – Travail – Justice</span>
        <span className="cj-bloc-marque__ministere">Ministère de la Justice</span>
      </span>
    </>
  );
  const classes = 'cj-bloc-marque' + (inverse ? ' cj-bloc-marque--inverse' : '');
  return href
    // WCAG 2.5.3 : le nom accessible reprend le texte visible ; « Accueil » est ajouté pour les lecteurs d'écran.
    ? <a className={classes} href={href}><span className="cj-visuellement-masque">Accueil — </span>{contenu}</a>
    : <div className={classes}>{contenu}</div>;
}
