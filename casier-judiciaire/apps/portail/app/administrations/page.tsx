import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Administrations et employeurs', description: 'Vérifier gratuitement le bulletin n°3 remis par un candidat ou un usager.' };

/** PUB-05 : un employeur ou une administration vérifie le bulletin remis par la personne, il ne le demande pas. */
export default function Administrations() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Administrations et employeurs' }]} surtitre="Professionnels" titre="Administrations et employeurs"
        chapo="Employeurs et administrations vérifient le bulletin n°3 que leur remet la personne concernée." />
      <div className="cj-conteneur p-contenu">
        <div className="cj-grille cj-grille--2">
          <section className="p-encadre cj-pile" aria-labelledby="titre-employeurs">
            <span className="cj-carte__icone"><Icone nom="building-2" /></span>
            <h2 id="titre-employeurs" className="p-titre-encadre">Vous êtes employeur</h2>
            <p>
              Vous ne demandez pas le bulletin de votre candidat : c’est lui qui le demande et vous le remet. Vous vérifiez ensuite qu’il est authentique
              et valable, gratuitement et sans compte.
            </p>
            <Link href="/verifier" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
              <Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span>
            </Link>
          </section>
          <section className="p-encadre cj-pile" aria-labelledby="titre-administrations">
            <span className="cj-carte__icone"><Icone nom="landmark" /></span>
            <h2 id="titre-administrations" className="p-titre-encadre">Vous êtes une administration</h2>
            <p>
              Pour un recrutement, un concours ou une autorisation, demandez à la personne son bulletin n°3, puis vérifiez-le de la même façon :
              le code ou le QR code renvoie au registre officiel.
            </p>
            <Link href="/verifier" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>
              <Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span>
            </Link>
          </section>
        </div>
        <Alerte type="info" titre="Ce que montre la vérification">
          Le numéro du bulletin, l’identité de la personne, ses dates d’émission et de validité, et s’il a été révoqué. Elle ne montre jamais le contenu du casier judiciaire.
        </Alerte>
      </div>
    </>
  );
}
