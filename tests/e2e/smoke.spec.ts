import { test, expect, type Page } from '@playwright/test';

/** Skip the boot theatre so smoke assertions hit the live world quickly. */
async function skipBoot(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('mw-booted', '1');
    } catch {
      /* restricted storage */
    }
  });
}

async function waitForHome(page: Page) {
  await page.goto('/');
  await expect(page.locator('.tx-card').first()).toBeVisible({ timeout: 30_000 });
}

test.describe('viewport layout — no overlap / no h-scroll', () => {
  for (const width of [320, 375, 768, 820, 1024]) {
    test(`${width}px`, async ({ page }) => {
      await skipBoot(page);
      await page.setViewportSize({ width, height: 800 });
      await waitForHome(page);

      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const cards = [...document.querySelectorAll('.tx-card')].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        });
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          cards,
        };
      });

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      for (const c of metrics.cards) {
        expect(c.left).toBeGreaterThanOrEqual(-1);
        expect(c.right).toBeLessThanOrEqual(metrics.clientWidth + 1);
        expect(c.width).toBeGreaterThan(40);
      }
    });
  }
});

test.describe('routes render', () => {
  test('home + blog + post + 404', async ({ page }) => {
    await skipBoot(page);
    await page.goto('/');
    await expect(page.locator('.tx-card').first()).toBeVisible({ timeout: 30_000 });

    await page.goto('/blog');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.goto('/blog/the-abundance-trap');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.log-uplink')).toBeVisible();

    const res = await page.goto('/this-route-does-not-exist-404');
    expect(res?.status()).toBe(404);
    await expect(page.locator('body')).toContainText(/404|lost|signal|transmission/i);
  });

  test('rss feed renders', async ({ request }) => {
    const res = await request.get('/feed.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<rss');
    expect(body).toContain('the-abundance-trap');
  });
});

test.describe('dossier a11y', () => {
  test('panel open → focus → Esc → restore', async ({ page }) => {
    await skipBoot(page);
    await page.goto('/');
    await expect(page.locator('.tx-card').first()).toBeVisible({ timeout: 30_000 });

    const card = page.locator('.tx-card').filter({ hasText: /About/i }).first();
    await card.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /close panel/i })).toBeFocused({
      timeout: 10_000,
    });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });

  test('contact dossier open/close', async ({ page }) => {
    await skipBoot(page);
    await page.goto('/?dossier=contact');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expect(dialog).toContainText(/Contact|CHANNEL|uplink|email/i);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });
});

test.describe('reduced motion', () => {
  test('home respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await skipBoot(page);
    await page.goto('/');
    await expect(page.locator('.tx-card').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-boot-veil]')).toHaveCount(0, { timeout: 10_000 });
  });
});

test.describe('plunge', () => {
  test('descent:plunge fires crossing CROSS_T', async ({ page }) => {
    await skipBoot(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.locator('.tx-card').first()).toBeVisible({ timeout: 30_000 });

    // Wait for Lenis raf to be alive
    await page.waitForTimeout(400);

    const fired = await page.evaluate(async () => {
      return await new Promise<boolean>((resolve) => {
        let seen = false;
        const onPlunge = () => {
          seen = true;
        };
        window.addEventListener('descent:plunge', onPlunge);

        const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        // Start ~0.06 t above a typical CROSS_T (~0.84) and wheel through it.
        const start = Math.floor(limit * 0.78);
        window.scrollTo(0, start);

        let i = 0;
        const burst = () => {
          window.dispatchEvent(
            new WheelEvent('wheel', {
              deltaY: 160,
              bubbles: true,
              cancelable: true,
            })
          );
          i += 1;
          if (i < 28) {
            setTimeout(burst, 16);
          } else {
            setTimeout(() => {
              window.removeEventListener('descent:plunge', onPlunge);
              resolve(seen);
            }, 900);
          }
        };
        setTimeout(burst, 50);
      });
    });

    expect(fired).toBe(true);
  });
});
