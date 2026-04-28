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

  const routePanel = page.getByRole('tabpanel').filter({
    has: page.getByRole('heading', { name: 'Route Planning' }),
  });
  await expect(routePanel.getByRole('heading', { name: 'Route Planning' })).toBeVisible();

  const startJobButton = routePanel.getByRole('button', { name: 'Start Scan Job' });
  await expect(startJobButton).toBeEnabled();

  await expect(routePanel.getByText('Detected Batteries')).toBeVisible();
  await expect(routePanel.getByText('Checked Waypoints')).toBeVisible();
  const measurementDensityInput = routePanel.getByRole('spinbutton', {
    name: 'Measurement Density',
  });
  await measurementDensityInput.fill('1.25');

  await startJobButton.click();

  const progressPanel = page.getByRole('tabpanel').filter({
    has: page.getByRole('heading', { name: 'Scan Progress' }),
  });
  await expect(progressPanel.getByRole('heading', { name: 'Scan Progress' })).toBeVisible();
  await expect(progressPanel.getByRole('heading', { name: 'Scan Status' })).toBeVisible();

});
