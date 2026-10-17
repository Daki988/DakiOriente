import { Champ, Icone, classesBouton } from '@casier/design-system';

/** Saisie du code court imprimé sur le bulletin (BUL-03). Formulaire GET : fonctionne sans JavaScript (PUB-18). */
export function FormulaireVerification({ valeur, erreur }: { valeur?: string; erreur?: string }) {
  return (
    <form className="p-verifier__formulaire p-verifier__formulaire--bordure" action="/verifier" method="get" noValidate>
      <Champ id="code" name="code" libelle="Code de vérification" defaultValue={valeur} erreur={erreur}
        aide="12 caractères imprimés en bas du bulletin, avec ou sans tirets. Exemple : DEMO-VALI-DE26"
        autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={20} className="cj-champ__saisie--code" requis />
      <button type="submit" className={classesBouton({ pleineLargeur: true })}>
        <Icone nom="shield-check" taille={20} /><span>Vérifier le bulletin</span>
      </button>
      <p className="p-note"><Icone nom="qr-code" taille={18} /><span>Avec un téléphone, scannez simplement le QR code du bulletin : la vérification s’ouvre directement.</span></p>
    </form>
  );
}
