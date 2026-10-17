import { Badge, ConteneurTableau } from '@casier/design-system';

import { dateLongue } from '@/lib/format';
import { fcfa, libellesActes, libellesProfils, profils } from '@/lib/contenu';
import type { Tarif } from '@/lib/types';

/** PUB-09 : tableau des tarifs lus dans le référentiel ; les profils sans tarif apparaissent « à fixer ». */
export function TableauTarifs({ tarifs, acte }: { tarifs: Tarif[]; acte?: string }) {
  const lignes = acte ? tarifs.filter((t) => t.acte === acte) : tarifs;
  const aFixer = acte === 'BULLETIN_N3' || !acte
    ? profils.filter((p) => !tarifs.some((t) => t.acte === 'BULLETIN_N3' && t.profil === p.code)) : [];
  return (
    <ConteneurTableau libelle="Tarifs des actes du casier judiciaire">
      <table className="cj-tableau cj-tableau--empile">
        <caption className="cj-visuellement-masque">Tarifs des actes du casier judiciaire</caption>
        <thead>
          <tr><th scope="col">Acte</th><th scope="col">Pour qui</th><th scope="col" className="cj-nombre">Montant</th><th scope="col">En vigueur depuis</th></tr>
        </thead>
        <tbody>
          {lignes.map((t) => (
            <tr key={t.acte + t.profil}>
              <th scope="row">{libellesActes[t.acte] ?? t.acte}<span className="p-tableau__detail">{t.libelle}</span></th>
              <td data-label="Pour qui">{libellesProfils[t.profil] ?? t.profil}</td>
              <td className="cj-nombre" data-label="Montant">{fcfa(t.montantFcfa)}</td>
              <td data-label="En vigueur depuis"><span>{dateLongue(t.dateEffet)} {t.provisoire && <Badge ton="alerte">Provisoire</Badge>}</span></td>
            </tr>
          ))}
          {aFixer.map((p) => (
            <tr key={p.code}>
              <th scope="row">{libellesActes.BULLETIN_N3}</th>
              <td data-label="Pour qui">{libellesProfils[p.code]}</td>
              <td className="cj-nombre" data-label="Montant">À fixer</td>
              <td data-label="En vigueur depuis"><Badge ton="neutre">En attente du Ministère</Badge></td>
            </tr>
          ))}
          {lignes.length === 0 && aFixer.length === 0 && <tr><td colSpan={4}>Tarifs momentanément indisponibles.</td></tr>}
        </tbody>
      </table>
    </ConteneurTableau>
  );
}
