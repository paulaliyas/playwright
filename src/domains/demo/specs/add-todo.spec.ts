import { test, expect } from '../fixtures';

test.describe('Demo — Add todo', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('adds a single todo @smoke', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');

    await expect(todoPage.items).toHaveText(['Buy milk']);
  });

  test('clears the input after adding @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');

    await expect(todoPage.newTodo).toHaveValue('');
  });

  test('keeps focus in the input after adding @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');

    await expect(todoPage.newTodo).toBeFocused();
  });

  test('appends new todos to the end of the list @regression', async ({ todoPage }) => {
    await todoPage.addTodos('First', 'Second', 'Third');

    await expect(todoPage.items).toHaveText(['First', 'Second', 'Third']);
  });

  test('allows duplicate todos @regression', async ({ todoPage }) => {
    await todoPage.addTodos('Same', 'Same');

    await expect(todoPage.items).toHaveText(['Same', 'Same']);
  });

  test('trims leading whitespace @regression', async ({ todoPage }) => {
    await todoPage.addTodo('   Buy milk');

    await expect(todoPage.items.first().locator('label')).toHaveJSProperty('textContent', 'Buy milk');
  });

  test('trims trailing whitespace @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk   ');

    await expect(todoPage.items.first().locator('label')).toHaveJSProperty('textContent', 'Buy milk');
  });

  test('preserves whitespace inside the text @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy   milk');

    await expect(todoPage.items.first().locator('label')).toHaveJSProperty('textContent', 'Buy   milk');
  });

  test('new todo is not completed @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');

    await expect(todoPage.item('Buy milk')).not.toHaveClass(/completed/);
  });

  test('new todo checkbox is unchecked @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Buy milk');

    await expect(todoPage.item('Buy milk').getByRole('checkbox')).not.toBeChecked();
  });

  test('every todo gets its own checkbox @regression', async ({ todoPage, page }) => {
    await todoPage.addTodos('A', 'B', 'C');

    await expect(page.getByRole('checkbox')).toHaveCount(3);
  });

  test('adds 10 todos in order @regression', async ({ todoPage }) => {
    const texts = Array.from({ length: 10 }, (_, i) => `Task ${i + 1}`);
    await todoPage.addTodos(...texts);

    await expect(todoPage.items).toHaveText(texts);
  });

  test('handles 50 todos @regression', async ({ todoPage }) => {
    await todoPage.addTodos(...Array.from({ length: 50 }, (_, i) => `Task ${i + 1}`));

    await expect(todoPage.items).toHaveCount(50);
    await expect(todoPage.count).toHaveText('50 items left');
  });

  test('renders HTML as plain text, not markup @regression', async ({ todoPage, page }) => {
    await todoPage.addTodo('<b id="injected">bold</b>');

    await expect(todoPage.items).toHaveText(['<b id="injected">bold</b>']);
    await expect(page.locator('#injected')).toHaveCount(0);
  });

  test('adds a 500-character todo @regression', async ({ todoPage }) => {
    const long = 'x'.repeat(500);
    await todoPage.addTodo(long);

    await expect(todoPage.items).toHaveText([long]);
  });

  test('adds a todo typed key by key @regression', async ({ todoPage }) => {
    await todoPage.newTodo.pressSequentially('Typed slowly');
    await todoPage.newTodo.press('Enter');

    await expect(todoPage.items).toHaveText(['Typed slowly']);
  });

  test('adding a todo keeps other todos completed @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Done already');
    await todoPage.toggle('Done already');
    await todoPage.addTodo('New one');

    await expect(todoPage.item('Done already')).toHaveClass(/completed/);
    await expect(todoPage.item('New one')).not.toHaveClass(/completed/);
  });

  test('adds a todo with emoji @regression', async ({ todoPage }) => {
    await todoPage.addTodo('🚀 Launch 🎉');

    await expect(todoPage.items).toHaveText(['🚀 Launch 🎉']);
  });
});
