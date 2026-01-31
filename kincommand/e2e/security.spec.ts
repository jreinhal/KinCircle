import { test, expect, type Page } from '@playwright/test';
import { openMobileNavIfNeeded } from './nav-helpers';

const seedLocalStorage = async (page: Page) => {
  await page.addInitScript(() => {
    const familyId = 'family-test';
    const settings = {
      hourlyRate: 25,
      patientName: '',
      privacyMode: false,
      autoLockEnabled: true,
      hasCompletedOnboarding: true,
      familyId,
      customPinHash: 'wcoy',
      isSecurePinHash: false
    };

    localStorage.setItem('kin_family_id', familyId);
    localStorage.setItem(`kin_entries:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_tasks:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_documents:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_security_logs:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_settings:${familyId}`, JSON.stringify(settings));

    const originalSetTimeout = window.setTimeout.bind(window);
    let lockScheduled = false;
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 300000 && !lockScheduled) {
        lockScheduled = true;
        return originalSetTimeout(handler, 10, ...args);
      }
      return originalSetTimeout(handler, timeout, ...args);
    }) as typeof window.setTimeout;
  });
};

test.describe('PIN Lock Screen @local', () => {
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
    await openMobileNavIfNeeded(page);
    await expect(page.getByRole('button', { name: /care ledger/i })).toBeVisible();
  });

  test('should reject incorrect PIN', async ({ page }) => {
    await expect(page.getByText('KinCircle Protected')).toBeVisible();

    for (const digit of ['9', '9', '9', '9']) {
      await page.getByRole('button', { name: digit }).click();
    }

    await expect(page.getByText(/invalid pin/i)).toBeVisible();
  });
});
