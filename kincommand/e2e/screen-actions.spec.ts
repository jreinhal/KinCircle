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
    localStorage.setItem(`kin_recurring_expenses:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_family_invites:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_help_tasks:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_medications:${familyId}`, JSON.stringify([]));
    localStorage.setItem(`kin_medication_logs:${familyId}`, JSON.stringify([]));
  });
};

test.describe('Screen action coverage', () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/');
  });

  test('dashboard interactions (settlement + journal)', async ({ page }) => {
    await page.getByRole('button', { name: /settlement details/i }).click();
    await expect(page.getByRole('heading', { name: /contribution breakdown/i })).toBeVisible();

    await page.getByRole('button', { name: /family journal/i }).click();
    await expect(page.getByRole('button', { name: /choose photo/i })).toBeVisible();

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

  test('add entry form toggles, cancel, and save', async ({ page }) => {
    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /add entry/i }).click();
    await expect(page.getByRole('heading', { name: /add contribution/i })).toBeVisible();

    await page.getByRole('button', { name: /care hours/i }).click();
    await page.getByRole('button', { name: /expense/i }).click();

    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('heading', { name: /the care ledger/i })).toBeVisible();

    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /add entry/i }).click();
    await page.getByPlaceholder('0.00').fill('18.75');
    await page.getByPlaceholder('e.g. Prescriptions at CVS').fill('Parking');
    await page.getByPlaceholder('e.g. Medical, Groceries').fill('Transport');
    await page.getByRole('button', { name: /save entry/i }).click();
    await expect(page.getByRole('heading', { name: /the care ledger/i })).toBeVisible();
  });

  test('care tasks add, edit, complete, and log', async ({ page }) => {
    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /care tasks/i }).click();
    await expect(page.getByRole('heading', { name: /care schedule/i })).toBeVisible();

    await page.getByPlaceholder('e.g. Pick up prescription from Walgreens').fill('Pick up meds');
    await page.locator('form').getByRole('button').click();
    await expect(page.getByText('Pick up meds')).toBeVisible();

    await page.getByRole('button', { name: /edit/i }).click();
    const editModal = page.getByRole('heading', { name: /edit task/i }).locator('..').locator('..');
    await editModal.locator('input[type="text"]').fill('Pick up prescriptions');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Pick up prescriptions')).toBeVisible();

    await page.getByRole('button', { name: /mark as complete/i }).click();

    await page.getByRole('button', { name: /completed/i }).click();
    await page.getByRole('button', { name: /log to ledger/i }).click();
    await page.getByPlaceholder('e.g. 1.5').fill('1.5');
    await page.getByRole('button', { name: /save entry/i }).click();
    await expect(page.getByText('Logged')).toBeVisible();
  });

  test('help calendar request, edit, claim, and complete', async ({ page }) => {
    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /help calendar/i }).click();
    await expect(page.getByRole('heading', { name: /help calendar/i })).toBeVisible();

    await page.getByRole('button', { name: /request help/i }).click();
    await page.getByPlaceholder("e.g., Drive Mom to doctor's appointment").fill('Meal prep');
    await page.getByRole('button', { name: /post request/i }).click();
    await expect(page.getByText('Meal prep')).toBeVisible();

    await page.getByRole('button', { name: /meal prep/i }).click();
    await page.getByRole('button', { name: /^edit$/i }).click();
    const helpEditModal = page.getByRole('heading', { name: /edit task/i }).locator('..').locator('..');
    await helpEditModal.locator('input[type="text"]').fill('Meal prep (weekly)');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Meal prep (weekly)')).toBeVisible();

    const claimButton = page.getByRole('button', { name: /i'll do this/i });
    if (!(await claimButton.isVisible())) {
      await page.getByRole('button', { name: /meal prep \(weekly\)/i }).click();
    }
    await expect(claimButton).toBeVisible();
    await claimButton.click();
    await expect(page.getByText(/you claimed this/i)).toBeVisible();

    await page.getByRole('button', { name: /complete & log/i }).click();
    await expect(page.getByRole('button', { name: /1 done/i })).toBeVisible();
  });

  test('medications add, log, edit, discontinue, reactivate', async ({ page }) => {
    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /medications/i }).click();
    await expect(page.getByRole('heading', { name: 'Medications', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /add medication/i }).click();
    await page.getByPlaceholder('e.g., Lisinopril').fill('Lisinopril');
    await page.getByPlaceholder('e.g., 10mg, 1 tablet').fill('10mg');
    await page.getByRole('button', { name: /add medication/i }).click();
    await expect(page.getByText('Lisinopril')).toBeVisible();

    const medCard = page.locator('div.bg-white', { hasText: 'Lisinopril' }).first();
    await medCard.getByRole('button', { name: /taken/i }).click();
    await medCard.locator('button.btn-ghost').click();
    await medCard.getByRole('button', { name: /edit/i }).click();
    await page.getByPlaceholder('e.g., 10mg, 1 tablet').fill('20mg');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('20mg')).toBeVisible();

    await medCard.locator('button.btn-ghost').click();
    await medCard.getByRole('button', { name: /discontinue/i }).click();
    await page.getByRole('button', { name: /discontinued/i }).click();
    await page.getByRole('button', { name: /reactivate/i }).click();
    await expect(page.getByText('Lisinopril')).toBeVisible();
  });

  test('ask kin suggested prompt and send', async ({ page }) => {
    await openMobileNavIfNeeded(page);
    await page.getByRole('button', { name: /ask kin/i }).click();
    await expect(page.getByRole('heading', { name: /ask kin/i })).toBeVisible();

    await page.getByRole('button', { name: /total spending/i }).click();
    await expect(page.getByPlaceholder(/ask about expenses/i)).toHaveValue(/total spending/i);

    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByText(/mock response|having trouble accessing the network/i)).toBeVisible({ timeout: 10000 });
  });

  test('ledger filters, export, and delete confirm', async ({ page }) => {
    await ensureToolsOpen(page);
    await page.getByRole('button', { name: /ledger & reports/i }).click();
    await expect(page.getByRole('heading', { name: /all transactions/i })).toBeVisible();

    await page.getByPlaceholder(/search ledger/i).fill('Groceries');
    await expect(page.getByText('Groceries').first()).toBeVisible();

    await page.getByPlaceholder(/search ledger/i).fill('');
    await page.getByRole('button', { name: 'Time' }).click();
    await expect(page.getByText('Care visit')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export csv/i }).click();
    await downloadPromise;

    await page.getByTitle('Delete Entry').first().click();
    await expect(page.getByRole('heading', { name: /delete entry/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('recurring expenses add, pause, resume, log', async ({ page }) => {
    await ensureToolsOpen(page);
    await page.getByRole('button', { name: /recurring expenses/i }).click();
    await expect(page.getByRole('heading', { name: 'Recurring Expenses', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /add recurring/i }).click();
    await page.getByPlaceholder('e.g., Monthly prescriptions').fill('Monthly utilities');
    await page.getByPlaceholder('0.00').fill('120.00');
    await page.getByRole('button', { name: /save recurring expense/i }).click();
    await expect(page.getByText('Monthly utilities')).toBeVisible();

    await page.getByTitle('Pause recurring').click();
    await page.getByRole('button', { name: /paused expenses/i }).click();
    await page.getByTitle('Resume recurring').click();
    await page.getByTitle('Log this expense now').click();
  });

  test('vault upload and view modal, emergency modal', async ({ page }) => {
    await ensureToolsOpen(page);
    await page.getByRole('button', { name: /document vault/i }).click();
    await expect(page.getByRole('heading', { name: /digital vault/i })).toBeVisible();

    const pdfBuffer = Buffer.from('%PDF-1.4 test');
    await page.setInputFiles('input[type="file"]', {
      name: 'care-plan.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer
    });
    await expect(page.getByText('care-plan.pdf')).toBeVisible();

    await page.getByRole('button', { name: /view/i }).click();
    await expect(page.getByRole('heading', { name: /document details/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByRole('button', { name: /emergency access/i }).click();
    await expect(page.getByRole('heading', { name: /emergency access/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
  });

  test('family circle invite, member modal, and cancel invite', async ({ page }) => {
    await ensureToolsOpen(page);
    await page.getByRole('button', { name: /family circle/i }).click();
    await expect(page.getByRole('heading', { name: /family circle/i })).toBeVisible();

    await page.getByRole('button', { name: /invite family/i }).click();
    await page.getByPlaceholder('e.g., David').fill('Alex');
    await page.getByPlaceholder('david@email.com').fill('alex@example.com');
    await page.getByRole('button', { name: /create invite/i }).click();
    await expect(page.getByText('Alex', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /copy link/i }).click();
    await expect(page.getByText(/copied/i)).toBeVisible();

    await page.getByRole('button', { name: /sarah miller/i }).click();
    await expect(page.getByRole('heading', { name: /member details/i })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await page.getByTitle('Cancel invite').click();
    await expect(page.getByText('Alex', { exact: true })).not.toBeVisible();
  });

  test('settings advanced actions (theme, export/import, reset)', async ({ page }) => {
    await ensureToolsOpen(page);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('heading', { name: /family configuration/i })).toBeVisible();

    await page.getByRole('button', { name: /dark/i }).click();
    await expect(page.getByRole('button', { name: /dark/i })).toHaveAttribute('aria-pressed', 'true');

    await page.getByText('Advanced Settings').click();

    await page.getByRole('button', { name: /sync local data to cloud/i }).click();
    await expect(page.getByRole('heading', { name: /sync local data to cloud/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();

    const exportDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: /export backup/i }).click();
    await exportDownload;

    const backupPayload = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: {
        hourlyRate: 25,
        patientName: 'Jesse',
        privacyMode: false,
        autoLockEnabled: false,
        hasCompletedOnboarding: true,
        familyId: 'family-test',
        securityProfile: 'standard',
        themeMode: 'light'
      },
      entries: []
    };
    const backupBuffer = Buffer.from(JSON.stringify(backupPayload));
    await page.setInputFiles('input[type="file"][accept=".json"]', {
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: backupBuffer
    });
    await expect(page.getByRole('heading', { name: /import backup/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();

    await page.getByRole('button', { name: /reset everything/i }).click();
    await expect(page.getByRole('heading', { name: 'Reset application data', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
  });
});
