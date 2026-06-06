import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders the example app shell', async ({ page }) => {
  await expect(page).toHaveTitle('RxFM Examples');
  await expect(page.getByRole('heading', { level: 1, name: 'RxFM Examples' })).toBeVisible();
});

test('click counter increments on click (reactivity)', async ({ page }) => {
  const counter = page.getByRole('button', { name: /^Clicks:/ });
  // The tsrx demo's counter also renders a derived value, e.g. "Clicks: 0 (doubled: 0)".
  await expect(counter).toContainText('Clicks: 0');
  await counter.click();
  await counter.click();
  await expect(counter).toContainText('Clicks: 2');
});

test('todo list renders its initial items', async ({ page }) => {
  await expect(page.getByText('Finish RxFM')).toBeVisible();
  await expect(page.getByPlaceholder('Add Item')).toBeVisible();
});

test('snake game board renders a grid of cells', async ({ page }) => {
  await expect(page.locator('.snake-game-board')).toBeVisible();
  expect(await page.locator('.snake-cell').count()).toBeGreaterThan(0);
});

test('minesweeper board renders', async ({ page }) => {
  await expect(page.locator('.minesweeper-board')).toBeVisible();
});
