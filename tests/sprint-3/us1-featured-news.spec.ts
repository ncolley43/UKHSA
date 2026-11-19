import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Sprint 3 - User story 1
// As a member of the public, I want to see UKHSA's featured news on the homepage,
// so that I hear about the most important updates.

test.describe('S3 US1 - Featured news', { tag: ['@S3', '@US1', '@live-safe'] }, () => {
  test('"Featured" shows news stories that open the full article', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const featured = page.locator('#featured-documents');
    await expect(featured.getByRole('heading', { name: 'Featured' })).toBeVisible();

    // Stories change most days, so check there are some rather than which ones
    const stories = featured.getByRole('heading', { level: 3 }).getByRole('link');
    expect(await stories.count()).toBeGreaterThan(0);

    const firstTitle = (await stories.first().innerText()).trim();
    await stories.first().click();
    await expect(page).toHaveURL(/\/government\/news\//);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).not.toHaveTitle(/UK Health Security Agency - GOV\.UK/);
    test.info().annotations.push({ type: 'Featured story opened', description: firstTitle });
  });
});
