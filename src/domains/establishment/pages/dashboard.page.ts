import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/base.page';

export class EstablishmentDashboardPage extends BasePage {
  protected readonly path = '/';
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}
