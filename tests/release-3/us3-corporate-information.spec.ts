import { test, expect } from '@playwright/test';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Release 3 - User story 3
// As a member of the public, I want links to UKHSA's corporate information and jobs,
// so that I can find policies, governance and job vacancies.

const links = [
  'Accessible documents policy',
  'Complaints procedure',
  'Media enquiries',
  'Our governance',
  'Working for UKHSA',
];

test.describe('R3 US3 - Corporate information', { tag: ['@R3', '@US3', '@live-safe'] }, () => {
  test('corporate information and jobs links are shown', async ({ page }) => {
    await page.goto(homepage);
    await acceptCookiesIfShown(page);

    const corporate = page.locator('#corporate-info');
    await expect(corporate.getByRole('heading', { name: 'Corporate information' })).toBeVisible();
    await expect(corporate.getByRole('heading', { name: 'Jobs and contracts' })).toBeVisible();

    for (const name of links) {
      await expect.soft(corporate.getByRole('link', { name, exact: true }), `"${name}" link`).toBeVisible();
    }
  });
});
