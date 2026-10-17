import { ICONES, type NomIcone } from '../icones';

export type { NomIcone };

/** Pictogramme Lucide (ISC). Décoratif par défaut ; fournir {@link titre} s'il porte un sens seul. */
export function Icone({ nom, taille = 24, titre, className, epaisseur = 2 }: {
  nom: NomIcone; taille?: number; titre?: string; className?: string; epaisseur?: number;
}) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titre ? 'img' : undefined}
      aria-hidden={titre ? undefined : true}
      aria-label={titre}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONES[nom] }}
    />
  );
}
