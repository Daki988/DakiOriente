'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Alerte, CaseACocher, Champ, ChampDate, ChampSelection, ChoixCarte, Icone, IndicateurEtapes, ListeDescription, ZoneTexte, classesBouton,
} from '@casier/design-system';

import { envoyerPreplainte, type EtatPreplainte } from '@/app/pre-plainte/actions';
import { fcfa } from '@/lib/contenu';
import { dateLongue } from '@/lib/format';
import { NATURES_PREPLAINTE, SERVICES_PREPLAINTE, libelleNature } from '@/lib/preplainte';
import { normaliserDate } from '@/lib/validation';
import type { NaturePreplainte } from '@/lib/types';

const ETAPES = ['Les faits en bref', 'Ce qui s’est passé', 'Vos coordonnées', 'Rendez-vous et envoi'];

type Donnees = {
  nature: NaturePreplainte | ''; auteurConnu: boolean | null; dateFaits: string; heureFaits: string; ville: string; lieu: string;
  description: string; biens: string; prejudiceFcfa: string; auteurInfos: string;
  declarant: { nom: string; prenoms: string; dateNaissance: string; telephone: string; email: string; adresse: string; entreprise: string };
  pourEntreprise: boolean; service: string; attestation: boolean;
};
const VIDE: Donnees = {
  nature: '', auteurConnu: null, dateFaits: '', heureFaits: '', ville: '', lieu: '', description: '', biens: '', prejudiceFcfa: '', auteurInfos: '',
  declarant: { nom: '', prenoms: '', dateNaissance: '', telephone: '', email: '', adresse: '', entreprise: '' }, pourEntreprise: false, service: '', attestation: false,
};
type Erreurs = Record<string, string>;
const aujourdhui = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Libreville' });

function controler(etape: number, d: Donnees): Erreurs {
  const e: Erreurs = {};
  if (etape === 0) {
    if (!d.nature) e.nature = 'Choisissez la nature des faits.';
    if (d.auteurConnu === null) e.auteurConnu = 'Indiquez si vous connaissez l’auteur.';
  }
  if (etape === 1) {
    if (!d.dateFaits) e.dateFaits = 'Indiquez la date des faits.';
    else if (d.dateFaits > aujourdhui()) e.dateFaits = 'La date ne peut pas être dans le futur.';
    if (!d.ville.trim()) e.ville = 'Indiquez la ville.';
    if (!d.lieu.trim()) e.lieu = 'Indiquez le lieu (adresse, quartier, site internet…).';
    if (d.description.trim().length < 20) e.description = 'Décrivez les faits en 20 caractères au moins.';
    if (d.prejudiceFcfa && !/^\d{1,12}$/.test(d.prejudiceFcfa.replace(/\s/g, ''))) e.prejudiceFcfa = 'Indiquez un montant en chiffres.';
  }
  if (etape === 2) {
    if (!d.declarant.nom.trim()) e.nom = 'Indiquez votre nom.';
    if (!d.declarant.prenoms.trim()) e.prenoms = 'Indiquez vos prénoms.';
    if (!normaliserDate(d.declarant.dateNaissance)) e.dateNaissance = 'Indiquez une date de naissance valide.';
    if (!/^\+?\d{8,15}$/.test(d.declarant.telephone.replace(/[\s.-]/g, ''))) e.telephone = 'Indiquez un numéro de téléphone valide.';
    if (d.declarant.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.declarant.email.trim())) e.email = 'Adresse électronique invalide.';
    if (d.pourEntreprise && !d.declarant.entreprise.trim()) e.entreprise = 'Indiquez le nom de l’entreprise ou de l’organisme.';
  }
  if (etape === 3) {
    if (!d.service) e.service = 'Choisissez le service où vous signerez votre plainte.';
    if (!d.attestation) e.attestation = 'Cochez l’attestation pour envoyer votre pré-plainte.';
  }
  return e;
}

/** Pré-plainte en ligne en quatre étapes, puis récépissé avec numéro et code de suivi. */
export function FormulairePreplainte() {
  const [etape, setEtape] = useState(0);
  const [d, setD] = useState<Donnees>(VIDE);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [etat, action, enCours] = useActionState<EtatPreplainte, FormData>(envoyerPreplainte, null);
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, [etape, etat]);

  const maj = (champ: keyof Donnees) => (e: { target: { value: string } }) => setD({ ...d, [champ]: e.target.value });
  const majDeclarant = (champ: keyof Donnees['declarant']) => (e: { target: { value: string } }) => setD({ ...d, declarant: { ...d.declarant, [champ]: e.target.value } });
  const suivant = () => {
    const e = controler(etape, d);
    setErreurs(e);
    if (Object.keys(e).length === 0) setEtape(etape + 1);
  };

  if (etat?.ok) {
    const r = etat.recu;
    return (
      <section className="p-parcours__panneau" aria-labelledby="titre-recu">
        <h2 id="titre-recu" ref={titre} tabIndex={-1}>Pré-plainte enregistrée</h2>
        <Alerte type="succes" titre={`Numéro ${r.numero}`}>
          <p>Code de suivi : <strong className="p-code">{r.code}</strong>. Notez-le : il ne sera plus affiché.</p>
          <p>Il vous permet de suivre votre pré-plainte et de connaître la date de votre rendez-vous.</p>
        </Alerte>
        <ol className="p-etapes-suite">
          <li><strong>Un officier de police judiciaire vous contacte</strong> pour fixer un rendez-vous au service choisi : {r.service}.</li>
          <li><strong>Présentez-vous au rendez-vous</strong> avec votre pièce d’identité, ce numéro et tout justificatif (facture, photos, relevé de mobile money).</li>
          <li><strong>Signez votre plainte</strong> : votre pré-plainte devient alors une plainte. Sans signature avant le {dateLongue(r.expireLe)}, elle expire.</li>
        </ol>
        <Alerte type="avertissement" titre="Tant qu’elle n’est pas signée, ce n’est pas une plainte">
          Pour un vol de carte bancaire ou de téléphone, faites aussi opposition sans attendre auprès de votre banque ou de votre opérateur.
        </Alerte>
        <p className="cj-actions">
          <Link href={`/pre-plainte/suivi?numero=${r.numero}`} className={classesBouton()}><Icone nom="search" taille={20} /><span>Suivre ma pré-plainte</span></Link>
          <button type="button" className={classesBouton({ variante: 'secondaire' })} onClick={() => window.print()}><Icone nom="printer" taille={20} /><span>Imprimer le récépissé</span></button>
        </p>
      </section>
    );
  }

  return (
    <section className="p-parcours__panneau" aria-labelledby="titre-etape">
      <IndicateurEtapes etapes={ETAPES} courante={etape} />
      <h2 id="titre-etape" ref={titre} tabIndex={-1}>{ETAPES[etape]}</h2>
      {Object.keys(erreurs).length > 0 && (
        <Alerte type="erreur" titre="Vérifiez votre saisie">
          <ul>{Object.values(erreurs).map((m) => <li key={m}>{m}</li>)}</ul>
        </Alerte>
      )}

      {etape === 0 && (
        <>
          <Alerte type="avertissement" titre="Urgence, violences ou menaces : ne remplissez pas ce formulaire">
            En cas de danger immédiat, appelez la police ou la gendarmerie. Pour des violences, une agression ou des menaces, rendez-vous directement
            au commissariat ou à la brigade la plus proche.
          </Alerte>
          <fieldset className="cj-choix" aria-describedby={erreurs.nature ? 'err-nature' : undefined}>
            <legend>Que s’est-il passé ?</legend>
            {NATURES_PREPLAINTE.map((n) => (
              <ChoixCarte key={n.code} name="nature" value={n.code} titre={n.titre} description={n.description}
                checked={d.nature === n.code} onChange={() => setD({ ...d, nature: n.code })} />
            ))}
          </fieldset>
          <fieldset className="cj-choix">
            <legend>Connaissez-vous l’auteur des faits ?</legend>
            <ChoixCarte name="auteur" value="non" titre="Non, auteur inconnu" checked={d.auteurConnu === false} onChange={() => setD({ ...d, auteurConnu: false })} />
            <ChoixCarte name="auteur" value="oui" titre="Oui, ou j’ai des éléments sur lui" description="Nom, numéro de téléphone, compte en ligne, véhicule…"
              checked={d.auteurConnu === true} onChange={() => setD({ ...d, auteurConnu: true })} />
          </fieldset>
        </>
      )}

      {etape === 1 && (
        <div className="p-parcours__champs">
          <div className="p-parcours__champs p-parcours__champs--2">
            <Champ id="dateFaits" type="date" libelle="Date des faits" requis max={aujourdhui()} value={d.dateFaits} onChange={maj('dateFaits')} erreur={erreurs.dateFaits}
              aide="Date approximative si vous ne savez pas exactement" />
            <Champ id="heureFaits" libelle="Heure" value={d.heureFaits} onChange={maj('heureFaits')} maxLength={40} placeholder="vers 18 h" />
          </div>
          <div className="p-parcours__champs p-parcours__champs--2">
            <Champ id="ville" libelle="Ville" requis value={d.ville} onChange={maj('ville')} maxLength={80} erreur={erreurs.ville} autoComplete="address-level2" />
            <Champ id="lieu" libelle="Lieu précis" requis value={d.lieu} onChange={maj('lieu')} maxLength={200} erreur={erreurs.lieu}
              aide="Adresse, quartier, marché, ou site internet pour une arnaque en ligne" />
          </div>
          <ZoneTexte id="description" libelle="Décrivez ce qui s’est passé" requis rows={6} maxLength={4000} value={d.description}
            onChange={maj('description')} erreur={erreurs.description}
            aide="Dans l’ordre : ce que vous faisiez, ce qui s’est passé, ce que vous avez constaté. Citez les témoins éventuels." />
          {d.auteurConnu && (
            <ZoneTexte id="auteurInfos" libelle="Ce que vous savez de l’auteur" rows={3} maxLength={1000} value={d.auteurInfos} onChange={maj('auteurInfos')}
              aide="Nom, surnom, description physique, numéro de téléphone, compte en ligne, plaque d’immatriculation…" />
          )}
          <ZoneTexte id="biens" libelle="Biens volés ou endommagés" rows={3} maxLength={1000} value={d.biens} onChange={maj('biens')}
            aide="Marque, modèle, numéro de série ou IMEI du téléphone, couleur…" />
          <Champ id="prejudice" libelle="Préjudice estimé (FCFA)" inputMode="numeric" value={d.prejudiceFcfa} onChange={maj('prejudiceFcfa')}
            erreur={erreurs.prejudiceFcfa} maxLength={15} aide="Facultatif" />
        </div>
      )}

      {etape === 2 && (
        <div className="p-parcours__champs">
          <div className="p-parcours__champs p-parcours__champs--2">
            <Champ id="nom" libelle="Nom" requis value={d.declarant.nom} onChange={majDeclarant('nom')} maxLength={80} erreur={erreurs.nom} autoComplete="family-name" />
            <Champ id="prenoms" libelle="Prénoms" requis value={d.declarant.prenoms} onChange={majDeclarant('prenoms')} maxLength={120} erreur={erreurs.prenoms} autoComplete="given-name" />
          </div>
          <ChampDate id="dateNaissance" libelle="Date de naissance" requis valeur={d.declarant.dateNaissance} erreur={erreurs.dateNaissance}
            onChange={(v) => setD({ ...d, declarant: { ...d.declarant, dateNaissance: v } })} />
          <div className="p-parcours__champs p-parcours__champs--2">
            <Champ id="telephone" type="tel" libelle="Téléphone mobile" requis value={d.declarant.telephone} onChange={majDeclarant('telephone')}
              maxLength={30} erreur={erreurs.telephone} autoComplete="tel" aide="Pour vous proposer un rendez-vous" />
            <Champ id="email" type="email" libelle="E-mail" value={d.declarant.email} onChange={majDeclarant('email')} maxLength={120} erreur={erreurs.email} autoComplete="email" aide="Facultatif" />
          </div>
          <Champ id="adresse" libelle="Adresse" value={d.declarant.adresse} onChange={majDeclarant('adresse')} maxLength={200} autoComplete="street-address" aide="Facultatif" />
          <CaseACocher id="pourEntreprise" libelle="Je déclare pour le compte d’une entreprise ou d’un organisme" checked={d.pourEntreprise}
            onChange={(e) => setD({ ...d, pourEntreprise: e.target.checked })} />
          {d.pourEntreprise && (
            <Champ id="entreprise" libelle="Nom de l’entreprise ou de l’organisme" requis value={d.declarant.entreprise} onChange={majDeclarant('entreprise')}
              maxLength={120} erreur={erreurs.entreprise} autoComplete="organization" />
          )}
        </div>
      )}

      {etape === 3 && (
        <div className="p-parcours__champs">
          <ChampSelection id="service" libelle="Où souhaitez-vous signer votre plainte ?" requis value={d.service} onChange={maj('service')} erreur={erreurs.service}>
            <option value="" disabled>Choisissez un commissariat ou une brigade</option>
            {SERVICES_PREPLAINTE.map((s) => <option key={s} value={s}>{s}</option>)}
          </ChampSelection>
          <ListeDescription elements={[
            { terme: 'Faits', valeur: `${d.nature ? libelleNature(d.nature) : '—'} · ${d.auteurConnu ? 'auteur connu ou identifiable' : 'auteur inconnu'}` },
            { terme: 'Quand et où', valeur: `${d.dateFaits ? dateLongue(d.dateFaits) : '—'}${d.heureFaits ? `, ${d.heureFaits}` : ''} · ${d.lieu}, ${d.ville}` },
            { terme: 'Récit', valeur: d.description.length > 220 ? `${d.description.slice(0, 220)}…` : d.description },
            ...(d.prejudiceFcfa ? [{ terme: 'Préjudice', valeur: fcfa(Number(d.prejudiceFcfa.replace(/\s/g, ''))) }] : []),
            { terme: 'Déclarant', valeur: `${d.declarant.prenoms} ${d.declarant.nom.toUpperCase()}${d.pourEntreprise ? ` pour ${d.declarant.entreprise}` : ''} · ${d.declarant.telephone}` },
          ]} />
          <CaseACocher id="attestation" requis checked={d.attestation} erreur={erreurs.attestation} onChange={(e) => setD({ ...d, attestation: e.target.checked })}
            libelle="J’atteste que ces informations sont exactes. Je sais qu’une fausse déclaration ou une dénonciation mensongère expose à des poursuites." />
          {etat && !etat.ok && <Alerte type="erreur" titre="Pré-plainte non envoyée">{etat.erreur}</Alerte>}
        </div>
      )}

      <div className="p-parcours__navigation">
        {etape > 0 ? (
          <button type="button" className={classesBouton({ variante: 'tertiaire' })} onClick={() => { setErreurs({}); setEtape(etape - 1); }}>
            <Icone nom="arrow-left" taille={20} /><span>Retour</span>
          </button>
        ) : <span />}
        {etape < 3 ? (
          <button type="button" className={classesBouton()} onClick={suivant}><span>Continuer</span><Icone nom="arrow-right" taille={20} /></button>
        ) : (
          <form action={(f) => { const e = controler(3, d); setErreurs(e); if (Object.keys(e).length === 0) return action(f); }}>
            <input type="hidden" name="donnees" value={JSON.stringify({ ...d, declarant: { ...d.declarant, dateNaissance: normaliserDate(d.declarant.dateNaissance) ?? '',
              entreprise: d.pourEntreprise ? d.declarant.entreprise : '' }, prejudiceFcfa: d.prejudiceFcfa.replace(/\s/g, '') })} />
            <button type="submit" className={classesBouton()} disabled={enCours}>
              <Icone nom="file-check" taille={20} /><span>{enCours ? 'Envoi…' : 'Envoyer ma pré-plainte'}</span>
            </button>
          </form>
        )}
      </div>
      <p className="p-note p-note--discrete"><Icone nom="lock" taille={16} /><span>Vos informations sont transmises de façon chiffrée et ne servent qu’au traitement de votre plainte.</span></p>
    </section>
  );
}
