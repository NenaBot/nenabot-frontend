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

  const startJobButton = page.getByRole('button', { name: 'Start Scan Job' });
  await expect(startJobButton).toBeEnabled();

  await expect(page.getByText(/Detected batteries:\s*[1-9]\d*/)).toBeVisible();
  await expect(page.getByText(/Checked waypoints:\s*[1-9]\d*/)).toBeVisible();
  const measurementDensityInput = page.locator('input[type="number"]').first();
  await measurementDensityInput.fill('1.25');
  await page.waitForTimeout(400);

  if (await startJobButton.isEnabled()) {
    await startJobButton.click();
  } else {
    await page.getByRole('button', { name: 'Progress', exact: true }).click();
  }

  await expect(page.getByRole('heading', { name: 'Scan Progress' })).toBeVisible();
});
