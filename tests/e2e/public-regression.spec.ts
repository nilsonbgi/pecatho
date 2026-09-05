import { test, expect } from '@playwright/test';

const publicRoutes = [
  { path: '/', heading: /Pecatho/i },
  { path: '/login', heading: /entrar|acesso/i },
  { path: '/cadastro', heading: /crie seu espaço/i },
  { path: '/anunciantes', heading: /anunciantes/i },
  { path: '/fans', heading: /fans/i },
];

for (const route of publicRoutes) {
  test(`public route ${route.path} renders without a fatal UI error`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(route.heading);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('cadastro preserves the complete five-step onboarding flow', async ({ page }) => {
  await page.goto('/cadastro', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Etapa 1 de 5')).toBeVisible();
  await expect(page.getByRole('button', { name: /Quero anunciar/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Quero criar no Fans/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Quero os dois/i })).toBeVisible();

  await page.getByLabel('Nome completo').fill('Usuário de Teste');
  await page.getByLabel('Data de nascimento').fill('1990-01-01');
  await page.getByRole('button', { name: /Continuar/i }).click();

  await expect(page.getByText('Etapa 2 de 5')).toBeVisible();
  await page.getByLabel('E-mail').fill('regression@example.com');
  await page.getByLabel('Senha').fill('SenhaSegura123!');
  await page.getByRole('button', { name: /Continuar/i }).click();

  await expect(page.getByText('Etapa 3 de 5')).toBeVisible();
  await page.getByLabel('CPF').fill('529.982.247-25');
  await page.getByLabel('Telefone').fill('(41) 99999-9999');
  await page.getByRole('button', { name: /Continuar/i }).click();

  await expect(page.getByText('Etapa 4 de 5')).toBeVisible();
  await page.route('https://viacep.com.br/ws/**/json/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cep: '80010000',
        logradouro: 'Rua de Teste',
        bairro: 'Centro',
        localidade: 'Curitiba',
        uf: 'PR',
        ibge: '4106902',
      }),
    });
  });
  await page.getByLabel('CEP').fill('80010000');
  await expect(page.locator('input[readonly][value="Curitiba"]')).toBeVisible();
  await expect(page.locator('input[readonly][value="PR"]')).toBeVisible();
  await page.getByLabel('Número').fill('100');
  await page.getByRole('button', { name: /Continuar/i }).click();

  await expect(page.getByText('Etapa 5 de 5')).toBeVisible();
  await expect(page.getByText('Usuário de Teste')).toBeVisible();
  await expect(page.getByText('Curitiba — PR')).toBeVisible();
  await expect(page.getByRole('button', { name: /Criar minha conta/i })).toBeVisible();
});

test('cadastro remains usable on mobile without horizontal overflow', async ({ page }) => {
  await page.goto('/cadastro', { waitUntil: 'domcontentloaded' });
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport + 1);
  await expect(page.getByRole('button', { name: /Continuar/i })).toBeVisible();
  await expect(page.getByLabel('Nome completo')).toBeVisible();
});
