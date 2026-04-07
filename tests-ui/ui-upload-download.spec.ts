import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('loads a previous mock scan and exports csv', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Results', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();

  const scanSelector = page.locator('select').first();
  await scanSelector.selectOption('mock-scan-02');
  await expect(scanSelector).toHaveValue('mock-scan-02');

  await page.getByRole('button', { name: 'Load Scan' }).click();
  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();

  const exportFormatSelector = page.locator('select').nth(1);
  await exportFormatSelector.selectOption('csv');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.csv');
  expect(download.suggestedFilename()).toContain('mock-scan-02');
});