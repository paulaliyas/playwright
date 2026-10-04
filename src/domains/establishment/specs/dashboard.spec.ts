import { test } from '../fixtures';

test.describe('Establishment — dashboard', () => {
  test('loads the landing page @smoke', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
  });
});
