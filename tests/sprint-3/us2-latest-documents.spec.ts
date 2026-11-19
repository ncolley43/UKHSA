import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Sprint 3 - User story 2
// As a member of the public, I want to see UKHSA's latest documents and find all of them,
// so that I can keep up with new guidance and statistics.

test.describe('S3 US2 - Latest documents', { tag: ['@S3', '@US2', '@live-safe'] }, () => {
  test('"See all latest documents" lists UKHSA content, newest first', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const latest = page.locator('#latest-documents');
    await expect(latest.getByRole('heading', { name: 'Latest from the UK Health Security Agency' })).toBeVisible();

    await latest.getByRole('link', { name: 'See all latest documents' }).click();
    await expect(page).toHaveURL(/\/search\/all\?/);
    const url = new URL(page.url());
    expect(url.searchParams.getAll('organisations[]')).toContain('uk-health-security-agency');
    expect(url.searchParams.get('order')).toBe('updated-newest');
  });
});
