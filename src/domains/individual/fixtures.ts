import { test as base } from '@playwright/test';
import { IndividualDashboardPage } from './pages/dashboard.page';

/** Page objects for the individual domain, injected into specs. Add new pages here. */
type IndividualFixtures = {
  dashboardPage: IndividualDashboardPage;
};

export const test = base.extend<IndividualFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new IndividualDashboardPage(page));
  },
});

export { expect } from '@playwright/test';
