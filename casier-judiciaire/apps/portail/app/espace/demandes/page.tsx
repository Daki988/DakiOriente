import { Alerte, Badge, FriseEtat, Icone, ZoneTexte, classesBouton, type EtatFrise } from '@casier/design-system';
import Link from 'next/link';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { fcfa } from '@/lib/contenu';
import { dateHeure } from '@/lib/format';
import type { DemandeUsager, StatutDemande } from '@/lib/types';
import { deposerPiece } from '../actions';

const TON: Record<StatutDemande, 'succes' | 'info' | 'alerte' | 'erreur' | 'neutre'> = {
  EN_ATTENTE_PAIEMENT: 'alerte', EN_TRAITEMENT: 'info', A_TRAITER_PAR_AGENT: 'info', EN_ATTENTE_PIECE: 'alerte', DELIVREE: 'succes', REJETEE: 'erreur',
};

function frise(d: DemandeUsager): { libelle: string; date?: string; etat: EtatFrise }[] {
  return d.frise.map((e, i) => {
    const derniere = i === d.frise.length - 1;
    const etat: EtatFrise = !derniere || d.statut === 'DELIVREE' ? 'fait' : d.statut === 'EN_ATTENTE_PIECE' || d.statut === 'REJETEE' ? 'bloque' : 'en-cours';
    return { libelle: e.libelle, date: dateHeure(e.horodatage), etat };
  });
}

/** DSH-01, DSH-02 : demandes de l'usager, bulletins à télécharger, pièces à déposer. */
export default async function MesDemandes() {
  const s = await exigerSession('R01');
  const demandes = await espaces.mesDemandes(s);
  return (
    <>
      <TitreEspace titre="Mes demandes" chapo="Vos demandes de bulletin n°3, leur état et vos bulletins à télécharger."
        actions={<Link href="/demande" className={classesBouton()}><Icone nom="plus" taille={20} /><span>Nouvelle demande</span></Link>} />
      <MessageAction session={s} />
      {demandes.length === 0 && <Alerte type="info" titre="Aucune demande">Vous n’avez pas encore fait de demande.</Alerte>}
      {demandes.map((d) => (
        <section key={d.id} className="cj-panneau" aria-labelledby={`titre-${d.id}`}>
          <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
            <h2 id={`titre-${d.id}`}>Dossier {d.numeroDossier}</h2>
            <Badge ton={TON[d.statut]}>{d.libelle}</Badge>
          </div>
          <p className="p-note p-note--discrete">
            Déposée le {dateHeure(d.creeLe)} · {fcfa(d.montantFcfa)}{d.tarifProvisoire ? ' (tarif provisoire)' : ''}
            {d.echeance && d.statut !== 'DELIVREE' && d.statut !== 'REJETEE' ? ` · réponse au plus tard le ${dateHeure(d.echeance)}` : ''}
          </p>
          <FriseEtat etapes={frise(d)} />
          {d.statut === 'DELIVREE' && d.bulletinId && (
            <div className="cj-actions">
              <a href={`/espace/bulletins/${encodeURIComponent(d.bulletinId)}/pdf`} className={classesBouton()} download>
                <Icone nom="download" taille={20} /><span>Télécharger le bulletin {d.bulletinNumero} (PDF scellé)</span>
              </a>
              <span className="p-note p-note--discrete">Valable 3 mois. Toute personne peut vérifier son authenticité avec le QR code.</span>
            </div>
          )}
          {d.statut === 'EN_ATTENTE_PIECE' && (
            <form action={deposerPiece} className="cj-pile">
              <Alerte type="avertissement" titre="Une pièce vous est demandée">{d.pieceDemandee}</Alerte>
              <input type="hidden" name="id" value={d.id} />
              <ZoneTexte id={`piece-${d.id}`} name="piece" libelle="Pièce transmise" requis rows={2} maxLength={300}
                aide="Indiquez la pièce transmise (le dépôt de fichier sera relié au stockage sécurisé du Ministère)." />
              <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
                <Icone nom="upload" taille={20} /><span>Transmettre la pièce</span>
              </button>
            </form>
          )}
          {d.statut === 'REJETEE' && d.motifRejet && <Alerte type="erreur" titre="Demande rejetée">{d.motifRejet}</Alerte>}
          {d.avis.length > 0 && (
            <details className="cj-faq">
              <summary>Messages reçus ({d.avis.length})<Icone nom="chevron-down" /></summary>
              <ul className="cj-pile" style={{ listStyle: 'none', padding: 0 }}>
                {d.avis.map((a, i) => <li key={i}><strong>{a.canal}</strong> · {dateHeure(a.horodatage)}<br />{a.message}</li>)}
              </ul>
            </details>
          )}
        </section>
      ))}
    </>
  );
}
