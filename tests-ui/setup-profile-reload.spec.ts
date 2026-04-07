import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('setup profile switch persists through reload action', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();

  const profileSelect = page.locator('select').first();
  await profileSelect.selectOption('high-precision');
  await expect(profileSelect).toHaveValue('high-precision');

  const optionsTextarea = page.locator('textarea');
  await expect(optionsTextarea).toContainText('precision');

  await page.getByRole('button', { name: 'Reload' }).click();
  await expect(profileSelect).toHaveValue('high-precision');
  await expect(optionsTextarea).toContainText('precision');
});