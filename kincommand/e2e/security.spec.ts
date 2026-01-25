import { test, expect } from '@playwright/test';

const seedLocalStorage = async (page: any) => {
  await page.addInitScript(() => {
    const settings = {
      hourlyRate: 25,
      patientName: '',
      privacyMode: false,
      autoLockEnabled: true,
      hasCompletedOnboarding: true
    };

    localStorage.setItem('kin_entries', JSON.stringify([]));
    localStorage.setItem('kin_tasks', JSON.stringify([]));
    localStorage.setItem('kin_documents', JSON.stringify([]));
    localStorage.setItem('kin_security_logs', JSON.stringify([]));
    localStorage.setItem('kin_settings', JSON.stringify(settings));

    const originalSetTimeout = window.setTimeout;
    let lockScheduled = false;
    window.setTimeout = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
      if (timeout === 60000 && !lockScheduled) {
        lockScheduled = true;
        return originalSetTimeout(handler, 10, ...args);
      }
      return originalSetTimeout(handler, timeout, ...args);
    };
  });
};

test.describe('PIN Lock Screen', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');
  });

  test('should unlock with correct PIN', async ({ page }) => {
    await expect(page.getByText('KinCircle Protected')).toBeVisible();

    for (const digit of ['1', '2', '3', '4']) {
      await page.getByRole('button', { name: digit }).click();
    }

    await expect(page.getByText('KinCircle Protected')).not.toBeVisible();
    await expect(page.getByRole('button', { name: /sibling ledger/i })).toBeVisible();
  });

  test('should reject incorrect PIN', async ({ page }) => {
    await expect(page.getByText('KinCircle Protected')).toBeVisible();

    for (const digit of ['9', '9', '9', '9']) {
      await page.getByRole('button', { name: digit }).click();
    }

    await expect(page.getByText(/invalid pin/i)).toBeVisible();
  });
});
