import { test, expect } from '../fixtures';

test.describe('Demo — Page layout', () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('has the page title "Demo Todos" @smoke', async ({ page }) => {
    await expect(page).toHaveTitle('Demo Todos');
  });

  test('declares English as the page language @regression', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('shows the "todos" heading @regression', async ({ todoPage }) => {
    await expect(todoPage.heading).toHaveText('todos');
  });

  test('heading is a level-1 heading @regression', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'todos' })).toBeVisible();
  });

  test('heading uses the brand colour @regression', async ({ todoPage }) => {
    await expect(todoPage.heading).toHaveCSS('color', 'rgb(184, 63, 69)');
  });

  test('input shows the placeholder text @regression', async ({ todoPage }) => {
    await expect(todoPage.newTodo).toHaveAttribute('placeholder', 'What needs to be done?');
  });

  test('input is focused on load @regression', async ({ todoPage }) => {
    await expect(todoPage.newTodo).toBeFocused();
  });

  test('input is empty on load @regression', async ({ todoPage }) => {
    await expect(todoPage.newTodo).toHaveValue('');
  });

  test('input is editable @regression', async ({ todoPage }) => {
    await expect(todoPage.newTodo).toBeEditable();
  });

  test('list is empty on load @regression', async ({ todoPage }) => {
    await expect(todoPage.items).toHaveCount(0);
  });

  test('has a responsive viewport meta tag @regression', async ({ page }) => {
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  });

  test('main card content is capped at 480px @regression', async ({ page }) => {
    await expect(page.locator('main')).toHaveCSS('max-width', '480px');
  });

  test('loads without console errors @regression', async ({ page, todoPage }) => {
    const errors: string[] = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (err) => errors.push(err.message));

    await todoPage.goto();
    await todoPage.addTodo('Smoke');

    expect(errors).toEqual([]);
  });

  test('responds with HTTP 200 @regression', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
  });

  test.describe('on a phone-sized screen', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('main card fits within the screen @regression', async ({ page }) => {
      const box = await page.locator('main').boundingBox();

      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });

    test('can add and complete a todo @regression', async ({ todoPage }) => {
      await todoPage.addTodo('Mobile task');
      await todoPage.toggle('Mobile task');

      await expect(todoPage.item('Mobile task')).toHaveClass(/completed/);
    });
  });
});
