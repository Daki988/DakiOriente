import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function sansViolation(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('nextjs-portal').analyze();
  expect(r.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('Paiement au Trésor public', () => {
  test('demande avec paiement au Trésor : avis de paiement, puis saisie de l’identifiant et bulletin délivré', async ({ page }) => {
    await page.goto('/demande');
    await page.getByRole('radio', { name: /né au Gabon/ }).check();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Remplir avec une identité fictive' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('radio', { name: /Au Trésor public/ }).check();
    await page.getByRole('button', { name: 'Obtenir mon avis de paiement' }).click();
    await expect(page.getByRole('heading', { name: 'Demande enregistrée : à payer au Trésor public' })).toBeVisible();
    const [numero, code] = await page.locator('.p-identifiant strong').allTextContents();
    await sansViolation(page);

    await page.getByRole('link', { name: /J’ai payé : saisir l’identifiant/ }).click();
    await expect(page.getByLabel(/Numéro de dossier/)).toHaveValue(numero);
    await page.getByLabel(/Code de suivi/).fill(code);
    await page.getByLabel(/Identifiant de paiement/).fill('x');
    await page.getByRole('button', { name: 'Valider mon paiement' }).click();
    await expect(page.getByText(/tel qu’il figure sur la quittance/)).toBeVisible();
    await page.getByLabel(/Identifiant de paiement/).fill(`TP-2026-${numero.slice(-6)}`);
    await page.getByRole('button', { name: 'Valider mon paiement' }).click();
    await expect(page.getByText('Paiement enregistré : votre bulletin est délivré')).toBeVisible();
    await expect(page.getByRole('button', { name: /Télécharger mon bulletin/ })).toBeVisible();
  });

  test('dossier de démonstration : code erroné refusé, puis bulletin téléchargeable', async ({ page }) => {
    await page.goto('/paiement-tresor');
    await sansViolation(page);
    await page.getByLabel(/Numéro de dossier/).fill('CJ-2026-000140');
    await page.getByLabel(/Code de suivi/).fill('000000');
    await page.getByLabel(/Identifiant de paiement/).fill('TP-2026-104512');
    await page.getByRole('button', { name: 'Valider mon paiement' }).click();
    await expect(page.getByText('Numéro de dossier ou code de suivi incorrect.', { exact: false })).toBeVisible();
    await page.getByLabel(/Code de suivi/).fill('654321');
    await page.getByRole('button', { name: 'Valider mon paiement' }).click();
    await expect(page.getByText('Paiement enregistré : votre bulletin est délivré')).toBeVisible();
    const r = await page.request.post('/paiement-tresor/bulletin', { form: { numero: 'CJ-2026-000140', code: '654321', quittance: 'TP-2026-104512' } });
    expect(r.headers()['content-type']).toBe('application/pdf');
    expect((await r.body()).subarray(0, 5).toString()).toBe('%PDF-');
    expect((await page.request.post('/paiement-tresor/bulletin', { form: { numero: 'CJ-2026-000140', code: '111111', quittance: 'TP-2026-104512' } })).status()).toBe(404);
  });
});

test.describe('Tableau de bord du validateur (impression)', () => {
  async function connecterValidateur(page: Page) {
    await page.goto('/connexion');
    await page.locator('#demonstration details').evaluate((d) => { (d as HTMLDetailsElement).open = true; });
    await page.locator('#demonstration').getByRole('button', { name: /^Validateur — impression/ }).click();
    await expect(page).toHaveURL(/\/espace$/);
  }

  test('file d’impression accessible, réservée au greffe', async ({ page }) => {
    await connecterValidateur(page);
    await expect(page.getByRole('navigation', { name: 'Navigation de l’espace' }).getByRole('link', { name: 'Impression des bulletins' })).toHaveAttribute('href', '/espace/impression');
    await page.goto('/espace/impression');
    await expect(page.getByRole('heading', { level: 1, name: 'Impression des bulletins' })).toBeVisible();
    await sansViolation(page);
    await page.goto('/espace/impression?etat=TOUS');
    await sansViolation(page);
  });

  test('validation puis impression sur feuillet sécurisé, réimpression motivée', async ({ page }, info) => {
    test.skip(info.project.name !== 'bureau', 'actions modifiant l’état de démonstration');
    await connecterValidateur(page);
    await page.goto('/espace/impression?etat=A_VALIDER');
    const fiche = page.locator('section', { has: page.getByRole('heading', { name: 'KOUMBA FICTIF Aline' }) });
    await fiche.getByRole('button', { name: 'Valider' }).click();
    await expect(page.getByText('Bulletin validé : il peut être imprimé.')).toBeVisible();

    const feuillet = `FS-TEST-${Date.now()}`;
    const r = await page.request.post('/espace/impression/demo-imp-431/imprimer', { form: { feuillet } });
    expect(r.headers()['content-type']).toBe('application/pdf');
    expect((await r.body()).subarray(0, 5).toString()).toBe('%PDF-');

    // Réimpression : motif obligatoire, feuillet unique.
    const sansMotif = await page.request.post('/espace/impression/demo-imp-431/imprimer', { form: { feuillet: `${feuillet}-2` }, maxRedirects: 0 });
    expect(sansMotif.status()).toBe(303);
    await page.goto('/espace/impression?etat=IMPRIME');
    await expect(page.getByText('Le motif de la réimpression est obligatoire.')).toBeVisible();
    const avecMotif = await page.request.post('/espace/impression/demo-imp-431/imprimer', { form: { feuillet: `${feuillet}-2`, motif: 'Feuillet abîmé' } });
    expect(avecMotif.headers()['content-type']).toBe('application/pdf');
  });

  test('un usager n’accède pas à l’impression', async ({ page, request }) => {
    await page.goto('/connexion');
    await page.locator('#demonstration details').evaluate((d) => { (d as HTMLDetailsElement).open = true; });
    await page.locator('#demonstration').getByRole('button', { name: /^Demandeur/ }).click();
    await expect(page).toHaveURL(/\/espace$/);
    await page.goto('/espace/impression');
    await expect(page).toHaveURL(/\/espace\?refus=1/);
    expect((await page.request.post('/espace/impression/demo-imp-412/imprimer', { form: { feuillet: 'FS-X' } })).status()).toBe(403);
    expect((await request.post('/espace/impression/demo-imp-412/imprimer', { form: { feuillet: 'FS-X' }, maxRedirects: 0 })).status()).toBe(303);
  });
});
