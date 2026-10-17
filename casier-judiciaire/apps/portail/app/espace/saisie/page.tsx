import { Alerte, Champ, ChampSelection, Icone, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { exigerSession } from '@/lib/espaces';
import { saisirCondamnation } from '../actions';

/** REG-01, REG-02 : saisie d'une condamnation par l'agent du greffe ; inscription après validation à quatre yeux (HAB-02). */
export default async function Saisie() {
  const s = await exigerSession('R06');
  return (
    <>
      <TitreEspace titre="Saisir une condamnation" chapo="La décision n’est inscrite au casier qu’après validation par le greffier en chef." />
      <MessageAction session={s} />
      {s.demo && <Alerte type="info" titre="Démonstration">Utilisez uniquement des identités fictives.</Alerte>}
      <form action={saisirCondamnation} className="cj-pile">
        <section className="cj-panneau" aria-labelledby="t-personne">
          <h2 id="t-personne">Personne condamnée</h2>
          <div className="cj-formulaire-ligne">
            <Champ id="nom" libelle="Nom" requis maxLength={100} autoComplete="off" />
            <Champ id="prenoms" libelle="Prénoms" requis maxLength={150} autoComplete="off" />
            <Champ id="dateNaissance" libelle="Date de naissance" type="date" requis />
            <Champ id="lieuNaissance" libelle="Lieu de naissance" requis maxLength={100} />
            <Champ id="nomPere" libelle="Nom du père" maxLength={200} />
            <Champ id="nomMere" libelle="Nom de la mère" maxLength={200} />
            <Champ id="numeroCnie" libelle="Numéro de CNIE" maxLength={40} />
          </div>
        </section>
        <section className="cj-panneau" aria-labelledby="t-decision">
          <h2 id="t-decision">Décision</h2>
          <div className="cj-formulaire-ligne">
            {!s.juridiction && <Champ id="juridiction" libelle="Juridiction" requis maxLength={40} />}
            <Champ id="numeroDecision" libelle="Numéro de la décision" requis maxLength={60} />
            <Champ id="dateDecision" libelle="Date de la décision" type="date" requis />
            <Champ id="dateDefinitive" libelle="Date où elle est devenue définitive" type="date" />
            <ChampSelection id="qualification" libelle="Qualification" requis defaultValue="DELIT">
              <option value="CRIME">Crime</option><option value="DELIT">Délit</option><option value="CONTRAVENTION">Contravention</option>
            </ChampSelection>
          </div>
          <Champ id="infraction" libelle="Infraction" requis maxLength={300} />
          <div className="cj-formulaire-ligne">
            <ChampSelection id="nature" libelle="Peine" requis defaultValue="EMPRISONNEMENT">
              <option value="EMPRISONNEMENT">Emprisonnement</option><option value="AMENDE">Amende</option>
            </ChampSelection>
            <Champ id="dureeMois" libelle="Durée (mois)" type="number" min={1} max={1200} inputMode="numeric" />
            <Champ id="montantFcfa" libelle="Montant (FCFA)" type="number" min={1} inputMode="numeric" />
            <ChampSelection id="sursis" libelle="Sursis" requis defaultValue="AUCUN">
              <option value="AUCUN">Aucun</option><option value="PARTIEL">Partiel</option><option value="TOTAL">Total</option>
            </ChampSelection>
          </div>
          <Champ id="referencePieceSource" libelle="Référence de la pièce source" requis maxLength={120}
            aide="Extrait de jugement ou fiche de la juridiction, conservé au greffe." />
        </section>
        <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
          <Icone nom="check" taille={20} /><span>Enregistrer pour validation</span>
        </button>
      </form>
    </>
  );
}
