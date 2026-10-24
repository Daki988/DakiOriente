'use client';
import { Icone, classesBouton } from '@casier/design-system';

/** Erreur inattendue ou service indisponible : message clair, sans détail technique. */
export default function Erreur({ reset }: { reset: () => void }) {
  return (
    <div className="cj-conteneur">
      <div className="p-erreur">
        <span className="p-erreur__pictogramme"><Icone nom="triangle-alert" taille={40} /></span>
        <p className="p-surtitre">Service momentanément indisponible</p>
        <h1 className="p-titre-section">La page n’a pas pu s’afficher</h1>
        <p className="p-chapo">Réessayez dans quelques instants.</p>
        <div className="p-page-entete__actions">
          <button type="button" onClick={reset} className={classesBouton()}><Icone nom="refresh-cw" taille={20} /><span>Réessayer</span></button>
        </div>
      </div>
    </div>
  );
}
