import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto(`${BASE}/pos`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error with wrong password", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    // Wait for the sign-in API to respond (scrypt can take several seconds)
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    // Should show an error message (scrypt can be slow, allow up to 15s)
    const errorEl = page.locator("text=/invalid|incorrect|wrong|failed/i").first();
    await expect(errorEl).toBeVisible({ timeout: 15000 });
  });

  test("admin can log in and access settings", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "admin123456");
    await page.click('button[type="submit"]');
    // Should redirect to /pos after login (scrypt can take several seconds)
    await expect(page).toHaveURL(/\/pos/, { timeout: 20000 });
    // Should be able to reach settings
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator("h1")).toHaveText("Settings");
  });

  test("cashier is redirected away from settings", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', "cashier@example.com");
    await page.fill('input[type="password"]', "cashier123456");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/pos/, { timeout: 20000 });
    // Cashier navigating to settings gets redirected back to /pos
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveURL(/\/pos/);
  });
});
