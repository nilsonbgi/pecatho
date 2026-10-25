import { test, expect } from '@playwright/test';

test.describe('fluxo comercial público de publicidade', () => {
  test('página de publicidade apresenta proposta comercial e não promete ativação imediata', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto('/anunciar', { waitUntil: 'domcontentloaded' });

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: /Sua marca,/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Solicitar proposta comercial/i })).toBeVisible();
    await expect(page.getByText(/não ativa anúncios nem representa contratação ou cobrança/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar solicitação comercial/i })).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('valida campos obrigatórios antes de enviar qualquer solicitação', async ({ page }) => {
    let rpcCalled = false;
    await page.route(/\/rest\/v1\/rpc\/submit_public_advertising_inquiry(?:\?.*)?$/, async (route) => {
      rpcCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    });

    await page.goto('/anunciar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Enviar solicitação comercial/i }).click();

    await expect(page.getByLabel(/Seu nome/i)).toHaveAttribute('required', '');
    await expect(page.getByLabel(/Empresa ou marca/i)).toHaveAttribute('required', '');
    await expect(page.getByLabel(/E-mail comercial/i)).toHaveAttribute('required', '');
    await expect(page.getByLabel(/Conte um pouco sobre a campanha/i)).toHaveAttribute('required', '');
    expect(rpcCalled).toBe(false);
  });

  test('envia os dados comerciais corretos, mantém orçamento como estimativa e confirma recebimento', async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route(/\/rest\/v1\/rpc\/submit_public_advertising_inquiry(?:\?.*)?$/, async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    });

    await page.goto('/anunciar', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/Seu nome/i).fill('Contato Homologação');
    await page.getByLabel(/Empresa ou marca/i).fill('Marca de Teste');
    await page.getByLabel(/E-mail comercial/i).fill('homologacao@example.com');
    await page.getByLabel(/WhatsApp/i).fill('(11) 99999-0000');
    await page.getByLabel(/Onde deseja anunciar/i).selectOption('home_top');
    await page.getByLabel(/Orçamento estimado/i).fill('Até R$ 2.500,00');
    await page.getByLabel(/Conte um pouco sobre a campanha/i).fill('Campanha de homologação automatizada; não publicar.');
    await page.getByRole('button', { name: /Enviar solicitação comercial/i }).click();

    await expect(page.getByRole('heading', { name: /Solicitação recebida/i })).toBeVisible();
    expect(requestBody).not.toBeNull();
    expect(requestBody).toMatchObject({
      p_contact_name: 'Contato Homologação',
      p_company_name: 'Marca de Teste',
      p_email: 'homologacao@example.com',
      p_whatsapp: '(11) 99999-0000',
      p_placement: 'home_top',
      p_budget: 'Até R$ 2.500,00',
      p_message: 'Formato preferido: leaderboard\n\nCampanha de homologação automatizada; não publicar.',
      p_website: '',
    });
  });

  test('página de publicidade funciona em viewport estreito sem overflow horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/anunciar', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /Solicitar proposta comercial/i })).toBeVisible();
    const metrics = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    await expect(page.getByLabel(/Seu nome/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar solicitação comercial/i })).toBeVisible();
  });
});
