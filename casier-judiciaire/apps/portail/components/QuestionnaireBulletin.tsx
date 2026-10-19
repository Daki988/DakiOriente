'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Alerte, ChoixCarte, Icone, classesBouton, type NomIcone } from '@casier/design-system';

type Qui = 'moi' | 'employeur' | 'autre';
type Situation = 'gabon' | 'etranger-ne' | 'etranger-resident';

const QUI: { code: Qui; titre: string; description: string; icone: NomIcone }[] = [
  { code: 'moi', titre: 'Pour moi-même', description: 'Emploi, concours, visa, démarche administrative', icone: 'user' },
  { code: 'employeur', titre: 'Pour recruter ou instruire un dossier', description: 'Employeur, administration, organisme', icone: 'building-2' },
  { code: 'autre', titre: 'Pour une autre personne', description: 'Un proche, un candidat, un salarié', icone: 'users' },
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
          <Alerte type="info" titre="Demandez le bulletin n°3 à la personne">
            <p>La personne concernée demande son bulletin n°3 et vous le remet. Vous en vérifiez ensuite l’authenticité, gratuitement et sans compte.</p>
            <p className="cj-actions">
              <Link href="/verifier" className={classesBouton()}><Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span></Link>
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
      </div>
    </div>
  );
}
