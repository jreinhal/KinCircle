import { test, expect } from '@playwright/test';

test.describe('Document Vault', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Complete onboarding if present
        const onboardingVisible = await page.locator('text=Welcome to KinCommand').isVisible().catch(() => false);
        if (onboardingVisible) {
            await page.fill('input[placeholder*="patient" i]', 'Test Patient');
            await page.fill('input[type="number"]', '20');
            await page.click('button:has-text("Get Started")');
        }

        // Navigate to vault
        await page.click('text=Vault');
    });

    test('should add a document to the vault', async ({ page }) => {
        // Click add document button
        await page.click('button:has-text("Add Document")');

        // Fill document form
        await page.fill('input[placeholder*="name" i]', 'Power of Attorney');

        // Select document type if dropdown exists
        const typeSelect = page.locator('select, input[placeholder*="type" i]').first();
        if (await typeSelect.isVisible()) {
            await typeSelect.click();
            await page.click('text=Legal', { timeout: 2000 }).catch(() => {
                // If dropdown doesn't work, try input
                typeSelect.fill('Legal');
            });
        }

        // Submit
        await page.click('button:has-text("Add"), button:has-text("Save")');

        // Verify document appears in vault
        await expect(page.locator('text=Power of Attorney')).toBeVisible({ timeout: 5000 });
    });

    test('should activate emergency mode', async ({ page }) => {
        // Click emergency mode button
        await page.click('button:has-text("Emergency Mode")');

        // Verify emergency overlay is visible
        await expect(page.locator('text=EMERGENCY MODE')).toBeVisible();

        // Verify high contrast styling (red/black theme)
        const emergencyOverlay = page.locator('[class*="emergency"], [class*="red-"]').first();
        await expect(emergencyOverlay).toBeVisible();

        // Exit emergency mode
        await page.click('button:has-text("Exit Emergency")');
        await expect(page.locator('text=EMERGENCY MODE')).not.toBeVisible();
    });
});
