import { test, expect } from '../fixtures';

test.describe('Demo — TodoMVC', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('loads the app @smoke', async ({ todoPage }) => {
    await todoPage.expectLoaded();
  });

  test('adds todos @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');
    await todoPage.addTodo('Write tests');

    await expect(todoPage.items).toHaveText(['Buy milk', 'Write tests']);
    await expect(todoPage.count).toHaveText('2 items left');
  });

  test('completes a todo @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');
    await todoPage.addTodo('Write tests');
    await todoPage.toggle('Buy milk');

    await expect(todoPage.items.filter({ hasText: 'Buy milk' })).toHaveClass(/completed/);
    await expect(todoPage.count).toHaveText('1 item left');
  });
});
