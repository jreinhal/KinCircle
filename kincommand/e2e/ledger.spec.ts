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

test.describe('Ledger Entry Creation @local', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');
  });

  test('should create an expense entry', async ({ page }) => {
    await page.getByRole('button', { name: /track expenses/i }).click();

    await page.getByPlaceholder('0.00').fill('45.67');
    await page.getByPlaceholder('e.g. Prescriptions at CVS').fill('Groceries for Mom');
    await page.getByPlaceholder('e.g. Medical, Groceries').fill('Groceries');

    await page.getByRole('button', { name: /save entry/i }).click();

    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /tools & settings/i }).click();
    await page.getByRole('button', { name: /ledger & reports/i }).click();
    await expect(page.getByText('Groceries for Mom')).toBeVisible();
    await expect(page.getByText('$45.67')).toBeVisible();

    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /care ledger/i }).click();
    await expect(page.getByText('Family Journal')).toBeVisible();
  });

  test('should create a time entry', async ({ page }) => {
    await page.getByRole('button', { name: /log care hours/i }).click();

    await page.getByPlaceholder('1.5').fill('2.5');
    await page.getByPlaceholder('e.g. Driving Mom to Cardiologist').fill('Doctor appointment with Dad');
    await page.getByPlaceholder('e.g. Medical, Groceries').fill('Caregiving');

    await page.getByRole('button', { name: /save entry/i }).click();

    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /tools & settings/i }).click();
    await page.getByRole('button', { name: /ledger & reports/i }).click();
    await expect(page.getByText('Doctor appointment with Dad')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /track expenses/i }).click();

    await page.getByPlaceholder('e.g. Prescriptions at CVS').fill('Test');
    await page.getByRole('button', { name: /save entry/i }).click();

    await expect(page.getByRole('heading', { name: /add contribution/i })).toBeVisible();
  });
});
