import { expect, test } from '@playwright/test';

test('shows setup error when profile endpoints fail in non-mock mode', async ({ page }) => {
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
        dms: { status: 'online', error: null },
      }),
    });
  });

  await page.route('**/api/profile/default', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'failed default profile' }),
    });
  });

  await page.route('**/api/profile', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'failed profiles' }),
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();
  await expect(
    page.getByText('Failed to load profiles. You can switch to mock mode in the header.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to Camera' })).toBeDisabled();
});