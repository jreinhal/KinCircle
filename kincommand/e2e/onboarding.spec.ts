import { test, expect } from '@playwright/test';

const seedLocalStorage = async (page: any) => {
  await page.addInitScript(() => {
    localStorage.removeItem('kin_settings');
    localStorage.removeItem('kin_entries');
    localStorage.removeItem('kin_tasks');
    localStorage.removeItem('kin_documents');
    localStorage.removeItem('kin_security_logs');
  });
};

test.describe('Onboarding Wizard', () => {
  test('should complete onboarding and reach dashboard', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /welcome to kincircle/i })).toBeVisible();
    await page.getByRole('button', { name: /let's get started/i }).click();

    await page.getByPlaceholder('e.g. Mom, Dad, Aunt Marie').fill('Martha Jones');
    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByRole('button', { name: /looks good/i }).click();
    await page.getByRole('button', { name: /finish setup/i }).click();

    await expect(page.getByRole('heading', { name: /the sibling ledger/i })).toBeVisible();
  });

  test('should require patient name before continuing', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');

    await page.getByRole('button', { name: /let's get started/i }).click();
    await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});
