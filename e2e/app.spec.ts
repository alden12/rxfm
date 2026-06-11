import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders the example app shell', async ({ page }) => {
  await expect(page).toHaveTitle('Corrente Examples');
  await expect(page.getByRole('heading', { level: 1, name: 'Corrente Examples' })).toBeVisible();
});

test('click counter increments on click (reactivity)', async ({ page }) => {
  const counter = page.getByRole('button', { name: /^Clicks:/ });
  await expect(counter).toHaveText('Clicks: 0');
  await counter.click();
  await counter.click();
  await expect(counter).toHaveText('Clicks: 2');
});

test('todo list renders its initial items', async ({ page }) => {
  await expect(page.getByText('Finish Corrente')).toBeVisible();
  await expect(page.getByPlaceholder('Add Item')).toBeVisible();
});

test('todo list adds an item from the input (keyed-list reactivity)', async ({ page }) => {
  const items = page.locator('.todo-item');
  const initialCount = await items.count();

  const input = page.getByPlaceholder('Add Item');
  await input.fill('Walk the dog');
  await input.blur(); // commit — fires the native `change` event the example listens for

  await expect(page.locator('.todo-item', { hasText: 'Walk the dog' })).toBeVisible();
  await expect(items).toHaveCount(initialCount + 1);
});

test('todo item toggles done on click (event → conditional class + checkbox binding)', async ({ page }) => {
  const item = page.locator('.todo-item', { hasText: 'Finish Corrente' });
  const checkbox = item.locator('input[type="checkbox"]');

  await expect(item).not.toHaveClass(/\bdone\b/);
  await expect(checkbox).not.toBeChecked();

  await page.getByText('Finish Corrente').click();

  await expect(item).toHaveClass(/\bdone\b/);
  await expect(checkbox).toBeChecked();
});

test('conditional child toggles on a timer (time-driven reactivity)', async ({ page }) => {
  // flipFlop = timer(0, 1000) gated by i % 2: visible at t=0, hidden ~1s, visible ~2s.
  const message = page.getByText('Now you see me!').first();
  await expect(message).toBeVisible();
  await expect(message).toBeHidden({ timeout: 2000 });
  await expect(message).toBeVisible({ timeout: 2000 });
});

test('snake game board renders a grid of cells', async ({ page }) => {
  await expect(page.locator('.snake-game-board')).toBeVisible();
  expect(await page.locator('.snake-cell').count()).toBeGreaterThan(0);
});

test('minesweeper board renders', async ({ page }) => {
  await expect(page.locator('.minesweeper-board')).toBeVisible();
});
