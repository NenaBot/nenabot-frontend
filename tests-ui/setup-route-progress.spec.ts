import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('setup to route flow creates a mock job and advances to progress', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to Camera' }).click();

  await expect(page.getByRole('heading', { name: 'Camera Preview & Verification' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to Route' }).click();

  await expect(page.getByRole('heading', { name: 'Route Planning' })).toBeVisible();
  await expect(page.getByText(/Route preview up to date\./)).toBeVisible();
  await expect(page.getByText(/Detected points:\s*6/)).toBeVisible();
  await expect(page.getByText(/Checked waypoints:\s*5/)).toBeVisible();

  const measurementDensityInput = page.locator('input[type="number"]').first();
  await measurementDensityInput.fill('1.25');
  await page.waitForTimeout(400);

  await expect(page.getByText(/Checked waypoints:\s*10|Checked waypoints:\s*11|Checked waypoints:\s*15/)).toBeVisible();

  await page.getByRole('button', { name: 'Start Scan Job' }).click();

  await expect(page.getByRole('heading', { name: 'Scan Progress' })).toBeVisible();
  await expect(page.getByText('Scan started successfully')).toBeVisible();
  await expect(page.getByText(/\b33% complete\b|\b34% complete\b/)).toBeVisible();
});
