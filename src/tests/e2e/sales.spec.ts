import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("POS Sales", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("http://localhost:3000/pos");
    // Clear persisted cart state from previous tests
    await page.evaluate(() => localStorage.removeItem("gadget-pos-cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("can add a product to the cart via search", async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");

    // Wait for search results
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Cart should show 1 item
    await expect(page.locator("text=Cart (1)")).toBeVisible({ timeout: 3000 });
  });

  test("completing a sale creates a sale record", async ({ page }) => {
    // Add a product
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Select CASH payment and charge
    await page.click('button:has-text("CASH")');
    const chargeBtn = page.locator('button:has-text("Charge")');
    await expect(chargeBtn).toBeEnabled({ timeout: 3000 });
    await chargeBtn.click();

    // Receipt modal should appear
    await expect(page.locator("text=Receipt Preview")).toBeVisible({
      timeout: 5000,
    });

    // Close receipt
    await page.keyboard.press("Escape");

    // Cart should be cleared
    await expect(
      page.locator("text=Cart is empty")
    ).toBeVisible({ timeout: 3000 });

    // Check sales history has a new record
    await page.goto("http://localhost:3000/sales");
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("can hold and recall an order", async ({ page }) => {
    // Add a product
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Hold the order
    await page.click('button:has-text("Hold Order")');
    // Cart should be empty after hold
    await expect(page.locator("text=Cart is empty")).toBeVisible({ timeout: 3000 });

    // Recall the order
    await page.click('button:has-text("Recall")');
    await expect(page.locator("h2:has-text('Held Orders')")).toBeVisible({ timeout: 3000 });
    // Click the Recall button inside the held orders modal dialog
    // Use force:true since the modal overlay may trap pointer events
    const recallBtn = page.locator('.fixed button:has-text("Recall")').first();
    await recallBtn.click({ force: true });

    // Cart should have the item back
    await expect(page.locator("text=Cart (1)")).toBeVisible({ timeout: 3000 });
  });
});
