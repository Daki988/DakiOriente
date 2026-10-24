import { Alerte, Champ, ChampSelection, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { exigerSession, nomEtablissement } from '@/lib/donnees';
import { TITRES } from '@/lib/libelles';
import { ecrouer } from '../actions';

/** Mise sous écrou : aucun écrou sans titre de détention (mandat de dépôt, jugement, arrêt ou contrainte). */
export default async function NouvelEcrou() {
  const s = await exigerSession('R16');
  return (
    <>
      <TitreEspace titre="Nouvel écrou" chapo={`${nomEtablissement(s.juridiction ?? '')} — le numéro d’écrou est attribué automatiquement.`} />
      <MessageAction session={s} />
      <Alerte type="info" titre="Aucun écrou sans titre">Vérifiez l’original du titre de détention avant l’enregistrement. Les champs marqués d’un astérisque sont obligatoires.</Alerte>
      <form action={ecrouer} className="cj-pile">
        <section className="p-encadre cj-pile" aria-labelledby="bloc-identite">
          <h2 id="bloc-identite" className="p-titre-encadre">Identité</h2>
          <div className="cj-grille cj-grille--2">
            <Champ id="nom" name="nom" libelle="Nom" requis autoComplete="off" />
            <Champ id="prenoms" name="prenoms" libelle="Prénoms" requis autoComplete="off" />
            <Champ id="dateNaissance" name="dateNaissance" type="date" libelle="Date de naissance" requis />
            <Champ id="lieuNaissance" name="lieuNaissance" libelle="Lieu de naissance" requis />
            <Champ id="nationalite" name="nationalite" libelle="Nationalité" defaultValue="Gabonaise" />
            <Champ id="quartier" name="quartier" libelle="Quartier d’affectation" />
          </div>
        </section>
        <section className="p-encadre cj-pile" aria-labelledby="bloc-titre">
          <h2 id="bloc-titre" className="p-titre-encadre">Titre de détention</h2>
          <div className="cj-grille cj-grille--2">
            <ChampSelection id="titreDetention" name="titreDetention" libelle="Titre" requis defaultValue="MANDAT_DEPOT">
              {Object.entries(TITRES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </ChampSelection>
            <Champ id="referenceTitre" name="referenceTitre" libelle="Référence du titre" requis />
            <Champ id="juridiction" name="juridiction" libelle="Juridiction ou magistrat mandant" requis defaultValue="Tribunal de première instance de Libreville" />
            <Champ id="infraction" name="infraction" libelle="Infraction" requis />
            <Champ id="dateEcrou" name="dateEcrou" type="date" libelle="Date d’écrou" aide="Par défaut : aujourd’hui" />
          </div>
        </section>
        <section className="p-encadre cj-pile" aria-labelledby="bloc-peine">
          <h2 id="bloc-peine" className="p-titre-encadre">Peine (si condamnation)</h2>
          <div className="cj-grille cj-grille--2">
            <Champ id="dureePeineMois" name="dureePeineMois" type="number" min={1} max={600} libelle="Durée de la peine (mois)" aide="Obligatoire pour un jugement, un arrêt ou une contrainte" />
            <Champ id="dateDebutPeine" name="dateDebutPeine" type="date" libelle="Début de peine" aide="Par défaut : date d’écrou" />
          </div>
        </section>
        <button type="submit" className={classesBouton({ taille: 'l' })} style={{ alignSelf: 'flex-start' }}>Enregistrer l’écrou</button>
      </form>
    </>
  );
}
