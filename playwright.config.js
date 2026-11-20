// Playwright runs the site's quality checks: accessibility (axe, WCAG 2.2 AA), layout at every width,
// touch targets, the project tabs, links and reduced motion. Locally it drives the installed Microsoft
// Edge; in CI it uses Playwright's own Chromium.
const { defineConfig, devices } = require('@playwright/test');

const channel = process.env.CI ? undefined : 'msedge';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx http-server -p 4173 -a 127.0.0.1 -c-1 -s .',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], channel, viewport: { width: 390, height: 844 } } },
  ],
});
