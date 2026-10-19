/** Questions fréquentes et glossaire (PUB-10, ERG-03). Contenu destiné à être géré depuis le back-office (PUB-17). */
export const questions: { id: string; theme: string; q: string; r: string }[] = [
  { id: 'definition', theme: 'Le bulletin', q: 'Qu’est-ce que le bulletin n°3 ?', r: 'C’est l’extrait du casier judiciaire que vous pouvez obtenir pour vous-même, par exemple pour un emploi ou un concours. Il ne mentionne que certaines condamnations, selon les règles du Code de procédure pénale.' },
  { id: 'autrui', theme: 'Le bulletin', q: 'Puis-je demander le bulletin d’une autre personne ?', r: 'Non. Le bulletin n°3 est strictement personnel : seule la personne concernée peut le demander, après vérification de son identité.' },
  { id: 'validite', theme: 'Le bulletin', q: 'Combien de temps mon bulletin est-il valable ?', r: 'La durée de validité est fixée par le Ministère de la Justice, Garde des Sceaux, chargé des Droits humains et imprimée sur le bulletin. La page de vérification indique si le bulletin est encore valable.' },
  { id: 'delai', theme: 'La demande', q: 'Combien de temps faut-il ?', r: '24 heures au plus après le paiement confirmé, et souvent immédiatement lorsque votre identité est certaine. Le délai est suspendu si une pièce complémentaire vous est demandée.' },
  { id: 'pieces', theme: 'La demande', q: 'Quelles pièces dois-je fournir ?', r: 'Avec l’identité numérique nationale, votre CNIE suffit. Sans identité numérique : acte de naissance, acte de mariage si la mention n’y figure pas, passeport ou titre de séjour, et une photo prise pendant la demande.' },
  { id: 'coupure', theme: 'La demande', q: 'Ma connexion a coupé pendant la demande. Dois-je tout recommencer ?', r: 'Non. Votre saisie est enregistrée automatiquement sur votre appareil pendant 24 heures. Revenez sur la page de demande pour reprendre là où vous en étiez.' },
  { id: 'piece-demandee', theme: 'La demande', q: 'On me demande une pièce complémentaire. Que faire ?', r: 'Connectez-vous à votre espace et déposez la pièce en photo depuis votre téléphone. Le délai de 24 heures reprend dès sa réception.' },
  { id: 'paiement', theme: 'Le paiement', q: 'Comment payer ?', r: 'Par Mobile Money ou par carte bancaire, au moment de la demande. Le paiement n’est validé qu’après confirmation de l’opérateur ; vous recevez un reçu numéroté.' },
  { id: 'double-paiement', theme: 'Le paiement', q: 'J’ai été débité deux fois. Que faire ?', r: 'Chaque transaction n’est prise en compte qu’une seule fois. Si vous constatez un double débit, faites une réclamation avec votre numéro de dossier : le paiement en trop vous sera remboursé.' },
  { id: 'code-perdu', theme: 'Le suivi', q: 'J’ai perdu mon code de suivi.', r: 'Le code figure dans le SMS reçu après votre demande. Si vous ne le retrouvez pas, connectez-vous à votre espace pour suivre votre demande, ou contactez le support avec votre numéro de dossier.' },
  { id: 'verification', theme: 'La vérification', q: 'Comment un employeur vérifie-t-il mon bulletin ?', r: 'En scannant le QR code ou en saisissant le code de vérification imprimé sur le bulletin. La vérification est gratuite et ne demande pas de compte. Elle n’affiche jamais le contenu de votre casier.' },
  { id: 'telephone', theme: 'Sécurité', q: 'On m’appelle de la part du casier judiciaire pour me demander un code. Est-ce normal ?', r: 'Non. Le service ne vous demandera jamais de code ni de paiement par téléphone. Ne communiquez rien et signalez l’appel au support.' },
  { id: 'erreur', theme: 'Vos droits', q: 'Je pense que mon casier contient une erreur.', r: 'Faites une réclamation en indiquant « contestation du contenu du casier ». Elle est transmise au service du casier judiciaire et vous suivez son traitement.' },
];

export const glossaire: { terme: string; definition: string }[] = [
  { terme: 'Casier judiciaire', definition: 'Registre national tenu par le Ministère de la Justice, Garde des Sceaux, chargé des Droits humains, qui conserve les condamnations prononcées par les juridictions.' },
  { terme: 'Bulletin n°3', definition: 'Extrait le plus court, délivré uniquement à la personne concernée.' },
  { terme: 'Néant', definition: 'Mention portée sur le bulletin quand aucune condamnation ne doit y figurer.' },
  { terme: 'Réhabilitation', definition: 'Effacement des effets d’une condamnation, de plein droit après un certain délai ou sur décision de justice.' },
  { terme: 'Sceau électronique', definition: 'Signature numérique du Ministère apposée sur le bulletin : la moindre modification du fichier est détectée.' },
  { terme: 'Code de vérification', definition: 'Code de 12 caractères imprimé sur le bulletin, qui permet à un tiers d’en vérifier l’authenticité en ligne.' },
  { terme: 'Jugement supplétif', definition: 'Décision de justice qui tient lieu d’acte de naissance lorsque celui-ci n’a pas été établi.' },
  { terme: 'CNIE', definition: 'Carte nationale d’identité électronique.' },
];

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function rechercher(q: string) {
  const mots = normaliser(q).split(/\s+/).filter((m) => m.length > 1);
  if (mots.length === 0) return questions;
  return questions.filter((x) => { const t = normaliser(`${x.q} ${x.r} ${x.theme}`); return mots.every((m) => t.includes(m)); });
}
