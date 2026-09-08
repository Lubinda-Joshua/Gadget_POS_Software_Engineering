import { PrismaClient } from "../src/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

await prisma.account.deleteMany({ where: { providerId: "credential" } });
await prisma.user.deleteMany({
  where: { email: { in: ["admin@example.com", "cashier@example.com"] } },
});
console.log("Deleted test users and accounts");
await prisma.$disconnect();
