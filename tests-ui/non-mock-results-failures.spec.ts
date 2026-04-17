import { expect, test } from '@playwright/test';

test('shows results error when latest scan APIs fail in non-mock mode', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'false');
  });

  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        uptimeSeconds: 100,
        robot: { status: 'online', error: null },
        camera: { status: 'online', error: null },
        ionvision: { status: 'online', error: null },
      }),
    });
  });

  await page.route('**/api/job/latest', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'latest job failed' }),
    });
  });

  await page.route('**/api/job', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'list jobs failed' }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Results', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();
  await expect(page.getByText(/Failed to load (the latest scan result|scan list)\./)).toBeVisible();
});