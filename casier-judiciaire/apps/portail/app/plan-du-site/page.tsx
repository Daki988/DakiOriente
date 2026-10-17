import type { Metadata } from 'next';
import Link from 'next/link';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Plan du site' };

const PLAN: { titre: string; liens: [string, string][] }[] = [
  { titre: 'Démarches', liens: [['Demander un bulletin n°3', '/demande'], ['Suivre une demande', '/suivi'], ['Payer au Trésor public', '/paiement-tresor'], ['De quel document ai-je besoin ?', '/quel-bulletin'], ['Vérifier un bulletin', '/verifier'], ['Tarifs', '/tarifs'], ['Se connecter', '/connexion']] },
  { titre: 'Informations', liens: [['Le bulletin n°3', '/bulletin-n3'], ['Gabonais de l’étranger', '/diaspora'], ['Étrangers résidant au Gabon', '/etrangers'], ['Administrations et employeurs', '/administrations'], ['Actualités', '/actualites'], ['Le service en chiffres', '/chiffres']] },
  { titre: 'Aide', liens: [['Aide et questions fréquentes', '/aide'], ['Contact et réclamation', '/contact']] },
  { titre: 'Informations légales', liens: [['Mentions légales', '/mentions-legales'], ['Conditions générales d’utilisation', '/cgu'], ['Confidentialité', '/confidentialite'], ['Cookies', '/cookies'], ['Accessibilité', '/accessibilite']] },
];

export default function PlanDuSite() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Plan du site' }]} titre="Plan du site" />
      <div className="cj-conteneur p-contenu cj-grille cj-grille--2">
        {PLAN.map((g) => (
          <section key={g.titre} className="p-prose" aria-labelledby={`plan-${g.titre}`}>
            <h2 id={`plan-${g.titre}`}>{g.titre}</h2>
            <ul>{g.liens.map(([l, h]) => <li key={h}><Link href={h}>{l}</Link></li>)}</ul>
          </section>
        ))}
      </div>
    </>
  );
}
