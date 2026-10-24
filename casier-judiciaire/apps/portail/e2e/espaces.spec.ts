import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** DSH, ENV-04 : espaces connectés avec les comptes de démonstration fictifs (un par profil). */
async function seConnecter(page: Page, profil: RegExp) {
  await page.goto('/connexion');
  await page.locator('#demonstration details').evaluate((d) => { (d as HTMLDetailsElement).open = true; });
  await page.locator('#demonstration').getByRole('button', { name: profil }).click();
  await expect(page).toHaveURL(/\/espace$/);
}

async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test('SEC-01 : l’espace exige une connexion', async ({ page }) => {
  await page.goto('/espace/demandes');
  await expect(page).toHaveURL(/\/connexion\?expiree=1/);
  await expect(page.getByText('Connectez-vous pour accéder à votre espace.')).toBeVisible();
});

test('DSH-01 : usager — demandes, bulletin scellé à télécharger, déconnexion', async ({ page }) => {
  await seConnecter(page, /^Demandeur/);
  await expect(page.getByRole('heading', { name: 'Bonjour Jean-Pierre' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Navigation de l’espace' }).getByRole('link', { name: 'Mes demandes' }).click();
  await expect(page.getByRole('heading', { name: 'Dossier CJ-2026-000087' })).toBeVisible();
  const lien = page.getByRole('link', { name: /Télécharger le bulletin B3-2026-0000412/ });
  const r = await page.request.get((await lien.getAttribute('href'))!);
  expect(r.headers()['content-type']).toBe('application/pdf');
  expect((await r.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await sansViolation(page);
  await page.goto('/');
  await expect(page.locator('header.cj-en-tete a[href="/espace"]').first()).toBeAttached();
  await page.goto('/espace');
  await page.getByRole('link', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/espace');
  await expect(page).toHaveURL(/\/connexion/);
});

test('HAB-01 : un usager n’accède pas au journal d’audit', async ({ page, request }) => {
  await seConnecter(page, /^Demandeur/);
  await page.goto('/espace/audit');
  await expect(page).toHaveURL(/\/espace\?refus=1/);
  await expect(page.getByText('Votre profil ne permet pas d’ouvrir cette page.')).toBeVisible();
  expect((await request.get('/espace/bulletins/demo-b3-412/pdf', { maxRedirects: 0 })).status()).toBe(307);
});

const LECTURE: [RegExp, string[]][] = [
  [/^Agent du casier/, ['/espace/file', '/espace/file/demo-f-123', '/espace/saisie']],
  [/^Greffier en chef/, ['/espace/validations']],
  [/^Direction centrale/, ['/espace/pilotage', '/espace/tarifs', '/espace/regles']],
  [/^Auditeur/, ['/espace/audit']],
];
for (const [profil, pages] of LECTURE) {
  test(`ERG-01 — espace ${profil.source.slice(1)} sans violation WCAG 2.1 AA`, async ({ page }) => {
    await seConnecter(page, profil);
    await sansViolation(page);
    for (const chemin of pages) {
      await page.goto(chemin);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await sansViolation(page);
    }
  });
}

test.describe('Actions (données de démonstration partagées : projet « bureau » seulement)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'bureau', 'actions modifiant l’état de démonstration'));

  test('IDT-06 : l’agent tranche une homonymie, l’action est journalisée', async ({ page, browser }) => {
    await seConnecter(page, /^Agent du casier/);
    await page.goto('/espace/file/demo-f-131');
    await page.getByRole('radio', { name: /ESSONO FICTIF Jean — fiche existante/ }).check();
    await page.getByLabel('Motivation').fill('Filiation et date de naissance concordantes avec la fiche (pièces contrôlées).');
    await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
    await expect(page.getByText('Décision enregistrée et journalisée.')).toBeVisible();
    const auditeur = await (await browser.newContext()).newPage();
    await seConnecter(auditeur, /^Auditeur/);
    await auditeur.goto('/espace/audit');
    await expect(auditeur.getByRole('cell', { name: 'IDENTITE_DECIDEE_PAR_AGENT' })).toBeVisible();
  });

  test('HAB-02 : le greffier valide une inscription saisie par l’agent', async ({ page }) => {
    await seConnecter(page, /^Greffier en chef/);
    await page.goto('/espace/validations');
    await page.getByRole('button', { name: 'Valider l’inscription' }).first().click();
    await expect(page.getByText('Inscription validée : elle figure désormais au casier.')).toBeVisible();
  });

  test('ADM-04 : tarif proposé par l’administrateur, validé par la direction', async ({ page, browser }) => {
    await seConnecter(page, /^Super administrateur/);
    await page.goto('/espace/tarifs');
    await expect(page.getByText('Proposé par vous').first()).toBeVisible();
    const direction = await (await browser.newContext()).newPage();
    await seConnecter(direction, /^Direction centrale/);
    await direction.goto('/espace/tarifs');
    await direction.getByRole('button', { name: 'Valider' }).first().click();
    await expect(direction.getByText('Tarif validé : il s’appliquera à sa date d’effet.')).toBeVisible();
  });
});

test('BUL-08 : dépôt du PDF — spécimen scellé reconnu, copie modifiée refusée', async ({ page }) => {
  const { SPECIMEN_B3 } = await import('../lib/specimen-b3');
  const pdf = Buffer.from(SPECIMEN_B3, 'base64');
  await page.goto('/verifier');
  await page.getByLabel('Fichier PDF du bulletin').setInputFiles({ name: 'bulletin.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByRole('button', { name: 'Contrôler le fichier' }).click();
  await expect(page.getByText('Sceau valide, fichier intact')).toBeVisible();
  await expect(page.getByText('Bulletin authentique et valide')).toBeVisible();
  const modifie = Buffer.concat([pdf, Buffer.from('\n%modification\n')]);
  await page.getByLabel('Fichier PDF du bulletin').setInputFiles({ name: 'bulletin.pdf', mimeType: 'application/pdf', buffer: modifie });
  await page.getByRole('button', { name: 'Contrôler le fichier' }).click();
  await expect(page.getByText('Fichier non authentique')).toBeVisible();
  await sansViolation(page);
});
