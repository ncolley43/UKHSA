import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Release 1 - User story 1
// As a member of the public, I want the UKHSA homepage to clearly show the agency's name,
// so that I know I'm on the right page.

test.describe('R1 US1 - Homepage shows the agency name', { tag: ['@R1', '@US1', '@live-safe'] }, () => {
  test('page title and main heading name the UK Health Security Agency', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    await expect(page).toHaveTitle('UK Health Security Agency - GOV.UK');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('UK Health Security Agency');
  });
});
