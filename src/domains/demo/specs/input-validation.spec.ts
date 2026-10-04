import { test, expect } from '../fixtures';

/** Data-driven checks on what the new-todo input accepts and rejects. */
test.describe('Demo — Input validation', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  const BLANK_INPUTS: Record<string, string> = {
    'empty string': '',
    'single space': ' ',
    'many spaces': '      ',
    'tab': '\t',
    'mixed tabs and spaces': ' \t  \t ',
  };

  for (const [name, value] of Object.entries(BLANK_INPUTS)) {
    test(`ignores ${name} @regression`, async ({ todoPage }) => {
      await todoPage.addTodo(value);

      await expect(todoPage.items).toHaveCount(0);
      await expect(todoPage.count).toHaveText('');
    });
  }

  test('keeps blank text in the input when rejected @regression', async ({ todoPage }) => {
    await todoPage.addTodo('   ');

    await expect(todoPage.newTodo).toHaveValue('   ');
  });

  for (const key of ['Tab', 'Escape', 'ArrowDown', 'ArrowUp', 'Shift']) {
    test(`does not add a todo on ${key} @regression`, async ({ todoPage }) => {
      await todoPage.newTodo.fill('Not submitted');
      await todoPage.newTodo.press(key);

      await expect(todoPage.items).toHaveCount(0);
    });
  }

  const ACCEPTED_INPUTS: Record<string, string> = {
    'accented latin': 'Café — naïve façade',
    'japanese': '日本語のタスク',
    'arabic': 'مهمة عربية',
    'script tag': '<script>alert(1)</script>',
    'quotes and ampersand': `"quoted" & 'single'`,
    'digits only': '12345',
    'symbols': '!@#$%^&*()_+-=[]{}|;:,.<>?',
    'SQL-like text': "'; DROP TABLE todos; --",
    'path traversal text': '../../etc/passwd',
    'literal null': 'null',
    'zero': '0',
    '1000 characters': 'y'.repeat(1000),
  };

  for (const [name, value] of Object.entries(ACCEPTED_INPUTS)) {
    test(`accepts ${name} @regression`, async ({ todoPage }) => {
      await todoPage.addTodo(value);

      await expect(todoPage.items.first().locator('label')).toHaveJSProperty('textContent', value);
      await expect(todoPage.count).toHaveText('1 item left');
    });
  }
});
