import { test, expect } from '../fixtures';

test.describe('Demo — Complete todo', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
    await todoPage.addTodos('First', 'Second', 'Third');
  });

  test('checking a todo marks it completed @smoke', async ({ todoPage }) => {
    await todoPage.toggle('First');

    await expect(todoPage.item('First')).toHaveClass(/completed/);
  });

  test('checking a todo checks its checkbox @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');

    await expect(todoPage.item('First').getByRole('checkbox')).toBeChecked();
  });

  test('unchecking a todo makes it active again @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');
    await todoPage.untoggle('First');

    await expect(todoPage.item('First')).not.toHaveClass(/completed/);
    await expect(todoPage.item('First').getByRole('checkbox')).not.toBeChecked();
  });

  test('completed label is struck through @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');

    await expect(todoPage.item('First').locator('label')).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('completed label is greyed out @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');

    await expect(todoPage.item('First').locator('label')).toHaveCSS('color', 'rgb(170, 170, 170)');
  });

  test('active label is not struck through @regression', async ({ todoPage }) => {
    await expect(todoPage.item('First').locator('label')).toHaveCSS('text-decoration-line', 'none');
  });

  test('completing one todo leaves the others active @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');

    await expect(todoPage.item('Second')).not.toHaveClass(/completed/);
    await expect(todoPage.item('Third')).not.toHaveClass(/completed/);
  });

  test('completes every todo @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');
    await todoPage.toggle('Second');
    await todoPage.toggle('Third');

    for (const text of ['First', 'Second', 'Third']) {
      await expect(todoPage.item(text)).toHaveClass(/completed/);
    }
  });

  test('completes the middle todo @regression', async ({ todoPage }) => {
    await todoPage.toggle('Second');

    await expect(todoPage.items.nth(1)).toHaveClass(/completed/);
  });

  test('completes the last todo @regression', async ({ todoPage }) => {
    await todoPage.toggle('Third');

    await expect(todoPage.items.last()).toHaveClass(/completed/);
  });

  test('completes a todo by clicking the checkbox @regression', async ({ todoPage }) => {
    await todoPage.item('First').getByRole('checkbox').click();

    await expect(todoPage.item('First')).toHaveClass(/completed/);
  });

  test('completes a todo with the Space key @regression', async ({ todoPage }) => {
    await todoPage.item('First').getByRole('checkbox').focus();
    await todoPage.item('First').getByRole('checkbox').press('Space');

    await expect(todoPage.item('First')).toHaveClass(/completed/);
  });

  test('completing keeps the list order @regression', async ({ todoPage }) => {
    await todoPage.toggle('First');

    await expect(todoPage.items).toHaveText(['First', 'Second', 'Third']);
  });

  test('odd number of clicks ends completed @regression', async ({ todoPage }) => {
    for (let i = 0; i < 5; i++) await todoPage.item('First').getByRole('checkbox').click();

    await expect(todoPage.item('First')).toHaveClass(/completed/);
  });

  test('even number of clicks ends active @regression', async ({ todoPage }) => {
    for (let i = 0; i < 4; i++) await todoPage.item('First').getByRole('checkbox').click();

    await expect(todoPage.item('First')).not.toHaveClass(/completed/);
  });
});
