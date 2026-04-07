import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('results tab supports threshold, point navigation, and filtering controls', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Results' }).click();

  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Load Scan' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Export Data|Exporting\.\.\./ })).toBeVisible();

  const thresholdInput = page.locator('input[type="number"]').first();
  await expect(thresholdInput).toBeVisible();
  await thresholdInput.fill('1.15');
  await expect(thresholdInput).toHaveValue('1.15');

  const selectedPointLabel = page.locator('p:has-text("Selected Point")').locator('..').getByRole('heading');
  const firstPoint = await selectedPointLabel.textContent();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(selectedPointLabel).not.toHaveText(firstPoint ?? '');

  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(selectedPointLabel).toHaveText(firstPoint ?? '');

  const tableSearch = page.getByPlaceholder('Filter by id, label or comment');
  await tableSearch.fill('anomaly');
  await expect(page.getByRole('cell', { name: 'Potential thermal anomaly' }).first()).toBeVisible();
});
