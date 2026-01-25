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

test('empty state CTAs open the entry form with the right type', async ({ page }) => {
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

test('can add an expense entry and see it in the ledger', async ({ page }) => {
  await seedLocalStorage(page);
  await page.goto('/');

  await page.getByRole('button', { name: /track expenses/i }).click();
  await page.getByPlaceholder('0.00').fill('19.99');
  await page.getByPlaceholder('e.g. Prescriptions at CVS').fill('Test Expense');
  await page.getByPlaceholder('e.g. Medical, Groceries').fill('Medical');
  await page.getByRole('button', { name: /save entry/i }).click();

  await page.getByRole('button', { name: /all transactions/i }).click();
  await expect(page.getByText('Test Expense')).toBeVisible();
});

test('ask kin returns a mock response', async ({ page }) => {
  await seedLocalStorage(page);
  await page.goto('/');

  await page.getByRole('button', { name: /ask kin/i }).click();
  await page.getByPlaceholder(/ask about expenses/i).fill('How much did we spend last month?');
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByText(/mock response/i)).toBeVisible();
});
