import type { Page } from '@playwright/test';

// The page under test - the UK Health Security Agency organisation homepage on GOV.UK.
// Relative to baseURL in playwright.config.ts (https://www.gov.uk by default).
export const homepage = '/government/organisations/uk-health-security-agency';

// The GOV.UK cookie banner isn't always shown, so accept it only if it appears
export async function acceptCookiesIfShown(page: Page) {
  const acceptCookies = page.getByRole('button', { name: 'Accept additional cookies' });
  try {
    await acceptCookies.click({ timeout: 5000 });
  } catch {
    // Banner not displayed - carry on with the test
    return;
  }
  // Accepting shows a "You have accepted additional cookies" message - hide it as well
  await page.getByRole('button', { name: 'Hide cookie message' }).click({ timeout: 5000 }).catch(() => {});
}
