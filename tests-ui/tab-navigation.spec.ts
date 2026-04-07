import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('can navigate through all primary tabs on desktop', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();

  await page.getByRole('button', { name: 'Camera' }).click();
  await expect(page.getByRole('heading', { name: 'Camera Preview & Verification' })).toBeVisible();

  await page.getByRole('button', { name: 'Route' }).click();
  await expect(page.getByRole('heading', { name: 'Route Planning' })).toBeVisible();

  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'Scan Progress' })).toBeVisible();

  await page.getByRole('button', { name: 'Results' }).click();
  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();
});

test('tab navigation stays usable on mobile viewport', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();

  await page.getByRole('button', { name: 'Camera' }).click();
  await expect(page.getByRole('heading', { name: 'Camera Preview & Verification' })).toBeVisible();

  await page.getByRole('button', { name: 'Setup' }).click();
  await expect(page.getByRole('heading', { name: 'Profile Setup' })).toBeVisible();
});
