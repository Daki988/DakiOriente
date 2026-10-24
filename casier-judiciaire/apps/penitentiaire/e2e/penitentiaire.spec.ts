import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(WCAG).exclude('nextjs-portal').analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function connecter(page: Page, profil: RegExp) {
  await page.goto('/connexion');
  await page.locator('#demonstration').getByRole('button', { name: profil }).click();
  await expect(page).toHaveURL(/\/espace$/);
}

/** Accessibilité WCAG 2.1 AA des pages publiques. */
for (const chemin of ['/', '/etablissements', '/etablissements/LBV-PC-01', '/connexion', '/mentions-legales', '/page-inexistante']) {
  test(`${chemin} sans violation WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(chemin);
    await sansViolation(page);
  });
}

test('aucun défilement horizontal sur les pages publiques', async ({ page }) => {
  for (const chemin of ['/', '/etablissements', '/connexion']) {
    await page.goto(chemin);
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(deborde, chemin).toBe(false);
  }
});

test('l’espace exige une connexion', async ({ page }) => {
  await page.goto('/espace/registre');
  await expect(page).toHaveURL(/\/connexion\?expiree=1/);
});

test('greffe : écrou, condamnation, demande de mouvement ; pages accessibles', async ({ page }) => {
  const nom = `GREFFE${Date.now().toString(36).toUpperCase()}`;
  await connecter(page, /Greffe pénitentiaire/);
  await sansViolation(page);
  await page.goto('/espace/ecrou');
  await sansViolation(page);
  await page.locator('#nom').fill(nom);
  await page.locator('#prenoms').fill('Jean');
  await page.locator('#dateNaissance').fill('1990-01-01');
  await page.locator('#lieuNaissance').fill('Libreville');
  await page.locator('#referenceTitre').fill('MD-2026-9999');
  await page.locator('#infraction').fill('Vol simple');
  await page.getByRole('button', { name: 'Enregistrer l’écrou' }).click();
  await expect(page.getByText(/Écrou enregistré sous le numéro LBV-2026-/)).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: `${nom} Jean` })).toBeVisible();
  await sansViolation(page);

  await page.locator('#reference').fill('JUG-2026-0500');
  await page.locator('#dureePeineMois').fill('18');
  await page.getByRole('button', { name: 'Enregistrer la condamnation' }).click();
  await expect(page.getByText('Condamnation enregistrée')).toBeVisible();
  await expect(page.getByText('Condamné', { exact: true }).first()).toBeVisible();

  await page.locator('#type').selectOption('EXTRACTION_MEDICALE');
  await page.locator('#destination').fill('CHU de Libreville');
  await page.locator('#motif').fill('Consultation');
  await page.locator('#prevuLe').fill('2030-01-10T09:00');
  await page.getByRole('button', { name: 'Demander le mouvement' }).click();
  await expect(page.getByText('Mouvement demandé')).toBeVisible();

  await page.goto(`/espace/registre?q=${nom}`);
  await expect(page.getByRole('link', { name: `${nom} Jean` })).toBeVisible();
  await sansViolation(page);
});

test('greffe : un écrou sans durée sur jugement est refusé', async ({ page }) => {
  await connecter(page, /Greffe pénitentiaire/);
  await page.goto('/espace/ecrou');
  await page.locator('#nom').fill('Refus Fictif');
  await page.locator('#prenoms').fill('Paul');
  await page.locator('#dateNaissance').fill('1990-01-01');
  await page.locator('#lieuNaissance').fill('Oyem');
  await page.locator('#titreDetention').selectOption('JUGEMENT');
  await page.locator('#referenceTitre').fill('JUG-1');
  await page.locator('#infraction').fill('Recel');
  await page.getByRole('button', { name: 'Enregistrer l’écrou' }).click();
  await expect(page.getByText(/durée de la peine/)).toBeVisible();
  await expect(page).toHaveURL(/\/espace\/ecrou$/);
});

test('chef d’établissement : autorise un mouvement et prononce une libération', async ({ page }) => {
  // Données propres au test : le registre de démonstration est partagé entre les tests parallèles.
  const nom = `CHEF${Date.now().toString(36).toUpperCase()}`;
  await connecter(page, /Greffe pénitentiaire/);
  await page.goto('/espace/ecrou');
  await page.locator('#nom').fill(nom);
  await page.locator('#prenoms').fill('Test');
  await page.locator('#dateNaissance').fill('1992-02-02');
  await page.locator('#lieuNaissance').fill('Mouila');
  await page.locator('#referenceTitre').fill('MD-2026-7777');
  await page.locator('#infraction').fill('Escroquerie');
  await page.getByRole('button', { name: 'Enregistrer l’écrou' }).click();
  await expect(page.getByText(/Écrou enregistré/)).toBeVisible();
  const fiche = page.url();
  await page.locator('#type').selectOption('EXTRACTION_JUDICIAIRE');
  await page.locator('#destination').fill('Tribunal de première instance de Libreville');
  await page.locator('#motif').fill(`Audition ${nom}`);
  await page.locator('#prevuLe').fill('2030-03-01T08:00');
  await page.getByRole('button', { name: 'Demander le mouvement' }).click();
  await expect(page.getByText('Mouvement demandé')).toBeVisible();

  await connecter(page, /Chef d’établissement/);
  await page.goto('/espace/mouvements');
  await sansViolation(page);
  const ligne = page.getByRole('row').filter({ hasText: `Audition ${nom}` });
  await ligne.getByRole('button', { name: 'Refuser' }).click();
  await expect(page.getByText('Le motif du refus est obligatoire.')).toBeVisible();
  await page.getByRole('row').filter({ hasText: `Audition ${nom}` }).getByRole('button', { name: 'Autoriser' }).click();
  await expect(page.getByText('Mouvement autorisé.')).toBeVisible();

  await page.goto(fiche);
  await sansViolation(page);
  await page.getByRole('button', { name: 'Libérer' }).click();
  await expect(page.getByText('Libération enregistrée')).toBeVisible();
  await expect(page.getByText('Libéré', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Annulé : détenu libéré')).toBeVisible();
});

test('direction : vue nationale de tous les établissements', async ({ page }) => {
  await connecter(page, /Direction de l’administration pénitentiaire/);
  await expect(page.getByText('Vue nationale de tous les établissements pénitentiaires.')).toBeVisible();
  await expect(page.getByRole('rowheader', { name: /Maison d’arrêt d’Oyem/ })).toBeVisible();
  await sansViolation(page);
  await page.goto('/espace/ecrou');
  await expect(page).toHaveURL(/\/espace\?refus=1/);
});

test('le menu mobile se referme après un choix', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'menu propre au téléphone');
  await page.goto('/');
  await page.locator('.cj-menu-mobile summary').click();
  await page.locator('.cj-menu-mobile').getByRole('link', { name: 'Établissements' }).click();
  await expect(page).toHaveURL(/\/etablissements$/);
  await expect(page.locator('.cj-menu-mobile')).not.toHaveAttribute('open', '');
});
