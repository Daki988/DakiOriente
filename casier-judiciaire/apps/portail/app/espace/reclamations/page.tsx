import type { ReactNode } from 'react';
import { Alerte, Badge, ChampSelection, Champ, Icone, ListeDescription, TuileIndicateur, ZoneTexte, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure } from '@/lib/format';
import type { CategorieReclamation, Reclamation, StatutReclamation } from '@/lib/types';
import { deposerReclamation, prendreEnChargeReclamation, repondreReclamation } from '../actions';

const CATEGORIES: Record<CategorieReclamation, string> = {
  PAIEMENT: 'Paiement (débité mais non pris en compte, montant…)',
  BULLETIN_NON_RECU: 'Bulletin non reçu ou introuvable',
  ERREUR_CASIER: 'Erreur sur mon casier ou mon identité',
  AUTRE: 'Autre',
};
const STATUTS: Record<StatutReclamation, { ton: 'alerte' | 'info' | 'succes'; libelle: string }> = {
  OUVERTE: { ton: 'alerte', libelle: 'Reçue' }, EN_COURS: { ton: 'info', libelle: 'En cours de traitement' }, TRAITEE: { ton: 'succes', libelle: 'Réponse envoyée' },
};

/** Réclamations : l'usager signale un problème et suit la réponse ; le support (R11) les traite. */
export default async function Reclamations() {
  const s = await exigerSession('R01', 'R11');
  return s.roles.includes('R11') ? <FileSupport /> : <EspaceUsager />;
}

async function EspaceUsager() {
  const s = await exigerSession('R01');
  const liste = await espaces.mesReclamations(s);
  return (
    <>
      <TitreEspace titre="Réclamations"
        chapo="Un paiement non pris en compte, un bulletin non reçu, une erreur sur votre casier ? Signalez-le : le support vous répond dans cet espace." />
      <MessageAction session={s} />
      <section className="cj-panneau" aria-labelledby="titre-nouvelle">
        <h2 id="titre-nouvelle">Nouvelle réclamation</h2>
        <form action={deposerReclamation} className="cj-pile">
          <div className="cj-formulaire-ligne">
            <ChampSelection id="categorie" name="categorie" libelle="Motif" requis defaultValue="">
              <option value="" disabled>Choisissez</option>
              {Object.entries(CATEGORIES).map(([code, libelle]) => <option key={code} value={code}>{libelle}</option>)}
            </ChampSelection>
            <Champ id="numeroDossier" name="numeroDossier" libelle="Numéro de dossier" aide="Facultatif, par exemple CJ-2026-000087" maxLength={30} autoComplete="off" />
          </div>
          <ZoneTexte id="message" name="message" libelle="Décrivez le problème" requis rows={4} minLength={10} maxLength={2000}
            aide="Ne communiquez jamais votre code de suivi ni un code reçu par SMS." />
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
            <Icone nom="mail" taille={20} /><span>Envoyer la réclamation</span>
          </button>
        </form>
      </section>
      <h2 className="p-titre-section">Mes réclamations</h2>
      {liste.length === 0 && <Alerte type="info" titre="Aucune réclamation">Vous n’avez déposé aucune réclamation.</Alerte>}
      {liste.map((r) => <FicheReclamation key={r.id} r={r} />)}
    </>
  );
}

async function FileSupport() {
  const s = await exigerSession('R11');
  const liste = await espaces.fileReclamations(s);
  const n = (st: StatutReclamation) => liste.filter((r) => r.statut === st).length;
  const anciennes = liste.filter((r) => r.statut !== 'TRAITEE' && Date.now() - Date.parse(r.creeLe) > 48 * 3600_000).length;
  return (
    <>
      <TitreEspace titre="Réclamations des usagers"
        chapo="Prenez en charge chaque réclamation, vérifiez le dossier, puis répondez par écrit. L’usager voit la réponse dans son espace ; chaque étape est journalisée." />
      <MessageAction session={s} />
      <div className="cj-grille cj-grille--4">
        <TuileIndicateur valeur={n('OUVERTE')} libelle="Reçues" detail="À prendre en charge" />
        <TuileIndicateur valeur={n('EN_COURS')} libelle="En cours" />
        <TuileIndicateur valeur={anciennes} libelle="Plus de 48 heures" detail="Sans réponse" />
        <TuileIndicateur valeur={n('TRAITEE')} libelle="Traitées" />
      </div>
      {liste.length === 0 && <Alerte type="succes" titre="Rien à traiter">Aucune réclamation.</Alerte>}
      {liste.map((r) => (
        <FicheReclamation key={r.id} r={r}>
          {r.statut === 'OUVERTE' && (
            <form action={prendreEnChargeReclamation}>
              <input type="hidden" name="id" value={r.id} />
              <button type="submit" className={classesBouton({ variante: 'secondaire' })}><Icone nom="user-check" taille={20} /><span>Prendre en charge</span></button>
            </form>
          )}
          {r.statut !== 'TRAITEE' && (
            <form action={repondreReclamation} className="cj-pile">
              <input type="hidden" name="id" value={r.id} />
              <ZoneTexte id={`reponse-${r.id}`} name="reponse" libelle="Réponse à l’usager" requis rows={3} minLength={10} maxLength={2000}
                aide={r.categorie === 'ERREUR_CASIER' ? 'Pour une erreur sur le casier, transmettez au greffe qui ouvre une contestation, puis informez l’usager.' : undefined} />
              <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}><Icone nom="check" taille={20} /><span>Répondre et clore</span></button>
            </form>
          )}
        </FicheReclamation>
      ))}
    </>
  );
}

function FicheReclamation({ r, children }: { r: Reclamation; children?: ReactNode }) {
  const st = STATUTS[r.statut];
  return (
    <section className="cj-panneau" aria-labelledby={`r-${r.id}`}>
      <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
        <h3 id={`r-${r.id}`}>{r.numero} · {CATEGORIES[r.categorie].split(' (')[0]}</h3>
        <Badge ton={st.ton}>{st.libelle}</Badge>
      </div>
      <ListeDescription elements={[
        { terme: 'Déposée le', valeur: dateHeure(r.creeLe) },
        ...(r.numeroDossier ? [{ terme: 'Dossier', valeur: r.numeroDossier }] : []),
        { terme: 'Message', valeur: r.message },
        ...(r.prisEnChargeLe ? [{ terme: 'Prise en charge', valeur: dateHeure(r.prisEnChargeLe) }] : []),
      ]} />
      {r.reponse && <Alerte type="succes" titre={`Réponse du ${dateHeure(r.traiteLe)}`}>{r.reponse}</Alerte>}
      {children}
    </section>
  );
}
