import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Release 2 - User story 3
// As a member of the public, I want links to UKHSA's social media accounts,
// so that I can follow their updates.

const accounts = ['Blog', 'Bluesky', 'Facebook', 'Instagram', 'LinkedIn', 'X (previously Twitter)', 'YouTube'];

test.describe('R2 US3 - Social media links', { tag: ['@R2', '@US3', '@live-safe'] }, () => {
  test('"Follow us" links to each account in a new tab', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const whatWeDo = page.locator('#what-we-do');
    await expect(whatWeDo.getByRole('heading', { name: 'Follow us' })).toBeVisible();

    for (const account of accounts) {
      const link = whatWeDo.getByRole('link').filter({ hasText: account });
      await expect.soft(link, `Link to ${account}`).toBeVisible();
      await expect.soft(link, `${account} opens in a new tab`).toHaveAttribute('target', '_blank');
      await expect.soft(link, `${account} link is secure`).toHaveAttribute('href', /^https:\/\//);
    }
  });
});
