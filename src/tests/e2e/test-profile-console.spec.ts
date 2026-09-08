import { test, expect } from "@playwright/test";

test("Capture profile page state and console", async ({ page }) => {
  page.on("console", (msg) => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Login
  await page.goto("http://localhost:3000/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "admin123456");
  await page.click('button[type="submit"]');

  // Wait for redirect to POS
  await page.waitForURL("**/pos");

  // Navigate to profile settings
  await page.goto("http://localhost:3000/settings/profile");
  await page.waitForTimeout(3000); // Wait for client-side queries

  // Take screenshot
  await page.screenshot({ path: "test-results/profile_test.png" });
});
