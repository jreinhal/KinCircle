import type { Page } from '@playwright/test';

export const openMobileNavIfNeeded = async (page: Page) => {
  const openButton = page.getByRole('button', { name: /open navigation/i });
  if (await openButton.isVisible()) {
    await openButton.click();
    await page.getByRole('button', { name: /close navigation/i }).waitFor({ state: 'visible' });
  }
};

export const ensureToolsOpen = async (page: Page) => {
  await openMobileNavIfNeeded(page);
  const toggle = page.getByRole('button', { name: /tools & settings/i });
  await toggle.scrollIntoViewIfNeeded();
  const expanded = await toggle.getAttribute('aria-expanded');
  if (expanded !== 'true') {
    await toggle.click();
  }
};
