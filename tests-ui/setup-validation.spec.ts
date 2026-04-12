import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('blocks setup progression until profile JSON is valid', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();

  const optionsTextarea = page.locator('textarea');
  await expect(optionsTextarea).toContainText('scanMode');

  await optionsTextarea.fill('{"scanMode":');

  await expect(page.getByText('Options must be valid JSON object syntax.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to Camera' })).toBeDisabled();

  await optionsTextarea.fill('{"scanMode":"standard","integrationMs":120,"nested":{"enabled":true}}');

  await expect(page.getByText('Options must be valid JSON object syntax.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue to Camera' })).toBeEnabled();

  await page.getByRole('button', { name: 'Continue to Camera' }).click();
  await expect(page.getByRole('heading', { name: 'Camera Preview & Verification' })).toBeVisible();
});