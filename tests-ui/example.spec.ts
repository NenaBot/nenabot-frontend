import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  await expect(page).toHaveTitle('NenäBot - Battery Inspection System');
  await page.waitForTimeout(3000);
});
