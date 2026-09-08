import "dotenv/config";
import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Wipe all auth data
  await client.query(
    `TRUNCATE "Account", "Session", "Verification", "User" RESTART IDENTITY CASCADE`
  );

  // Mark setup as incomplete so the wizard runs again
  await client.query(
    `UPDATE "BusinessSettings" SET "setupComplete" = false WHERE id = 'singleton'`
  );

  console.log("✅ DB reset — users cleared, setupComplete = false");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
