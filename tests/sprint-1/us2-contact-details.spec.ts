import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Release 1 - User story 2
// As a member of the public, I want to find UKHSA's contact details on the homepage,
// so that I can get in touch with them.

test.describe('R1 US2 - Homepage shows contact details', { tag: ['@R1', '@US2', '@live-safe'] }, () => {
  test('general enquiries email and switchboard number are shown', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const contacts = page.locator('#org-contacts');
    await expect(contacts.getByRole('heading', { name: 'Contact UKHSA' })).toBeVisible();
    await expect(contacts.getByRole('link', { name: 'correspondence@ukhsa.gov.uk' }))
      .toHaveAttribute('href', 'mailto:correspondence@ukhsa.gov.uk');
    await expect(contacts).toContainText('020 7654 8000');
  });
});
