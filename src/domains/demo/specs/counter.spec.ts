import { test, expect } from '../fixtures';

test.describe('Demo — Items-left counter', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('is empty when there are no todos @smoke', async ({ todoPage }) => {
    await expect(todoPage.count).toHaveText('');
  });

  test('uses the singular for one item @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Only one');

    await expect(todoPage.count).toHaveText('1 item left');
  });

  for (const n of [2, 3, 5, 10, 25]) {
    test(`shows "${n} items left" for ${n} todos @regression`, async ({ todoPage }) => {
      await todoPage.addTodos(...Array.from({ length: n }, (_, i) => `Task ${i + 1}`));

      await expect(todoPage.count).toHaveText(`${n} items left`);
    });
  }

  test('updates after every add @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Task 1');
    await expect(todoPage.count).toHaveText('1 item left');

    for (let i = 2; i <= 5; i++) {
      await todoPage.addTodo(`Task ${i}`);
      await expect(todoPage.count).toHaveText(`${i} items left`);
    }
  });

  test('decrements when a todo is completed @regression', async ({ todoPage }) => {
    await todoPage.addTodos('A', 'B', 'C');
    await todoPage.toggle('A');

    await expect(todoPage.count).toHaveText('2 items left');
  });

  test('increments when a todo is unchecked @regression', async ({ todoPage }) => {
    await todoPage.addTodos('A', 'B', 'C');
    await todoPage.toggle('A');
    await todoPage.untoggle('A');

    await expect(todoPage.count).toHaveText('3 items left');
  });

  test('shows "0 items left" when everything is done @regression', async ({ todoPage }) => {
    await todoPage.addTodos('A', 'B');
    await todoPage.toggle('A');
    await todoPage.toggle('B');

    await expect(todoPage.count).toHaveText('0 items left');
  });

  test('counts only active todos in a mixed list @regression', async ({ todoPage }) => {
    await todoPage.addTodos('A', 'B', 'C', 'D', 'E');
    await todoPage.toggle('B');
    await todoPage.toggle('D');

    await expect(todoPage.count).toHaveText('3 items left');
  });

  test('counts duplicate todos separately @regression', async ({ todoPage }) => {
    await todoPage.addTodos('Same', 'Same');

    await expect(todoPage.count).toHaveText('2 items left');
  });

  test('does not change on a rejected blank input @regression', async ({ todoPage }) => {
    await todoPage.addTodo('Real');
    await todoPage.addTodo('   ');

    await expect(todoPage.count).toHaveText('1 item left');
  });

  test('adding after completing counts only the active ones @regression', async ({ todoPage }) => {
    await todoPage.addTodo('A');
    await todoPage.toggle('A');
    await todoPage.addTodo('B');

    await expect(todoPage.count).toHaveText('1 item left');
  });
});
