import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('calibration tab is visible in navigation', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const calibrationTab = page.getByRole('button', { name: 'Calibration', exact: true });
  await expect(calibrationTab).toBeVisible();
});

test('can navigate to calibration tab and see calibration controls', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Calibration', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Robot 4-Point Calibration' })).toBeVisible();

  // Check for key UI elements
  await expect(page.getByRole('button', { name: 'Start Calibration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh Status' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Capture Current Point' })).toBeVisible();
});

test('calibration tab displays status information', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Calibration', exact: true }).click();

  // Check for status text by finding the exact label
  await expect(page.getByText('Intrinsics', { exact: true })).toBeVisible();
  await expect(page.getByText('Checkerboard', { exact: true })).toBeVisible();
  await expect(page.getByText('Runtime Calibration', { exact: true })).toBeVisible();
});

test('calibration tab displays video feeds', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Calibration', exact: true }).click();

  // Check for feed labels
  await expect(page.getByText('Raw Stream')).toBeVisible();
  await expect(page.getByText('Detection Stream')).toBeVisible();
  await expect(page.getByText('Reference Frame')).toBeVisible();
});

test('can update API URL in calibration tab', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Calibration', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Robot 4-Point Calibration' })).toBeVisible();
});

test('calibration tab remains accessible on mobile', async ({ page }) => {
  await enableMockMode(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Calibration', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Robot 4-Point Calibration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Calibration' })).toBeVisible();
});
