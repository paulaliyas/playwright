import { defineConfig, devices, type Project } from '@playwright/test';
import { env } from './config/env';
import { DOMAINS, authFile, domainConfig, selectedDomains } from './config/domains';

const BROWSER_DEVICES = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
} as const;

const device = BROWSER_DEVICES[env.browser];

/**
 * One Playwright project per domain (+ a "<domain>-setup" project for
 * domains that need login). Filter with DOMAIN=establishment,individual.
 */
const projects: Project[] = selectedDomains().flatMap((domain): Project[] => {
  const { baseURL } = domainConfig(domain);
  const domainDir = `./src/domains/${domain}`;

  if (!DOMAINS[domain].requiresAuth) {
    return [{ name: domain, testDir: `${domainDir}/specs`, use: { ...device, baseURL } }];
  }

  return [
    {
      name: `${domain}-setup`,
      testDir: domainDir,
      testMatch: /.*\.setup\.ts/,
      use: { ...device, baseURL },
    },
    {
      name: domain,
      testDir: `${domainDir}/specs`,
      dependencies: [`${domain}-setup`],
      use: { ...device, baseURL, storageState: authFile(domain) },
    },
  ];
});

/** The demo domain tests a local page (demo-site/) — serve it only when demo is selected. */
const webServer = selectedDomains().includes('demo')
  ? {
      command: 'node scripts/serve-demo.js',
      url: domainConfig('demo').baseURL,
      reuseExistingServer: !process.env.CI,
    }
  : undefined;

export default defineConfig({
  webServer,
  timeout: env.timeouts.test,
  expect: { timeout: env.timeouts.expect },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? env.workers : undefined,
  outputDir: 'reports/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],
  use: {
    headless: env.headless,
    ignoreHTTPSErrors: env.ignoreHTTPSErrors,
    locale: env.locale,
    actionTimeout: env.timeouts.action,
    navigationTimeout: env.timeouts.navigation,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects,
});
