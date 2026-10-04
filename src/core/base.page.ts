import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared behaviour for every page object in every domain.
 * Keep it small: navigation, waiting for Angular to settle, language toggle.
 */
export abstract class BasePage {
  /** Path relative to the domain baseURL, e.g. '/dashboard'. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async goto(query = ''): Promise<void> {
    await this.page.goto(`${this.path}${query}`);
    await this.waitForReady();
  }

  /** Waits for network idle and any global loader to disappear. */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    const loader = this.page.locator('.loader, .spinner, [data-testid="global-loader"]');
    await expect(loader).toHaveCount(0, { timeout: 30_000 });
  }

  async switchLanguage(lang: 'en' | 'ar'): Promise<void> {
    const html = this.page.locator('html');
    if ((await html.getAttribute('lang')) === lang) return;
    await this.page.getByTestId('language-toggle').click();
    await expect(html).toHaveAttribute('lang', lang);
  }

  protected byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }
}
