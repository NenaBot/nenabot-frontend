import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('results table supports sorting and critical-only filtering', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Results', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();

  await page.getByRole('button', { name: /Sort by point/i }).click();
  await expect(page.locator('tbody tr').first().locator('td').first()).toHaveText('P-001');

  await page.getByLabel('Show critical only').check();
  await expect(page.getByText('Normal')).toHaveCount(0);
  await expect(page.getByText('Critical').first()).toBeVisible();
});