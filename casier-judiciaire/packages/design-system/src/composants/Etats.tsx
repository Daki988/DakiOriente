import type { ReactNode } from 'react';
import { Icone, type NomIcone } from './Icone';

/** Indicateur d'étapes d'un parcours (ERG-04 : cinq étapes au plus). */
export function IndicateurEtapes({ etapes, courante }: { etapes: string[]; courante: number }) {
  return (
    <nav aria-label="Étapes de la demande">
      <p className="cj-etapes__resume">
        Étape {courante + 1} sur {etapes.length} : <strong>{etapes[courante]}</strong>
      </p>
      <ol className="cj-etapes">
        {etapes.map((e, i) => {
          const etat = i < courante ? 'fait' : i === courante ? 'courant' : 'a-venir';
          return (
            <li key={e} className={`cj-etapes__item cj-etapes__item--${etat}`} aria-current={i === courante ? 'step' : undefined}>
              <span className="cj-etapes__barre" aria-hidden="true" />
              <span className="cj-etapes__libelle">{e}{i < courante && <span className="cj-visuellement-masque"> (terminée)</span>}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type EtatFrise = 'fait' | 'en-cours' | 'a-venir' | 'bloque';

/** Frise d'état d'une demande (PUB-07). */
export function FriseEtat({ etapes }: { etapes: { libelle: string; date?: string; etat: EtatFrise }[] }) {
  const lecteurs: Record<EtatFrise, string> = { fait: 'terminé', 'en-cours': 'en cours', 'a-venir': 'à venir', bloque: 'en attente' };
  return (
    <ol className="cj-frise">
      {etapes.map((e, i) => (
        <li key={i} className={`cj-frise__item cj-frise__item--${e.etat}`} aria-current={e.etat === 'en-cours' ? 'step' : undefined}>
          <span className="cj-frise__pastille" aria-hidden="true">{e.etat === 'fait' && <Icone nom="check" taille={16} epaisseur={3} />}</span>
          <span>
            <span className="cj-frise__libelle">{e.libelle}<span className="cj-visuellement-masque"> — {lecteurs[e.etat]}</span></span>
            {e.date && <span className="cj-frise__date"><br />{e.date}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

const ICONES_ALERTE: Record<string, NomIcone> = { info: 'info', succes: 'circle-check', avertissement: 'triangle-alert', erreur: 'circle-x' };

export function Alerte({ type = 'info', titre, children }: {
  type?: 'info' | 'succes' | 'avertissement' | 'erreur'; titre?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className={`cj-alerte cj-alerte--${type}`} role={type === 'erreur' ? 'alert' : 'status'}>
      <Icone nom={ICONES_ALERTE[type]} />
      <div className="cj-alerte__corps">
        {titre && <p className="cj-alerte__titre">{titre}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

export function Badge({ ton = 'neutre', children }: { ton?: 'succes' | 'info' | 'alerte' | 'erreur' | 'neutre'; children: ReactNode }) {
  return <span className={`cj-badge cj-badge--${ton}`}>{children}</span>;
}

export function Carte({ titre, href, icone, children, suite, accent = false }: {
  titre: ReactNode; href?: string; icone?: NomIcone; children?: ReactNode; suite?: ReactNode; accent?: boolean;
}) {
  return (
    <article className={'cj-carte' + (href ? ' cj-carte--lien' : '') + (accent ? ' cj-carte--accent' : '')}>
      {icone && <span className="cj-carte__icone"><Icone nom={icone} /></span>}
      <h3 className="cj-carte__titre">{href ? <a href={href}>{titre}</a> : titre}</h3>
      {children && <div className="cj-carte__texte">{children}</div>}
      {href && suite !== null && <span className="cj-carte__suite" aria-hidden="true">{suite ?? 'En savoir plus'}<Icone nom="arrow-right" taille={18} /></span>}
    </article>
  );
}

export function TuileIndicateur({ valeur, libelle, detail }: { valeur: ReactNode; libelle: ReactNode; detail?: ReactNode }) {
  return (
    <div className="cj-tuile">
      <span className="cj-tuile__valeur">{valeur}</span>
      <span className="cj-tuile__libelle">{libelle}</span>
      {detail && <span className="cj-tuile__detail">{detail}</span>}
    </div>
  );
}

/** Conteneur de tableau défilant : atteignable au clavier quand il déborde sur mobile (WCAG 2.1.1). */
export function ConteneurTableau({ libelle, children }: { libelle: string; children: ReactNode }) {
  return <div className="cj-tableau-conteneur" tabIndex={0} role="region" aria-label={libelle}>{children}</div>;
}

/** Pastille d'introduction d'une section (« Vos démarches », « FAQ »…). */
export function Pastille({ children }: { children: ReactNode }) {
  return <p className="cj-pastille">{children}</p>;
}
