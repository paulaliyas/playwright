import { test as setup } from '@playwright/test';
import { loginAndSaveState } from '@core/auth';

setup('authenticate establishment', async ({ page }) => {
  await loginAndSaveState(page, 'establishment');
});
