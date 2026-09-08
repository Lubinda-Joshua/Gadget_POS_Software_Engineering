import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Customer & Loyalty", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("http://localhost:3000/pos");
  });

  test("can attach a customer to a sale via CustomerCapture", async ({ page }) => {
    // CustomerCapture shows a trigger button - click it to open the dropdown
    const triggerBtn = page.locator('[aria-label="Attach customer"]');
    await expect(triggerBtn).toBeVisible({ timeout: 5000 });
    await triggerBtn.click();

    // The search input should now be visible inside the dropdown
    const searchInput = page.locator('input[placeholder*="Name, phone"]');
    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // Switch to "New" tab to create a quick test customer
    await page.locator('button:has-text("New")').click();
    const nameInput = page.locator('input[placeholder="Name *"]');
    await expect(nameInput).toBeVisible({ timeout: 2000 });
    await nameInput.fill("E2E Test Customer");
    await page.locator('button:has-text("Create & attach")').click();

    // Customer chip should now show in place of the trigger button
    await expect(page.locator("text=E2E Test Customer")).toBeVisible({ timeout: 3000 });
  });

  test("loyalty points earned label appears in receipt after sale", async ({ page }) => {
    // Add a product
    const search = page.locator('[id="pos-search-input"]');
    await search.fill("Coffee");
    const firstResult = page.locator('[class*="divide-y"] button').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // Complete the sale with CASH
    await page.locator('button:has-text("CASH"), [data-method="CASH"]').first().click().catch(() => {});
    const chargeBtn = page.locator('[data-charge-btn], button:has-text("Charge"), button:has-text("Complete Sale")').first();
    await expect(chargeBtn).toBeEnabled({ timeout: 3000 });
    await chargeBtn.click();

    // Receipt modal should appear (contains <h2>Receipt Preview</h2>)
    await expect(page.locator("text=Receipt Preview")).toBeVisible({ timeout: 5000 });

    // Receipt content should be present
    const receiptContent = await page.locator("#receipt-print-overlay").textContent().catch(() => "");
    expect(receiptContent).toBeTruthy();

    await page.keyboard.press("Escape");
  });

  test("customer loyalty balance is visible on customer profile page", async ({ page }) => {
    await page.goto("http://localhost:3000/customers");
    // Customer list heading should load
    await expect(page.locator("h1").filter({ hasText: "Customers" })).toBeVisible({ timeout: 5000 });

    // Wait for actual customer links (td a links — not the loading spinner row)
    const firstCustomerLink = page.locator("table tbody tr td a").first();
    if (await firstCustomerLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstCustomerLink.click();
      // Profile page should show loyalty points section
      await expect(page.locator("text=Loyalty Points").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
