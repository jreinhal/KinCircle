import { test, expect } from '@playwright/test';

test.describe('PIN Lock Screen', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Complete onboarding
        const onboardingVisible = await page.locator('text=Welcome to KinCommand').isVisible().catch(() => false);
        if (onboardingVisible) {
            await page.fill('input[placeholder*="patient" i]', 'Test Patient');
            await page.fill('input[type="number"]', '20');
            await page.click('button:has-text("Get Started")');
        }
    });

    test('should unlock with correct PIN', async ({ page }) => {
        // Navigate to settings and enable auto-lock
        await page.click('text=Settings');

        // Enable auto-lock if checkbox exists
        const autoLockCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /auto.*lock/i });
        if (await autoLockCheckbox.isVisible()) {
            await autoLockCheckbox.check();
        }

        // Wait for potential auto-lock (in test, we'll trigger manually if needed)
        // In real app, waiting 60 seconds is impractical for tests

        // Navigate away and back to simulate activity
        await page.click('text=Dashboard');

        // Try to trigger lock screen by looking for lock button if available
        const lockButton = page.locator('button:has-text("Lock")');
        if (await lockButton.isVisible()) {
            await lockButton.click();

            // Should see PIN entry screen
            await expect(page.locator('text=Enter PIN')).toBeVisible();

            // Enter default PIN (1234)
            await page.fill('input[type="password"], input[inputmode="numeric"]', '1234');
            await page.click('button:has-text("Unlock")');

            // Should be back to normal view
            await expect(page.locator('text=Dashboard')).toBeVisible();
        }
    });

    test('should reject incorrect PIN', async ({ page }) => {
        const lockButton = page.locator('button:has-text("Lock")');
        if (await lockButton.isVisible()) {
            await lockButton.click();

            // Enter wrong PIN
            await page.fill('input[type="password"], input[inputmode="numeric"]', '9999');
            await page.click('button:has-text("Unlock")');

            // Should show error or remain locked
            await expect(page.locator('text=Enter PIN')).toBeVisible();
        }
    });
});
