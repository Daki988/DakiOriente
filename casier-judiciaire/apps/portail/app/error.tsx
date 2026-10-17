'use client';

import { Icone, classesBouton } from '@casier/design-system';

/** PUB-16, ERG-05 : erreur inattendue, sans détail technique pour l'usager. */
export default function Erreur({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="cj-conteneur">
      <div className="p-erreur">
        <span className="p-erreur__pictogramme"><Icone nom="triangle-alert" taille={40} /></span>
        <p className="p-surtitre">Incident</p>
        <h1 className="p-titre-section">Le service rencontre une difficulté</h1>
        <p className="p-chapo">Vos informations n’ont pas été perdues. Réessayez dans quelques instants ; si le problème persiste, contactez le support.</p>
        <div className="p-page-entete__actions">
          <button type="button" className={classesBouton()} onClick={reset}><Icone nom="refresh-cw" taille={20} /><span>Réessayer</span></button>
          <a href="/" className={classesBouton({ variante: 'secondaire' })}><span>Retour à l’accueil</span></a>
        </div>
      </div>
    </div>
  );
}
