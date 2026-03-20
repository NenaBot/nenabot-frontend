import { expect, test } from '@playwright/test';

test('can navigate through all primary tabs', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();

  await page.locator('button[title="Verify camera and detection"]').click();
  await expect(page.getByRole('heading', { name: 'Camera Preview & Verification' })).toBeVisible();

  await page.locator('button[title="Plan scan route"]').click();
  await expect(page.getByRole('heading', { name: 'Route Planning' })).toBeVisible();
});
