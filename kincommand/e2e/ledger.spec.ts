import { test, expect } from '@playwright/test';

const seedLocalStorage = async (page: any) => {
  await page.addInitScript(() => {
    const settings = {
      hourlyRate: 25,
      patientName: '',
      privacyMode: false,
      autoLockEnabled: false,
      hasCompletedOnboarding: true
    };

    localStorage.setItem('kin_entries', JSON.stringify([]));
    localStorage.setItem('kin_tasks', JSON.stringify([]));
    localStorage.setItem('kin_documents', JSON.stringify([]));
    localStorage.setItem('kin_security_logs', JSON.stringify([]));
    localStorage.setItem('kin_settings', JSON.stringify(settings));
  });
};

test.describe('Ledger Entry Creation', () => {
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

    await page.getByRole('button', { name: /all transactions/i }).click();
    await expect(page.getByText('Groceries for Mom')).toBeVisible();
    await expect(page.getByText('$45.67')).toBeVisible();

    await page.getByRole('button', { name: /sibling ledger/i }).click();
    await expect(page.getByText('Family Journal')).toBeVisible();
  });

  test('should create a time entry', async ({ page }) => {
    await page.getByRole('button', { name: /log care hours/i }).click();

    await page.getByPlaceholder('1.5').fill('2.5');
    await page.getByPlaceholder('e.g. Driving Mom to Cardiologist').fill('Doctor appointment with Dad');
    await page.getByPlaceholder('e.g. Medical, Groceries').fill('Caregiving');

    await page.getByRole('button', { name: /save entry/i }).click();

    await page.getByRole('button', { name: /all transactions/i }).click();
    await expect(page.getByText('Doctor appointment with Dad')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /track expenses/i }).click();

    await page.getByPlaceholder('e.g. Prescriptions at CVS').fill('Test');
    await page.getByRole('button', { name: /save entry/i }).click();

    await expect(page.getByRole('heading', { name: /add contribution/i })).toBeVisible();
  });
});
