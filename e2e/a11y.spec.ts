import { test, expect } from "@playwright/test";

test("keyboard navigation works across primary flows", async ({ page }) => {
  await page.goto("/browse");
  // Wait for the page to fully load data (retry on simulated 503 errors)
  await expect(page.getByText(/\d+ weapons indexed/)).toBeVisible({ timeout: 15_000 });

  // Tab to filter search box
  await page.keyboard.press("Tab"); // brand link
  await page.keyboard.press("Tab"); // browse link
  await page.keyboard.press("Tab"); // orders
  await page.keyboard.press("Tab"); // seller
  await page.keyboard.press("Tab"); // cart link
  await page.keyboard.press("Tab"); // glow toggle
  await page.keyboard.press("Tab"); // wallet chip
  await page.keyboard.press("Tab"); // avatar
  // Now we should be in the main content. The first focusable inside the filter sidebar is search input.
  await page.keyboard.press("Tab"); // → search input
  await page.keyboard.type("mjolnir");
  await expect(page.getByText("MJOLNIR.exe", { exact: true }).filter({ has: page.locator("h3") }).or(page.locator('h3:has-text("MJOLNIR.exe")'))).toBeVisible({ timeout: 10_000 });

  // Tab into the result grid and press Enter on the card to open dialog
  // Use an explicit selector since tab order through filters is long
  await page.locator('button[aria-label="Preview MJOLNIR.exe"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/PROVENANCE/)).toBeVisible({ timeout: 5_000 });

  // Esc closes; focus returns to the trigger
  await page.keyboard.press("Escape");
  await expect(page.getByText(/PROVENANCE/)).not.toBeVisible({ timeout: 3_000 });
  // The trigger button should be focused again (wait for setTimeout focus restore)
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "Preview MJOLNIR.exe",
    { timeout: 3_000 },
  );
  const focusedAria = await page.evaluate(() =>
    document.activeElement?.getAttribute("aria-label"),
  );
  expect(focusedAria).toBe("Preview MJOLNIR.exe");
});

test("glow toggle flips data-cp-glow attribute", async ({ page }) => {
  await page.goto("/");
  const initial = await page.evaluate(() => document.documentElement.getAttribute("data-cp-glow"));
  expect(initial === null || initial === "on").toBeTruthy();

  await page.getByRole("button", { name: /Glow effects/i }).click();
  const flipped = await page.evaluate(() => document.documentElement.getAttribute("data-cp-glow"));
  expect(flipped).toBe("off");

  // Reload — preference persists (wait for React hydration to apply the attribute)
  await page.reload();
  await page.waitForFunction(() => document.documentElement.getAttribute("data-cp-glow") === "off", { timeout: 5_000 });
  const afterReload = await page.evaluate(() => document.documentElement.getAttribute("data-cp-glow"));
  expect(afterReload).toBe("off");
});
