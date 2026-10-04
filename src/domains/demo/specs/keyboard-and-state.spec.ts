import { test, expect } from '../fixtures';
import { TodoPage } from '../pages/todo.page';

test.describe('Demo — Keyboard', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('Tab moves focus from the input to the first checkbox @regression', async ({ todoPage }) => {
    await todoPage.addTodo('A');
    await todoPage.newTodo.press('Tab');

    await expect(todoPage.item('A').getByRole('checkbox')).toBeFocused();
  });

  test('Shift+Tab moves focus back to the input @regression', async ({ todoPage }) => {
    await todoPage.addTodo('A');
    await todoPage.newTodo.press('Tab');
    await todoPage.item('A').getByRole('checkbox').press('Shift+Tab');

    await expect(todoPage.newTodo).toBeFocused();
  });

  test('adds a todo using only the keyboard @regression', async ({ todoPage, page }) => {
    await page.keyboard.type('Keyboard only');
    await page.keyboard.press('Enter');

    await expect(todoPage.items).toHaveText(['Keyboard only']);
  });

  test('Backspace edits the text before submitting @regression', async ({ todoPage }) => {
    await todoPage.newTodo.fill('Buy milkk');
    await todoPage.newTodo.press('Backspace');
    await todoPage.newTodo.press('Enter');

    await expect(todoPage.items).toHaveText(['Buy milk']);
  });

  test('select-all and retype replaces the text @regression', async ({ todoPage }) => {
    await todoPage.newTodo.fill('Wrong text');
    await todoPage.newTodo.press('ControlOrMeta+a');
    await todoPage.newTodo.pressSequentially('Right text');
    await todoPage.newTodo.press('Enter');

    await expect(todoPage.items).toHaveText(['Right text']);
  });

  test('every todo exposes an accessible checkbox @regression', async ({ todoPage, page }) => {
    await todoPage.addTodos('A', 'B', 'C', 'D');

    await expect(page.getByRole('checkbox')).toHaveCount(await todoPage.items.count());
  });
});

test.describe('Demo — State', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('reloading clears the todos @regression', async ({ todoPage, page }) => {
    await todoPage.addTodos('A', 'B');
    await page.reload();

    await expect(todoPage.items).toHaveCount(0);
  });

  test('reloading clears the counter @regression', async ({ todoPage, page }) => {
    await todoPage.addTodo('A');
    await page.reload();

    await expect(todoPage.count).toHaveText('');
  });

  test('navigating away and back resets the list @regression', async ({ todoPage, page }) => {
    await todoPage.addTodo('A');
    await page.goto('about:blank');
    await todoPage.goto();

    await expect(todoPage.items).toHaveCount(0);
  });

  test('a second tab has its own independent list @regression', async ({ todoPage, context }) => {
    await todoPage.addTodo('Tab one only');

    const other = new TodoPage(await context.newPage());
    await other.goto();

    await expect(other.items).toHaveCount(0);
    await expect(todoPage.items).toHaveText(['Tab one only']);
  });
});
