import { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "admin123456");
  await page.click('button[type="submit"]');
  // scrypt hashing can take several seconds — allow 25s
  await page.waitForURL(/\/pos/, { timeout: 25000 });
}

export async function loginAsCashier(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.fill('input[type="email"]', "cashier@example.com");
  await page.fill('input[type="password"]', "cashier123456");
  await page.click('button[type="submit"]');
  // scrypt hashing can take several seconds — allow 25s
  await page.waitForURL(/\/pos/, { timeout: 25000 });
}
