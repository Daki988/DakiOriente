import Link from 'next/link';
import { Icone, classesBouton } from '@casier/design-system';

export default function PageIntrouvable() {
  return (
    <div className="cj-conteneur">
      <div className="p-erreur">
        <span className="p-erreur__pictogramme"><Icone nom="search" taille={40} /></span>
        <p className="p-surtitre">Page introuvable</p>
        <h1 className="p-titre-section">Cette page n’existe pas ou a été déplacée</h1>
        <p className="p-chapo">Vérifiez l’adresse saisie, ou repartez de l’accueil.</p>
        <div className="p-page-entete__actions">
          <Link href="/" className={classesBouton()}><Icone nom="house" taille={20} /><span>Retour à l’accueil</span></Link>
        </div>
      </div>
    </div>
  );
}
