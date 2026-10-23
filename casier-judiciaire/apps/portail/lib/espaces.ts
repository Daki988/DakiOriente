import 'server-only';
import { redirect } from 'next/navigation';

import { RefusMetier, ServiceIndisponible } from './api';
import { config } from './config';
import { demoEspaces } from './demo-espaces';
import { jetonValide } from './oidc';
import { session, type Session } from './session';
import type {
  AccesDonnees, BulletinAImprimer, CategorieReclamation, CompteAgent, CompteCree, DemandeUsager, DossierAgent, EntreeJournal, Indicateurs,
  InscriptionEnAttente, JeuDeRegles, PaiementEncaisse, ParcoursDossier, ProfilIdentite, Reclamation, ResultatIntegrite, ResultatRapprochement,
  SaisieCondamnation, SyntheseRecettes, TarifComplet,
} from './types';

/**
 * Espaces connectés (DSH-01 à DSH-11) : appels au service métier avec le jeton OpenID Connect de l'agent ou de l'usager,
 * ou données de démonstration fictives quand la session est de démonstration (ENV-03).
 * Les habilitations sont appliquées par le service (HAB-01) ; le portail ne fait que masquer les entrées inutiles.
 */

/** Session obligatoire, avec au moins un des rôles demandés (sinon retour à la connexion ou refus). */
export async function exigerSession(...roles: string[]): Promise<Session> {
  const s = await session();
  if (!s) redirect('/connexion?expiree=1');
  if (roles.length && !roles.some((r) => s.roles.includes(r))) redirect('/espace?refus=1');
  return s;
}

async function appel<T>(s: Session, chemin: string, init?: RequestInit & { brut?: boolean }): Promise<T | null> {
  const jeton = await jetonValide(s);
  if (!jeton) redirect('/session-expiree');
  let r: Response;
  try {
    r = await fetch(`${config.apiCasier}${chemin}`, {
      ...init,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${jeton}`, ...init?.headers },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ServiceIndisponible();
  }
  if (r.status === 401) redirect('/session-expiree');
  if (r.status === 404) return null;
  if ([403, 409, 422].includes(r.status)) {
    const corps = await r.json().catch(() => ({}));
    throw new RefusMetier(typeof corps.detail === 'string' ? corps.detail : 'Action refusée.');
  }
  if (r.status === 503) {
    // Fonction non configurée sur ce serveur (gestion des agents) : message explicite du service.
    const corps = await r.json().catch(() => ({}));
    throw typeof corps.detail === 'string' ? new RefusMetier(corps.detail) : new ServiceIndisponible();
  }
  if (!r.ok) throw new ServiceIndisponible();
  if (r.status === 204) return null;
  return (init?.brut ? (r as unknown) : await r.json()) as T;
}

const post = (corps?: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(corps ?? {}) });

/** Envoi d'un fichier (multipart) avec le jeton de l'utilisateur. */
async function envoyerFichier<T>(s: Session, chemin: string, fichier: File): Promise<T> {
  const jeton = await jetonValide(s);
  if (!jeton) redirect('/session-expiree');
  const corps = new FormData();
  corps.append('fichier', fichier, fichier.name);
  let r: Response;
  try {
    r = await fetch(`${config.apiCasier}${chemin}`, { method: 'POST', body: corps, cache: 'no-store',
      headers: { Accept: 'application/json', Authorization: `Bearer ${jeton}` }, signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new ServiceIndisponible();
  }
  if (r.status === 401) redirect('/session-expiree');
  if ([403, 404, 409, 413, 422].includes(r.status)) {
    const c = await r.json().catch(() => ({}));
    throw new RefusMetier(typeof c.detail === 'string' ? c.detail : r.status === 413 ? 'Le fichier dépasse 5 Mo.' : 'Dépôt refusé.');
  }
  if (!r.ok) throw new ServiceIndisponible();
  return (await r.json()) as T;
}

const periode = (du: string, au: string) => new URLSearchParams({ du, au }).toString();

export const espaces = {
  async mesDemandes(s: Session): Promise<DemandeUsager[]> {
    return s.demo ? demoEspaces.mesDemandes(s) : (await appel<DemandeUsager[]>(s, '/api/v1/usager/demandes')) ?? [];
  },
  /** Transparence : actions tracées sur les données de l'usager (la plus récente d'abord). */
  async acces(s: Session): Promise<AccesDonnees[]> {
    if (s.demo) return demoEspaces.acces(s);
    return ((await appel<AccesDonnees[]>(s, '/api/v1/usager/acces')) ?? []).reverse();
  },
  async deposerPiece(s: Session, id: string, piece: string) {
    if (s.demo) return demoEspaces.deposerPiece(s, id);
    await appel(s, `/api/v1/demandes/${encodeURIComponent(id)}/piece`, post({ piece }));
  },
  /** BUL-01 : PDF scellé du bulletin, servi à son seul destinataire (contrôlé par le service). */
  async telecharger(s: Session, id: string): Promise<Response | null> {
    return appel<Response>(s, `/api/v1/bulletins/${encodeURIComponent(id)}/pdf`, { brut: true, headers: { Accept: 'application/pdf' } });
  },
  async file(s: Session): Promise<DossierAgent[]> {
    return s.demo ? demoEspaces.file() : (await appel<DossierAgent[]>(s, '/api/v1/demandes/file')) ?? [];
  },
  async dossier(s: Session, id: string): Promise<DossierAgent | null> {
    if (s.demo) return demoEspaces.dossier(id);
    return (await espaces.file(s)).find((d) => d.id === id) ?? null;
  },
  /** IDT-05 : candidats proches dans le référentiel des identités (consultation motivée et tracée). */
  async candidats(s: Session, d: DossierAgent): Promise<ProfilIdentite[]> {
    if (s.demo) return demoEspaces.candidats(d.identite.nom);
    const q = new URLSearchParams({ nom: d.identite.nom, prenoms: d.identite.prenoms, motif: `Traitement de la demande ${d.numeroDossier}` });
    return (await appel<ProfilIdentite[]>(s, `/api/v1/registre/recherche?${q}`)) ?? [];
  },
  async deciderIdentite(s: Session, id: string, personneId: string | null, motivation: string) {
    if (s.demo) return void demoEspaces.deciderIdentite(s, id, personneId, motivation);
    await appel(s, `/api/v1/demandes/${encodeURIComponent(id)}/decision-identite`, post({ personneId, motivation }));
  },
  async demanderPiece(s: Session, id: string, piece: string) {
    if (s.demo) return demoEspaces.demanderPiece(s, id, piece);
    await appel(s, `/api/v1/demandes/${encodeURIComponent(id)}/demande-piece`, post({ piece }));
  },
  async rejeterDemande(s: Session, id: string, motif: string) {
    if (s.demo) return demoEspaces.rejeterDemande(s, id, motif);
    await appel(s, `/api/v1/demandes/${encodeURIComponent(id)}/rejet`, post({ motif }));
  },
  async saisir(s: Session, c: SaisieCondamnation): Promise<string> {
    if (s.demo) return demoEspaces.saisir(s, c);
    return (await appel<{ id: string }>(s, '/api/v1/registre/condamnations', post(c)))!.id;
  },
  async enAttente(s: Session): Promise<InscriptionEnAttente[]> {
    return s.demo ? demoEspaces.enAttente(s) : (await appel<InscriptionEnAttente[]>(s, '/api/v1/registre/inscriptions-en-attente')) ?? [];
  },
  async validerInscription(s: Session, id: string) {
    if (s.demo) {
      const erreur = demoEspaces.validerInscription(s, id);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/registre/condamnations/${encodeURIComponent(id)}/validation`, post());
  },
  async rejeterInscription(s: Session, id: string, motif: string) {
    if (s.demo) return demoEspaces.rejeterInscription(s, id, motif);
    await appel(s, `/api/v1/registre/condamnations/${encodeURIComponent(id)}/rejet`, post({ motif }));
  },
  async indicateurs(s: Session): Promise<Indicateurs | null> {
    return s.demo ? demoEspaces.indicateurs() : appel<Indicateurs>(s, '/api/v1/pilotage/indicateurs');
  },
  async tarifs(s: Session): Promise<TarifComplet[]> {
    return s.demo ? demoEspaces.tarifs() : (await appel<TarifComplet[]>(s, '/api/v1/tarifs')) ?? [];
  },
  async proposerTarif(s: Session, t: { acte: string; profil: string; montantFcfa: number; dateEffet: string; provisoire: boolean; libelle: string; source?: string }) {
    if (s.demo) return demoEspaces.proposerTarif(s, t);
    await appel(s, '/api/v1/tarifs', post(t));
  },
  async validerTarif(s: Session, id: string) {
    if (s.demo) {
      const erreur = demoEspaces.validerTarif(s, id);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/tarifs/${encodeURIComponent(id)}/validation`, post());
  },
  async regles(s: Session): Promise<JeuDeRegles[]> {
    return s.demo ? demoEspaces.regles() : (await appel<JeuDeRegles[]>(s, '/api/v1/regles')) ?? [];
  },
  async decisionRegles(s: Session, id: string, valider: boolean, motif?: string) {
    if (s.demo) {
      const erreur = demoEspaces.decisionRegles(s, id, valider, motif);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/regles/${encodeURIComponent(id)}/${valider ? 'validation' : 'rejet'}`, post(valider ? {} : { motif }));
  },
  /** Tableau de bord du validateur : bulletins n°3 à valider puis imprimer au guichet. */
  async fileImpression(s: Session): Promise<BulletinAImprimer[]> {
    return s.demo ? demoEspaces.fileImpression(s) : (await appel<BulletinAImprimer[]>(s, '/api/v1/impressions')) ?? [];
  },
  async validerImpression(s: Session, id: string) {
    if (s.demo) {
      const erreur = demoEspaces.validerImpression(s, id);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/impressions/${encodeURIComponent(id)}/validation`, post());
  },
  /** Impression sur feuillet sécurisé : renvoie le PDF scellé à imprimer. */
  async imprimer(s: Session, id: string, feuillet: string, motif: string | null): Promise<Uint8Array> {
    if (s.demo) {
      const r = demoEspaces.imprimer(s, id, feuillet, motif);
      if ('erreur' in r) throw new RefusMetier(r.erreur);
      return new Uint8Array(r.pdf);
    }
    const r = await appel<Response>(s, `/api/v1/impressions/${encodeURIComponent(id)}/impression`,
      { ...post({ feuillet, motif: motif || undefined }), brut: true, headers: { Accept: 'application/pdf' } });
    if (!r) throw new RefusMetier('Bulletin introuvable.');
    return new Uint8Array(await r.arrayBuffer());
  },
  async journal(s: Session): Promise<{ integrite: ResultatIntegrite | null; entrees: EntreeJournal[] }> {
    if (s.demo) {
      const entrees = demoEspaces.journal(s);
      return { integrite: { integre: true, entreesVerifiees: entrees.length, premiereAlteration: null }, entrees };
    }
    const [integrite, entrees] = await Promise.all([
      appel<ResultatIntegrite>(s, '/api/v1/audit/integrite'),
      appel<EntreeJournal[]>(s, '/api/v1/audit/entrees?nombre=50'),
    ]);
    return { integrite, entrees: entrees ?? [] };
  },
  /** RG-09 : dépôt du fichier de la pièce demandée. */
  async deposerFichier(s: Session, id: string, fichier: File) {
    if (s.demo) {
      const erreur = demoEspaces.deposerFichier(s, id, fichier.name, new Uint8Array(await fichier.arrayBuffer()));
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await envoyerFichier(s, `/api/v1/demandes/${encodeURIComponent(id)}/pieces`, fichier);
  },

  // ---------- Réclamations ----------
  async mesReclamations(s: Session): Promise<Reclamation[]> {
    return s.demo ? demoEspaces.mesReclamations(s) : (await appel<Reclamation[]>(s, '/api/v1/usager/reclamations')) ?? [];
  },
  async deposerReclamation(s: Session, r: { categorie: CategorieReclamation; numeroDossier: string | null; message: string }) {
    if (s.demo) return void demoEspaces.deposerReclamation(s, r);
    await appel(s, '/api/v1/usager/reclamations', post(r));
  },
  async fileReclamations(s: Session): Promise<Reclamation[]> {
    return s.demo ? demoEspaces.fileReclamations(s) : (await appel<Reclamation[]>(s, '/api/v1/reclamations')) ?? [];
  },
  async prendreEnCharge(s: Session, id: string) {
    if (s.demo) {
      const erreur = demoEspaces.prendreEnCharge(s, id);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/reclamations/${encodeURIComponent(id)}/prise-en-charge`, post());
  },
  async repondreReclamation(s: Session, id: string, reponse: string) {
    if (s.demo) {
      const erreur = demoEspaces.repondreReclamation(s, id, reponse);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/reclamations/${encodeURIComponent(id)}/reponse`, post({ reponse }));
  },

  // ---------- Comptabilité ----------
  async paiements(s: Session, du: string, au: string): Promise<PaiementEncaisse[]> {
    return s.demo ? demoEspaces.paiements(du, au) : (await appel<PaiementEncaisse[]>(s, `/api/v1/comptabilite/paiements?${periode(du, au)}`)) ?? [];
  },
  async synthese(s: Session, du: string, au: string): Promise<SyntheseRecettes | null> {
    return s.demo ? demoEspaces.synthese(du, au) : appel<SyntheseRecettes>(s, `/api/v1/comptabilite/synthese?${periode(du, au)}`);
  },
  async rapprocher(s: Session, du: string, au: string, releve: string): Promise<ResultatRapprochement> {
    if (s.demo) {
      const r = demoEspaces.rapprocher(s, du, au, releve);
      if ('erreur' in r) throw new RefusMetier(r.erreur);
      return r;
    }
    return (await appel<ResultatRapprochement>(s, `/api/v1/comptabilite/rapprochement?${periode(du, au)}`,
      { method: 'POST', body: releve, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }))!;
  },
  async exporterPaiements(s: Session, du: string, au: string): Promise<string> {
    if (s.demo) return demoEspaces.exporter(s, du, au);
    const r = await appel<Response>(s, `/api/v1/comptabilite/export?${periode(du, au)}`, { brut: true, headers: { Accept: 'text/csv' } });
    return r ? r.text() : '';
  },

  // ---------- Agents ----------
  async agents(s: Session): Promise<CompteAgent[]> {
    return s.demo ? demoEspaces.agents() : (await appel<CompteAgent[]>(s, '/api/v1/agents')) ?? [];
  },
  async rolesAttribuables(s: Session): Promise<Record<string, string>> {
    return s.demo ? demoEspaces.rolesAttribuables() : (await appel<Record<string, string>>(s, '/api/v1/agents/roles')) ?? {};
  },
  async creerAgent(s: Session, a: { login: string; prenom: string; nom: string; email: string; role: string; juridiction: string | null }): Promise<CompteCree> {
    if (s.demo) {
      const r = demoEspaces.creerAgent(s, a);
      if ('erreur' in r) throw new RefusMetier(r.erreur);
      return r;
    }
    return (await appel<CompteCree>(s, '/api/v1/agents', post(a)))!;
  },
  async changerRoleAgent(s: Session, id: string, role: string, juridiction: string | null) {
    if (s.demo) {
      const erreur = demoEspaces.changerRoleAgent(s, id, role, juridiction);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/agents/${encodeURIComponent(id)}/role`, post({ role, juridiction }));
  },
  async activerAgent(s: Session, id: string, actif: boolean, motif: string | null) {
    if (s.demo) {
      const erreur = demoEspaces.activerAgent(s, id, actif, motif);
      if (erreur) throw new RefusMetier(erreur);
      return;
    }
    await appel(s, `/api/v1/agents/${encodeURIComponent(id)}/activation`, post({ actif, motif }));
  },

  // ---------- Suivi d'un dossier de A à Z ----------
  async parcours(s: Session, numero: string): Promise<ParcoursDossier | null> {
    return s.demo ? demoEspaces.parcours(s, numero) : appel<ParcoursDossier>(s, `/api/v1/pilotage/parcours/${encodeURIComponent(numero)}`);
  },
};
