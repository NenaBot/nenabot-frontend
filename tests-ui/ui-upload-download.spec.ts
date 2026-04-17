import { expect, Page, test } from '@playwright/test';

async function enableMockMode(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('loads a previous mock scan and exports csv', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Results', exact: true }).click();

  const resultsPanel = page.getByRole('tabpanel').filter({
    has: page.getByRole('heading', { name: 'Scan Results' }),
  });

  await expect(resultsPanel.getByRole('heading', { name: 'Scan Results' })).toBeVisible();

  const scanSelector = resultsPanel.getByRole('combobox', {
    name: 'View uploaded data from a previous scan',
  });
  await scanSelector.selectOption('mock-scan-02');
  await expect(scanSelector).toHaveValue('mock-scan-02');

  await resultsPanel.getByRole('button', { name: 'Load Scan' }).click();
  await expect(resultsPanel.getByRole('heading', { name: 'Scan Results' })).toBeVisible();

  const exportFormatSelector = resultsPanel.getByRole('combobox', {
    name: 'Select export format',
  });
  await exportFormatSelector.selectOption('csv');

  const downloadPromise = page.waitForEvent('download');
  await resultsPanel.getByRole('button', { name: 'Export Data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.csv');
  expect(download.suggestedFilename()).toContain('mock-scan-02');
});