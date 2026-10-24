import Link from 'next/link';
import { Alerte, Badge, CaseACocher, Champ, ConteneurTableau, Icone, classesBouton } from '@casier/design-system';

import { TitreEspace } from '@/components/TitreEspace';
import { donnees, exigerSession, nomEtablissement } from '@/lib/donnees';
import { dateLongue } from '@/lib/format';
import { STATUTS_DETENU } from '@/lib/libelles';

/** Registre d'écrou : recherche par nom, prénom ou numéro d'écrou, dans le périmètre de l'agent. */
export default async function Registre({ searchParams }: { searchParams: Promise<{ q?: string; liberes?: string }> }) {
  const s = await exigerSession();
  const { q = '', liberes } = await searchParams;
  const recherche = q.slice(0, 80);
  const liste = await donnees.registre(s, recherche, liberes === '1');
  const national = s.roles.includes('R18');
  return (
    <>
      <TitreEspace titre="Registre d’écrou" chapo="Personnes écrouées dans votre périmètre. Aucune fiche n’est supprimée : la libération lève l’écrou."
        actions={s.roles.includes('R16') ? <Link href="/espace/ecrou" className={classesBouton()}><Icone nom="plus" taille={18} /><span>Nouvel écrou</span></Link> : undefined} />
      <form method="get" className="p-encadre cj-pile" role="search" aria-label="Rechercher dans le registre">
        <Champ id="q" name="q" libelle="Nom, prénom ou numéro d’écrou" defaultValue={recherche} autoComplete="off" />
        <CaseACocher id="liberes" name="liberes" value="1" libelle="Inclure les personnes libérées" defaultChecked={liberes === '1'} />
        <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>
          <Icone nom="search" taille={18} /><span>Rechercher</span>
        </button>
      </form>
      {liste.length === 0
        ? <Alerte type="info" titre="Aucun résultat">Aucune personne ne correspond à votre recherche.</Alerte>
        : (
          <ConteneurTableau libelle="Personnes écrouées">
            <table className="cj-tableau cj-tableau--empile">
              <caption>{liste.length} personne{liste.length > 1 ? 's' : ''}</caption>
              <thead><tr><th>Nom</th><th>Écrou</th>{national && <th>Établissement</th>}<th>Statut</th><th>Libération prévue</th></tr></thead>
              <tbody>
                {liste.map((d) => (
                  <tr key={d.id}>
                    <th scope="row"><Link href={`/espace/detenus/${d.id}`}>{d.nom} {d.prenoms}</Link></th>
                    <td data-label="Écrou"><span className="p-code">{d.numeroEcrou}</span></td>
                    {national && <td data-label="Établissement">{nomEtablissement(d.etablissement)}</td>}
                    <td data-label="Statut"><Badge ton={STATUTS_DETENU[d.statut].ton}>{STATUTS_DETENU[d.statut].libelle}</Badge></td>
                    <td data-label="Libération prévue">{d.statut === 'LIBERE' ? `Libéré le ${dateLongue(d.dateLiberation)}` : dateLongue(d.dateLiberationPrevue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConteneurTableau>
        )}
    </>
  );
}
