import { test, expect } from "@playwright/test";

test("seller dashboard + publish new listing", async ({ page }) => {
  // Dashboard renders with seeded data
  await page.goto("/seller");
  await expect(page.getByText("// SELLER DASHBOARD")).toBeVisible();
  await expect(page.getByText(/REVENUE/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Last 30 days")).toBeVisible();
  await expect(page.getByText(/MJOLNIR\.exe|EXCALIBUR\.dll|KUSANAGI\.blade/)).toBeVisible();

  // Start new listing
  await page.getByRole("link", { name: /LIST NEW WEAPON/ }).click();
  await expect(page.getByText("Pick a category")).toBeVisible();

  // Step 1: melee
  await page.getByRole("button", { name: /^Melee/ }).click();
  await page.getByRole("button", { name: /CONTINUE/ }).click();

  // Step 2: name + preset image + tag
  await expect(page.getByText("Name & media")).toBeVisible();
  await page.getByPlaceholder("MJOLNIR.exe").fill("PLAYTEST.blade");
  // First preset image
  await page.locator('button[aria-label^="Use /items/"]').first().click();
  await page.getByPlaceholder(/lightning, hammer, norse/).fill("test");
  await page.getByRole("button", { name: /\+ ADD/ }).click();
  await page.getByRole("button", { name: /CONTINUE/ }).click();

  // Step 3: leave defaults; set origin and lore
  await expect(page.getByText("Price, stats & lore")).toBeVisible();
  await page.getByPlaceholder(/Norse \/ Greek/).fill("Playtest");
  await page.getByPlaceholder(/One-paragraph backstory/).fill("Auto-test relic.");
  await page.getByRole("button", { name: /CONTINUE/ }).click();

  // Step 4: publish
  await expect(page.getByText("Preview & publish")).toBeVisible();
  await page.getByRole("button", { name: /PUBLISH/ }).click();
  await expect(page.getByText(/LISTING PUBLISHED/)).toBeVisible({ timeout: 12_000 });

  // Verify it appears on /browse search
  await page.goto("/browse?q=playtest");
  await expect(page.getByText("PLAYTEST.blade")).toBeVisible({ timeout: 10_000 });
});
