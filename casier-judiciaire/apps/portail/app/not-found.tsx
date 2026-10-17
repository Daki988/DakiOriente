import { PageSysteme } from '@/components/PageSysteme';

export default function PageIntrouvable() {
  return (
    <PageSysteme icone="search" surtitre="Page introuvable" titre="Cette page n’existe pas ou a été déplacée">
      <p>Vérifiez l’adresse saisie, ou repartez de l’accueil. Pour vérifier un bulletin, scannez de nouveau son QR code ou saisissez son code.</p>
    </PageSysteme>
  );
}
