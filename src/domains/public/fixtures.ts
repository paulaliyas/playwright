import { test as base } from '@playwright/test';
import { PublicDashboardPage } from './pages/dashboard.page';

/** Page objects for the public domain, injected into specs. Add new pages here. */
type PublicFixtures = {
  dashboardPage: PublicDashboardPage;
};

export const test = base.extend<PublicFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new PublicDashboardPage(page));
  },
});

export { expect } from '@playwright/test';
