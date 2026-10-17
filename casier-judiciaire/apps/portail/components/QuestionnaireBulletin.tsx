'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Alerte, ChoixCarte, Icone, classesBouton, type NomIcone } from '@casier/design-system';

type Qui = 'moi' | 'employeur' | 'autre' | 'justice';
type Situation = 'gabon' | 'etranger-ne' | 'etranger-resident';

const QUI: { code: Qui; titre: string; description: string; icone: NomIcone }[] = [
  { code: 'moi', titre: 'Pour moi-même', description: 'Emploi, concours, visa, démarche administrative', icone: 'user' },
  { code: 'employeur', titre: 'Pour recruter ou instruire un dossier', description: 'Employeur, administration, organisme', icone: 'building-2' },
  { code: 'autre', titre: 'Pour une autre personne', description: 'Un proche, un candidat, un salarié', icone: 'users' },
  { code: 'justice', titre: 'Pour une procédure judiciaire', description: 'Magistrat, greffier, officier de police judiciaire', icone: 'scale' },
];
const SITUATIONS: { code: Situation; titre: string; icone: NomIcone }[] = [
  { code: 'gabon', titre: 'Je suis Gabonais, né au Gabon', icone: 'house' },
  { code: 'etranger-ne', titre: 'Je suis Gabonais, né à l’étranger', icone: 'plane' },
  { code: 'etranger-resident', titre: 'Je suis étranger et je réside au Gabon', icone: 'globe' },
];

/** « De quel document ai-je besoin ? » (inspiré des questionnaires d'orientation de GOV.UK) : deux questions, une réponse. */
export function QuestionnaireBulletin() {
  const [qui, setQui] = useState<Qui | null>(null);
  const [situation, setSituation] = useState<Situation | null>(null);
  return (
    <div className="cj-pile">
      <fieldset className="cj-choix">
        <legend>1. Pour qui avez-vous besoin d’un extrait de casier judiciaire ?</legend>
        {QUI.map((q) => (
          <ChoixCarte key={q.code} name="qui" value={q.code} titre={q.titre} description={q.description} icone={q.icone}
            checked={qui === q.code} onChange={() => { setQui(q.code); setSituation(null); }} />
        ))}
      </fieldset>

      {qui === 'moi' && (
        <fieldset className="cj-choix">
          <legend>2. Quelle est votre situation ?</legend>
          {SITUATIONS.map((s) => (
            <ChoixCarte key={s.code} name="situation" value={s.code} titre={s.titre} icone={s.icone}
              checked={situation === s.code} onChange={() => setSituation(s.code)} />
          ))}
        </fieldset>
      )}

      <div aria-live="polite" className="cj-pile">
        {qui === 'moi' && situation && (
          <Alerte type="succes" titre="Il vous faut un bulletin n°3">
            <p>C’est l’extrait que vous demandez pour vous-même. Il est délivré en 24 heures au plus, scellé et vérifiable par QR code.
              {situation !== 'gabon' && ' Votre demande est traitée par l’administration centrale.'}</p>
            <p className="cj-actions">
              <Link href="/demande" className={classesBouton()}><Icone nom="file-text" taille={20} /><span>Faire ma demande</span></Link>
              <Link href={situation === 'gabon' ? '/bulletin-n3' : situation === 'etranger-ne' ? '/diaspora' : '/etrangers'}
                className={classesBouton({ variante: 'secondaire' })}>En savoir plus</Link>
            </p>
          </Alerte>
        )}
        {qui === 'employeur' && (
          <Alerte type="info" titre="Deux possibilités">
            <p>Un employeur privé demande au candidat son bulletin n°3, puis en vérifie l’authenticité gratuitement. Une administration
              habilitée par la loi obtient le bulletin n°2 depuis son espace.</p>
            <p className="cj-actions">
              <Link href="/verifier" className={classesBouton()}><Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span></Link>
              <Link href="/administrations" className={classesBouton({ variante: 'secondaire' })}>Administrations habilitées</Link>
            </p>
          </Alerte>
        )}
        {qui === 'autre' && (
          <Alerte type="avertissement" titre="Le bulletin n°3 est strictement personnel">
            <p>Seule la personne concernée peut le demander. Demandez-lui de faire sa demande en ligne et de vous remettre son bulletin :
              vous pourrez en vérifier l’authenticité.</p>
            <p className="cj-actions"><Link href="/verifier" className={classesBouton({ variante: 'secondaire' })}>Vérifier un bulletin reçu</Link></p>
          </Alerte>
        )}
        {qui === 'justice' && (
          <Alerte type="info" titre="Bulletin n°1, réservé à l’autorité judiciaire">
            <p>Il se consulte depuis l’accès réservé communiqué par votre juridiction, avec un numéro de procédure.</p>
            <p className="cj-actions"><Link href="/connexion" className={classesBouton({ variante: 'secondaire' })}>Se connecter</Link></p>
          </Alerte>
        )}
      </div>
    </div>
  );
}
