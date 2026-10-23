'use client';
import { useActionState, useState } from 'react';
import { Alerte, Champ, ChampSelection, Icone, classesBouton } from '@casier/design-system';

import { creerAgent, type EtatCreationAgent } from '@/app/espace/actions-etat';

const AVEC_JURIDICTION = ['R05', 'R06', 'R07'];

/** Création du compte d'un agent ; le mot de passe provisoire n'est affiché qu'une fois. */
export function FormulaireCreationAgent({ roles }: { roles: Record<string, string> }) {
  const [etat, action, enCours] = useActionState<EtatCreationAgent, FormData>(creerAgent, null);
  // Champs contrôlés : ils restent remplis après un refus.
  const [v, setV] = useState({ prenom: '', nom: '', login: '', email: '', role: '', juridiction: '' });
  const maj = (cle: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [cle]: e.target.value });
  if (etat?.ok) {
    const c = etat.resultat.compte;
    return (
      <div className="cj-pile" aria-live="polite">
        <Alerte type="succes" titre={`Compte créé : ${c.prenom} ${c.nom}`}>
          <p>Identifiant : <strong>{c.login}</strong> · rôle {roles[c.role ?? ''] ?? c.role}{c.juridiction ? ` · ${c.juridiction}` : ''}</p>
          <p>Mot de passe provisoire : <strong className="p-code">{etat.resultat.motDePasseProvisoire}</strong></p>
          <p>Remettez-le à l’agent par un canal sûr. Il ne sera plus affiché : à la première connexion, l’agent choisit son mot de passe et active son double facteur.</p>
        </Alerte>
        <a href="/espace/agents" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>
          <Icone nom="plus" taille={20} /><span>Créer un autre compte</span>
        </a>
      </div>
    );
  }
  return (
    <form action={action} className="cj-pile">
      {etat && !etat.ok && <Alerte type="erreur" titre="Compte non créé">{etat.erreur}</Alerte>}
      <div className="cj-formulaire-ligne">
        <Champ id="prenom" name="prenom" libelle="Prénom" requis maxLength={80} value={v.prenom} onChange={maj('prenom')} autoComplete="off" />
        <Champ id="nom" name="nom" libelle="Nom" requis maxLength={80} value={v.nom} onChange={maj('nom')} autoComplete="off" />
      </div>
      <div className="cj-formulaire-ligne">
        <Champ id="login" name="login" libelle="Identifiant de connexion" requis maxLength={50} value={v.login} onChange={maj('login')}
          aide="Minuscules, chiffres, point ou tiret : prenom.nom" autoComplete="off" />
        <Champ id="email" name="email" type="email" libelle="Adresse électronique professionnelle" requis maxLength={120} value={v.email} onChange={maj('email')} autoComplete="off" />
      </div>
      <div className="cj-formulaire-ligne">
        <ChampSelection id="role" name="role" libelle="Rôle" requis value={v.role} onChange={maj('role')}>
          <option value="" disabled>Choisissez</option>
          {Object.entries(roles).map(([code, libelle]) => <option key={code} value={code}>{libelle}</option>)}
        </ChampSelection>
        {AVEC_JURIDICTION.includes(v.role) && (
          <Champ id="juridiction" name="juridiction" libelle="Juridiction de rattachement" requis maxLength={40} value={v.juridiction}
            onChange={maj('juridiction')} placeholder="TPI-LIBREVILLE" autoComplete="off" />
        )}
      </div>
      <button type="submit" className={classesBouton()} disabled={enCours} style={{ alignSelf: 'flex-start' }}>
        <Icone nom="plus" taille={20} /><span>{enCours ? 'Création…' : 'Créer le compte'}</span>
      </button>
    </form>
  );
}
