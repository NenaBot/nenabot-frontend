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

  const resultsPanel = page.getByRole('tabpanel').filter({
    has: page.getByRole('heading', { name: 'Scan Results' }),
  });

  await expect(resultsPanel.getByRole('heading', { name: 'Scan Results' })).toBeVisible();
  await expect(resultsPanel.getByRole('button', { name: 'Load Scan' })).toBeVisible();
  await expect(resultsPanel.getByRole('button', { name: /Export Data|Exporting\.\.\./ })).toBeVisible();

  const thresholdInput = resultsPanel.locator('input[type="number"]').first();
  await expect(thresholdInput).toBeVisible();
  await thresholdInput.fill('1.15');
  await expect(thresholdInput).toHaveValue('1.15');

  const selectedPointLabel = resultsPanel.getByRole('heading', { name: /^P-\d{3}$/ }).first();
  await expect(selectedPointLabel).toHaveText('P-001');

  await resultsPanel.getByRole('button', { name: 'Next' }).first().click();
  await expect(selectedPointLabel).toHaveText('P-002');

  await resultsPanel.getByRole('button', { name: 'Previous' }).first().click();
  await expect(selectedPointLabel).toHaveText('P-001');

  const tableSearch = resultsPanel.getByPlaceholder('Filter by id, label or comment');
  await tableSearch.fill('anomaly');
  await expect(
    resultsPanel.getByRole('cell', { name: 'Potential thermal anomaly' }).first(),
  ).toBeVisible();
});
