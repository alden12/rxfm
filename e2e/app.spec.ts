import { test, expect } from "@playwright/test";

// The demo is now a doc-site: a sidebar nav (in an <aside>) switches the content pane
// between the rendered markdown docs (with live demos spliced in) and the full app
// examples. Only the selected route is mounted, so most tests navigate via the sidebar
// first. Nav links are scoped to the <aside> to avoid matching links of the same name
// inside the rendered docs (e.g. the README's "Guide" table link).
const nav = (page: import("@playwright/test").Page, name: string) =>
  page.locator("aside").getByText(name, { exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders the doc-site shell with sidebar nav", async ({ page }) => {
  await expect(page).toHaveTitle("Corrente - Reactive TS");
  await expect(
    page.locator("aside").getByText("Corrente").first(),
  ).toBeVisible();
  await expect(nav(page, "Guide")).toBeVisible();
  await expect(nav(page, "Snake")).toBeVisible();
});

test("overview page renders the live counter demo (markdown + spliced demo)", async ({
  page,
}) => {
  // The README hero fence is annotated `demo=counter`, so the live counter renders
  // beneath the snippet on the default (Overview) page.
  const counter = page.getByRole("button", { name: /^Clicks:/ });
  await expect(counter).toContainText("Clicks: 0");
  await counter.click();
  await counter.click();
  await expect(counter).toContainText("Clicks: 2");
});

test("guide page splices the conditional demo (time-driven reactivity)", async ({
  page,
}) => {
  await nav(page, "Guide").click();
  // Scope to the live demo output — the teaching snippet above it contains the same
  // text inside a highlighted code block.
  const message = page.locator(".demo-result").getByText("Now you see me!");
  await expect(message).toBeVisible();
  await expect(message).toBeHidden({ timeout: 2000 });
  await expect(message).toBeVisible({ timeout: 2000 });
});

test("todo list example renders and adds an item (keyed-list reactivity)", async ({
  page,
}) => {
  await nav(page, "Todo List").click();
  const live = page.locator(".demo-result"); // exclude the source-code expander
  await expect(live.getByText("Finish Corrente")).toBeVisible();

  const items = page.locator(".todo-item");
  const initialCount = await items.count();

  const input = page.getByPlaceholder("Add Item");
  await input.fill("Walk the dog");
  await input.blur(); // commit — fires the native `change` event the example listens for

  await expect(
    page.locator(".todo-item", { hasText: "Walk the dog" }),
  ).toBeVisible();
  await expect(items).toHaveCount(initialCount + 1);
});

test("todo item toggles done on click (event → conditional class + checkbox binding)", async ({
  page,
}) => {
  await nav(page, "Todo List").click();
  const item = page.locator(".todo-item", { hasText: "Finish Corrente" });
  const checkbox = item.locator('input[type="checkbox"]');

  await expect(item).not.toHaveClass(/\bdone\b/);
  await expect(checkbox).not.toBeChecked();

  await page.locator(".demo-result").getByText("Finish Corrente").click();

  await expect(item).toHaveClass(/\bdone\b/);
  await expect(checkbox).toBeChecked();
});

test("snake game example renders a grid of cells", async ({ page }) => {
  await nav(page, "Snake").click();
  await expect(page.locator(".snake-game-board")).toBeVisible();
  expect(await page.locator(".snake-cell").count()).toBeGreaterThan(0);
});

test("minesweeper example renders its board", async ({ page }) => {
  await nav(page, "Minesweeper").click();
  await expect(page.locator(".minesweeper-board")).toBeVisible();
});

test("view full source expander reveals the real example source", async ({
  page,
}) => {
  await nav(page, "Snake").click();
  const details = page.locator("details", { hasText: "View full source" });
  await expect(details.locator(".code-block")).toBeHidden();
  await details.getByText("View full source").click();
  await expect(details.locator(".code-block")).toBeVisible();
  await expect(details.locator(".code-block")).toContainText("SnakeGame");
});
