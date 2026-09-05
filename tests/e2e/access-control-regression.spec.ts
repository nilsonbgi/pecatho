import { test, expect } from '@playwright/test';

const protectedPages = ['/painel', '/fans', '/fans/gerenciar', '/admin'];

for (const path of protectedPages) {
  test(`protected page ${path} does not expose authenticated UI to anonymous visitors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(page.locator('body')).toContainText(/Entrar no Pecatho|acesso/i);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('protected API endpoints reject anonymous requests', async ({ request }) => {
  const endpoints = [
    { path: '/api/fans/checkout/intent', body: { kind: 'post', post_id: '00000000-0000-0000-0000-000000000000' } },
    { path: '/api/fans/checkout/provider', body: { order_id: '00000000-0000-0000-0000-000000000000' } },
    { path: '/api/fans/payout/request', body: { creator_id: '00000000-0000-0000-0000-000000000000', amount: 20, idempotency_key: 'regression-anonymous' } },
  ];

  for (const endpoint of endpoints) {
    const response = await request.post(endpoint.path, {
      data: endpoint.body,
      headers: { 'content-type': 'application/json' },
    });
    expect(response.status(), `${endpoint.path} must reject anonymous access`).toBe(401);
  }
});

test('public catalogue remains usable on mobile without horizontal overflow', async ({ page }) => {
  await page.goto('/anunciantes', { waitUntil: 'domcontentloaded' });
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport + 1);
  await expect(page.locator('body')).toContainText(/Anunciantes/i);
});
