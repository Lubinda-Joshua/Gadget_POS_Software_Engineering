/**
 * Playwright global setup
 *
 * Runs once before all tests. Hits /api/setup/status so the server sets
 * the "gadget-pos-setup-complete" cookie in its own response headers.  That
 * cookie is then written into the shared storage-state file used by all
 * browser contexts, so the middleware (proxy.ts) never redirects test
 * traffic to /setup.
 */
import { chromium, type FullConfig } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

export default async function globalSetup(_config: FullConfig) {
  // Hit the status endpoint – it sets the setup-complete cookie if the DB
  // says setup is done.  We use a real browser context so cookies are
  // persisted properly.
  const browser = await chromium.launch({ channel: "chrome" });
  const context = await browser.newContext();

  // Directly inject the setup cookie without SameSite restriction so it's
  // always sent on all requests (including fetch POST).
  await context.addCookies([
    {
      name: "gadget-pos-setup-complete",
      value: "1",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "None",
    },
  ]);

  const page = await context.newPage();

  try {
    const response = await page.goto(`${BASE_URL}/api/setup/status`, {
      waitUntil: "commit",
      timeout: 30_000,
    });

    if (!response || !response.ok()) {
      console.warn(
        `[globalSetup] /api/setup/status returned ${response?.status()} — tests may be redirected to /setup`,
      );
    } else {
      const data = await response.json().catch(() => ({})) as { setupComplete?: boolean };
      if (!data.setupComplete) {
        console.warn(
          "[globalSetup] setupComplete is false — run `pnpm db:seed` before E2E tests",
        );
      }
    }
  } catch (err) {
    console.warn("[globalSetup] Could not reach /api/setup/status:", err);
  }

  // Save the cookies (including gadget-pos-setup-complete) to the shared storage state
  await context.storageState({ path: "playwright/.auth/setup.json" });

  await context.close();
  await browser.close();
}
