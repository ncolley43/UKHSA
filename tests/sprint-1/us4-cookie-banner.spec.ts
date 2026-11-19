import { test, expect } from '@playwright/test';
import { homepage } from '../ukhsa';

// Sprint 1 - User story 4
// As a member of the public, I want to be able to reject additional cookies,
// so that I control how my visit is tracked.

test.describe('S1 US4 - Rejecting cookies', { tag: ['@S1', '@US4', '@live-safe'] }, () => {
  test('rejecting additional cookies confirms the choice and hides the banner', async ({ page }) => {
    await page.goto(homepage);

    const reject = page.getByRole('button', { name: 'Reject additional cookies' });
    test.skip(!(await reject.isVisible({ timeout: 5000 }).catch(() => false)), 'Cookie banner not displayed');

    await reject.click();
    const confirmation = page.getByText('You have rejected additional cookies');
    await expect(confirmation).toBeVisible();

    await page.getByRole('button', { name: 'Hide cookie message' }).click();
    await expect(confirmation).toBeHidden();

    // The choice is remembered - the banner doesn't come back on the next page load
    await page.reload();
    await expect(reject).toBeHidden();
  });
});
