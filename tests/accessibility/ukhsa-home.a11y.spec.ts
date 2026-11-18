import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// WCAG 2.2 AA - the standard UK public sector websites must meet
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Only these impact levels fail a test - minor and moderate issues are reported but don't fail
const failingImpacts = ['serious', 'critical'];

// Runs an axe scan, attaches the full results to the report and fails only on serious/critical issues
async function checkAccessibility(page: Page, testInfo: TestInfo, label: string) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();

  await testInfo.attach(`axe results - ${label}`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });

  const summarise = (violations: typeof results.violations) =>
    violations.map(v => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element(s)) - ${v.helpUrl}\n` +
      v.nodes.map(n => `    ${n.target.join(' ')}`).join('\n'));

  const failing = results.violations.filter(v => failingImpacts.includes(v.impact ?? ''));
  const warnings = results.violations.filter(v => !failingImpacts.includes(v.impact ?? ''));

  for (const warning of summarise(warnings)) {
    testInfo.annotations.push({ type: 'accessibility warning', description: warning });
  }

  expect(failing, `Serious or critical accessibility issues on ${label}:\n${summarise(failing).join('\n')}`).toEqual([]);
}

test.describe('Automated WCAG 2.2 AA scans', () => {
  test('UKHSA homepage has no serious accessibility issues', async ({ page }, testInfo) => {
    await page.goto(homepage, { waitUntil: 'domcontentloaded' });
    await acceptCookiesIfShown(page);
    await checkAccessibility(page, testInfo, 'UKHSA homepage');
  });

  test('cookie banner has no serious accessibility issues', async ({ page }, testInfo) => {
    await page.goto(homepage, { waitUntil: 'domcontentloaded' });
    const banner = page.getByRole('button', { name: 'Accept additional cookies' });
    test.skip(!(await banner.isVisible({ timeout: 5000 }).catch(() => false)), 'Cookie banner not displayed');

    await checkAccessibility(page, testInfo, 'cookie banner');
  });

  test.describe('on a mobile screen', () => {
    test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

    test('UKHSA homepage has no serious accessibility issues', async ({ page }, testInfo) => {
      await page.goto(homepage, { waitUntil: 'domcontentloaded' });
      await acceptCookiesIfShown(page);
      await checkAccessibility(page, testInfo, 'UKHSA homepage (mobile)');
    });
  });
});

test.describe('Keyboard access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(homepage, { waitUntil: 'domcontentloaded' });
    await acceptCookiesIfShown(page);
    // Reload so the cookie banner is gone and the Tab key starts from the top of the page
    await page.reload({ waitUntil: 'domcontentloaded' });
  });

  test('"Skip to main content" is the first link and moves focus to the main content', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#content$/);
    await expect(page.locator('#content')).toBeInViewport();
  });

  test('tab order follows the page layout', async ({ page }) => {
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    const expectedOrder = [
      { name: 'Skip to main content', element: page.getByRole('link', { name: 'Skip to main content' }) },
      { name: 'GOV.UK homepage', element: page.getByRole('link', { name: 'Go to the GOV.UK homepage' }) },
      { name: 'Menu', element: page.getByRole('button', { name: 'Show navigation menu' }) },
      { name: 'Search', element: page.getByRole('button', { name: 'Show search menu' }) },
      { name: 'Breadcrumb: Home', element: breadcrumb.getByRole('link', { name: 'Home' }) },
      { name: 'Breadcrumb: Organisations', element: breadcrumb.getByRole('link', { name: 'Organisations' }) },
    ];

    for (const [index, { name, element }] of expectedOrder.entries()) {
      await page.keyboard.press('Tab');
      await expect(element, `Tab stop ${index + 1} should be "${name}"`).toBeFocused();
    }
  });

  test('every focusable element shows a visible focus indicator', async ({ page }) => {
    const focusable = await page.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .filter({ visible: true }).count();

    for (let i = 0; i < focusable; i++) {
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const style = getComputedStyle(el);
        return {
          element: `${el.tagName} "${(el.textContent ?? '').trim().slice(0, 40)}"`,
          visible: (style.outlineStyle !== 'none' && style.outlineWidth !== '0px') || style.boxShadow !== 'none',
        };
      });
      expect.soft(focus.visible, `No visible focus indicator on ${focus.element}`).toBe(true);
    }
  });

  test('search can be used with the keyboard only', async ({ page }) => {
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // GOV.UK logo
    await page.keyboard.press('Tab'); // Menu
    await page.keyboard.press('Tab'); // Search
    const searchButton = page.getByRole('button', { name: 'Show search menu' });
    await expect(searchButton).toBeFocused();

    await page.keyboard.press('Enter'); // Opens the search panel
    const searchBox = page.getByRole('combobox', { name: 'Search GOV.UK' });
    await expect(searchBox).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(searchBox).toBeFocused();

    await page.keyboard.type('UKHSA');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/search\/all\?keywords=UKHSA/);
  });

  test('cookie banner can be accepted with the keyboard', async ({ browser, baseURL }) => {
    // Fresh context with no cookies so the banner shows
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto(homepage, { waitUntil: 'domcontentloaded' });

    const accept = page.getByRole('button', { name: 'Accept additional cookies' });
    test.skip(!(await accept.isVisible({ timeout: 5000 }).catch(() => false)), 'Cookie banner not displayed');

    let reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await accept.evaluate(el => el === document.activeElement);
    }
    expect(reached, 'Could not reach "Accept additional cookies" with the Tab key').toBe(true);

    await page.keyboard.press('Enter');
    await expect(accept).toBeHidden();
    await expect(page.getByText('You have accepted additional cookies')).toBeVisible();
    await context.close();
  });
});

test.describe('Page structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(homepage, { waitUntil: 'domcontentloaded' });
    await acceptCookiesIfShown(page);
  });

  test('page has a language and a meaningful title', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle('UK Health Security Agency - GOV.UK');
  });

  test('page has exactly one main heading and no skipped heading levels', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText('UK Health Security Agency');

    const levels = await page.locator('#content').locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll(headings => headings.map(h => Number(h.tagName[1])));
    for (let i = 1; i < levels.length; i++) {
      expect.soft(levels[i] - levels[i - 1], `Heading level jumps from h${levels[i - 1]} to h${levels[i]}`).toBeLessThanOrEqual(1);
    }
  });

  test('page has the expected landmarks', async ({ page }) => {
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  });

  test('content reflows at 320px wide without horizontal scrolling (WCAG 1.4.10)', async ({ page }) => {
    // 320px is equivalent to a 1280px screen zoomed to 400%
    await page.setViewportSize({ width: 320, height: 640 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'Page scrolls horizontally at 320px wide').toBeLessThanOrEqual(0);
  });
});
