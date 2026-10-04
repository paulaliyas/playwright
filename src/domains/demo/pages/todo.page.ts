import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/base.page';

/** Local demo todo app (demo-site/index.html) — served offline, no login. */
export class TodoPage extends BasePage {
  protected readonly path = '/';
  readonly heading: Locator;
  readonly newTodo: Locator;
  readonly items: Locator;
  readonly count: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'todos' });
    this.newTodo = page.getByPlaceholder('What needs to be done?');
    this.items = page.getByTestId('todo-item');
    this.count = page.getByTestId('todo-count');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async addTodo(text: string): Promise<void> {
    await this.newTodo.fill(text);
    await this.newTodo.press('Enter');
  }

  async addTodos(...texts: string[]): Promise<void> {
    for (const text of texts) await this.addTodo(text);
  }

  item(text: string): Locator {
    return this.items.filter({ hasText: text });
  }

  async toggle(text: string): Promise<void> {
    await this.item(text).getByRole('checkbox').check();
  }

  async untoggle(text: string): Promise<void> {
    await this.item(text).getByRole('checkbox').uncheck();
  }
}
