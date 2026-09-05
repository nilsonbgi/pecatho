import { test, expect, type Page } from '@playwright/test';

const userEmail = process.env.E2E_TEST_EMAIL;
const userPassword = process.env.E2E_TEST_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const creatorEmail = process.env.E2E_CREATOR_EMAIL;
const creatorPassword = process.env.E2E_CREATOR_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('domcontentloaded');
}

async function expectAuthenticatedPage(page: Page, path: string, expectedText?: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response?.status(), `${path} returned an unexpected HTTP status`).toBeLessThan(500);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  if (expectedText) await expect(page.getByText(expectedText, { exact: false }).first()).toBeVisible();
}

test.describe('authenticated Pecatho regression', () => {
  test.skip(!userEmail || !userPassword, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to enable the authenticated advertiser/account fixture.');

  test('authenticated account reaches the core user workspace without falling back to login', async ({ page }) => {
    await login(page, userEmail!, userPassword!);
    await expect(page).toHaveURL(/\/(painel|admin)(?:\?.*)?$/);
    await expectAuthenticatedPage(page, '/painel', 'PAINEL DO USUÁRIO');

    for (const path of [
      '/painel/perfil',
      '/painel/anuncio',
      '/painel/anuncio/revisao',
      '/painel/anuncio/midias',
      '/painel/anuncio/operacional',
    ]) {
      await expectAuthenticatedPage(page, path);
    }
  });

  test('authenticated account cannot silently obtain privileged administration', async ({ page }) => {
    await login(page, userEmail!, userPassword!);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const body = await page.locator('body').innerText();
    const hasAdminWorkspace = /centro de gestão|revisão e moderação|recebimentos fans/i.test(body);
    const hasBootstrapOnly = /primeiro acesso administrativo/i.test(body);

    if (hasAdminWorkspace) {
      throw new Error('Non-privileged E2E account reached the administrative workspace.');
    }

    expect(hasBootstrapOnly || /painel/i.test(body)).toBeTruthy();
  });
});

test.describe('authenticated Fans creator regression', () => {
  test.skip(!creatorEmail || !creatorPassword, 'Set E2E_CREATOR_EMAIL and E2E_CREATOR_PASSWORD to enable the Fans creator fixture.');

  test('creator reaches Fans management and its principal operational modules', async ({ page }) => {
    await login(page, creatorEmail!, creatorPassword!);
    await expectAuthenticatedPage(page, '/fans/gerenciar', 'PAINEL DO CRIADOR');

    for (const path of [
      '/fans/gerenciar/perfil',
      '/fans/gerenciar/planos',
      '/fans/gerenciar/publicacoes',
      '/fans/gerenciar/assinantes',
      '/fans/gerenciar/vendas',
      '/fans/gerenciar/gorjetas',
      '/fans/gerenciar/recebimentos',
      '/fans/gerenciar/configuracoes',
    ]) {
      await expectAuthenticatedPage(page, path);
    }
  });
});

test.describe('authenticated administration regression', () => {
  test.skip(!adminEmail || !adminPassword, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to enable the administrative fixture.');

  test('privileged account reaches moderation and financial administration', async ({ page }) => {
    await login(page, adminEmail!, adminPassword!);
    await expect(page).toHaveURL(/\/admin(?:\?.*)?$/);
    await expectAuthenticatedPage(page, '/admin');
    await expectAuthenticatedPage(page, '/admin/revisao');
    await expectAuthenticatedPage(page, '/admin/recebimentos');
  });
});
