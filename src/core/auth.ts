import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '@config/env';
import { authFile, type DomainName } from '@config/domains';

/**
 * Generic login used by each domain's auth.setup.ts.
 * Adjust the selectors once to match your SSO / login page.
 */
export async function loginAndSaveState(page: Page, domain: DomainName): Promise<void> {
  const { username, password } = env.credentials(domain);

  await page.goto('/');
  await page.getByLabel(/username|user id/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // Anything that only renders once logged in.
  await expect(page.getByTestId('user-menu')).toBeVisible({ timeout: 60_000 });

  const file = authFile(domain);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.context().storageState({ path: file });
}
