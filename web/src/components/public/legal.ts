// Textes légaux de la plateforme (version 1.0). À faire relire par un juriste avant le lancement commercial.
export const LEGAL_VERSION = { version: "1.0", date: "09/10/2026" };
export const LEGAL: Record<string, { title: string; brief: string; body: string }> = {
  cgu: { title: "Conditions générales d'utilisation", brief: "Navigoal est gratuit pour les élèves et étudiants ; vos documents ne sont partagés qu'avec les établissements où vous candidatez ; les paiements Navilease sont protégés en séquestre.",
    body: `## Objet
Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'usage de la plateforme Navigoal et de son service de logement Navilease par les élèves, étudiants, parents ou tuteurs, établissements et bailleurs.

## Comptes et rôles
L'inscription est gratuite. Chaque compte correspond à un profil : élève, étudiant, parent ou tuteur, établissement, bailleur. Les comptes établissement et bailleur sont activés après vérification par l'équipe Navigoal. Un utilisateur mineur ne peut candidater, payer ou réserver qu'après le consentement de son parent ou tuteur légal.

Vous êtes responsable de la confidentialité de vos identifiants et de l'exactitude des informations fournies.

## Candidatures et frais de dossier
Navigoal transmet les dossiers aux établissements et encaisse pour leur compte les éventuels frais de dossier. La décision d'admission relève exclusivement de l'établissement. Les frais de scolarité affichés sont indicatifs tant que l'établissement ne les a pas confirmés.

## Navilease : réservation et séquestre
Les annonces sont modérées. Le premier loyer, les charges, le dépôt de garantie et les frais de service sont conservés en séquestre par Navilease et versés au bailleur après l'état des lieux d'entrée ; le dépôt de garantie est restitué après l'état des lieux de sortie, déduction faite des retenues justifiées. Les coordonnées des parties sont masquées jusqu'au paiement. Tout paiement effectué en dehors de la plateforme fait perdre la protection du séquestre.

## Obligations des utilisateurs
Les utilisateurs s'engagent à publier des informations exactes, à ne déposer que des documents authentiques, à respecter les autres membres et à ne pas contourner la plateforme. Navigoal peut suspendre un compte en cas de fraude, d'annonce trompeuse ou de comportement abusif.

## Données personnelles
Le traitement des données est décrit dans la [politique de confidentialité](/confidentialite).

## Responsabilité
Navigoal met en relation élèves, familles, établissements et bailleurs et n'est pas partie aux contrats de formation ou de location, à l'exception de son rôle de tiers de séquestre pour Navilease. Navigoal met tout en œuvre pour assurer la disponibilité du service sans pouvoir la garantir en permanence.

## Droit applicable et litiges
Les litiges liés à une réservation sont d'abord soumis à la médiation Navilease. À défaut d'accord, ils relèvent des juridictions compétentes du pays de l'utilisateur, conformément au droit applicable.

## Contact
Pour toute question : contact@navigoal.com.` },
  confidentialite: { title: "Politique de confidentialité", brief: "Nous collectons uniquement les données utiles à votre orientation, vos candidatures et votre logement ; nous ne les vendons jamais.",
    body: `## Responsable du traitement
Navigoal est responsable du traitement des données collectées sur la plateforme. Contact : contact@navigoal.com.

## Données collectées
- Identité et coordonnées : nom, prénom, année de naissance, e-mail, téléphone, pays, ville.
- Scolarité et orientation : niveau, série, établissement, résultats du test d'orientation, préférences.
- Documents déposés : pièces d'identité, relevés de notes, diplômes, attestations.
- Paiements : montants, références de transaction (les données de carte sont traitées par l'agrégateur de paiement).
- Navilease : annonces, réservations, contrats, états des lieux, messages.

## Finalités
Fournir les recommandations d'orientation, transmettre les candidatures, sécuriser les paiements et les réservations, prévenir la fraude, envoyer les notifications utiles et produire des statistiques anonymisées.

## Destinataires
Vos documents ne sont transmis qu'aux établissements auxquels vous candidatez, à vos parents ou tuteurs liés et, pour Navilease, au bailleur concerné après votre demande de réservation. Nos sous-traitants techniques (hébergement, envoi d'e-mails et de SMS, paiement) agissent sur nos instructions.

## Mineurs
Les comptes des mineurs sont liés à un parent ou tuteur, dont le consentement est recueilli avant toute candidature, tout paiement ou toute réservation. Les annonces non vérifiées ne leur sont pas proposées.

## Durée de conservation
Les données de compte sont conservées tant que le compte est actif, puis 3 ans ; les pièces comptables et contrats, selon les durées légales.

## Vos droits
Vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression, conformément à la loi n° 001/2011 (Gabon), à la loi 09-08 (Maroc) et à la loi 2008-12 (Sénégal). Pour l'exercer : contact@navigoal.com. Vous pouvez également saisir l'autorité de protection des données de votre pays (CNPDCP, CNDP ou CDP).

## Sécurité
Connexions chiffrées, mots de passe hachés, contrôle d'accès par rôle, journalisation des actions sensibles et vérification du type des fichiers déposés.` },
  "mentions-legales": { title: "Mentions légales", brief: "Informations sur l'éditeur et l'hébergeur de la plateforme.",
    body: `## Éditeur
Navigoal — plateforme d'orientation, de candidature et de logement étudiant (Gabon, Maroc, Sénégal). Contact : contact@navigoal.com.

Les informations d'immatriculation de la société éditrice (raison sociale, siège, numéro d'immatriculation, directeur de la publication) sont communiquées sur demande et complétées lors de l'immatriculation.

## Hébergement
Application hébergée par Netlify, Inc. (San Francisco, États-Unis) ; base de données hébergée par Neon (Netlify DB).

## Propriété intellectuelle
Les contenus éditoriaux, la marque Navigoal et Navilease sont protégés. Les logos et photographies des établissements restent la propriété de leurs titulaires ; les photographies issues de Wikimedia Commons sont publiées sous leurs licences respectives, créditées sur chaque fiche.

## Données de référence
Les référentiels (métiers, formations, séries, établissements) sont fournis à titre indicatif et mis à jour avec les établissements partenaires.` },
  cookies: { title: "Cookies", brief: "Navigoal n'utilise qu'un cookie de session indispensable, sans publicité ni traçage tiers.",
    body: `## Cookie de session
Un cookie strictement nécessaire (ng_session) maintient votre connexion pendant 30 jours au maximum. Il est supprimé à la déconnexion.

## Stockage local
Votre navigateur conserve localement certaines préférences (résultat provisoire du test d'orientation, étapes cochées des démarches). Vous pouvez les effacer depuis les réglages de votre navigateur.

## Mesure d'audience et publicité
Aucun cookie publicitaire ni traceur tiers n'est déposé.` },
};
