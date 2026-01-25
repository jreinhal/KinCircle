import { test, expect } from '@playwright/test';

const hasRealKey =
  !!process.env.VITE_GEMINI_API_KEY &&
  process.env.VITE_GEMINI_API_KEY !== 'PLACEHOLDER_API_KEY';

const shouldRun = process.env.E2E_GEMINI_REAL === 'true' && hasRealKey;

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

test.describe('Ask Kin real API', () => {
  test.skip(!shouldRun, 'Set E2E_GEMINI_REAL=true and a real VITE_GEMINI_API_KEY to run.');

  test('returns a response from Gemini without network error', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');

    await page.getByRole('button', { name: /ask kin/i }).click();
    await page.getByPlaceholder(/ask about expenses/i).fill('What is 2+2? Reply with just the number.');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText(/searching & thinking/i)).toBeVisible();
    await expect(page.getByText(/searching & thinking/i)).not.toBeVisible({ timeout: 60000 });

    await expect(page.getByText(/i'm having trouble accessing the network/i)).toHaveCount(0);
  });
});
