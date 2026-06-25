import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Skip the boot theatre so axe scans the settled page, not transient chrome. */
async function skipBoot(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('mw-booted', '1');
    } catch {
      /* restricted storage */
    }
  });
}

async function scan(page: Page, path: string) {
  await skipBoot(page);
  await page.goto(path);
  await page.locator('main').waitFor({ timeout: 30_000 });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );

  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test('home and blog have no serious or critical axe violations', async ({ page }) => {
  await scan(page, '/');
  await scan(page, '/blog');
});
