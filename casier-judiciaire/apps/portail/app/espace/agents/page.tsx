import { Alerte, Badge, Champ, ChampSelection, Icone, ListeDescription, TuileIndicateur, classesBouton } from '@casier/design-system';

import { FormulaireCreationAgent } from '@/components/FormulaireCreationAgent';
import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { RefusMetier, ServiceIndisponible } from '@/lib/api';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateLongue } from '@/lib/format';
import type { CompteAgent } from '@/lib/types';
import { activerAgent, changerRoleAgent } from '../actions';

/** Comptes des agents (R13) : création, changement de rôle, désactivation motivée. Aucun compte n'est supprimé. */
export default async function Agents() {
  const s = await exigerSession('R13');
  let comptes: CompteAgent[] = [];
  let roles: Record<string, string> = {};
  let indisponible: string | null = null;
  try {
    [comptes, roles] = await Promise.all([espaces.agents(s), espaces.rolesAttribuables(s)]);
  } catch (e) {
    if (e instanceof RefusMetier || e instanceof ServiceIndisponible) indisponible = e.message;
    else throw e;
  }
  const actifs = comptes.filter((c) => c.actif);
  return (
    <>
      <TitreEspace titre="Comptes des agents"
        chapo="Créez les comptes des agents, changez leur rôle quand ils changent de poste, désactivez-les à leur départ. Chaque action est journalisée." />
      <MessageAction session={s} />
      {indisponible ? <Alerte type="avertissement" titre="Gestion des agents indisponible">{indisponible}</Alerte> : (
        <>
          <div className="cj-grille cj-grille--4">
            <TuileIndicateur valeur={actifs.length} libelle="Comptes actifs" />
            <TuileIndicateur valeur={comptes.length - actifs.length} libelle="Désactivés" />
            <TuileIndicateur valeur={actifs.filter((c) => c.role === 'R06' || c.role === 'R07').length} libelle="Agents des greffes" />
            <TuileIndicateur valeur={new Set(actifs.map((c) => c.juridiction).filter(Boolean)).size} libelle="Juridictions couvertes" />
          </div>
          <section className="cj-panneau" aria-labelledby="titre-creation">
            <h2 id="titre-creation">Nouveau compte</h2>
            <FormulaireCreationAgent roles={roles} />
          </section>
          <h2 className="p-titre-section">Comptes ({comptes.length})</h2>
          {comptes.map((c) => <FicheAgent key={c.identifiant} c={c} roles={roles} moi={c.identifiant === s.sujet} />)}
          <Alerte type="info" titre="Rôle d’administrateur">
            Il ne s’attribue pas depuis la plateforme, seulement dans la console du fournisseur d’identité : personne ne peut s’accorder ce droit.
          </Alerte>
        </>
      )}
    </>
  );
}

function FicheAgent({ c, roles, moi }: { c: CompteAgent; roles: Record<string, string>; moi: boolean }) {
  return (
    <section className="cj-panneau" aria-labelledby={`a-${c.identifiant}`}>
      <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
        <h3 id={`a-${c.identifiant}`}>{c.prenom} {c.nom}</h3>
        <Badge ton={c.actif ? 'succes' : 'neutre'}>{c.actif ? 'Actif' : 'Désactivé'}</Badge>
      </div>
      <ListeDescription elements={[
        { terme: 'Rôle', valeur: roles[c.role ?? ''] ?? c.role ?? '—' },
        ...(c.juridiction ? [{ terme: 'Juridiction', valeur: c.juridiction }] : []),
        { terme: 'Identifiant', valeur: c.login },
        { terme: 'Adresse', valeur: c.email },
        ...(c.creeLe ? [{ terme: 'Créé le', valeur: dateLongue(c.creeLe) }] : []),
      ]} />
      {!moi && (
        <details className="cj-faq">
          <summary>Modifier ce compte</summary>
          <div className="cj-pile">
            <form action={changerRoleAgent} className="cj-formulaire-ligne">
              <input type="hidden" name="id" value={c.identifiant} />
              <ChampSelection id={`role-${c.identifiant}`} name="role" libelle="Nouveau rôle" defaultValue={c.role ?? ''}>
                {Object.entries(roles).map(([code, libelle]) => <option key={code} value={code}>{libelle}</option>)}
              </ChampSelection>
              <Champ id={`jur-${c.identifiant}`} name="juridiction" libelle="Juridiction" defaultValue={c.juridiction ?? ''} maxLength={40}
                aide="Greffes et magistrats seulement" autoComplete="off" />
              <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-end' }}>
                <Icone nom="pencil" taille={20} /><span>Changer le rôle</span>
              </button>
            </form>
            <form action={activerAgent} className="cj-formulaire-ligne">
              <input type="hidden" name="id" value={c.identifiant} />
              <input type="hidden" name="actif" value={c.actif ? 'false' : 'true'} />
              {c.actif && <Champ id={`motif-${c.identifiant}`} name="motif" libelle="Motif de la désactivation" requis maxLength={500} placeholder="Départ du service" />}
              <button type="submit" className={classesBouton({ variante: c.actif ? 'tertiaire' : 'secondaire' })} style={{ alignSelf: 'flex-end' }}>
                <Icone nom={c.actif ? 'lock' : 'refresh-cw'} taille={20} /><span>{c.actif ? 'Désactiver' : 'Réactiver'}</span>
              </button>
            </form>
          </div>
        </details>
      )}
    </section>
  );
}
