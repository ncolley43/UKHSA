import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Sprint 1 - User story 3
// As a member of the public, I want a breadcrumb trail on the homepage,
// so that I can get back to the list of all government organisations.

test.describe('S1 US3 - Breadcrumb navigation', { tag: ['@S1', '@US3', '@live-safe'] }, () => {
  test('"Organisations" breadcrumb goes to the list of all organisations', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');

    await breadcrumb.getByRole('link', { name: 'Organisations' }).click();
    await expect(page).toHaveURL(/\/government\/organisations$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Departments, agencies and public bodies');
  });
});
