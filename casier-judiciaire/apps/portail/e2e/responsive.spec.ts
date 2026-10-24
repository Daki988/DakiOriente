import { expect, test } from '@playwright/test';

/** ERG-02 : aucune page ne déborde horizontalement, du petit téléphone (320 px) à la tablette. */
const PAGES = ['/', '/demande', '/suivi', '/verifier', '/verifier?code=DEMO-VALI-DE26', '/tarifs', '/bulletin-n3', '/diaspora', '/etrangers',
  '/administrations', '/aide', '/contact', '/connexion', '/chiffres', '/plan-du-site', '/quel-bulletin', '/en', '/paiement-tresor', '/pre-plainte', '/pre-plainte/suivi?numero=PP-2026-000029&code=314159'];
const ESPACES: [RegExp, string[]][] = [
  [/^Demandeur/, ['/espace', '/espace/demandes', '/espace/acces', '/espace/reclamations']],
  [/^Agent du casier/, ['/espace/file', '/espace/saisie']],
  [/^Validateur/, ['/espace/impression?etat=TOUS', '/espace/validations']],
  [/^Direction centrale/, ['/espace/pilotage', '/espace/tarifs', '/espace/regles', '/espace/suivi?numero=CJ-2026-000087']],
  [/^Comptable/, ['/espace/comptabilite']],
  [/^Support usagers/, ['/espace/reclamations']],
  [/^Super administrateur/, ['/espace/agents']],
];

for (const largeur of [320, 768]) {
  test.describe(`Largeur ${largeur} px`, () => {
    test.use({ viewport: { width: largeur, height: 800 } });
    test.beforeEach(({}, info) => test.skip(info.project.name !== 'bureau', 'largeurs imposées dans le projet « bureau »'));

    test('pages publiques sans défilement horizontal', async ({ page }) => {
      for (const chemin of PAGES) {
        await page.goto(chemin);
        const [defilement, largeurVisible] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
        expect(defilement, `${chemin} à ${largeur} px`).toBeLessThanOrEqual(largeurVisible);
      }
    });

    for (const [profil, pages] of ESPACES) {
      test(`espace ${profil.source.slice(1)} sans défilement horizontal`, async ({ page }) => {
        await page.goto('/connexion');
        await page.locator('#demonstration details').evaluate((d) => { (d as HTMLDetailsElement).open = true; });
        await page.locator('#demonstration').getByRole('button', { name: profil }).click();
        await expect(page).toHaveURL(/\/espace$/);
        for (const chemin of pages) {
          await page.goto(chemin);
          const [defilement, largeurVisible] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
          expect(defilement, `${chemin} à ${largeur} px`).toBeLessThanOrEqual(largeurVisible);
        }
      });
    }
  });
}
