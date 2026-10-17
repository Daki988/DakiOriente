import type { Metadata } from 'next';
import Link from 'next/link';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { BulletinSpecimen } from '@/components/BulletinSpecimen';
import { EntetePage } from '@/components/EntetePage';
import { TableauTarifs } from '@/components/TableauTarifs';
import { tarifs } from '@/lib/api';

export const metadata: Metadata = { title: 'Le bulletin n°3', description: 'Ce qu’est le bulletin n°3, qui peut le demander, les pièces, le tarif et le délai.' };
export const dynamic = 'force-dynamic';

/** PUB-02 : définition, pour qui, pièces, tarif par profil, délai. */
export default async function BulletinN3() {
  const liste = await tarifs().catch(() => []);
  return (
    <>
      <EntetePage fil={[{ libelle: 'Le bulletin n°3' }]} surtitre="Comprendre" titre="Le bulletin n°3, extrait de votre casier judiciaire"
        chapo="Le document qu’on vous demande pour un emploi, un concours ou certaines démarches. Il est personnel et se demande en ligne."
        actions={<Link href="/demande" className={classesBouton({ taille: 'l' })}><Icone nom="file-text" taille={20} /><span>Demander mon bulletin</span></Link>}
        visuel={<BulletinSpecimen />} />
      <div className="cj-conteneur p-contenu p-contenu--colonnes">
        <div className="p-prose">
          <h2>Qu’est-ce que le bulletin n°3 ?</h2>
          <p>
            Le casier judiciaire conserve les condamnations prononcées par les juridictions. Le bulletin n°3 en est l’extrait le plus court :
            il ne mentionne que certaines condamnations, selon les règles du Code de procédure pénale (Titre VIII). Le plus souvent, il porte la mention « Néant ».
          </p>
          <h2>Qui peut le demander ?</h2>
          <p>Uniquement la personne concernée, après vérification de son identité. Personne ne peut demander le bulletin n°3 d’une autre personne, pas même un employeur.</p>
          <h2>Les pièces à prévoir</h2>
          <ul>
            <li>Avec l’identité numérique nationale : votre CNIE suffit, vos informations sont vérifiées automatiquement.</li>
            <li>Sans identité numérique : votre acte de naissance, votre acte de mariage si la mention n’y figure pas, votre passeport ou titre de séjour, et une photo de vous prise pendant la demande.</li>
          </ul>
          <h2>Le délai</h2>
          <p>
            24 heures au plus après le paiement. Quand votre identité est certaine, le bulletin est émis immédiatement. Si un agent doit vérifier
            votre identité et vous demande une pièce, le délai est suspendu jusqu’à sa réception.
          </p>
          <h2>Un document numérique, vérifiable par tous</h2>
          <p>
            Le bulletin est un fichier PDF scellé électroniquement par le Ministère de la Justice. Il porte un QR code et un code de vérification :
            la personne à qui vous le remettez peut vérifier en quelques secondes qu’il est authentique et toujours valable.
          </p>
          <h2>Tarifs</h2>
          <TableauTarifs tarifs={liste} acte="BULLETIN_N3" />
        </div>
        <aside className="p-encadre cj-pile" aria-label="En bref">
          <h2 className="p-titre-encadre">En bref</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="user-check" />Personnel : vous seul pouvez le demander.</li>
            <li><Icone nom="timer" />24 heures au plus, souvent immédiat.</li>
            <li><Icone nom="smartphone" />Paiement par Mobile Money ou carte.</li>
            <li><Icone nom="qr-code" />Vérifiable par QR code, gratuitement.</li>
          </ul>
          <Alerte type="info">Le tutoriel vidéo sous-titré sera publié avec l’ouverture du service.</Alerte>
        </aside>
      </div>
    </>
  );
}
