import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

const UNIQUE_PRODUCT = `E2E-Product-${Date.now()}`;

test.describe("Products", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin can create a new product", async ({ page }) => {
    await page.goto("http://localhost:3000/products/new");
    await expect(page.locator("h1")).toHaveText(/Add Product/i);

    await page.fill('input[name="name"]', UNIQUE_PRODUCT);
    await page.fill('input[name="price"]', "9.99");
    await page.fill('input[name="stock"]', "50");
    await page.click('button[type="submit"]');

    // After save, should redirect to the products LIST (not /products/new)
    await expect(page).toHaveURL(/\/products$/, { timeout: 10000 });
    await expect(page.locator("body")).toContainText(UNIQUE_PRODUCT);
  });

  test("new product appears in POS search", async ({ page }) => {
    await page.goto("http://localhost:3000/pos");
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill(UNIQUE_PRODUCT.slice(0, 10));
    // Wait for results
    await expect(page.locator(`text="${UNIQUE_PRODUCT}"`)).toBeVisible({
      timeout: 5000,
    });
  });

  test("product with low stock shows alert in product list", async ({ page }) => {
    await page.goto("http://localhost:3000/products/new");
    const lowStockName = `LowStock-${Date.now()}`;
    await page.fill('input[name="name"]', lowStockName);
    await page.fill('input[name="price"]', "5.00");
    await page.fill('input[name="stock"]', "1");
    await page.fill('input[name="lowStockThreshold"]', "5");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/products$/, { timeout: 10000 });
    // Low stock indicator should be present
    const row = page.locator("tr", { hasText: lowStockName });
    await expect(row.locator("text=/low stock/i")).toBeVisible({ timeout: 5000 });
  });
});
