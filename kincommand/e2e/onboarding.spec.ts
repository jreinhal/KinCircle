import { test, expect, type Page } from '@playwright/test';

const seedLocalStorage = async (page: Page) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
};

test.describe('Onboarding Wizard @local', () => {
  test('should complete onboarding and reach dashboard', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /welcome to kincircle/i })).toBeVisible();
    await page.getByRole('button', { name: /let's get started/i }).click();

    await page.getByPlaceholder('e.g. Mom, Dad, Aunt Marie').fill('Martha Jones');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByRole('button', { name: /looks good/i }).click();
    await page.getByPlaceholder('PIN').fill('1234');
    await page.getByPlaceholder('Confirm').fill('1234');
    await page.getByRole('button', { name: /finish setup/i }).click();

    await expect(page.getByRole('heading', { name: /the care ledger/i })).toBeVisible();
  });

  test('should require patient name before continuing', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');

    await page.getByRole('button', { name: /let's get started/i }).click();
    await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});
