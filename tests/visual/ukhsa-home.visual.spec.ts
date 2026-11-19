import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { homepage, acceptCookiesIfShown } from '../ukhsa';

// Screenshots look slightly different on each operating system (fonts, anti-aliasing),
// so a baseline made on Windows won't match the Linux machines GitHub Actions uses.
// Run visual checks locally only, with `npm run test:visual`.
test.skip(!!process.env.CI, 'Visual checks run locally only - baselines are made on Windows');

const screenshotName = 'ukhsa-home.png';

// Allow up to 1% of pixels to differ, to absorb tiny rendering differences between runs
const maxDiffPixelRatio = 0.01;

// These sections list the latest news and documents, which change most days.
// They are covered with a solid box in the screenshot so only the page layout is compared.
function changingContent(page: Page) {
  return [
    page.locator('#featured-documents'),
    page.locator('#latest-documents'),
    page.locator('section').filter({ has: page.getByRole('heading', { name: 'Documents', exact: true }) }),
  ];
}

// Takes full-page screenshots until two in a row are identical, so the page has finished drawing
async function stableScreenshot(page: Page) {
  const mask = changingContent(page);
  let previous: Buffer | undefined;
  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide', mask });
    if (previous?.equals(current)) return current;
    previous = current;
    await page.waitForTimeout(500);
  }
  throw new Error('The page kept changing - could not take a stable screenshot');
}

test('UKHSA homepage layout matches the last passing run', async ({ page }, testInfo) => {
  await page.goto(homepage, { waitUntil: 'domcontentloaded' });

  await acceptCookiesIfShown(page);
  await expect(page.getByRole('button', { name: 'Accept additional cookies' })).toBeHidden();

  // Wait for fonts and images so the page is fully drawn before comparing
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('heading', { level: 1, name: 'UK Health Security Agency' })).toBeVisible();
  await page.waitForLoadState('load');

  // Some images (e.g. the management team photos) only load when scrolled into view,
  // so load them all now - otherwise the screenshot can catch empty gaps where they go
  await page.locator('img[loading="lazy"]').evaluateAll(images => images.forEach(img => img.setAttribute('loading', 'eager')));
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete)),
    { message: 'Waiting for all images to load' }).toBe(true);

  const screenshot = await stableScreenshot(page);
  const baselinePath = testInfo.snapshotPath(screenshotName);

  // Compares against the saved baseline. If there is no baseline yet (first run),
  // Playwright saves this screenshot as the baseline and fails this run - run it again and it will pass
  expect(screenshot).toMatchSnapshot(screenshotName, { maxDiffPixelRatio });

  // The layout matched, so replace the baseline with this run's screenshot.
  // The next run is then compared with the latest passing screenshot
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, screenshot);

  testInfo.annotations.push({ type: 'Baseline updated', description: path.relative(process.cwd(), baselinePath) });
});
