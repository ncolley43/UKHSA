import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Sprint 2 - User story 1
// As a member of the public, I want to read what UKHSA does,
// so that I understand the agency's purpose.

test.describe('S2 US1 - "What we do" section', { tag: ['@S2', '@US1', '@live-safe'] }, () => {
  test('describes the agency and links to more information', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const whatWeDo = page.locator('#what-we-do');
    await expect(whatWeDo.getByRole('heading', { name: 'What we do' })).toBeVisible();
    await expect(whatWeDo).toContainText('exists to protect people from health threats');
    await expect(whatWeDo.getByRole('link', { name: 'Department of Health and Social Care' }))
      .toHaveAttribute('href', '/government/organisations/department-of-health-and-social-care');

    await whatWeDo.getByRole('link', { name: 'Read more about what we do' }).click();
    await expect(page).toHaveURL(/\/uk-health-security-agency\/about$/);
  });
});
