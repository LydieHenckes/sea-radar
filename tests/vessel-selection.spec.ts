import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
});

test("affiche trois navires", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  await expect(page.locator("[data-vessel-id]")).toHaveCount(3);
});

test("ouvre la fiche du navire sélectionné", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const vessel = page.locator('[data-vessel-id="demo-2"]');
  await vessel.click();

  await expect(page.locator("article[aria-label='Судно demo-2']")).toBeVisible();
});

test("conserve la fiche au second clic", async ({ page }) => {
  await page.goto("http://localhost:3000/");

  const vessel = page.locator('[data-vessel-id="demo-2"]');
  await vessel.click();
  await vessel.click();

  await expect(page.locator("article[aria-label='Судно demo-2']")).toBeVisible();
});
