import Link from 'next/link';
import { Carte, EmblemeNeutre, Icone, LOGO_MINISTERE, Pastille, TuileIndicateur, classesBouton, type NomIcone } from '@casier/design-system';

import { config } from '@/lib/config';
import { donnees } from '@/lib/donnees';
import { TYPES_ETABLISSEMENT } from '@/lib/libelles';

export const dynamic = 'force-dynamic';

const MISSIONS: { titre: string; texte: string; icone: NomIcone }[] = [
  { titre: 'Exécuter les décisions de justice', texte: 'Recevoir les personnes placées sous main de justice sur la base d’un titre régulier et tenir leur situation pénale à jour.', icone: 'gavel' },
  { titre: 'Garantir la sécurité', texte: 'Assurer la garde des personnes détenues, la sécurité des établissements, des personnels et des visiteurs.', icone: 'shield-check' },
  { titre: 'Respecter les droits et la dignité', texte: 'Accès aux soins, au droit, aux visites et à la correspondance, dans le respect des droits humains.', icone: 'scale' },
  { titre: 'Préparer la réinsertion', texte: 'Formation, travail, accompagnement social et préparation de la sortie pour prévenir la récidive.', icone: 'users' },
];

const OUTILS: { titre: string; texte: string; icone: NomIcone }[] = [
  { titre: 'Registre d’écrou numérique', texte: 'Numéro d’écrou unique, titre de détention obligatoire, recherche immédiate dans l’établissement.', icone: 'list-checks' },
  { titre: 'Situation pénale', texte: 'Date de libération prévue calculée et tenue à jour, alertes des libérations à venir.', icone: 'calendar' },
  { titre: 'Mouvements autorisés', texte: 'Transferts, extractions et permissions de sortir demandés par le greffe, autorisés par le chef d’établissement.', icone: 'arrow-right' },
  { titre: 'Tableau de bord national', texte: 'Population et taux d’occupation de chaque établissement pour la direction de l’administration pénitentiaire.', icone: 'chart-column' },
];

/** Accueil du service pénitentiaire : missions, réseau des établissements, outils et accès professionnel. */
export default async function Accueil() {
  const etablissements = await donnees.etablissements();
  const capacite = etablissements.reduce((t, e) => t + e.capacite, 0);
  const provinces = new Set(etablissements.map((e) => e.province)).size;
  return (
    <>
      <section className="p-accueil" aria-labelledby="titre-accueil">
        <div className="cj-conteneur p-accueil__contenu">
          <span className="p-accueil__embleme">
            {config.embleme === 'ministere'
              ? <img src={LOGO_MINISTERE} alt="" width={119} height={80} className="p-accueil__logo" />
              : config.embleme === 'officiel'
                ? <img src="/emblemes/armoiries.svg" alt="" width={72} height={69} />
                : <EmblemeNeutre taille={64} />}
          </span>
          <Pastille>Ministère de la Justice, Garde des Sceaux, chargé des Droits humains · Direction de l’administration pénitentiaire</Pastille>
          <h1 id="titre-accueil">L’administration pénitentiaire, <em>au service de la Justice</em></h1>
          <p className="p-accueil__chapo">
            Exécution des peines, sécurité des établissements, respect des droits et réinsertion des personnes détenues, dans tout le Gabon.
          </p>
          <div className="p-accueil__actions">
            <Link href="/etablissements" className={classesBouton({ taille: 'l' })}>
              <Icone nom="building-2" taille={20} /><span>Trouver un établissement</span>
            </Link>
            <Link href="/connexion" className={classesBouton({ variante: 'secondaire', taille: 'l' })}>
              <Icone nom="lock" taille={20} /><span>Accès professionnel</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="cj-conteneur" aria-label="Le réseau en chiffres">
        <div className="p-chiffres">
          <TuileIndicateur valeur={etablissements.length} libelle="établissements pénitentiaires" />
          <TuileIndicateur valeur={provinces} libelle="provinces couvertes" />
          <TuileIndicateur valeur={capacite.toLocaleString('fr-FR')} libelle="places opérationnelles" detail={config.modeDemo ? 'Capacités indicatives' : undefined} />
          <TuileIndicateur valeur="24 h/24" libelle="garde et sécurité" />
        </div>
      </section>

      <section className="p-section p-section--attenuee" id="missions" aria-labelledby="titre-missions">
        <div className="cj-conteneur">
          <div className="p-entete-section">
            <p className="p-surtitre">Nos missions</p>
            <h2 id="titre-missions" className="p-titre-section">Garder, protéger, préparer la sortie</h2>
          </div>
          <div className="cj-grille cj-grille--4">
            {MISSIONS.map((m) => <Carte key={m.titre} titre={m.titre} icone={m.icone}>{m.texte}</Carte>)}
          </div>
        </div>
      </section>

      <section className="p-section" aria-labelledby="titre-etablissements">
        <div className="cj-conteneur">
          <div className="p-entete-section">
            <p className="p-surtitre">Le réseau</p>
            <h2 id="titre-etablissements" className="p-titre-section">Les établissements pénitentiaires</h2>
          </div>
          <div className="cj-grille cj-grille--3">
            {etablissements.map((e) => (
              <Carte key={e.code} titre={e.nom} href={`/etablissements/${e.code}`} icone="building-2" suite="Voir la fiche">
                {TYPES_ETABLISSEMENT[e.type]} · {e.ville}, {e.province}
              </Carte>
            ))}
          </div>
        </div>
      </section>

      <section className="p-section p-section--surface" aria-labelledby="titre-outils">
        <div className="cj-conteneur">
          <div className="p-entete-section">
            <p className="p-surtitre">Modernisation</p>
            <h2 id="titre-outils" className="p-titre-section">Un système de gestion pénitentiaire unique</h2>
            <p className="p-chapo">Chaque action est tracée et attribuée à son auteur : aucune donnée n’est effacée, chaque mouvement est autorisé par une autre personne que celle qui le demande.</p>
          </div>
          <div className="cj-grille cj-grille--4">
            {OUTILS.map((o) => <Carte key={o.titre} titre={o.titre} icone={o.icone}>{o.texte}</Carte>)}
          </div>
        </div>
      </section>

      <section className="p-section" id="familles" aria-labelledby="titre-familles">
        <div className="cj-conteneur p-deux-colonnes">
          <div className="p-entete-section">
            <p className="p-surtitre">Familles et proches</p>
            <h2 id="titre-familles" className="p-titre-section">Rendre visite à un proche détenu</h2>
            <p className="p-chapo">
              Le permis de visite est délivré par le magistrat saisi pour une personne prévenue, et par le chef d’établissement pour une personne condamnée.
              Présentez-vous à l’établissement muni d’une pièce d’identité en cours de validité.
            </p>
          </div>
          <ul className="p-liste-coches">
            <li><Icone nom="check" taille={20} /><span>Aucune information sur une personne détenue n’est donnée par téléphone.</span></li>
            <li><Icone nom="check" taille={20} /><span>Les dépôts de linge et d’argent se font aux jours et heures fixés par l’établissement.</span></li>
            <li><Icone nom="check" taille={20} /><span>Un avocat peut rencontrer son client sur présentation de sa carte professionnelle.</span></li>
            <li><Icone nom="check" taille={20} /><span>Une réclamation peut être adressée par écrit au chef d’établissement ou à la direction.</span></li>
          </ul>
        </div>
      </section>

      <section className="p-section p-section--attenuee" aria-labelledby="titre-pro">
        <div className="cj-conteneur pen-acces">
          <div>
            <h2 id="titre-pro" className="p-titre-section">Personnels pénitentiaires</h2>
            <p className="p-chapo">Greffe, chefs d’établissement et direction : accédez au registre d’écrou, aux mouvements et aux tableaux de bord.</p>
          </div>
          <Link href="/connexion" className={classesBouton({ taille: 'l' })}><Icone nom="lock" taille={20} /><span>Accès professionnel</span></Link>
        </div>
      </section>
    </>
  );
}
