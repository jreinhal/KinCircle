import { test, expect } from '@playwright/test';

const shouldRun =
  process.env.E2E_SUPABASE === 'true' &&
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_ANON_KEY;

const completeOnboarding = async (page: any) => {
  const welcome = page.getByRole('heading', { name: /welcome to kincircle/i });
  const dashboardNav = page.getByRole('button', { name: /sibling ledger/i });

  await Promise.race([
    welcome.waitFor({ state: 'visible', timeout: 15000 }),
    dashboardNav.waitFor({ state: 'visible', timeout: 15000 })
  ]).catch(() => {});

  if (await welcome.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /let's get started/i }).click();
    await page.getByPlaceholder('e.g. Mom, Dad, Aunt Marie').fill('Sync Patient');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /looks good/i }).click();
    await page.getByPlaceholder('PIN').fill('1234');
    await page.getByPlaceholder('Confirm').fill('1234');
    await page.getByRole('button', { name: /finish setup/i }).click();
  }

  await dashboardNav.waitFor({ state: 'visible', timeout: 15000 });
};

test.describe('Supabase multi-session sync', () => {
  test.setTimeout(60000);
  test.skip(!shouldRun, 'Set E2E_SUPABASE=true with Supabase env vars to run.');

  test('entry created in one session is isolated from another by default', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/');
    await completeOnboarding(pageA);

    const entryDescription = `Sync Entry ${Date.now()}`;
    await pageA.getByRole('button', { name: /add entry/i }).click();
    await expect(pageA.getByRole('heading', { name: /add contribution/i })).toBeVisible();
    await pageA.getByPlaceholder('0.00').fill('12.34');
    await pageA.getByPlaceholder('e.g. Prescriptions at CVS').fill(entryDescription);
    await pageA.getByPlaceholder('e.g. Medical, Groceries').fill('Medical');
    await pageA.getByRole('button', { name: /save entry/i }).click();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/');
    await completeOnboarding(pageB);

    await pageB.getByRole('button', { name: /all transactions/i }).click();
    await expect(pageB.getByText(entryDescription)).not.toBeVisible({ timeout: 5000 });
  });
});
