import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: ["admin@example.com", "cashier@example.com"] } },
    include: { accounts: true },
  });

  for (const u of users) {
    console.log(`\nUser: ${u.email} (${u.role})`);
    for (const a of u.accounts) {
      console.log(`  Account: providerId=${a.providerId}, accountId=${a.accountId}`);
      const pw = a.password ?? "(null)";
      console.log(`  Password hash: ${pw.substring(0, 80)}...`);
      const parts = pw.split(":");
      console.log(`  Hash parts: ${parts.length} (salt length: ${parts[0]?.length}, key length: ${parts[1]?.length})`);
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
