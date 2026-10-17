import Link from 'next/link';
import { Alerte, Badge, Champ, Icone, ListeDescription, TuileIndicateur, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure, dateLongue } from '@/lib/format';
import type { BulletinAImprimer, EtatImpression } from '@/lib/types';
import { validerImpression } from '../actions';

const ONGLETS: { etat: EtatImpression | 'TOUS'; libelle: string }[] = [
  { etat: 'A_VALIDER', libelle: 'À valider' }, { etat: 'A_IMPRIMER', libelle: 'À imprimer' },
  { etat: 'IMPRIME', libelle: 'Imprimés' }, { etat: 'TOUS', libelle: 'Tous' },
];
const BADGES: Record<EtatImpression, { ton: 'alerte' | 'info' | 'succes' | 'erreur'; libelle: string }> = {
  A_VALIDER: { ton: 'alerte', libelle: 'À valider' }, A_IMPRIMER: { ton: 'info', libelle: 'Validé, à imprimer' },
  IMPRIME: { ton: 'succes', libelle: 'Imprimé' }, REVOQUE: { ton: 'erreur', libelle: 'Révoqué' },
};

const aujourdhui = (iso: string | null) =>
  !!iso && new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Africa/Libreville' }) === new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Libreville' });

/** Tableau de bord du validateur : contrôle puis impression des bulletins n°3 sur papier sécurisé, au guichet. */
export default async function Impression({ searchParams }: { searchParams: Promise<{ etat?: string }> }) {
  const s = await exigerSession('R07');
  const { etat } = await searchParams;
  const filtre = ONGLETS.find((o) => o.etat === etat)?.etat ?? 'A_VALIDER';
  const liste = await espaces.fileImpression(s);
  const visibles = filtre === 'TOUS' ? liste : liste.filter((b) => b.etat === filtre);
  const compte = (e: EtatImpression) => liste.filter((b) => b.etat === e).length;
  return (
    <>
      <TitreEspace titre="Impression des bulletins"
        chapo="Contrôlez l’identité du demandeur et le paiement, validez, puis imprimez sur un feuillet sécurisé numéroté. Chaque action est journalisée." />
      <MessageAction session={s} />
      <div className="cj-grille cj-grille--4">
        <TuileIndicateur valeur={compte('A_VALIDER')} libelle="À valider" />
        <TuileIndicateur valeur={compte('A_IMPRIMER')} libelle="À imprimer" />
        <TuileIndicateur valeur={liste.filter((b) => aujourdhui(b.imprimeLe)).length} libelle="Imprimés aujourd’hui" />
        <TuileIndicateur valeur={liste.reduce((n, b) => n + Math.max(0, b.impressions - 1), 0)} libelle="Réimpressions" detail="Motif obligatoire" />
      </div>
      <nav aria-label="Filtrer les bulletins" className="cj-actions">
        {ONGLETS.map((o) => (
          <Link key={o.etat} href={`/espace/impression?etat=${o.etat}`} aria-current={o.etat === filtre ? 'page' : undefined}
            className={classesBouton({ variante: o.etat === filtre ? 'primaire' : 'secondaire' })}>
            {o.libelle}{o.etat !== 'TOUS' && <> ({compte(o.etat)})</>}
          </Link>
        ))}
      </nav>
      {visibles.length === 0 && <Alerte type="succes" titre="Rien à traiter">Aucun bulletin dans cette liste.</Alerte>}
      {visibles.map((b) => <FicheImpression key={b.id} b={b} />)}
    </>
  );
}

function FicheImpression({ b }: { b: BulletinAImprimer }) {
  const badge = BADGES[b.etat];
  return (
    <section className="cj-panneau" aria-labelledby={`t-${b.id}`}>
      <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
        <h2 id={`t-${b.id}`}>{b.nom} {b.prenoms}</h2>
        <Badge ton={badge.ton}>{badge.libelle}</Badge>
      </div>
      <ListeDescription elements={[
        { terme: 'Bulletin', valeur: b.numero },
        { terme: 'Né(e) le', valeur: dateLongue(b.dateNaissance) },
        { terme: 'Émis le', valeur: dateHeure(b.dateEmission) },
        ...(b.paiement ? [{ terme: 'Paiement', valeur: b.paiement }] : []),
        ...(b.valideLe ? [{ terme: 'Validé', valeur: `${b.validePar ?? '—'}, le ${dateHeure(b.valideLe)}` }] : []),
        ...(b.imprimeLe ? [{ terme: 'Dernière impression', valeur: `${dateHeure(b.imprimeLe)} · feuillet ${b.feuillet}${b.impressions > 1 ? ` · ${b.impressions} impressions` : ''}` }] : []),
      ]} />
      {b.etat === 'A_VALIDER' && (
        <form action={validerImpression} className="cj-actions">
          <input type="hidden" name="id" value={b.id} />
          <p style={{ margin: 0 }}>J’ai contrôlé la pièce d’identité du demandeur et le paiement.</p>
          <button type="submit" className={classesBouton()}><Icone nom="check" taille={20} /><span>Valider</span></button>
        </form>
      )}
      {(b.etat === 'A_IMPRIMER' || b.etat === 'IMPRIME') && (
        <form action={`/espace/impression/${encodeURIComponent(b.id)}/imprimer`} method="post" target="_blank" className="cj-pile">
          <div className="cj-formulaire-ligne">
            <Champ id={`feuillet-${b.id}`} name="feuillet" libelle="N° du feuillet sécurisé" requis maxLength={40} placeholder="FS-2026-000119" autoComplete="off" />
            {b.etat === 'IMPRIME' && <Champ id={`motif-${b.id}`} name="motif" libelle="Motif de la réimpression" requis maxLength={500} placeholder="Feuillet abîmé" />}
          </div>
          <button type="submit" className={classesBouton({ variante: b.etat === 'IMPRIME' ? 'secondaire' : 'primaire' })} style={{ alignSelf: 'flex-start' }}>
            <Icone nom="printer" taille={20} /><span>{b.etat === 'IMPRIME' ? 'Réimprimer' : 'Imprimer'}</span>
          </button>
          <p className="p-note p-note--discrete"><Icone nom="info" taille={16} /><span>Le bulletin scellé s’ouvre dans un nouvel onglet : lancez l’impression, puis actualisez cette page.</span></p>
        </form>
      )}
    </section>
  );
}
