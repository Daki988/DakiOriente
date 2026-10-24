import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('Pré-plainte en ligne', () => {
  test('lien en pied de page, déclaration en quatre étapes, récépissé et suivi', async ({ page }, info) => {
    test.skip(info.project.name !== 'bureau', 'dépôt modifiant l’état de démonstration');
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Pré-plainte en ligne' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Pré-plainte en ligne' })).toBeVisible();
    await sansViolation(page);

    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Choisissez la nature des faits.')).toBeVisible();
    await page.getByRole('radio', { name: /^Vol Téléphone/ }).check();
    await page.getByRole('radio', { name: /Non, auteur inconnu/ }).check();
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.getByLabel('Date des faits').fill(new Date(Date.now() - 86_400_000).toISOString().slice(0, 10));
    await page.getByLabel('Ville').fill('Libreville');
    await page.getByLabel('Lieu précis').fill('Marché de Mont-Bouët');
    await page.getByLabel('Décrivez ce qui s’est passé').fill('On m’a arraché mon téléphone au marché, l’auteur est parti en courant vers la route.');
    await page.getByLabel('Préjudice estimé (FCFA)').fill('150000');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.locator('#nom').fill('Nzé fictif');
    await page.locator('#prenoms').fill('Carine');
    await page.getByLabel('Jour').fill('12');
    await page.getByLabel('Mois').fill('3');
    await page.getByLabel('Année').fill('1994');
    await page.getByLabel('Téléphone mobile').fill('+241 77 00 00 03');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.getByLabel('Où souhaitez-vous signer votre plainte ?').selectOption('Commissariat central de Libreville');
    await expect(page.getByText('Marché de Mont-Bouët, Libreville')).toBeVisible();
    await page.getByRole('button', { name: 'Envoyer ma pré-plainte' }).click();
    await expect(page.locator('#attestation-erreur')).toHaveText('Cochez l’attestation pour envoyer votre pré-plainte.');
    await page.getByRole('checkbox', { name: /J’atteste que ces informations sont exactes/ }).check();
    await page.getByRole('button', { name: 'Envoyer ma pré-plainte' }).click();

    await expect(page.getByRole('heading', { name: 'Pré-plainte enregistrée' })).toBeVisible();
    const numero = (await page.getByText(/^Numéro PP-2026-\d{6}$/).textContent())!.replace('Numéro ', '');
    const code = (await page.locator('.p-code').textContent())!.trim();
    await sansViolation(page);

    await page.getByRole('link', { name: 'Suivre ma pré-plainte' }).click();
    await page.getByLabel('Code de suivi').fill(code);
    await page.getByRole('button', { name: 'Suivre' }).click();
    await expect(page.getByRole('heading', { name: `Pré-plainte ${numero}` })).toBeVisible();
    await expect(page.getByText('Reçue', { exact: true })).toBeVisible();
    await sansViolation(page);
  });

  test('l’officier de police judiciaire fixe le rendez-vous puis constate la signature ; la victime le voit', async ({ page }, info) => {
    test.skip(info.project.name !== 'bureau', 'actions modifiant l’état de démonstration');
    await page.goto('/connexion');
    await page.locator('#demonstration details').evaluate((d) => { (d as HTMLDetailsElement).open = true; });
    await page.locator('#demonstration').getByRole('button', { name: /^Officier de police judiciaire/ }).click();
    await expect(page).toHaveURL(/\/espace$/);
    await page.goto('/espace/pre-plaintes');
    await expect(page.getByRole('heading', { level: 1, name: 'Pré-plaintes en ligne' })).toBeVisible();
    await sansViolation(page);
    const fiche = page.locator('section.cj-panneau', { hasText: 'PP-2026-000031' });
    const demain = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    await fiche.getByLabel('Date et heure du rendez-vous').fill(`${demain}T10:30`);
    await fiche.getByRole('button', { name: 'Fixer le rendez-vous' }).click();
    await expect(page.getByText('Rendez-vous fixé : la victime le voit dans son suivi.')).toBeVisible();

    await page.goto('/pre-plainte/suivi?numero=PP-2026-000031&code=271828');
    await expect(page.getByText('Rendez-vous fixé', { exact: true })).toBeVisible();
    await expect(page.getByText(/10 h 30/)).toBeVisible();

    await page.goto('/espace/pre-plaintes?statut=RENDEZ_VOUS_FIXE');
    const ficheRdv = page.locator('section.cj-panneau', { hasText: 'PP-2026-000031' });
    await ficheRdv.getByLabel('N° de procédure de la plainte signée').fill('PV-2026-0457');
    await ficheRdv.getByRole('button', { name: 'Plainte signée' }).click();
    await expect(page.getByText('Plainte signée : la pré-plainte est close.')).toBeVisible();
    await page.goto('/pre-plainte/suivi?numero=PP-2026-000031&code=271828');
    await expect(page.getByText('Plainte signée', { exact: true })).toBeVisible();
  });
});

test.describe('Menu mobile', () => {
  test('se referme après le choix d’une page', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'menu propre au téléphone');
    await page.goto('/');
    const menu = page.locator('details.cj-menu-mobile');
    await menu.locator('summary').click();
    await expect(menu).toHaveAttribute('open', '');
    await menu.getByRole('link', { name: 'Tarifs' }).click();
    await expect(page).toHaveURL(/\/tarifs$/);
    await expect(menu).not.toHaveAttribute('open', '');
    await menu.locator('summary').click();
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
  });
});
