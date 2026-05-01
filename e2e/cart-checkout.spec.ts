import { test, expect } from "@playwright/test";

test.describe.configure({ retries: 2 });

test.beforeEach(async ({ request }) => {
  // Reset cart state before each test run to avoid cross-test pollution
  await request.delete("http://localhost:3000/api/cart");
});

test("happy path: browse → add → cart → checkout → order", async ({ page }) => {
  await page.goto("/browse/mjolnir-exe");
  await expect(page.getByText("DAMAGE")).toBeVisible({ timeout: 10_000 });

  // Click add to cart and wait for a successful POST (retried automatically if API errors)
  let added = false;
  for (let attempt = 0; attempt < 5 && !added; attempt++) {
    const postDone = page.waitForResponse(
      (r) => r.url().includes("/api/cart") && r.request().method() === "POST",
      { timeout: 5_000 },
    );
    if (attempt > 0) {
      // Re-click if previous attempt failed
      await page.getByRole("button", { name: /ADD TO CART/ }).click();
    } else {
      await page.getByRole("button", { name: /ADD TO CART/ }).click();
    }
    const res = await postDone;
    if (res.status() === 200) {
      added = true;
    } else {
      // Wait a moment before retry
      await page.waitForTimeout(500);
    }
  }
  expect(added).toBe(true);

  // Header cart link shows 1 item
  await expect(page.locator("[aria-label='Cart, 1 items']")).toBeVisible({ timeout: 5_000 });

  await page.goto("/cart");
  await expect(page.getByText("// CART")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText("MJOLNIR.exe", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: /PROCEED TO CHECKOUT/ }).click();
  await expect(page.getByRole("heading", { name: "Review your order" })).toBeVisible();
  await page.getByRole("button", { name: /CONTINUE/ }).first().click();
  await expect(page.getByRole("heading", { name: "Confirm wallet" })).toBeVisible();
  await page.getByRole("button", { name: /CONTINUE/ }).first().click();
  await expect(page.getByRole("heading", { name: /Sign/ })).toBeVisible();

  // Click sign — retry if BLOCKCHAIN_CONGESTION (8% chance)
  let confirmed = false;
  for (let attempt = 0; attempt < 3 && !confirmed; attempt++) {
    await page.getByRole("button", { name: /SIGN & SEND/ }).click();
    try {
      await expect(page.getByText("TRANSACTION CONFIRMED")).toBeVisible({ timeout: 12_000 });
      confirmed = true;
    } catch {
      // Congestion or error — go back and retry sign step
      await page.goto("/checkout");
      await page.getByRole("button", { name: /CONTINUE/ }).first().click();
      await page.getByRole("button", { name: /CONTINUE/ }).first().click();
    }
  }
  expect(confirmed).toBe(true);

  // Visit orders
  await page.getByRole("link", { name: /VIEW ORDERS/ }).click();
  await expect(page.getByText("// ORDER HISTORY")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("main").getByText(/MJOLNIR\.exe/).first()).toBeVisible({ timeout: 10_000 });
});
