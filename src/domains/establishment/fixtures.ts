import { test as base } from '@playwright/test';
import { EstablishmentDashboardPage } from './pages/dashboard.page';

/** Page objects for the establishment domain, injected into specs. Add new pages here. */
type EstablishmentFixtures = {
  dashboardPage: EstablishmentDashboardPage;
};

export const test = base.extend<EstablishmentFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new EstablishmentDashboardPage(page));
  },
});

export { expect } from '@playwright/test';
