import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Release 3 - User story 4
// As a member of the public, I want to sign up for email updates from UKHSA,
// so that I'm told when they publish something new.
//
// NOT tagged @live-safe: in SIT and E2E this journey would go on to create a real
// subscription, which we don't want on live. (This example stops before subscribing.)

test.describe('R3 US4 - Email updates sign-up', { tag: ['@R3', '@US4'] }, () => {
  test('"Get emails" starts the UKHSA email sign-up', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    await page.locator('#latest-documents').getByRole('link', { name: 'Get emails' }).click();
    await expect(page).toHaveURL(/\/email-signup\?link=\/government\/organisations\/uk-health-security-agency/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
