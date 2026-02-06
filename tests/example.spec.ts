import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle("React UI with Material Design (Copy)");
});