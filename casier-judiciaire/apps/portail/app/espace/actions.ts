'use server';
import { redirect } from 'next/navigation';

import { RefusMetier, ServiceIndisponible } from '@/lib/api';
import { espaces, exigerSession } from '@/lib/espaces';
import type { Session } from '@/lib/session';

/** Texte obligatoire, nettoyé et borné (les contrôles métier restent faits par le service). */
function texte(f: FormData, cle: string, max = 500): string {
  const v = String(f.get(cle) ?? '').trim().slice(0, max);
  if (!v) throw new RefusMetier('Complétez tous les champs obligatoires.');
  return v;
}
const facultatif = (f: FormData, cle: string, max = 200) => String(f.get(cle) ?? '').trim().slice(0, max) || null;

/** Exécute une action de l'espace et laisse un message unique à afficher sur la page de retour. */
async function agir(roles: string[], retour: string, succes: string, action: (s: Session) => Promise<unknown>) {
  const s = await exigerSession(...roles);
  try {
    await action(s);
    s.flash = { type: 'succes', texte: succes };
  } catch (e) {
    if (e instanceof RefusMetier) s.flash = { type: 'erreur', texte: e.message };
    else if (e instanceof ServiceIndisponible) s.flash = { type: 'erreur', texte: 'Le service est momentanément indisponible. Réessayez dans quelques minutes.' };
    else throw e;
  }
  redirect(retour);
}

// ---------- Usager (DSH-01, RG-09) ----------
export async function deposerPiece(f: FormData) {
  await agir(['R01'], '/espace/demandes', 'Pièce transmise : le traitement de votre demande reprend.', (s) =>
    espaces.deposerPiece(s, texte(f, 'id', 64), texte(f, 'piece', 300)));
}

// ---------- Agent (DSH-04, IDT-06, RG-09) ----------
export async function deciderIdentite(f: FormData) {
  const id = texte(f, 'id', 64);
  await agir(['R06'], '/espace/file', 'Décision enregistrée et journalisée.', (s) =>
    espaces.deciderIdentite(s, id, facultatif(f, 'personneId', 64), texte(f, 'motivation', 1000)));
}

export async function demanderPiece(f: FormData) {
  await agir(['R06'], '/espace/file', 'Pièce demandée à l’usager : le délai est suspendu.', (s) =>
    espaces.demanderPiece(s, texte(f, 'id', 64), texte(f, 'piece', 300)));
}

export async function rejeterDemande(f: FormData) {
  await agir(['R06'], '/espace/file', 'Demande rejetée. L’usager est informé du motif.', (s) =>
    espaces.rejeterDemande(s, texte(f, 'id', 64), texte(f, 'motif', 1000)));
}

/** REG-01 : saisie d'une condamnation, en attente de validation par une seconde personne (HAB-02). */
export async function saisirCondamnation(f: FormData) {
  await agir(['R06'], '/espace/saisie', 'Condamnation enregistrée : elle sera inscrite après validation par le greffier en chef.', (s) => {
    const nature = texte(f, 'nature', 40);
    const duree = Number(f.get('dureeMois') || 0);
    const montant = Number(f.get('montantFcfa') || 0);
    if (nature === 'EMPRISONNEMENT' && !(duree > 0)) throw new RefusMetier('Indiquez la durée de l’emprisonnement en mois.');
    if (nature === 'AMENDE' && !(montant > 0)) throw new RefusMetier('Indiquez le montant de l’amende.');
    return espaces.saisir(s, {
      personneId: null,
      nouvellePersonne: {
        nom: texte(f, 'nom', 100).toUpperCase(), prenoms: texte(f, 'prenoms', 150), dateNaissance: texte(f, 'dateNaissance', 10),
        lieuNaissance: texte(f, 'lieuNaissance', 100), paysNaissance: 'GA', nomPere: facultatif(f, 'nomPere'), nomMere: facultatif(f, 'nomMere'),
        nationalites: ['GA'], numeroCnie: facultatif(f, 'numeroCnie', 40), numeroPasseport: null, alias: [],
      },
      juridiction: s.juridiction ?? texte(f, 'juridiction', 40), dateDecision: texte(f, 'dateDecision', 10),
      numeroDecision: texte(f, 'numeroDecision', 60), infraction: texte(f, 'infraction', 300), qualification: texte(f, 'qualification', 20),
      peines: [{ nature, dureeMois: nature === 'EMPRISONNEMENT' ? duree : null, montantFcfa: nature === 'AMENDE' ? montant : null,
        sursis: texte(f, 'sursis', 20), dureeSursisMois: null }],
      dateDefinitive: facultatif(f, 'dateDefinitive', 10), referencePieceSource: texte(f, 'referencePieceSource', 120),
    });
  });
}

// ---------- Greffier en chef (DSH-06, HAB-02) ----------
export async function validerInscription(f: FormData) {
  await agir(['R07'], '/espace/validations', 'Inscription validée : elle figure désormais au casier.', (s) => espaces.validerInscription(s, texte(f, 'id', 64)));
}

export async function rejeterInscription(f: FormData) {
  await agir(['R07'], '/espace/validations', 'Inscription rejetée et renvoyée à l’agent.', (s) =>
    espaces.rejeterInscription(s, texte(f, 'id', 64), texte(f, 'motif', 1000)));
}

// ---------- Back-office (ADM-04, ADM-05) ----------
export async function proposerTarif(f: FormData) {
  await agir(['R08', 'R13'], '/espace/tarifs', 'Tarif proposé : une seconde personne doit le valider.', (s) => {
    const montant = Number(f.get('montantFcfa'));
    if (!Number.isInteger(montant) || montant < 0) throw new RefusMetier('Le montant doit être un nombre entier positif ou nul.');
    return espaces.proposerTarif(s, {
      acte: texte(f, 'acte', 40), profil: texte(f, 'profil', 40), montantFcfa: montant, dateEffet: texte(f, 'dateEffet', 10),
      provisoire: f.get('provisoire') === 'on', libelle: texte(f, 'libelle', 200), source: facultatif(f, 'source', 300) ?? undefined,
    });
  });
}

export async function validerTarif(f: FormData) {
  await agir(['R08', 'R13'], '/espace/tarifs', 'Tarif validé : il s’appliquera à sa date d’effet.', (s) => espaces.validerTarif(s, texte(f, 'id', 64)));
}

export async function validerRegles(f: FormData) {
  await agir(['R05', 'R08'], '/espace/regles', 'Version publiée : elle s’appliquera à sa date d’effet.', (s) =>
    espaces.decisionRegles(s, texte(f, 'id', 64), true));
}

export async function rejeterRegles(f: FormData) {
  await agir(['R05', 'R08'], '/espace/regles', 'Version rejetée.', (s) => espaces.decisionRegles(s, texte(f, 'id', 64), false, texte(f, 'motif', 1000)));
}
