import { test } from '../fixtures';

test.describe('Public — dashboard', () => {
  test('loads the landing page @smoke', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoaded();
  });
});
