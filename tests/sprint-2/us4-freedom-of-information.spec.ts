import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Release 2 - User story 4
// As a member of the public, I want to know how to make a Freedom of Information request,
// so that I can ask UKHSA for information it holds.

test.describe('R2 US4 - Freedom of Information requests', { tag: ['@R2', '@US4', '@live-safe'] }, () => {
  test('FOI section explains how to make a request and who to contact', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const foi = page.locator('#freedom-of-information');
    await expect(foi.getByRole('heading', { name: 'Make a Freedom of Information (FOI) request' })).toBeVisible();
    await expect(foi.getByRole('link', { name: 'how to make a request' })).toBeVisible();
    await expect(foi.getByRole('link', { name: 'previous releases' })).toBeVisible();
    await expect(foi.getByRole('link', { name: 'InformationRights@UKHSA.gov.uk' }))
      .toHaveAttribute('href', /^mailto:InformationRights@UKHSA\.gov\.uk$/i);
  });
});
