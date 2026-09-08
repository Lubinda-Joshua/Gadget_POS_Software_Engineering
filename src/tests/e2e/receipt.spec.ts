import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Receipt Printing", () => {
  test("print dialog opens from receipt modal", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("http://localhost:3000/pos");

    // Add a product to the cart
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Complete the sale
    await page.click('button:has-text("CASH")');
    const chargeBtn = page.locator('button:has-text("Charge")');
    await chargeBtn.click();

    // Wait for receipt modal
    await expect(page.locator("text=Receipt Preview")).toBeVisible({ timeout: 5000 });

    // Check that the Print button is present
    await expect(
      page.locator('button:has-text("Print"), a:has-text("Print")')
    ).toBeVisible();

    // Verify receipt content
    await expect(page.locator("#receipt-print")).toBeVisible();
    await expect(page.locator("#receipt-print")).toContainText("TOTAL");
  });

  test("can close receipt modal without printing", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("http://localhost:3000/pos");

    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    await page.click('button:has-text("CASH")');
    await page.locator('button:has-text("Charge")').click();
    await expect(page.locator("text=Receipt Preview")).toBeVisible({ timeout: 5000 });

    // Close using X button
    await page.click('button[aria-label="close"], button:near(:text("Receipt Preview"))');
    // If no aria-label, just look for X button near the header
    await expect(page.locator("text=Cart is empty")).toBeVisible({ timeout: 3000 });
  });
});
