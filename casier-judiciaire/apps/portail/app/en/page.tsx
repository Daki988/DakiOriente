import type { Metadata } from 'next';
import Link from 'next/link';
import { Icone, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = {
  title: 'Criminal record certificate — English',
  description: 'How to obtain and verify a Gabonese criminal record certificate (bulletin n°3) online. Information in English.',
};

/** Information in English for foreign residents, the diaspora and foreign employers (multilingual service, as in Spain or Estonia). */
export default function Anglais() {
  return (
    <div lang="en">
      <EntetePage fil={[{ libelle: 'English' }]} surtitre="Information in English" titre="Gabonese criminal record certificate"
        chapo="Request your criminal record certificate (bulletin n°3) online, pay by mobile money, card or at the Public Treasury, and receive it within 24 hours." />
      <div className="cj-conteneur p-contenu p-etroit p-prose">
        <h2>Who can apply?</h2>
        <p>Any person, for themselves only: Gabonese citizens born in Gabon or abroad, and foreign nationals living in Gabon.
          The certificate is personal: nobody can request it on your behalf.</p>
        <h2>How does it work?</h2>
        <ol>
          <li>Fill in the online form in five steps (identity, contact details, payment).</li>
          <li>Pay by Airtel Money, Moov Money, bank card, or in cash at the Public Treasury with your payment notice.
            If you pay at the Treasury, enter the payment reference shown on your receipt.</li>
          <li>Your certificate is issued within 24 hours at most, often immediately.</li>
          <li>Download it: it is electronically sealed and carries a QR code. You may also collect a printed copy at the court registry.</li>
        </ol>
        <h2>For employers and foreign authorities</h2>
        <p>Check the authenticity of a certificate free of charge, without an account: scan its QR code or enter its 12-character
          verification code. You can also upload the PDF file: the electronic seal and integrity are checked. The criminal record
          itself is never displayed.</p>
        <p className="cj-actions">
          <Link href="/demande" className={classesBouton()} lang="fr"><Icone nom="file-text" taille={20} /><span>Faire une demande</span></Link>
          <Link href="/verifier" className={classesBouton({ variante: 'secondaire' })} lang="fr"><Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span></Link>
        </p>
        <p className="p-note">The online forms are in French. For assistance, use the <Link href="/contact" lang="fr">contact page</Link>.</p>
      </div>
    </div>
  );
}
