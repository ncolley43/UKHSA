import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Sprint 2 - User story 2
// As a member of the public, I want to see who runs UKHSA,
// so that I know who is accountable for the agency.

test.describe('S2 US2 - Management team', { tag: ['@S2', '@US2', '@live-safe'] }, () => {
  test('"Our management" lists the Chief Executive with a photo', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const people = page.locator('#people');
    await expect(people.getByRole('heading', { name: 'Our management' })).toBeVisible();
    await expect(people).toContainText('Chief Executive');

    // Names change over time, so check the shape rather than who is in post
    expect(await people.getByRole('link').count()).toBeGreaterThan(0);
    await expect(people.locator('img').first()).toBeVisible();
  });
});
