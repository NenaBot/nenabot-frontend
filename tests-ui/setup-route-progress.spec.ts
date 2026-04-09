import { expect, test } from '@playwright/test';

test('setup to camera to route flow initializes route and enables job action', async ({ page }) => {
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
});
