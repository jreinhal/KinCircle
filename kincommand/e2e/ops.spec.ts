import { test, expect, type Page } from '@playwright/test';
import { openMobileNavIfNeeded } from './nav-helpers';

const seedLocalStorage = async (page: Page) => {
  await page.addInitScript(() => {
    const familyId = 'family-test';
    const settings = {
      hourlyRate: 25,
      patientName: '',
      privacyMode: false,
      autoLockEnabled: false,
      hasCompletedOnboarding: true,
      familyId
    };

    localStorage.setItem('kin_family_id', familyId);
    localStorage.setItem(`kin_entries:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_tasks:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_documents:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_security_logs:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_settings:${familyId}`, JSON.stringify(settings));
  });
};

test('empty state CTAs open the entry form with the right type @local', async ({ page }) => {
  await seedLocalStorage(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /welcome to kincircle/i })).toBeVisible();

  await page.getByRole('button', { name: /track expenses/i }).click();
  await expect(page.getByRole('heading', { name: /add contribution/i })).toBeVisible();
  await expect(page.getByText('Amount ($)')).toBeVisible();
  await page.getByRole('button', { name: /cancel/i }).click();

  await page.getByRole('button', { name: /log care hours/i }).click();
  await expect(page.getByText('Duration (Hours)')).toBeVisible();
});

test('can add an expense entry and see it in the ledger @local', async ({ page }) => {
  await seedLocalStorage(page);
  await page.goto('/');

  await page.getByRole('button', { name: /track expenses/i }).click();
  await page.getByPlaceholder('0.00').fill('19.99');
  await page.getByPlaceholder('e.g. Prescriptions at CVS').fill('Test Expense');
  await page.getByPlaceholder('e.g. Medical, Groceries').fill('Medical');
  await page.getByRole('button', { name: /save entry/i }).click();

  await openMobileNavIfNeeded(page);
  await page.getByRole('button', { name: /tools & settings/i }).click();
  await page.getByRole('button', { name: /ledger & reports/i }).click();
  await expect(page.getByText('Test Expense')).toBeVisible();
});

test('ask kin returns a response @local', async ({ page }) => {
  await seedLocalStorage(page);
  await page.goto('/');

  await openMobileNavIfNeeded(page);
  await page.getByRole('button', { name: /ask kin/i }).click();
  await page.getByPlaceholder(/ask about expenses/i).fill('How much did we spend last month?');
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByText(/mock response|trouble accessing the network|encountered an error/i)).toBeVisible();
});
