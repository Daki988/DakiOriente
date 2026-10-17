import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icone, type NomIcone } from './Icone';

export type VarianteBouton = 'primaire' | 'secondaire' | 'tertiaire' | 'inverse';

/** Classes d'un bouton, réutilisables sur un lien de routeur (Next.js `<Link>`). */
export function classesBouton({ variante = 'primaire', taille = 'm', pleineLargeur = false }: {
  variante?: VarianteBouton; taille?: 'm' | 'l'; pleineLargeur?: boolean;
} = {}) {
  return ['cj-bouton', `cj-bouton--${variante}`, taille === 'l' && 'cj-bouton--l', pleineLargeur && 'cj-bouton--pleine-largeur']
    .filter(Boolean).join(' ');
}

type Options = {
  variante?: VarianteBouton; taille?: 'm' | 'l'; pleineLargeur?: boolean;
  icone?: NomIcone; iconeApres?: NomIcone; children: ReactNode;
};

function Contenu({ icone, iconeApres, children }: Pick<Options, 'icone' | 'iconeApres' | 'children'>) {
  return (
    <>
      {icone && <Icone nom={icone} taille={20} />}
      <span>{children}</span>
      {iconeApres && <Icone nom={iconeApres} taille={20} />}
    </>
  );
}

export function Bouton({ variante, taille, pleineLargeur, icone, iconeApres, children, className, type = 'button', ...reste }:
  Options & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={[classesBouton({ variante, taille, pleineLargeur }), className].filter(Boolean).join(' ')} {...reste}>
      <Contenu icone={icone} iconeApres={iconeApres}>{children}</Contenu>
    </button>
  );
}

export function LienBouton({ variante, taille, pleineLargeur, icone, iconeApres, children, className, ...reste }:
  Options & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={[classesBouton({ variante, taille, pleineLargeur }), className].filter(Boolean).join(' ')} {...reste}>
      <Contenu icone={icone} iconeApres={iconeApres}>{children}</Contenu>
    </a>
  );
}

export { Contenu as ContenuBouton };
