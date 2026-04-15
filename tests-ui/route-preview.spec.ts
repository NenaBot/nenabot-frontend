import { expect, test } from '@playwright/test';

async function enableMockMode(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nenabot-use-mock-data', 'true');
  });
}

test('route preview shows labels and updates path during drag', async ({ page }) => {
  await enableMockMode(page);
  await page.goto('/');

  await page.getByRole('button', { name: 'Continue to Camera' }).click();
  await page.getByRole('button', { name: 'Continue to Route' }).click();
  await expect(page.getByRole('heading', { name: 'Route Planning' })).toBeVisible();

  const svg = page.getByRole('img', { name: 'Route preview' });
  await expect(svg).toBeVisible();

  const labels = svg.locator('text');
  const labelCount = await labels.count();
  expect(labelCount).toBeGreaterThan(0);

  const polyline = svg.locator('polyline').first();
  await expect(polyline).toBeVisible();
  const beforePoints = await polyline.getAttribute('points');
  expect(beforePoints).toBeTruthy();

  const point = svg.getByRole('button', { name: /Point 1/ }).first();
  const pointBox = await point.boundingBox();
  const svgBox = await svg.boundingBox();

  if (!pointBox || !svgBox) {
    throw new Error('Expected bounding boxes for drag gesture');
  }

  await page.mouse.move(pointBox.x + pointBox.width / 2, pointBox.y + pointBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(svgBox.x + svgBox.width * 0.85, svgBox.y + svgBox.height * 0.25);
  await page.mouse.up();

  await expect
    .poll(async () => polyline.getAttribute('points'))
    .not.toBe(beforePoints);
});
