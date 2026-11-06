import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export function NotFound() {
  return (
    <div className="panel" style={{ maxWidth: 520 }}>
      <Empty img="./img/poussin.webp" title="Page introuvable" text="Cette adresse n'existe pas ou n'est pas accessible avec votre profil.">
        <Link to="/" className="cta green" style={{ width: 'auto' }}>Retour à l'accueil</Link>
      </Empty>
    </div>
  );
}
