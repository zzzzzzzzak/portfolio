// Quality checks for the portfolio, after impeccable's audit dimensions:
// accessibility, responsive layout, touch targets, motion and implementation integrity.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function open(page) {
  const problems = [];
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('response', (r) => {
    const url = r.url();
    if (url.startsWith('http://127.0.0.1') && r.status() >= 400) problems.push(`${r.status()} ${url}`);
  });
  await page.goto('/index.html');
  await page.waitForLoadState('networkidle');
  return problems;
}

test('loads without errors or missing files', async ({ page }) => {
  const problems = await open(page);
  // walk the page so lazy parts (moments, effects) load too
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(80);
  }
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});

test('names the person and the work on the first screen', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle(/Zakir Siddiqui/);
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText('Zakir Siddiqui');
  await expect(page.locator('.hero .btn--primary')).toBeInViewport();
});

test('passes axe WCAG 2.2 AA with no serious or critical issues', async ({ page }) => {
  await open(page);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const bad = results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
  expect(bad).toEqual([]);
});

test('headings step down one level at a time', async ({ page }) => {
  await open(page);
  const levels = await page.$$eval('main h1, main h2, main h3', (hs) => hs.map((h) => Number(h.tagName[1])));
  for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`nothing scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('every link and button outside running text is at least 24px tall on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const small = await page.$$eval('a, button', (els) => els
    .filter((e) => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.visibility === 'hidden' || e.matches('.skip-link') || e.closest('[hidden], [inert], .nav__menu')) return false;
      if (e.closest('p, li > p') && cs.display === 'inline') return false;   // a link inside a sentence
      return r.height < 24;
    })
    .map((e) => `${e.textContent.trim().slice(0, 30)} (${Math.round(e.getBoundingClientRect().height)}px)`));
  expect(small).toEqual([]);
});

test('project tabs show their own text and screen, by click and by arrow key', async ({ page, isMobile }) => {
  await open(page);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(6);
  for (let i = 1; i <= 6; i++) {
    await page.locator(`#t-${i}`).click();
    await expect(page.locator(`#t-${i}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`#p-${i}`)).toBeVisible();
    await expect(page.locator(`#s-${i}`)).toBeVisible();
    for (let j = 1; j <= 6; j++) if (j !== i) await expect(page.locator(`#p-${j}`)).toBeHidden();
  }
  if (!isMobile) {
    await page.locator('#t-1').click();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#t-2')).toHaveAttribute('aria-selected', 'true');
  }
});

test('every in-page link has a target and every outside link is https', async ({ page }) => {
  await open(page);
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  for (const h of hrefs) {
    if (h.startsWith('#')) expect(await page.locator(h).count(), h).toBe(1);
    else if (h.startsWith('mailto:')) expect(h).toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]+/);
    else expect(h, h).toMatch(/^https:\/\//);
  }
});

test('the main action reads the same everywhere', async ({ page }) => {
  await open(page);
  const labels = await page.$$eval('.btn--primary', (bs) => [...new Set(bs.map((b) => b.textContent.trim()))]);
  expect(labels).toEqual(['Email Zakir']);
});

test('with reduced motion every word is still on screen', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('/index.html');
  await page.waitForLoadState('networkidle');
  for (const sel of ['h1', '.hero__lead', '#work-h', '#projects-h', '#experience-h', '#about-h', '#skills-h', '#close-h']) {
    const el = page.locator(sel);
    await el.scrollIntoViewIfNeeded();
    await expect(el).toBeVisible();
    expect(Number(await el.evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.9);
  }
  await context.close();
});

test('the keyboard reaches the skip link first', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no Tab key on a phone');
  await open(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
});
