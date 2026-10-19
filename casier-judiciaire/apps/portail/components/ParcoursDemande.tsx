'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent, type RefObject } from 'react';
import Link from 'next/link';
import {
  Alerte, Badge, CaseACocher, Champ, ChampDate, ChoixCarte, Icone, IndicateurEtapes, classesBouton,
} from '@casier/design-system';

import { deposerAction } from '@/app/demande/actions';
import { AvisSatisfaction } from './AvisSatisfaction';
import { fcfa, profils, type CodeProfil } from '@/lib/contenu';
import type { DemandeDeposee } from '@/lib/types';
import {
  DONNEES_VIDES, neAilleurs, normaliserDate, verifierAttestation, verifierCoordonnees, verifierIdentite, verifierPaiement, verifierProfil,
  type DonneesDemande, type Erreurs,
} from '@/lib/validation';

/** ERG-04 : cinq étapes au plus. */
const ETAPES = ['Votre situation', 'Votre identité', 'Vos coordonnées', 'Vérification', 'Paiement'];
const CONTROLES = [verifierProfil, verifierIdentite, verifierCoordonnees, verifierAttestation, verifierPaiement];

/**
 * ERG-04 : sauvegarde automatique et reprise après coupure, sur cet appareil uniquement, effacée après le dépôt
 * ou au bout de 24 heures. Avec la connexion par l'identité numérique (lot L1), le brouillon sera conservé dans l'espace usager.
 */
const CLE_BROUILLON = 'cj-brouillon-demande-b3';
const DUREE_BROUILLON_MS = 24 * 3600_000;

type Brouillon = { etape: number; donnees: DonneesDemande; enregistreLe: number };

function lireBrouillon(): Brouillon | null {
  try {
    const b = JSON.parse(localStorage.getItem(CLE_BROUILLON) ?? 'null') as Brouillon | null;
    if (!b || Date.now() - b.enregistreLe > DUREE_BROUILLON_MS) {
      localStorage.removeItem(CLE_BROUILLON);
      return null;
    }
    return { ...b, donnees: { ...DONNEES_VIDES, ...b.donnees, consentement: false } };
  } catch {
    return null;
  }
}

const LIBELLES: Partial<Record<keyof DonneesDemande, string>> = {
  profil: 'Situation', nom: 'Nom', prenoms: 'Prénoms', dateNaissance: 'Date de naissance', lieuNaissance: 'Lieu de naissance',
  paysNaissance: 'Pays de naissance', nomPere: 'Nom du père', nomMere: 'Nom de la mère', nationalite: 'Nationalité',
  numeroCnie: 'Numéro de CNIE', numeroPasseport: 'Passeport ou titre de séjour', telephone: 'Téléphone mobile', email: 'E-mail',
  consentement: 'Attestation', modePaiement: 'Moyen de paiement',
};

const MODES: { code: DonneesDemande['modePaiement']; titre: string; description: string; icone: 'smartphone' | 'credit-card' | 'landmark' }[] = [
  { code: 'AIRTEL_MONEY', titre: 'Airtel Money', description: 'Validation sur votre téléphone', icone: 'smartphone' },
  { code: 'MOOV_MONEY', titre: 'Moov Money', description: 'Validation sur votre téléphone', icone: 'smartphone' },
  { code: 'CARTE', titre: 'Carte bancaire', description: 'Paiement sécurisé', icone: 'credit-card' },
  { code: 'TRESOR', titre: 'Au Trésor public', description: 'En espèces au guichet, puis saisie de l’identifiant de paiement', icone: 'landmark' },
];

/** ENV-04 : identité fictive pour les scénarios guidés de démonstration (DON-06). */
const IDENTITE_FICTIVE: Partial<DonneesDemande> = {
  nom: 'NDONG MBA', prenoms: 'Jean-Pierre', dateNaissance: '1990-3-14', lieuNaissance: 'Libreville',
  nomPere: 'NDONG Paul', nomMere: 'MBA Marie', telephone: '+241 77 00 00 00',
};

export type TarifProfil = { montantFcfa: number; provisoire: boolean };

export function ParcoursDemande({ tarifs, demo }: { tarifs: Partial<Record<CodeProfil, TarifProfil>>; demo: boolean }) {
  const [etape, setEtape] = useState(0);
  const [d, setD] = useState<DonneesDemande>(DONNEES_VIDES);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [message, setMessage] = useState<string | null>(null);
  const [repris, setRepris] = useState<number | null>(null);
  const [depot, setDepot] = useState<DemandeDeposee | null>(null);
  const [envoiEnCours, demarrer] = useTransition();
  const titre = useRef<HTMLHeadingElement>(null);
  const resume = useRef<HTMLDivElement>(null);
  const premierRendu = useRef(true);
  const focaliser = useRef(false);

  // Reprise après coupure (ERG-04).
  useEffect(() => {
    const b = lireBrouillon();
    if (b) {
      setD(b.donnees);
      setEtape(Math.min(b.etape, 3));
      setRepris(b.enregistreLe);
    }
  }, []);

  // Sauvegarde automatique à chaque modification (sans l'attestation ni le moyen de paiement).
  useEffect(() => {
    if (premierRendu.current) { premierRendu.current = false; return; }
    if (depot) return;
    try {
      const b: Brouillon = { etape, donnees: { ...d, consentement: false, modePaiement: '' }, enregistreLe: Date.now() };
      localStorage.setItem(CLE_BROUILLON, JSON.stringify(b));
    } catch { /* stockage indisponible (navigation privée) : le parcours continue sans brouillon */ }
  }, [d, etape, depot]);

  // Le focus suit l'étape affichée (lecteurs d'écran, ERG-01).
  useEffect(() => {
    if (focaliser.current) { focaliser.current = false; titre.current?.focus(); }
  }, [etape, depot]);

  const allerA = (n: number) => { focaliser.current = true; setErreurs({}); setRepris(null); setEtape(n); };

  const maj = <K extends keyof DonneesDemande>(champ: K, valeur: DonneesDemande[K]) => {
    setD((x) => ({ ...x, [champ]: valeur }));
    if (erreurs[champ]) setErreurs((x) => ({ ...x, [champ]: undefined }));
  };
  const saisie = (champ: keyof DonneesDemande) => ({
    value: d[champ] as string,
    onChange: (e: { target: { value: string } }) => maj(champ, e.target.value as never),
    erreur: erreurs[champ],
  });

  const tarif = d.profil ? tarifs[d.profil] : undefined;

  function signaler(e: Erreurs) {
    setErreurs(e);
    requestAnimationFrame(() => resume.current?.focus());
  }

  function suivant(ev: FormEvent) {
    ev.preventDefault();
    setMessage(null);
    // nosemgrep: javascript.lang.security.audit.unsafe-dynamic-method -- index numérique interne (0 à 4), jamais issu d'une saisie
    const e = Object.fromEntries(Object.entries(CONTROLES[etape](d)).filter(([, v]) => v)) as Erreurs;
    if (Object.keys(e).length > 0) return signaler(e);
    if (etape === 0 && !tarif) return;
    if (etape < ETAPES.length - 1) return allerA(etape + 1);
    demarrer(async () => {
      const r = await deposerAction(d);
      if (r.ok) {
        try { localStorage.removeItem(CLE_BROUILLON); } catch { /* rien à effacer */ }
        focaliser.current = true;
        setDepot(r.depot);
      } else if (r.erreurs && Object.keys(r.erreurs).length > 0) {
        const premiere = CONTROLES.findIndex((c) => Object.keys(c(d)).length > 0);
        if (premiere >= 0 && premiere !== etape) setEtape(premiere);
        signaler(r.erreurs);
      } else {
        setMessage(r.message ?? 'Votre demande n’a pas pu être enregistrée. Réessayez.');
        requestAnimationFrame(() => resume.current?.focus());
      }
    });
  }

  function recommencer() {
    try { localStorage.removeItem(CLE_BROUILLON); } catch { /* rien à effacer */ }
    setD(DONNEES_VIDES);
    setEtape(0);
    setErreurs({});
    setRepris(null);
  }

  if (depot) return <Confirmation depot={depot} titre={titre} />;

  const listeErreurs = Object.entries(erreurs).filter(([, v]) => v) as [keyof DonneesDemande, string][];

  return (
    <form className="p-parcours__panneau" onSubmit={suivant} noValidate>
      <IndicateurEtapes etapes={ETAPES} courante={etape} />

      {repris && etape > 0 && (
        <div className="p-reprise">
          <p><Icone nom="history" taille={18} />Nous avons retrouvé la demande que vous aviez commencée sur cet appareil.</p>
          <button type="button" className={classesBouton({ variante: 'tertiaire' })} onClick={recommencer}>Effacer et recommencer</button>
        </div>
      )}

      <div ref={resume} tabIndex={-1} className="p-resume-erreurs">
        {listeErreurs.length > 0 && (
          <Alerte type="erreur" titre={listeErreurs.length === 1 ? 'Une information est à corriger' : `${listeErreurs.length} informations sont à corriger`}>
            <ul>{listeErreurs.map(([champ, texte]) => <li key={champ}><a href={`#${champ}`}>{LIBELLES[champ]} : {texte}</a></li>)}</ul>
          </Alerte>
        )}
        {message && <Alerte type="erreur" titre="La demande n’a pas abouti">{message}</Alerte>}
      </div>

      <h2 ref={titre} tabIndex={-1}>{ETAPES[etape]}</h2>

      {etape === 0 && (
        <>
          <fieldset className="cj-choix" aria-describedby={erreurs.profil ? 'profil-erreur' : undefined}>
            <legend>Quelle est votre situation ?</legend>
            {erreurs.profil && <p className="cj-champ__erreur" id="profil-erreur"><Icone nom="circle-x" taille={18} />{erreurs.profil}</p>}
            {profils.map((p, i) => (
              <ChoixCarte key={p.code} name="profil" value={p.code} titre={p.titre} description={p.description} icone={p.icone}
                id={i === 0 ? 'profil' : undefined} checked={d.profil === p.code} onChange={() => maj('profil', p.code)} />
            ))}
          </fieldset>
          {d.profil && !tarif && (
            <Alerte type="avertissement" titre="La demande en ligne n’est pas encore ouverte pour cette situation">
              Le Ministère n’a pas encore fixé le tarif du bulletin n°3 pour ce profil.
              {d.profil === 'GABONAIS_NE_A_L_ETRANGER' ? ' Vous pouvez vous adresser à votre consulat.' : ' Vous pouvez vous adresser au service central du casier judiciaire.'}
              {' '}<Link href="/contact">Nous contacter</Link>
            </Alerte>
          )}
          {tarif && (
            <p className="p-note"><Icone nom="banknote" taille={18} /><span>Tarif pour votre situation : <strong>{fcfa(tarif.montantFcfa)}</strong>
              {tarif.provisoire && <> <Badge ton="alerte">Provisoire</Badge></>}</span></p>
          )}
        </>
      )}

      {etape === 1 && (
        <>
          {demo && (
            <div className="p-reprise p-reprise--alerte">
              <p><Icone nom="triangle-alert" taille={18} />Démonstration : ne saisissez jamais vos vraies données (ENV-02).</p>
              <button type="button" className={classesBouton({ variante: 'tertiaire' })}
                onClick={() => { setErreurs({}); setD((x) => ({ ...x, ...IDENTITE_FICTIVE })); }}>
                Remplir avec une identité fictive
              </button>
            </div>
          )}
          <Alerte type="info">Saisissez vos informations exactement comme sur votre acte de naissance. Le nom de vos parents aide à vous identifier plus vite.</Alerte>
          <div className="p-parcours__champs p-parcours__champs--2">
            <Champ id="nom" libelle="Nom de famille" autoComplete="family-name" requis {...saisie('nom')} />
            <Champ id="prenoms" libelle="Prénoms" aide="Tous vos prénoms, dans l’ordre" autoComplete="given-name" requis {...saisie('prenoms')} />
            <ChampDate id="dateNaissance" libelle="Date de naissance" aide="Par exemple : 14 03 1990" requis
              valeur={d.dateNaissance} onChange={(v) => maj('dateNaissance', v)} erreur={erreurs.dateNaissance} />
            <Champ id="lieuNaissance" libelle="Lieu de naissance" aide="Ville ou commune" requis {...saisie('lieuNaissance')} />
            {neAilleurs(d.profil) && <Champ id="paysNaissance" libelle="Pays de naissance" autoComplete="country-name" requis {...saisie('paysNaissance')} />}
            {d.profil === 'ETRANGER_RESIDENT' && <Champ id="nationalite" libelle="Nationalité" requis {...saisie('nationalite')} />}
            <Champ id="nomPere" libelle="Nom et prénoms du père" aide="Facultatif" {...saisie('nomPere')} />
            <Champ id="nomMere" libelle="Nom et prénoms de la mère" aide="Facultatif" {...saisie('nomMere')} />
            {d.profil === 'ETRANGER_RESIDENT'
              ? <Champ id="numeroPasseport" libelle="Numéro de passeport ou de titre de séjour" autoComplete="off" requis {...saisie('numeroPasseport')} />
              : <Champ id="numeroCnie" libelle="Numéro de CNIE" aide="Facultatif, accélère la vérification" autoComplete="off" {...saisie('numeroCnie')} />}
          </div>
        </>
      )}

      {etape === 2 && (
        <>
          <p>Nous vous envoyons le code de suivi et les avis d’avancement. Les messages ne contiennent jamais votre bulletin.</p>
          <div className="p-parcours__champs p-parcours__champs--2">
            <Champ id="telephone" libelle="Téléphone mobile" type="tel" inputMode="tel" autoComplete="tel" requis
              aide="Indicatif compris, par exemple +241 77 00 00 00" {...saisie('telephone')} />
            <Champ id="email" libelle="Adresse e-mail" type="email" autoComplete="email" aide="Facultatif" {...saisie('email')} />
          </div>
        </>
      )}

      {etape === 3 && (
        <>
          <p>Relisez vos informations avant le paiement.</p>
          <Recapitulatif d={d} modifier={allerA} />
          <CaseACocher id="consentement" requis checked={d.consentement} erreur={erreurs.consentement}
            onChange={(e) => maj('consentement', e.target.checked)}
            libelle="J’atteste que ces informations me concernent et sont exactes."
            aide={<>Le bulletin n°3 est personnel : le demander pour une autre personne est interdit. Vos données servent uniquement
              au traitement de cette demande (<Link href="/confidentialite">confidentialité</Link>).</>} />
        </>
      )}

      {etape === 4 && tarif && (
        <>
          <div className="p-montant">
            <span>Bulletin n°3 {tarif.provisoire && <Badge ton="alerte">Tarif provisoire</Badge>}</span>
            <strong>{fcfa(tarif.montantFcfa)}</strong>
          </div>
          {demo && (
            <Alerte type="info" titre="Simulateur de paiement">Démonstration : aucune somme n’est encaissée et aucun opérateur n’est contacté (PAY-07).</Alerte>
          )}
          <fieldset className="cj-choix p-paiement" aria-describedby={erreurs.modePaiement ? 'modePaiement-erreur' : undefined}>
            <legend>Moyen de paiement</legend>
            {erreurs.modePaiement && <p className="cj-champ__erreur" id="modePaiement-erreur"><Icone nom="circle-x" taille={18} />{erreurs.modePaiement}</p>}
            {MODES.map((m, i) => (
              <ChoixCarte key={m.code} name="modePaiement" value={m.code} titre={m.titre} description={m.description} icone={m.icone}
                id={i === 0 ? 'modePaiement' : undefined} checked={d.modePaiement === m.code} onChange={() => maj('modePaiement', m.code)} />
            ))}
          </fieldset>
          {d.modePaiement === 'TRESOR'
            ? <p className="p-note"><Icone nom="landmark" taille={18} /><span>Vous recevez un avis de paiement avec votre numéro de dossier. Après paiement au guichet du Trésor, saisissez l’identifiant de paiement figurant sur la quittance pour obtenir votre bulletin.</span></p>
            : <p className="p-note"><Icone nom="lock" taille={18} /><span>Le paiement n’est validé qu’après confirmation de l’opérateur. Vous recevez un reçu numéroté.</span></p>}
        </>
      )}

      <div className="p-parcours__navigation">
        {etape > 0
          ? <button type="button" className={classesBouton({ variante: 'secondaire' })} onClick={() => allerA(etape - 1)}>
              <Icone nom="arrow-left" taille={20} /><span>Retour</span>
            </button>
          : <span />}
        <button type="submit" className={classesBouton()} disabled={envoiEnCours || (etape === 0 && !!d.profil && !tarif)}>
          {etape < ETAPES.length - 1
            ? <><span>Continuer</span><Icone nom="arrow-right" taille={20} /></>
            : d.modePaiement === 'TRESOR'
              ? <><Icone nom="landmark" taille={20} /><span>{envoiEnCours ? 'Enregistrement…' : 'Obtenir mon avis de paiement'}</span></>
              : <><Icone nom="lock" taille={20} /><span>{envoiEnCours ? 'Paiement en cours…' : `Payer ${tarif ? fcfa(tarif.montantFcfa) : ''}`}</span></>}
        </button>
      </div>
      {etape < 4 && <p className="p-note p-note--discrete"><Icone nom="history" taille={16} /><span>Votre saisie est enregistrée automatiquement sur cet appareil.</span></p>}
    </form>
  );
}

function dateLisible(v: string) {
  const iso = normaliserDate(v);
  return iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—';
}

function Recapitulatif({ d, modifier }: { d: DonneesDemande; modifier: (etape: number) => void }) {
  const profil = profils.find((p) => p.code === d.profil);
  const lignes: [string, string, number][] = [
    ['Situation', profil?.titre ?? '—', 0],
    ['Nom', d.nom.toUpperCase(), 1],
    ['Prénoms', d.prenoms, 1],
    ['Date de naissance', dateLisible(d.dateNaissance), 1],
    ['Lieu de naissance', [d.lieuNaissance, neAilleurs(d.profil) ? d.paysNaissance : 'Gabon'].filter(Boolean).join(', '), 1],
    ...(d.nomPere ? [['Père', d.nomPere, 1] as [string, string, number]] : []),
    ...(d.nomMere ? [['Mère', d.nomMere, 1] as [string, string, number]] : []),
    ...(d.profil === 'ETRANGER_RESIDENT'
      ? [['Nationalité', d.nationalite, 1], ['Passeport ou titre de séjour', d.numeroPasseport, 1]] as [string, string, number][]
      : d.numeroCnie ? [['CNIE', d.numeroCnie, 1] as [string, string, number]] : []),
    ['Téléphone', d.telephone, 2],
    ...(d.email ? [['E-mail', d.email, 2] as [string, string, number]] : []),
  ];
  return (
    <dl className="p-recapitulatif">
      {lignes.map(([cle, valeur, etape]) => (
        <div key={cle} className="p-recapitulatif__ligne">
          <dt>{cle}</dt>
          <dd>{valeur}</dd>
          <dd className="p-recapitulatif__action">
            <button type="button" className="p-lien-bouton" onClick={() => modifier(etape)}>
              Modifier<span className="cj-visuellement-masque"> : {cle}</span>
            </button>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Confirmation({ depot, titre }: { depot: DemandeDeposee; titre: RefObject<HTMLHeadingElement | null> }) {
  if (depot.paiementTresor) return <AvisPaiementTresor depot={depot} titre={titre} />;
  if (depot.paiementEnAttente) {
    return (
      <section className="p-parcours__panneau p-confirmation">
        <span className="p-confirmation__pictogramme"><Icone nom="smartphone" taille={40} /></span>
        <h2 ref={titre} tabIndex={-1}>Demande enregistrée : confirmez le paiement</h2>
        <p>Validez le paiement sur votre téléphone ou sur la page de paiement. Vous recevez un SMS dès que l’opérateur le confirme.</p>
        <div className="p-identifiants">
          <div className="p-identifiant"><span>Numéro de dossier</span><strong>{depot.numeroDossier}</strong></div>
          <div className="p-identifiant"><span>Code de suivi</span><strong>{depot.codeSuivi}</strong></div>
          <div className="p-identifiant"><span>Montant</span><strong>{fcfa(depot.montantFcfa)}</strong></div>
        </div>
        <div className="p-page-entete__actions">
          <Link href="/espace/demandes" className={classesBouton()}><Icone nom="file-text" taille={20} /><span>Mes demandes</span></Link>
        </div>
      </section>
    );
  }
  return (
    <section className="p-parcours__panneau p-confirmation">
      <span className="p-confirmation__pictogramme"><Icone nom="circle-check" taille={40} /></span>
      <h2 ref={titre} tabIndex={-1}>Demande enregistrée et payée</h2>
      <p>Conservez ces deux informations : elles vous permettent de suivre votre demande. Elles vous ont aussi été envoyées par SMS.</p>
      <div className="p-identifiants">
        <div className="p-identifiant"><span>Numéro de dossier</span><strong>{depot.numeroDossier}</strong></div>
        <div className="p-identifiant"><span>Code de suivi</span><strong>{depot.codeSuivi}</strong></div>
        <div className="p-identifiant"><span>Montant payé</span><strong>{fcfa(depot.montantFcfa)}</strong></div>
      </div>
      {depot.demo
        ? <Alerte type="succes" titre="Démonstration">Votre identité étant certaine, le bulletin fictif est disponible immédiatement.</Alerte>
        : <p>Votre bulletin sera disponible dans votre espace en 24 heures au plus.</p>}
      <div className="p-page-entete__actions">
        <Link href="/suivi" className={classesBouton()}><Icone nom="search" taille={20} /><span>Suivre ma demande</span></Link>
        <Link href="/" className={classesBouton({ variante: 'secondaire' })}><span>Retour à l’accueil</span></Link>
      </div>
      <AvisSatisfaction parcours="DEMANDE" />
    </section>
  );
}

/** Paiement au Trésor : avis de paiement à présenter au guichet, puis saisie de l'identifiant de paiement. */
function AvisPaiementTresor({ depot, titre }: { depot: DemandeDeposee; titre: RefObject<HTMLHeadingElement | null> }) {
  return (
    <section className="p-parcours__panneau p-confirmation">
      <span className="p-confirmation__pictogramme"><Icone nom="landmark" taille={40} /></span>
      <h2 ref={titre} tabIndex={-1}>Demande enregistrée : à payer au Trésor public</h2>
      <p>Voici votre avis de paiement. Il vous a aussi été envoyé par SMS. Conservez le code de suivi : il vous sera demandé avec l’identifiant de paiement.</p>
      <div className="p-identifiants">
        <div className="p-identifiant"><span>Numéro de dossier</span><strong>{depot.numeroDossier}</strong></div>
        <div className="p-identifiant"><span>Code de suivi</span><strong>{depot.codeSuivi}</strong></div>
        <div className="p-identifiant"><span>Montant à payer</span><strong>{fcfa(depot.montantFcfa)}</strong></div>
      </div>
      <ol className="p-etapes-liste" style={{ textAlign: 'left' }}>
        <li><span className="p-etapes-liste__numero" aria-hidden="true" /><div><h3>Payez au Trésor public</h3><p>Présentez le numéro de dossier au guichet du Trésor et réglez {fcfa(depot.montantFcfa)}.</p></div></li>
        <li><span className="p-etapes-liste__numero" aria-hidden="true" /><div><h3>Gardez la quittance</h3><p>Elle porte l’identifiant de paiement (numéro de quittance).</p></div></li>
        <li><span className="p-etapes-liste__numero" aria-hidden="true" /><div><h3>Saisissez l’identifiant de paiement</h3><p>Votre bulletin vous est alors délivré.</p></div></li>
      </ol>
      <div className="p-page-entete__actions">
        <Link href={`/paiement-tresor?numero=${encodeURIComponent(depot.numeroDossier)}`} className={classesBouton()}>
          <Icone nom="landmark" taille={20} /><span>J’ai payé : saisir l’identifiant</span>
        </Link>
        <button type="button" className={classesBouton({ variante: 'secondaire' })} onClick={() => window.print()}>
          <Icone nom="printer" taille={20} /><span>Imprimer l’avis</span>
        </button>
      </div>
    </section>
  );
}
