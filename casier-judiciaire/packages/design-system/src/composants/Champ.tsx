import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icone, type NomIcone } from './Icone';

type Commun = { id: string; libelle: ReactNode; aide?: ReactNode; erreur?: string; requis?: boolean };

function Entete({ id, libelle, aide, requis }: Omit<Commun, 'erreur'>) {
  return (
    <>
      <label className="cj-champ__libelle" htmlFor={id}>
        {libelle}{requis && <span className="cj-requis" aria-hidden="true">*</span>}
      </label>
      {aide && <p className="cj-champ__aide" id={`${id}-aide`}>{aide}</p>}
    </>
  );
}

function Erreur({ id, erreur }: { id: string; erreur?: string }) {
  return erreur
    ? <p className="cj-champ__erreur" id={`${id}-erreur`}><Icone nom="circle-x" taille={18} />{erreur}</p>
    : null;
}

function decrit(id: string, aide?: ReactNode, erreur?: string) {
  return [aide && `${id}-aide`, erreur && `${id}-erreur`].filter(Boolean).join(' ') || undefined;
}

/** Champ de saisie : libellé, aide et message d'erreur qui dit quoi corriger (ERG-05). */
export function Champ({ id, libelle, aide, erreur, requis, className, ...reste }: Commun & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={'cj-champ' + (erreur ? ' cj-champ--erreur' : '')}>
      <Entete id={id} libelle={libelle} aide={aide} requis={requis} />
      <Erreur id={id} erreur={erreur} />
      <input id={id} name={reste.name ?? id} required={requis} aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(id, aide, erreur)} className={['cj-champ__saisie', className].filter(Boolean).join(' ')} {...reste} />
    </div>
  );
}

export function ChampSelection({ id, libelle, aide, erreur, requis, children, ...reste }:
  Commun & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={'cj-champ' + (erreur ? ' cj-champ--erreur' : '')}>
      <Entete id={id} libelle={libelle} aide={aide} requis={requis} />
      <Erreur id={id} erreur={erreur} />
      <select id={id} name={reste.name ?? id} required={requis} aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(id, aide, erreur)} className="cj-champ__saisie" {...reste}>{children}</select>
    </div>
  );
}

/** Option du sélecteur de profil, présentée en carte (VIS-10). */
export function ChoixCarte({ name, value, titre, description, icone, ...reste }: {
  name: string; value: string; titre: string; description?: string; icone?: NomIcone;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'value'>) {
  return (
    <label className="cj-choix-carte">
      <input type="radio" name={name} value={value} {...reste} />
      {icone && <span className="cj-choix-carte__icone"><Icone nom={icone} /></span>}
      <span>
        <span className="cj-choix-carte__titre">{titre}</span>
        {description && <span className="cj-choix-carte__description">{description}</span>}
      </span>
      <span className="cj-choix-carte__puce" aria-hidden="true" />
    </label>
  );
}

/** Case à cocher (consentement, attestation) : la zone cliquable couvre le texte (ERG-01). */
export function CaseACocher({ id, libelle, aide, erreur, requis, ...reste }: Commun & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className={'cj-case' + (erreur ? ' cj-case--erreur' : '')}>
      <Erreur id={id} erreur={erreur} />
      <input type="checkbox" id={id} name={reste.name ?? id} required={requis} aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit(id, aide, erreur)} {...reste} />
      <label htmlFor={id}>
        {libelle}{requis && <span className="cj-requis" aria-hidden="true">*</span>}
        {aide && <span className="cj-champ__aide" id={`${id}-aide`}>{aide}</span>}
      </label>
    </div>
  );
}

/** Zone de texte libre (réclamation, message). */
export function ZoneTexte({ id, libelle, aide, erreur, requis, ...reste }: Commun & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={'cj-champ' + (erreur ? ' cj-champ--erreur' : '')}>
      <Entete id={id} libelle={libelle} aide={aide} requis={requis} />
      <Erreur id={id} erreur={erreur} />
      <textarea id={id} name={reste.name ?? id} required={requis} aria-invalid={erreur ? true : undefined} rows={6}
        aria-describedby={decrit(id, aide, erreur)} className="cj-champ__saisie cj-champ__saisie--zone" {...reste} />
    </div>
  );
}

/**
 * Date en trois champs (jour, mois, année) : plus simple qu'un calendrier sur un téléphone d'entrée de gamme (ERG-02).
 * Valeur au format « AAAA-M-J », parties éventuellement vides ; la validation complète se fait hors du composant.
 */
export function ChampDate({ id, libelle, aide, erreur, requis, valeur, onChange }: Commun & { valeur: string; onChange: (v: string) => void }) {
  const [annee = '', mois = '', jour = ''] = valeur.split('-');
  const maj = (a: string, m: string, j: string) => onChange(`${a}-${m}-${j}`);
  const chiffres = (s: string, n: number) => s.replace(/\D/g, '').slice(0, n);
  return (
    <fieldset className={'cj-champ cj-champ-date' + (erreur ? ' cj-champ--erreur' : '')} aria-describedby={decrit(id, aide, erreur)}>
      <legend className="cj-champ__libelle">{libelle}{requis && <span className="cj-requis" aria-hidden="true">*</span>}</legend>
      {aide && <p className="cj-champ__aide" id={`${id}-aide`}>{aide}</p>}
      <Erreur id={id} erreur={erreur} />
      <div className="cj-champ-date__parties">
        <label>Jour<input id={id} className="cj-champ__saisie" inputMode="numeric" autoComplete="bday-day" maxLength={2} value={jour}
          aria-invalid={erreur ? true : undefined} onChange={(e) => maj(annee, mois, chiffres(e.target.value, 2))} /></label>
        <label>Mois<input id={`${id}-mois`} className="cj-champ__saisie" inputMode="numeric" autoComplete="bday-month" maxLength={2} value={mois}
          aria-invalid={erreur ? true : undefined} onChange={(e) => maj(annee, chiffres(e.target.value, 2), jour)} /></label>
        <label className="cj-champ-date__annee">Année<input id={`${id}-annee`} className="cj-champ__saisie" inputMode="numeric" autoComplete="bday-year"
          maxLength={4} value={annee} aria-invalid={erreur ? true : undefined} onChange={(e) => maj(chiffres(e.target.value, 4), mois, jour)} /></label>
      </div>
    </fieldset>
  );
}
