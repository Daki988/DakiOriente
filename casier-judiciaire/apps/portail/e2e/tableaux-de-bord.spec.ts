import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Tableaux de bord ajoutés : réclamations, comptabilité, comptes des agents, suivi d'un dossier de A à Z, dépôt de pièce. */
async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function connecter(page: Page, profil: RegExp) {
  await page.goto('/connexion');
  await page.locator('#demonstration').getByRole('button', { name: profil }).click();
  await expect(page).toHaveURL(/\/espace$/);
}

test.describe('Suivi d’un dossier de A à Z', () => {
  test('la direction suit un dossier de la demande à l’impression, avec la fonction de chaque intervenant', async ({ page }) => {
    await connecter(page, /^Direction centrale/);
    await page.getByRole('navigation', { name: 'Navigation de l’espace' }).getByRole('link', { name: 'Suivi d’un dossier' }).click();
    await page.getByLabel('Numéro de dossier').fill('cj-2026-000087');
    await page.getByRole('button', { name: 'Suivre' }).click();
    await expect(page.getByRole('heading', { name: 'Dossier CJ-2026-000087' })).toBeVisible();
    const chronologie = page.locator('.p-chronologie');
    await expect(chronologie.getByText('Demande déposée en ligne')).toBeVisible();
    await expect(chronologie.getByText('Bulletin imprimé sur feuillet sécurisé')).toBeVisible();
    await expect(chronologie.getByText('Greffier en chef').first()).toBeVisible();
    await expect(page.getByText('2 vérifications')).toBeVisible();
    await sansViolation(page);
    await page.goto('/espace/suivi?numero=CJ-2026-999999');
    await expect(page.getByText('Aucun dossier ne porte le numéro CJ-2026-999999.')).toBeVisible();
  });

  test('l’auditeur y accède, l’usager non', async ({ page }) => {
    await connecter(page, /^Auditeur/);
    await page.goto('/espace/suivi?numero=CJ-2026-000123');
    await expect(page.getByText('Pièce complémentaire demandée')).toBeVisible();
    await connecter(page, /^Usager/);
    await page.goto('/espace/suivi');
    await expect(page).toHaveURL(/refus=1/);
  });
});

test.describe('Réclamations', () => {
  test('l’usager dépose une réclamation, le support la prend en charge et répond', async ({ page }, info) => {
    test.skip(info.project.name !== 'bureau', 'actions modifiant l’état de démonstration');
    await connecter(page, /^Usager/);
    await page.goto('/espace/reclamations');
    await expect(page.getByText('RC-2026-000014')).toBeVisible();
    await sansViolation(page);
    await page.getByLabel('Motif').selectOption('PAIEMENT');
    await page.getByLabel('Numéro de dossier').fill('CJ-2026-000123');
    await page.getByLabel('Décrivez le problème').fill('Paiement Moov Money débité deux fois pour le même dossier.');
    await page.getByRole('button', { name: 'Envoyer la réclamation' }).click();
    await expect(page.getByText('Réclamation enregistrée')).toBeVisible();
    await expect(page.getByText('Paiement Moov Money débité deux fois')).toBeVisible();

    await connecter(page, /^Support usagers/);
    await page.goto('/espace/reclamations');
    await expect(page.getByRole('heading', { level: 1, name: 'Réclamations des usagers' })).toBeVisible();
    await sansViolation(page);
    const fiche = page.locator('section.cj-panneau', { hasText: 'Paiement Moov Money débité deux fois' });
    await fiche.getByRole('button', { name: 'Prendre en charge' }).click();
    await expect(page.getByText('Réclamation prise en charge.')).toBeVisible();
    const ficheEnCours = page.locator('section.cj-panneau', { hasText: 'Paiement Moov Money débité deux fois' });
    await ficheEnCours.getByLabel('Réponse à l’usager').fill('Le second débit vous sera remboursé par l’opérateur sous 72 heures.');
    await ficheEnCours.getByRole('button', { name: 'Répondre et clore' }).click();
    await expect(page.getByText('Réponse envoyée à l’usager')).toBeVisible();

    await connecter(page, /^Usager/);
    await page.goto('/espace/reclamations');
    await expect(page.getByText('Le second débit vous sera remboursé')).toBeVisible();
  });
});

test.describe('Comptabilité', () => {
  test('recettes par moyen, rapprochement d’un relevé avec écarts, export CSV', async ({ page }) => {
    await connecter(page, /^Comptable/);
    await page.goto('/espace/comptabilite');
    await expect(page.getByRole('heading', { name: 'Recettes par moyen de paiement' })).toBeVisible();
    await expect(page.getByRole('rowheader', { name: 'Trésor public' })).toBeVisible();
    await sansViolation(page);
    const reference = (await page.locator('table').last().locator('tbody tr').first().locator('td').nth(2).textContent())!.trim();
    await page.getByLabel('Ou collez les lignes du relevé').fill(`reference;montant\n${reference};1500\nTRESOR-TP-INCONNUE;2000\n`);
    await page.getByRole('button', { name: 'Rapprocher' }).click();
    await expect(page.getByText('Sur le relevé, absent de la plateforme')).toBeVisible();
    await expect(page.getByText('Encaissé sur la plateforme, absent du relevé').first()).toBeVisible();
    const telechargement = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Exporter les paiements (CSV)' }).click();
    expect((await telechargement).suggestedFilename()).toMatch(/^paiements-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

test.describe('Comptes des agents', () => {
  test('l’administrateur crée un compte (mot de passe affiché une fois) et désactive un compte avec motif', async ({ page }, info) => {
    test.skip(info.project.name !== 'bureau', 'actions modifiant l’état de démonstration');
    await connecter(page, /^Super administrateur/);
    await page.goto('/espace/agents');
    await expect(page.getByRole('heading', { level: 3, name: 'Clarisse MOUSSAVOU' })).toBeVisible();
    await sansViolation(page);
    await page.getByLabel('Prénom').fill('Aimée');
    await page.locator('#nom').fill('Mintsa');
    await page.getByLabel('Identifiant de connexion').fill('aimee.mintsa');
    await page.getByLabel('Adresse électronique professionnelle').fill('aimee.mintsa@exemple.ga');
    await page.locator('#role').selectOption('R06');
    await expect(page.getByLabel('Juridiction de rattachement')).toBeVisible();
    await page.getByLabel('Identifiant de connexion').fill('Aimee Mintsa');
    await page.getByLabel('Juridiction de rattachement').fill('tpi-oyem');
    await page.getByRole('button', { name: 'Créer le compte' }).click();
    await expect(page.getByText('Identifiant invalide')).toBeVisible();
    await page.getByLabel('Identifiant de connexion').fill('aimee.mintsa');
    await page.getByRole('button', { name: 'Créer le compte' }).click();
    await expect(page.getByText('Compte créé : Aimée MINTSA')).toBeVisible();
    await expect(page.locator('.p-code')).toHaveText(/^[A-Za-z0-9]{16}$/);

    await page.goto('/espace/agents');
    const fiche = page.locator('section.cj-panneau', { has: page.getByRole('heading', { name: 'Aimée MINTSA' }) });
    await fiche.getByText('Modifier ce compte').click();
    await fiche.getByLabel('Motif de la désactivation').fill('Mutation dans un autre ministère');
    await fiche.getByRole('button', { name: 'Désactiver' }).click();
    await expect(page.getByText('Compte désactivé')).toBeVisible();
    await expect(page.locator('section.cj-panneau', { has: page.getByRole('heading', { name: 'Aimée MINTSA' }) }).getByText('Désactivé', { exact: true })).toBeVisible();
  });
});

test.describe('Dépôt de pièce', () => {
  test('l’usager dépose le fichier demandé ; un faux PDF est refusé', async ({ page }, info) => {
    test.skip(info.project.name !== 'bureau', 'actions modifiant l’état de démonstration');
    await connecter(page, /^Usager/);
    await page.goto('/espace/demandes');
    const champ = page.getByLabel('Fichier de la pièce');
    await champ.setInputFiles({ name: 'acte.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>pas un pdf</html>') });
    await page.getByRole('button', { name: 'Transmettre la pièce' }).click();
    await expect(page.getByText('Format non accepté')).toBeVisible();
    await page.getByLabel('Fichier de la pièce').setInputFiles({ name: 'acte.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n% fictif\n') });
    await page.getByRole('button', { name: 'Transmettre la pièce' }).click();
    await expect(page.getByText('Pièce transmise')).toBeVisible();
    await expect(page.getByText('Pièce reçue (acte.pdf)')).toBeVisible();
  });
});
