import { test, expect, type Page } from '@playwright/test';
import { ensureToolsOpen, openMobileNavIfNeeded } from './nav-helpers';

const seedLocalStorage = async (page: Page) => {
  await page.addInitScript(() => {
    const familyId = 'family-test';
    const settings = {
      hourlyRate: 25,
      patientName: 'Jesse',
      privacyMode: false,
      autoLockEnabled: false,
      hasCompletedOnboarding: true,
      familyId,
      securityProfile: 'standard',
      themeMode: 'light'
    };

    const entries = [
      {
        id: 'e1',
        userId: 'u1',
        type: 'EXPENSE',
        date: '2024-01-02',
        description: 'Groceries',
        amount: 45.25,
        category: 'Groceries'
      },
      {
        id: 'e2',
        userId: 'u2',
        type: 'TIME',
        date: '2024-01-03',
        description: 'Care visit',
        amount: 50,
        timeDurationMinutes: 120,
        category: 'Caregiving'
      }
    ];

    localStorage.setItem('kin_family_id', familyId);
    localStorage.setItem(`kin_entries:${familyId}`, JSON.stringify(entries));
    localStorage.setItem(`kin_tasks:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_documents:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_security_logs:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_settings:${familyId}`, JSON.stringify(settings));
  });
};

const navExpectations = [
  { label: 'Care Ledger', heading: 'The Care Ledger' },
  { label: 'Care Tasks', heading: 'Care Schedule' },
  { label: 'Help Calendar', heading: 'Help Calendar' },
  { label: 'Add Entry', heading: 'Add Contribution' },
  { label: 'Medications', heading: 'Medications' },
  { label: 'Ask Kin (AI)', heading: 'Ask Kin' }
];

const toolsExpectations = [
  { label: 'Ledger & Reports', heading: 'All Transactions' },
  { label: 'Recurring Expenses', heading: 'Recurring Expenses' },
  { label: 'Document Vault', heading: 'Digital Vault' },
  { label: 'Family Circle', heading: 'Family Circle' },
  { label: 'Settings', heading: 'Family Configuration' }
];

test.describe('Button navigation smoke test (desktop) @local', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');
  });

  test('primary navigation buttons go to the correct screens', async ({ page }) => {
    for (const item of navExpectations) {
      await openMobileNavIfNeeded(page);
      await page.getByRole('button', { name: item.label, exact: true }).click();
      await expect(page.getByRole('heading', { name: item.heading, exact: true })).toBeVisible();
    }
  });

  test('tools & settings navigation buttons go to the correct screens', async ({ page }) => {
    for (const item of toolsExpectations) {
      await ensureToolsOpen(page);
      await page.getByRole('button', { name: item.label, exact: true }).click();
      await expect(page.getByRole('heading', { name: item.heading, exact: true })).toBeVisible();
    }
  });

  test('family journal photo buttons accept input', async ({ page }) => {
    await page.getByRole('button', { name: /family journal/i }).click();

    await expect(page.getByRole('button', { name: /choose photo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /take photo/i })).toBeVisible();

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
      'base64'
    );

    await page.getByRole('button', { name: /choose photo/i }).click();
    await page.setInputFiles('[data-testid="journal-photo-input"]', {
      name: 'journal-photo.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    await expect(page.getByText(/selected: journal-photo\.png/i)).toBeVisible();

    await page.getByRole('button', { name: /take photo/i }).click();
    await page.setInputFiles('[data-testid="journal-camera-input"]', {
      name: 'journal-camera.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    });
    await expect(page.getByText(/selected: journal-camera\.png/i)).toBeVisible();
  });
});

test.describe('Mobile navigation smoke test @local', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');
  });

  test('hamburger opens navigation and routes correctly', async ({ page }) => {
    await page.getByRole('button', { name: /open navigation/i }).click();
    await expect(page.getByRole('button', { name: /close navigation/i })).toBeVisible();

    await page.getByRole('button', { name: /care tasks/i }).click();
    await expect(page.getByText(/care schedule/i)).toBeVisible();
  });
});
