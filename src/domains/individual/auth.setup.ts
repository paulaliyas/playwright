import { test as setup } from '@playwright/test';
import { loginAndSaveState } from '@core/auth';

setup('authenticate individual', async ({ page }) => {
  await loginAndSaveState(page, 'individual');
});
