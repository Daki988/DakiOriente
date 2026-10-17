'use client';

import { useActionState } from 'react';
import { Alerte, Champ, ChampSelection, Icone, ZoneTexte, classesBouton } from '@casier/design-system';

import { reclamerAction, type EtatReclamation } from '@/app/contact/actions';

/** Formulaire de réclamation (PUB-12) ; fonctionne avant le chargement du JavaScript (PUB-18). */
export function FormulaireReclamation({ objetInitial = '' }: { objetInitial?: string }) {
  const [etat, action, enCours] = useActionState<EtatReclamation, FormData>(reclamerAction, { valeurs: { objet: objetInitial } });
  if (etat.reference) {
    return (
      <div className="p-parcours__panneau p-confirmation" role="status">
        <span className="p-confirmation__pictogramme"><Icone nom="circle-check" taille={40} /></span>
        <h2>Réclamation enregistrée</h2>
        <p>Conservez sa référence : <strong>{etat.reference}</strong>. Vous recevrez la réponse par SMS ou e-mail.</p>
        {etat.demo && <Alerte type="info">Démonstration : la réclamation n’est ni conservée ni transmise.</Alerte>}
      </div>
    );
  }
  const e = etat.erreurs ?? {};
  const val = etat.valeurs;
  return (
    <form action={action} className="p-parcours__panneau" noValidate>
      <h2>Faire une réclamation</h2>
      {etat.message && <Alerte type="erreur" titre="La réclamation n’a pas été envoyée">{etat.message}</Alerte>}
      {Object.keys(e).length > 0 && <Alerte type="erreur" titre="Des informations sont à corriger">Les champs concernés sont signalés ci-dessous.</Alerte>}
      <div className="p-parcours__champs p-parcours__champs--2">
        <ChampSelection id="objet" libelle="Objet" requis defaultValue={val.objet ?? ''} erreur={e.objet}>
          <option value="" disabled>Choisissez</option>
          <option value="SUIVI">Suivi d’une demande</option>
          <option value="PAIEMENT">Paiement ou remboursement</option>
          <option value="CONTENU_CASIER">Contestation du contenu du casier</option>
          <option value="BULLETIN">Bulletin reçu (erreur, révocation)</option>
          <option value="AUTRE">Autre question</option>
        </ChampSelection>
        <Champ id="numeroDossier" libelle="Numéro de dossier" aide="Facultatif. Ex. : CJ-2026-000123" defaultValue={val.numeroDossier} erreur={e.numeroDossier} autoComplete="off" />
        <Champ id="nom" libelle="Nom et prénoms" autoComplete="name" requis defaultValue={val.nom} erreur={e.nom} />
        <Champ id="telephone" libelle="Téléphone" type="tel" autoComplete="tel" aide="Téléphone ou e-mail" defaultValue={val.telephone} erreur={e.telephone} />
        <Champ id="email" libelle="Adresse e-mail" type="email" autoComplete="email" aide="Facultatif si vous indiquez un téléphone" defaultValue={val.email} erreur={e.email} />
      </div>
      <ZoneTexte id="message" libelle="Votre message" requis maxLength={3000} defaultValue={val.message} erreur={e.message}
        aide="N’indiquez ni mot de passe ni code reçu par SMS." />
      <div className="p-parcours__navigation">
        <span />
        <button type="submit" className={classesBouton()} disabled={enCours}>
          <Icone nom="mail" taille={20} /><span>{enCours ? 'Envoi…' : 'Envoyer ma réclamation'}</span>
        </button>
      </div>
    </form>
  );
}
