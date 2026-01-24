import { test, expect } from '@playwright/test';

test.describe('Onboarding Wizard', () => {
    test('should complete onboarding and reach dashboard', async ({ page }) => {
        await page.goto('/');

        // Check for onboarding wizard
        await expect(page.locator('text=Welcome to KinCommand')).toBeVisible();

        // Fill out patient name
        await page.fill('input[placeholder*="patient" i]', 'Martha Jones');

        // Fill out hourly rate
        await page.fill('input[type="number"]', '25');

        // Click Get Started button
        await page.click('button:has-text("Get Started")');

        // Should reach dashboard
        await expect(page).toHaveURL(/.*dashboard/i);

        // Verify dashboard elements are visible
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
        await page.goto('/');

        // Try to submit without filling fields
        await page.click('button:has-text("Get Started")');

        // Should still be on onboarding (basic validation check)
        await expect(page.locator('text=Welcome to KinCommand')).toBeVisible();
    });
});
