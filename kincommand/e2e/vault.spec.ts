import { test, expect } from '@playwright/test';

const seedLocalStorage = async (page: any) => {
  await page.addInitScript(() => {
    const familyId = 'family-test';
    const settings = {
      hourlyRate: 25,
      patientName: 'Test Patient',
      privacyMode: false,
      autoLockEnabled: false,
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
  });
};

// Helper to enter PIN and activate emergency mode
const activateEmergencyMode = async (page: any) => {
  await page.getByRole('button', { name: /emergency access/i }).click();
  // Wait for PIN modal to appear
  await page.waitForSelector('input[type="password"]');
  // Enter configured PIN '1234'
  await page.fill('input[type="password"]', '1234');
  // Click the activate button
  await page.getByRole('button', { name: /activate emergency mode/i }).click();
  // Wait for emergency view to appear
  await page.waitForSelector('text=Emergency Responder View');
};

test.describe('Document Vault', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');
    await page.getByRole('button', { name: /tools & settings/i }).click();
    await page.getByRole('button', { name: /document vault/i }).click();
  });

  test('should add a document to the vault', async ({ page }) => {
    await page.setInputFiles('input[type="file"]', {
      name: 'power-of-attorney.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test document')
    });

    await expect(page.getByText('power-of-attorney.pdf')).toBeVisible();
  });

  test('should activate emergency access view', async ({ page }) => {
    await activateEmergencyMode(page);
    await expect(page.getByText('Emergency Responder View')).toBeVisible();
  });

  // Skip snapshot test in CI - visual regression requires consistent environments
  // Run locally with: npx playwright test --update-snapshots
  test.skip('emergency access view matches snapshot', async ({ page }) => {
    await activateEmergencyMode(page);
    await expect(page.getByText('Emergency Responder View')).toBeVisible();
    await expect(page).toHaveScreenshot('vault-emergency-view.png', { fullPage: true });
  });
});
