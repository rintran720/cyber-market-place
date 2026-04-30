import { test, expect } from "@playwright/test";

test("browse page loads, filters, and paginates", async ({ page }) => {
  await page.goto("/browse");

  await expect(page.getByText("ARSENAL CATALOG")).toBeVisible();
  await expect(page.getByText(/40 weapons indexed/)).toBeVisible({ timeout: 10_000 });

  await page.getByPlaceholder("mjolnir, norse, ...").fill("mjolnir");
  await expect(page.getByText("MJOLNIR.exe", { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/1 weapons indexed|1 weapon indexed/)).toBeVisible({ timeout: 5_000 });

  await page.getByPlaceholder("mjolnir, norse, ...").fill("");

  await page.getByLabel("1 of 1").check();
  await expect(page.getByText("HOLY-GRAIL", { exact: true })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "RESET" }).click();
  await expect(page.getByText(/40 weapons indexed/)).toBeVisible({ timeout: 10_000 });
});
