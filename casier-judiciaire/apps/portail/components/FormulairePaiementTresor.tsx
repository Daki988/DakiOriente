'use client';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Alerte, Champ, Icone, classesBouton } from '@casier/design-system';

import { enregistrerPaiementTresor, type EtatTresor } from '@/app/paiement-tresor/actions';
import { AvisSatisfaction } from './AvisSatisfaction';

/** Saisie de l'identifiant de paiement du Trésor, puis accès au bulletin. */
export function FormulairePaiementTresor({ numeroInitial }: { numeroInitial: string }) {
  const [etat, action, enCours] = useActionState<EtatTresor, FormData>(enregistrerPaiementTresor, null);
  // Champs contrôlés : ils restent remplis après un refus (React réinitialise les champs libres après l'envoi).
  const [numero, setNumero] = useState(numeroInitial);
  const [code, setCode] = useState('');
  const [quittance, setQuittance] = useState('');
  if (etat?.ok) {
    const p = etat.paiement;
    return (
      <div className="cj-pile" aria-live="polite">
        {p.statut === 'DELIVREE' ? (
          <>
            <Alerte type="succes" titre="Paiement enregistré : votre bulletin est délivré">
              Dossier {p.numeroDossier}{p.numeroBulletin ? ` · bulletin ${p.numeroBulletin}` : ''}. Il est scellé électroniquement et vérifiable par QR code.
            </Alerte>
            {p.demo ? (
              <form action="/paiement-tresor/bulletin" method="post">
                <input type="hidden" name="numero" value={etat.numero} />
                <input type="hidden" name="code" value={etat.code} />
                <input type="hidden" name="quittance" value={etat.quittance} />
                <button type="submit" className={classesBouton()}><Icone nom="download" taille={20} /><span>Télécharger mon bulletin (PDF scellé)</span></button>
              </form>
            ) : (
              <Link href="/espace/demandes" className={classesBouton()}><Icone nom="download" taille={20} /><span>Télécharger depuis mon espace</span></Link>
            )}
            <p className="p-note"><Icone nom="printer" taille={18} /><span>Vous pouvez aussi le retirer imprimé sur papier sécurisé au greffe, muni de votre pièce d’identité.</span></p>
            <AvisSatisfaction parcours="TRESOR" />
          </>
        ) : (
          <Alerte type="info" titre="Paiement enregistré">
            Votre demande est vérifiée par un agent du casier. Le bulletin vous sera délivré en 24 heures au plus ; suivez-la avec votre code.
          </Alerte>
        )}
      </div>
    );
  }
  const e = etat && !etat.ok ? etat.erreurs ?? {} : {};
  return (
    <form action={action} className="cj-pile" noValidate>
      {etat && !etat.ok && etat.message && <Alerte type="erreur" titre="Paiement non enregistré">{etat.message}</Alerte>}
      <Champ id="numero" libelle="Numéro de dossier" requis value={numero} onChange={(ev) => setNumero(ev.target.value)} placeholder="CJ-2026-000123" autoComplete="off"
        erreur={e.numero} maxLength={20} />
      <Champ id="code" libelle="Code de suivi" requis inputMode="numeric" maxLength={6} autoComplete="one-time-code"
        value={code} onChange={(ev) => setCode(ev.target.value)}
        aide="6 chiffres, reçus par SMS avec l’avis de paiement." erreur={e.code} />
      <Champ id="quittance" libelle="Identifiant de paiement" requis maxLength={30} autoComplete="off" placeholder="TP-2026-104512"
        value={quittance} onChange={(ev) => setQuittance(ev.target.value)}
        aide="Numéro de la quittance remise par le Trésor public." erreur={e.quittance} />
      <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }} disabled={enCours}>
        <Icone nom="check" taille={20} /><span>{enCours ? 'Vérification…' : 'Valider mon paiement'}</span>
      </button>
    </form>
  );
}
