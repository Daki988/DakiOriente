import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function seConnecter(page: Page, profil: RegExp) {
  await page.goto('/connexion');
  await page.locator('#demonstration details').evaluate((d) => { (d as HTMLDetailsElement).open = true; });
  await page.locator('#demonstration').getByRole('button', { name: profil }).click();
  await expect(page).toHaveURL(/\/espace$/);
}

test('Transparence : l’usager voit qui a consulté ses données', async ({ page }) => {
  await seConnecter(page, /^Demandeur/);
  await page.goto('/espace/acces');
  await expect(page.getByRole('heading', { level: 1, name: 'Accès à mes données' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Consultation de votre fiche' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Agent du casier (greffe)' }).first()).toBeVisible();
  await sansViolation(page);
});

test('Questionnaire d’orientation : la bonne démarche en deux questions', async ({ page }) => {
  await page.goto('/quel-bulletin');
  await page.getByRole('radio', { name: /Pour moi-même/ }).check();
  await page.getByRole('radio', { name: /né à l’étranger/ }).check();
  await expect(page.getByText('Il vous faut un bulletin n°3')).toBeVisible();
  await expect(page.getByRole('link', { name: 'En savoir plus' })).toHaveAttribute('href', '/diaspora');
  await sansViolation(page);
  await page.getByRole('radio', { name: /Pour une autre personne/ }).check();
  await expect(page.getByText('Le bulletin n°3 est strictement personnel')).toBeVisible();
});

test('Information en anglais, langue déclarée', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('div[lang="en"] h1')).toHaveText('Gabonese criminal record certificate');
  await sansViolation(page);
});

test('Avis de satisfaction après une vérification, repris dans le pilotage', async ({ page }) => {
  await page.goto('/verifier?code=DEMO-VALI-DE26');
  await page.getByRole('radio', { name: /Très satisfait/ }).check();
  await page.getByRole('button', { name: 'Envoyer mon avis' }).click();
  await expect(page.getByText('Merci pour votre avis')).toBeVisible();
  await seConnecter(page, /^Direction centrale/);
  await page.goto('/espace/pilotage');
  await expect(page.getByText('Satisfaction des usagers')).toBeVisible();
});
