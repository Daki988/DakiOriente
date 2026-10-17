import { expect, test } from '@playwright/test';

test.describe('PUB-01 Accueil', () => {
  test('trois actions principales, bandeau de démonstration et emblème neutre (ENV-01, VIS-02)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Démonstration — service non officiel.')).toBeVisible();
    for (const nom of ['Demander mon bulletin', 'Suivre ma demande', 'Vérifier un bulletin']) {
      await expect(page.getByRole('main').getByRole('link', { name: nom }).first()).toBeVisible();
    }
    await expect(page.locator('img[src*="armoiries"]')).toHaveCount(0);
  });

  test('ENV-02 : la démonstration n’est pas indexée', async ({ page, request }) => {
    const r = await request.get('/');
    expect(r.headers()['x-robots-tag']).toContain('noindex');
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
  });

  test('SEC-04 : en-têtes de sécurité', async ({ request }) => {
    const h = (await request.get('/')).headers();
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['referrer-policy']).toBe('no-referrer');
    expect(h['x-powered-by']).toBeUndefined();
  });
});

test.describe('PUB-06 Demande de bulletin n°3 (ERG-04)', () => {
  test('cinq étapes, erreurs explicites, reprise après coupure, paiement simulé puis suivi', async ({ page }) => {
    await page.goto('/demande');
    await expect(page.getByText('Étape 1 sur 5')).toBeVisible();

    // ERG-05 : l'erreur dit quoi corriger.
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Choisissez la situation qui vous correspond.').first()).toBeVisible();

    await page.getByRole('radio', { name: /né au Gabon/ }).check();
    await expect(page.getByText('1 500 FCFA')).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.getByRole('button', { name: 'Remplir avec une identité fictive' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Étape 3 sur 5')).toBeVisible();

    // Coupure : la saisie est retrouvée (ERG-04).
    await page.reload();
    await expect(page.getByText('Étape 3 sur 5')).toBeVisible();
    await expect(page.getByLabel(/Téléphone mobile/)).toHaveValue('+241 77 00 00 00');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(page.getByText('NDONG MBA')).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Cochez la case pour attester').first()).toBeVisible();
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Continuer' }).click();

    await expect(page.getByText('Simulateur de paiement')).toBeVisible();
    await page.getByRole('radio', { name: /Airtel Money/ }).check();
    await page.getByRole('button', { name: /Payer 1 500 FCFA/ }).click();
    await expect(page.getByRole('heading', { name: 'Demande enregistrée et payée' })).toBeVisible();

    const [numero, code] = await page.locator('.p-identifiant strong').allTextContents();
    expect(numero).toMatch(/^CJ-2026-\d{6}$/);
    expect(await page.evaluate(() => localStorage.getItem('cj-brouillon-demande-b3'))).toBeNull();

    // PUB-07 : suivi avec le numéro et le code.
    await page.goto('/suivi');
    await page.getByLabel(/Numéro de dossier/).fill(numero);
    await page.getByLabel(/Code de suivi/).fill(code);
    await page.getByRole('button', { name: /Voir l’état/ }).click();
    await expect(page.getByRole('heading', { name: 'Bulletin disponible dans votre espace' })).toBeVisible();
  });

  test('profil sans tarif fixé : la demande en ligne n’est pas ouverte (ADR 0005)', async ({ page }) => {
    await page.goto('/demande');
    await page.getByRole('radio', { name: /étranger et je réside/ }).check();
    await expect(page.getByText('La demande en ligne n’est pas encore ouverte pour cette situation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  test('date de naissance impossible refusée', async ({ page }) => {
    await page.goto('/demande');
    await page.getByRole('radio', { name: /né au Gabon/ }).check();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Remplir avec une identité fictive' }).click();
    await page.getByLabel('Jour').fill('31');
    await page.getByLabel('Mois').fill('02');
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByText('Cette date n’existe pas. Vérifiez le jour et le mois.').first()).toBeVisible();
  });
});

test.describe('PUB-07 Suivi', () => {
  test('dossier en attente de pièce : délai suspendu (RG-09)', async ({ page }) => {
    await page.goto('/suivi');
    await page.getByLabel(/Numéro de dossier/).fill('CJ-2026-000123');
    await page.getByLabel(/Code de suivi/).fill('123456');
    await page.getByRole('button', { name: /Voir l’état/ }).click();
    await expect(page.getByText('Le délai de 24 heures est suspendu')).toBeVisible();
  });

  test('mauvais code : message sans dire quel champ est faux', async ({ page }) => {
    await page.goto('/suivi');
    await page.getByLabel(/Numéro de dossier/).fill('CJ-2026-000123');
    await page.getByLabel(/Code de suivi/).fill('000000');
    await page.getByRole('button', { name: /Voir l’état/ }).click();
    await expect(page.getByText('Aucune demande ne correspond')).toBeVisible();
  });
});

test.describe('PUB-08 Vérification (BUL-03, BUL-06, BUL-07)', () => {
  test('code valide : identité minimale, jamais de condamnation', async ({ page }) => {
    await page.goto('/verifier');
    await page.getByLabel(/Code de vérification/).fill('demo vali de26');
    await page.getByRole('button', { name: 'Vérifier le bulletin' }).click();
    await expect(page.getByRole('heading', { name: 'Bulletin authentique et valide' })).toBeVisible();
    await expect(page.getByText('NDONG MBA')).toBeVisible();
    await expect(page.getByText(/condamnation/i)).toHaveCount(1); // seule la mention « Jamais le contenu du casier : les condamnations ne s’affichent pas »
  });

  test('bulletin révoqué et bulletin expiré', async ({ page }) => {
    await page.goto('/verifier?code=DEMO-REVO-QUE1');
    await expect(page.getByRole('heading', { name: /Bulletin révoqué/ })).toBeVisible();
    await page.goto('/verifier?code=DEMO-EXPI-RE01');
    await expect(page.getByRole('heading', { name: /expiré/ })).toBeVisible();
  });

  test('code mal formé : message de correction, aucun appel', async ({ page }) => {
    await page.goto('/verifier?code=abc');
    await expect(page.getByText('Le code doit compter 12 lettres ou chiffres').first()).toBeVisible();
  });

  test('QR code : jeton valide, jeton inconnu', async ({ page }) => {
    await page.goto('/v/demo-bulletin-valide-7Kq2mW9xP4vB8nR3tY6zA1cE5hJ0sL2d');
    await expect(page.getByRole('heading', { name: 'Bulletin authentique et valide' })).toBeVisible();
    await page.goto('/v/jeton-inconnu-0000000000000');
    await expect(page.getByRole('heading', { name: 'Aucun bulletin ne correspond' })).toBeVisible();
  });
});

test.describe('PUB-09, PUB-10, PUB-16', () => {
  test('tarifs lus dans le référentiel, bandeau provisoire, profils à fixer', async ({ page }) => {
    await page.goto('/tarifs');
    await expect(page.getByText('Tarifs provisoires')).toBeVisible();
    await expect(page.getByRole('cell', { name: '20 000 FCFA' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'À fixer' }).first()).toBeVisible();
  });

  test('recherche dans l’aide sans JavaScript', async ({ browser }) => {
    const contexte = await browser.newContext({ javaScriptEnabled: false });
    const page = await contexte.newPage();
    await page.goto('/aide?q=paiement');
    await expect(page.getByText(/réponses? pour « paiement »/)).toBeVisible();
    await contexte.close();
  });

  test('page introuvable : message clair et numéro de support', async ({ page }) => {
    const r = await page.goto('/nexiste-pas');
    expect(r?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Cette page n’existe pas ou a été déplacée' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Support/ })).toBeVisible();
  });
});
