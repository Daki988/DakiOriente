import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'

// Textes provisoires rédigés d'après le fonctionnement réel de l'application (données collectées,
// durées de conservation, partage de position). Les mentions entre crochets sont à compléter,
// et l'ensemble doit être relu par un juriste avant publication sur les stores.
const COMPANY = {
  name: '[Raison sociale de NEAM]',
  address: '[Adresse du siège, Libreville]',
  email: '[adresse e-mail de contact]',
  phone: '[numéro du service client]',
}
const UPDATED = '20 novembre 2026'

type Section = { title: string; body: (string | string[])[] }

const PRIVACY: Section[] = [
  {
    title: 'Qui est responsable de vos données',
    body: [
      `${COMPANY.name}, ${COMPANY.address}, exploite les applications NEAM, NEAM Partenaire et NEAM Livreur. Pour toute question sur vos données : ${COMPANY.email} ou ${COMPANY.phone}.`,
    ],
  },
  {
    title: 'Ce que nous collectons',
    body: [
      [
        'Votre numéro de téléphone, pour vous connecter par code SMS et pour que le livreur puisse vous joindre.',
        'Votre nom, s’il est indiqué.',
        'Vos adresses de livraison et de ramassage, et le contenu de vos commandes et envois.',
        'Pour les marchands : le nom, l’adresse et le téléphone de la boutique, son catalogue, ses ventes et les versements reçus.',
        'Pour les livreurs : le véhicule, la plaque, la pièce d’identité indiquée lors de la candidature, les courses effectuées, les espèces encaissées et remises, et la position GPS pendant le service.',
      ],
      'Nous ne collectons ni vos contacts, ni vos photos, ni votre position de client. Le paiement se fait en espèces à la livraison : aucune donnée bancaire n’est demandée.',
    ],
  },
  {
    title: 'Pourquoi',
    body: [
      [
        'Préparer, livrer et suivre vos commandes.',
        'Permettre au marchand et au livreur de vous servir.',
        'Tenir la comptabilité des ventes, des commissions et des espèces.',
        'Prévenir la fraude : code de remise, limites de commandes, suspension des comptes abusifs.',
      ],
    ],
  },
  {
    title: 'Qui voit quoi',
    body: [
      [
        'La boutique voit le nom, le téléphone, l’adresse et le contenu des commandes qui la concernent.',
        'Le livreur voit les mêmes informations pour les courses qui lui sont confiées.',
        'Le client voit le nom, le téléphone et la position du livreur uniquement pendant que sa commande est en route ; plus rien après la livraison.',
        'Le code de remise n’est visible que par le client.',
        'L’équipe NEAM voit l’ensemble pour assurer le service ; ses actions sur l’argent et les comptes sont journalisées.',
      ],
      'Vos données ne sont ni vendues ni utilisées pour de la publicité.',
    ],
  },
  {
    title: 'Où elles sont hébergées',
    body: [
      'Les données sont hébergées par Supabase sur des serveurs situés dans l’Union européenne (Irlande). Ce transfert hors du Gabon est encadré par des mesures de sécurité : connexions chiffrées, règles d’accès vérifiées par le serveur, sauvegardes.',
    ],
  },
  {
    title: 'Combien de temps',
    body: [
      [
        'Commandes : conservées pour la comptabilité ; le nom, le téléphone et l’adresse sont effacés 2 ans après la clôture de la commande.',
        'Position des livreurs : seule la dernière position est gardée, et elle est effacée dès que le livreur passe hors ligne.',
        'Compte : jusqu’à sa suppression à votre demande.',
      ],
    ],
  },
  {
    title: 'Vos droits',
    body: [
      `Conformément à la loi n° 001/2011 du 25 septembre 2011 relative à la protection des données à caractère personnel, vous pouvez accéder à vos données, les faire corriger ou supprimer, et vous opposer à leur traitement, en écrivant à ${COMPANY.email}. Vous pouvez aussi saisir la Commission nationale pour la protection des données à caractère personnel (CNPDCP).`,
    ],
  },
  {
    title: 'Sur votre téléphone',
    body: [
      'L’application garde sur votre téléphone votre panier et votre session de connexion. Tout est effacé lorsque vous vous déconnectez.',
    ],
  },
]

const TERMS: Section[] = [
  {
    title: 'Le service',
    body: [
      'NEAM met en relation des clients, des boutiques partenaires (NEAM Market) et des livreurs salariés de NEAM pour la livraison de courses et de colis (NEAM Express) à Libreville, Akanda et Owendo. Les autres services affichés sont en aperçu et ne peuvent pas encore être commandés.',
    ],
  },
  {
    title: 'Compte',
    body: [
      'Le compte est lié à votre numéro de téléphone. Vous êtes responsable des commandes passées depuis votre compte. NEAM peut suspendre un compte en cas de fausses commandes, de fraude ou de comportement abusif envers un marchand ou un livreur.',
    ],
  },
  {
    title: 'Prix et paiement',
    body: [
      'Les prix sont ceux affichés par la boutique au moment de la commande ; le serveur NEAM les vérifie et calcule les frais de livraison. Le total s’affiche avant validation. Le paiement se fait en espèces au livreur, à la remise. Mobile Money et carte bancaire seront proposés plus tard.',
    ],
  },
  {
    title: 'Livraison et code de remise',
    body: [
      'À la livraison, vous donnez au livreur le code à 4 chiffres affiché dans votre suivi. Ce code prouve la remise : ne le communiquez pas avant d’avoir reçu votre commande.',
    ],
  },
  {
    title: 'Annulation',
    body: [
      'Vous pouvez annuler gratuitement tant que la boutique n’a pas accepté la commande. Une commande qu’une boutique n’accepte pas dans les 45 minutes est annulée automatiquement. Au-delà, contactez le service client.',
    ],
  },
  {
    title: 'Boutiques partenaires',
    body: [
      'Les boutiques vendent leurs propres produits et restent responsables de leur qualité et de leur disponibilité. NEAM prélève une commission sur les articles vendus, fixée dans le contrat partenaire (10 % par défaut), et verse le solde à la boutique.',
    ],
  },
  {
    title: 'Livreurs',
    body: [
      'Les livreurs NEAM encaissent les espèces au nom de NEAM et les remettent selon la procédure interne. Leur position est partagée avec le client uniquement pendant une course.',
    ],
  },
  {
    title: 'Responsabilité',
    body: [
      `En cas d’article manquant ou abîmé, contactez le service client (${COMPANY.phone}) le jour même : NEAM étudie la demande avec la boutique. NEAM ne répond pas des retards dus à des circonstances extérieures (circulation, intempéries, coupures de réseau).`,
    ],
  },
  {
    title: 'Droit applicable',
    body: ['Ces conditions relèvent du droit gabonais. Tout litige est soumis aux juridictions de Libreville, après une tentative de règlement amiable.'],
  },
]

function LegalPage({ title, sections, other }: { title: string; sections: Section[]; other: { to: string; label: string } }) {
  return (
    <PageShell>
      <PageHeader title={title} />
      <article className="mx-auto max-w-2xl space-y-5 px-5 pb-10 pt-2 text-[15px] leading-relaxed text-neutral-700">
        <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Version provisoire du {UPDATED}, à faire valider avant publication.</p>
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="mb-1.5 text-base font-bold text-neutral-900">{s.title}</h2>
            {s.body.map((b, i) =>
              Array.isArray(b) ? (
                <ul key={i} className="mb-2 list-disc space-y-1 pl-5">{b.map((li) => <li key={li}>{li}</li>)}</ul>
              ) : (
                <p key={i} className="mb-2">{b}</p>
              ),
            )}
          </section>
        ))}
        <Link to={other.to} className="inline-block font-semibold text-neam-700 underline underline-offset-2">{other.label}</Link>
      </article>
    </PageShell>
  )
}

export function PrivacyPage() {
  return <LegalPage title="Confidentialité" sections={PRIVACY} other={{ to: '/conditions', label: 'Lire les conditions d’utilisation' }} />
}

export function TermsPage() {
  return <LegalPage title="Conditions d’utilisation" sections={TERMS} other={{ to: '/confidentialite', label: 'Lire la politique de confidentialité' }} />
}
