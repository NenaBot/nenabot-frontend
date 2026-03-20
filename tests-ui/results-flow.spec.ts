import { expect, test } from '@playwright/test';

test('results tab supports basic result controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Results' }).click();

  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();

  const refreshButton = page.getByRole('button', { name: 'Refresh result data' });
  await expect(refreshButton).toBeVisible();

  const loadButton = page.getByRole('button', { name: 'Load Scan' });
  await expect(loadButton).toBeVisible();

  const exportButton = page.getByRole('button', { name: /Export Data|Exporting\.\.\./ });
  await expect(exportButton).toBeVisible();

  await expect(page.getByText('Critical Threshold')).toBeVisible();
});
