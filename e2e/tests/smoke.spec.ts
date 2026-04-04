import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Biarritz/);
    await expect(page.getByText("Biarritz")).toBeVisible();
  });

  test("users page loads", async ({ page }) => {
    await page.goto("/users");
    await expect(page.getByText("Users")).toBeVisible();
  });
});
