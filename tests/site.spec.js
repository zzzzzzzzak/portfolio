// Quality checks for the portfolio, after impeccable's audit dimensions:
// accessibility, responsive layout, touch targets, motion and implementation integrity.
// The page has a loader and pinned scroll scenes, so checks wait for the network to settle.
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
    // scroll through so every not-yet-revealed element is measured too, then compare with the real screen width
    // (on phones the browser silently widens the layout to fit overflow, so innerWidth alone hides it)
    const overflow = await page.evaluate(async (w) => {
      let worst = 0;
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30));
        worst = Math.max(worst, document.documentElement.scrollWidth - w, window.innerWidth - w);
      }
      return worst;
    }, width);
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

test('the 3D hero, the blueprint story and seven projects are on the page', async ({ page }) => {
  await open(page);
  await expect(page.locator('.hero__canvas')).toBeVisible();
  await expect(page.locator('.story .step')).toHaveCount(4);
  await expect(page.locator('.bp')).toBeVisible();
  await expect(page.locator('.proj')).toHaveCount(7);
  for (const c of await page.locator('.chart[data-chart]').all()) await expect(c.locator('.chart__row').first()).toBeAttached();
});

test('the phone menu opens and closes', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'desktop shows the links inline');
  await open(page);
  const btn = page.locator('.nav__menu-btn');
  await page.waitForTimeout(3200);   // the loader
  await btn.click();
  await expect(page.locator('#menu')).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await btn.click();
  await expect(page.locator('#menu')).toBeHidden();
});

test('the churn lab switches models and the terminal answers SQL', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(3200);   // the loader
  await page.locator('#lab').scrollIntoViewIfNeeded();
  await page.locator('[data-model="0"]').click();
  await expect(page.locator('.m-recall')).toHaveText('78.1%');
  await expect(page.locator('.dots i.on')).toHaveCount(292);
  await page.locator('[data-model="2"]').click();
  await expect(page.locator('.dots i.on')).toHaveCount(307);
  const q = page.locator('#tty-q');
  await q.scrollIntoViewIfNeeded();
  await q.fill("SELECT company FROM roles WHERE area = 'civil'");
  await q.press('Enter');
  await expect(page.locator('.tty__out table').last()).toContainText('Teemage Builders');
  await q.fill('SELECT nope FROM roles');
  await q.press('Enter');
  await expect(page.locator('.tty__out .tl-err').last()).toContainText('no such column');
});

test('survey mode opens, drives to a project site and closes with Escape', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard driving');
  await open(page);
  await page.waitForTimeout(3200);
  await page.locator('.survey-open').click();
  await expect(page.locator('.survey')).toBeVisible();
  await expect(page.locator('.lm')).toHaveCount(7);
  await page.evaluate(() => {
    if (window.city && window.city.drive && window.city.landmarks) {
      const lm = window.city.landmarks[3];
      window.city.drive.x = lm.x;
      window.city.drive.z = lm.z;
    }
  });
  await expect(page.locator('.survey__card')).toBeVisible();
  await expect(page.locator('.sv-n')).not.toHaveText('0');
  await page.keyboard.press('Escape');
  await expect(page.locator('.survey')).toBeHidden();
  await expect(page.locator('.survey-open')).toBeFocused();
});

test('the agent runs a goal through its tools and answers from the data', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(3200);
  await page.locator('#agents').scrollIntoViewIfNeeded();
  await page.locator('[data-task="recall"]').click();
  await expect(page.locator('.agent__answer')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.agent__answer')).toContainText('307');
  await expect(page.locator('.agent__trace .tr__k--act')).toHaveCount(2);
  await page.locator('#agent-q').fill('Webonise Labs');
  await page.locator('#agent-q').press('Enter');
  await expect(page.locator('.agent__answer')).toContainText('450,000', { timeout: 15000 });
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
  for (const sel of ['h1', '.hero__lead', '#story-h', '#work-h', '#projects-h', '#experience-h', '#skills-h', '#close-h']) {
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
