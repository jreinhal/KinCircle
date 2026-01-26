import { test, expect } from '@playwright/test';

const hasRealKey =
  !!process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'PLACEHOLDER_API_KEY';

const shouldRun = process.env.E2E_GEMINI_REAL === 'true' && hasRealKey;

const seedLocalStorage = async (page: any) => {
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

test.describe('Ask Kin real API', () => {
test.skip(!shouldRun, 'Set E2E_GEMINI_REAL=true and a real GEMINI_API_KEY to run.');

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
