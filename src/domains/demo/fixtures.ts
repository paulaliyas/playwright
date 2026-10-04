import { test as base } from '@playwright/test';
import { TodoPage } from './pages/todo.page';

/** Page objects for the demo domain, injected into specs. */
type DemoFixtures = {
  todoPage: TodoPage;
};

export const test = base.extend<DemoFixtures>({
  todoPage: async ({ page }, use) => {
    await use(new TodoPage(page));
  },
});

export { expect } from '@playwright/test';
