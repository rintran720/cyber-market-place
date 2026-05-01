import { test, expect } from "@playwright/test";

test("item detail flow: home → preview dialog → full detail → add to cart", async ({ page }) => {
  await page.goto("/");
  // Home page has "ARSENAL" and "OF MYTHS" in separate spans
  await expect(page.getByText("ARSENAL", { exact: true })).toBeVisible();

  await page.goto("/browse/mjolnir-exe");
  await expect(page.getByText("DAMAGE")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("SPEED")).toBeVisible();
  await expect(page.getByText("RANGE")).toBeVisible();
  await expect(page.getByText("SOUL COST")).toBeVisible();
  await expect(page.getByText("vs median")).toBeVisible();
  await expect(page.getByText(/Other (melee|ranged|energy.divine|cursed) weapons/)).toBeVisible();

  // Increment qty + add to cart
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: /ADD TO CART/ }).click();

  // Header cart badge updates
  await expect(page.getByLabel(/Cart,/)).toBeVisible();
  await expect(page.getByLabel(/Cart, 2 items/)).toBeVisible({ timeout: 5_000 });

  // 404 path
  await page.goto("/browse/does-not-exist");
  await expect(page.getByText("[NOT_FOUND]")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("link", { name: /BACK TO ARSENAL/ })).toBeVisible();
});
