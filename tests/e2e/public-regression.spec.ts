import { test, expect } from '@playwright/test';

const publicRoutes = [
  { path: '/', heading: /Pecatho/i },
  { path: '/login', heading: /entrar|acesso/i },
  { path: '/cadastro', heading: /crie seu espaço/i },
  { path: '/anunciantes', heading: /descubra perfis|pecatho\s*·\s*acompanhantes/i },
  { path: '/fans', heading: /conexões reais|criadores/i },
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

test('cadastro preserves the complete five-step onboarding flow without creating production users', async ({ page }) => {
  // This suite may run against the production URL. Intercept Supabase Auth signup so
  // the browser validates the full completion UI without creating accounts or sending email.
  let signupIntercepted = false;
  let signupRequestBody: { [key: string]: unknown } | null = null;
  const referralCode = 'PTESTAFFILIATE123';
  await page.route(/\\/auth\\/v1\\/signup(?:\\?.*)?$/, async (route) => {
    signupIntercepted = true;
    signupRequestBody = route.request().postDataJSON() as { [key: string]: unknown };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: '',
        token_type: 'bearer',
        expires_in: 0,
        refresh_token: '',
        user: {
          id: '00000000-0000-4000-8000-000000000099',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'regression@pecatho.invalid',
          email_confirmed_at: null,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: { display_name: 'Usuário de Teste' },
          identities: [],
          created_at: '2026-01-01T00:00:00.000Z',
        },
      }),
    });
  });

  await page.goto(`/cadastro?ref=${referralCode}`, { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Etapa 1 de 5')).toBeVisible();
  await expect(page.getByRole('button', { name: /Quero ser acompanhante/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Quero criar no Fans/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Quero os dois/i })).toBeVisible();

  // Select the intended account type after hydration before interacting with the form.
  await page.getByRole('button', { name: /Quero criar no Fans/i }).click();
  const nameInput = page.getByLabel('Nome completo');
  const birthDateInput = page.getByLabel('Data de nascimento');
  await expect(nameInput).toBeVisible();
  await nameInput.fill('Usuário de Teste');
  await expect(nameInput).toHaveValue('Usuário de Teste');
  await birthDateInput.fill('1990-01-01');
  await expect(birthDateInput).toHaveValue('1990-01-01');
  await page.getByRole('button', { name: /Continuar/i }).click();

  await expect(page.getByText('Etapa 2 de 5')).toBeVisible();
  await page.getByLabel('E-mail').fill('regression@pecatho.invalid');
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
  await expect(page.locator('input[readonly][value="Curitiba"]')).toHaveValue('Curitiba');
  await expect(page.locator('input[readonly][value="PR"]')).toHaveValue('PR');
  await expect(page.getByLabel('Logradouro')).toHaveValue('Rua de Teste');
  await expect(page.getByLabel('Bairro')).toHaveValue('Centro');
  await expect(page.getByText('Consultando CEP...')).toBeHidden();
  await page.getByLabel('Número').fill('100');
  await expect(page.getByText('Etapa 4 de 5')).toBeVisible();
  await page.getByRole('button', { name: /Continuar/i }).click();

  // Advancing to review must never submit the form or create an Auth user.
  await expect(page.getByText('Etapa 5 de 5')).toBeVisible();
  expect(signupIntercepted, 'Signup must not run before the final review confirmation').toBe(false);
  await expect(page.getByText('Usuário de Teste')).toBeVisible();
  await expect(page.getByText('Curitiba — PR')).toBeVisible();
  await page.getByRole('button', { name: /Criar minha conta/i }).click();
  await expect.poll(() => signupIntercepted).toBe(true);
  await expect(page.getByText('Falta só confirmar seu e-mail.')).toBeVisible();
  await expect(page.getByRole('link', { name: /Ir para o login/i })).toBeVisible();
  expect(signupRequestBody, 'The referral signup request must be captured').not.toBeNull();
  const userMetadata = signupRequestBody?.options && typeof signupRequestBody.options === 'object'
    ? (signupRequestBody.options as { data?: { referral_code?: string } }).data
    : undefined;
  expect(userMetadata?.referral_code, 'The referral code from the signup URL must be sent in Supabase Auth user metadata').toBe(referralCode);
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
