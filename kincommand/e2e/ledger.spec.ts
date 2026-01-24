import { test, expect } from '@playwright/test';

test.describe('Ledger Entry Creation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // Complete onboarding if present
        const onboardingVisible = await page.locator('text=Welcome to KinCommand').isVisible().catch(() => false);
        if (onboardingVisible) {
            await page.fill('input[placeholder*="patient" i]', 'Test Patient');
            await page.fill('input[type="number"]', '20');
            await page.click('button:has-text("Get Started")');
        }

        // Navigate to ledger if not already there
        const ledgerLink = page.locator('text=Ledger').first();
        if (await ledgerLink.isVisible()) {
            await ledgerLink.click();
        }
    });

    test('should create an expense entry', async ({ page }) => {
        // Click new entry button
        await page.click('button:has-text("New Entry")');

        // Select expense type
        await page.click('button:has-text("Expense")');

        // Fill form
        await page.fill('input[placeholder*="amount" i]', '45.67');
        await page.fill('input[placeholder*="description" i], textarea[placeholder*="description" i]', 'Groceries for Mom');

        // Select category if dropdown exists
        const categoryInput = page.locator('input[placeholder*="category" i]').first();
        if (await categoryInput.isVisible()) {
            await categoryInput.fill('Groceries');
        }

        // Submit
        await page.click('button:has-text("Add Entry")');

        // Verify entry appears in ledger
        await expect(page.locator('text=Groceries for Mom')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=$45.67')).toBeVisible();
    });

    test('should create a time entry', async ({ page }) => {
        // Click new entry button
        await page.click('button:has-text("New Entry")');

        // Select time type
        await page.click('button:has-text("Time")');

        // Fill form
        await page.fill('input[placeholder*="hours" i], input[type="number"]', '2.5');
        await page.fill('input[placeholder*="description" i], textarea[placeholder*="description" i]', 'Doctor appointment with Dad');

        // Submit
        await page.click('button:has-text("Add Entry")');

        // Verify entry appears
        await expect(page.locator('text=Doctor appointment')).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
        await page.click('button:has-text("New Entry")');
        await page.click('button:has-text("Expense")');

        // Try to submit without amount
        await page.fill('input[placeholder*="description" i], textarea[placeholder*="description" i]', 'Test');
        await page.click('button:has-text("Add Entry")');

        // Should show validation error or remain on form
        // This is a basic check - actual validation might vary
        const formStillVisible = await page.locator('input[placeholder*="amount" i]').isVisible();
        expect(formStillVisible).toBe(true);
    });
});
