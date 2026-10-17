import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** ERG-01 : WCAG 2.1 AA vérifié automatiquement sur toutes les pages publiques (l'audit humain reste obligatoire). */
const PAGES = ['/', '/demande', '/suivi', '/verifier', '/verifier?code=DEMO-VALI-DE26', '/verifier?code=DEMO-REVO-QUE1', '/v/jeton-inconnu-0000000000000',
  '/tarifs', '/bulletin-n3', '/diaspora', '/etrangers', '/administrations', '/aide', '/contact', '/connexion', '/actualites', '/chiffres',
  '/mentions-legales', '/cgu', '/confidentialite', '/cookies', '/accessibilite', '/plan-du-site', '/quel-bulletin', '/en', '/paiement-tresor', '/maintenance', '/session-expiree', '/page-inexistante'];

for (const chemin of PAGES) {
  test(`ERG-01 — ${chemin} sans violation WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(chemin);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
    expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('ERG-01 — étapes de la demande sans violation, erreurs affichées comprises', async ({ page }) => {
  await page.goto('/demande');
  const verifier = async () => {
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  };
  await page.getByRole('button', { name: 'Continuer' }).click();
  await verifier();
  await page.getByRole('radio', { name: /né au Gabon/ }).check();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await verifier();
});
