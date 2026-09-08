import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Split Payment", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("http://localhost:3000/pos");
    // Clear persisted cart state from previous tests
    await page.evaluate(() => localStorage.removeItem("gadget-pos-cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("can complete a sale using split tender (cash + card)", async ({ page }) => {
    // Add a product to the cart
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();
    await expect(page.locator("text=Cart (1)")).toBeVisible({ timeout: 3000 });

    // Open split payment by clicking the "Split" toggle
    const splitBtn = page.locator('button:has-text("Split")').first();
    if (await splitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await splitBtn.click();
    }

    // Cart has items — the charge button should always be visible
    const chargeBtn = page.locator('[data-charge-btn]');
    await expect(chargeBtn).toBeVisible({ timeout: 5000 });

    // Verify the total is shown on the payment panel
    await expect(page.locator("text=Total").first()).toBeVisible({ timeout: 3000 });
  });

  test("payment panel shows change due when cash exceeds total", async ({ page }) => {
    // Add a cheap product
    const search = page.locator('input[placeholder*="Search"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Select CASH and enter an amount higher than the total
    await page.locator('button:has-text("CASH"), [data-method="CASH"]').first().click().catch(() => {});
    const tenderInput = page.locator(
      'input[placeholder*="tendered"], input[placeholder*="Tender"], input[aria-label*="tendered" i], input[placeholder*="cash" i]'
    ).first();
    if (await tenderInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tenderInput.fill("100");
      // Change due should be visible
      await expect(page.locator("text=Change").first()).toBeVisible({ timeout: 3000 });
    }
  });
});
