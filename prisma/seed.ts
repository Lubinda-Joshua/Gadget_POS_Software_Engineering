import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

/**
 * Hash a password exactly as Better Auth does internally:
 * scrypt with N=16384, r=16, p=1, dkLen=64.
 * Format: "<saltHex>:<keyHex>"  (both hex-encoded)
 */
async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.randomBytes(16);
  const saltHex = saltBytes.toString("hex");
  const keyBuf = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(
      password.normalize("NFKC"),
      saltHex,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, derived) => {
        if (err) reject(err);
        else resolve(derived);
      }
    );
  });
  const keyHex = keyBuf.toString("hex");
  return `${saltHex}:${keyHex}`;
}

async function upsertUser(
  email: string,
  name: string,
  password: string,
  role: "ADMIN" | "CASHIER"
) {
  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomBytes(12).toString("hex");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ↩  User ${email} already exists, skipping`);
    return existing;
  }

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      emailVerified: true,
      role,
    },
  });

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  return user;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Business settings ────────────────────────────────────────────────────────
  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    create: {
      name: "Gadget POS Store",
      primaryColor: "#0f2044",
      accentColor: "#f5c518",
      currency: "K",
      currencyDecimals: 2,
      taxRate: 0.1, // 10%
      taxName: "Tax",
      receiptFooter: "Thank you for your purchase!",
      setupComplete: true, // Mark setup as done so tests bypass /setup wizard
    },
    update: {
      name: "Gadget POS Store",
      currency: "K",
      currencyDecimals: 2,
      setupComplete: true, // Ensure existing installs are also marked complete
    },
  });

  console.log("✅ Business settings seeded");

  // Hide the coffee-shop fixtures inherited from the starter repository. They
  // remain recoverable in the database but no longer clutter the gadget demo.
  await prisma.product.updateMany({
    where: {
      sku: {
        in: [
          "CAFE-000",
          "CAFE-001",
          "CAFE-002",
          "CAFE-003",
          "FOOD-001",
          "FOOD-002",
          "DRINK-001",
          "DRINK-002",
        ],
      },
    },
    data: { active: false },
  });

  // ── Test users (used by E2E tests) ───────────────────────────────────────────
  await upsertUser("admin@example.com", "Admin User", "admin123456", "ADMIN");
  console.log("✅ Admin user seeded (admin@example.com / admin123456)");

  await upsertUser("cashier@example.com", "Cashier User", "cashier123456", "CASHIER");
  console.log("✅ Cashier user seeded (cashier@example.com / cashier123456)");

  // ── Gadget-shop sample catalog ───────────────────────────────────────────────
  const quantityProducts = [
    {
      name: "65W USB-C Charger",
      sku: "ACC-CHG-65W",
      price: 650,
      cost: 410,
      stock: 30,
      category: "Accessories",
    },
    {
      name: "USB-C Cable 2m",
      sku: "ACC-CBL-2M",
      price: 180,
      cost: 90,
      stock: 40,
      category: "Accessories",
    },
    {
      name: "Tempered Glass Protector",
      sku: "ACC-GLS-A55",
      price: 120,
      cost: 45,
      stock: 25,
      category: "Accessories",
    },
    {
      name: "Wireless Earbuds",
      sku: "AUD-BUDS-01",
      price: 950,
      cost: 610,
      stock: 12,
      category: "Audio",
    },
    {
      name: "20,000mAh Power Bank",
      sku: "PWR-BANK-20K",
      price: 850,
      cost: 560,
      stock: 18,
      category: "Power",
    },
    {
      name: "Bluetooth Speaker Mini",
      sku: "AUD-SPK-MINI",
      price: 780,
      cost: 490,
      stock: 14,
      category: "Audio",
    },
    {
      name: "128 GB MicroSD Card",
      sku: "STO-MSD-128",
      price: 320,
      cost: 190,
      stock: 22,
      category: "Storage",
    },
    {
      name: "Smartwatch Fit 3",
      sku: "WEAR-FIT-3",
      price: 1450,
      cost: 980,
      stock: 9,
      category: "Wearables",
    },
    {
      name: "Wireless Gaming Mouse",
      sku: "PC-MOUSE-GM1",
      price: 520,
      cost: 315,
      stock: 16,
      category: "Computer Accessories",
    },
    {
      name: "Compact Bluetooth Keyboard",
      sku: "PC-KEY-BT1",
      price: 680,
      cost: 430,
      stock: 11,
      category: "Computer Accessories",
    },
    {
      name: "Laptop Backpack 15.6 inch",
      sku: "BAG-LAP-156",
      price: 590,
      cost: 350,
      stock: 15,
      category: "Bags",
    },
    {
      name: "Universal Phone Stand",
      sku: "ACC-STAND-01",
      price: 150,
      cost: 65,
      stock: 24,
      category: "Accessories",
    },
  ];

  for (const product of quantityProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      create: { ...product },
      update: { ...product, active: true },
    });
  }

  const serializedProducts = [
    {
      name: "Samsung Galaxy A55 128 GB",
      sku: "PHONE-A55-128",
      price: 8499,
      cost: 6900,
      category: "Smartphones",
      warrantyMonths: 12,
      units: [
        { serialNumber: "A55-DEMO-001", imei: "356789012345671" },
        { serialNumber: "A55-DEMO-002", imei: "356789012345689" },
      ],
    },
    {
      name: "Apple iPhone 13 128 GB (Refurbished)",
      sku: "PHONE-IP13-128-R",
      price: 10999,
      cost: 8900,
      category: "Smartphones",
      warrantyMonths: 6,
      units: [
        { serialNumber: "IP13-REF-001", imei: "352099001234561" },
        { serialNumber: "IP13-REF-002", imei: "352099001234579" },
      ],
    },
    {
      name: "Lenovo IdeaPad Slim 3",
      sku: "LAP-LEN-SLIM3",
      price: 12500,
      cost: 10100,
      category: "Laptops",
      warrantyMonths: 12,
      units: [
        { serialNumber: "LEN-S3-DEMO-001", imei: null },
        { serialNumber: "LEN-S3-DEMO-002", imei: null },
      ],
    },
    {
      name: "HP EliteBook 840 G8 (Refurbished)",
      sku: "LAP-HP-840G8-R",
      price: 9800,
      cost: 7700,
      category: "Laptops",
      warrantyMonths: 6,
      units: [
        { serialNumber: "HP840-DEMO-001", imei: null },
        { serialNumber: "HP840-DEMO-002", imei: null },
      ],
    },
    {
      name: "Samsung Galaxy Tab A9",
      sku: "TAB-A9-64",
      price: 4900,
      cost: 3900,
      category: "Tablets",
      warrantyMonths: 12,
      units: [
        { serialNumber: "TABA9-DEMO-001", imei: "354422001234567" },
        { serialNumber: "TABA9-DEMO-002", imei: "354422001234575" },
      ],
    },
  ];

  for (const entry of serializedProducts) {
    const { units, ...productData } = entry;
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      create: { ...productData, stock: 0, trackingMode: "SERIALIZED" },
      update: { ...productData, trackingMode: "SERIALIZED", active: true },
    });

    for (const unit of units) {
      await prisma.productUnit.upsert({
        where: { serialNumber: unit.serialNumber },
        create: { ...unit, productId: product.id },
        update: {},
      });
    }

    const availableUnits = await prisma.productUnit.count({
      where: { productId: product.id, status: "AVAILABLE" },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: availableUnits },
    });
  }

  console.log(
    `✅ ${quantityProducts.length + serializedProducts.length} sample gadget products seeded`
  );

  // ── Sample customer (E2E tests use this to verify loyalty profile) ───────────
  await prisma.customer.upsert({
    where: { email: "test.customer@example.com" },
    create: {
      name: "Test Customer",
      email: "test.customer@example.com",
      phone: "+1-555-0100",
      loyaltyPoints: 50,
    },
    update: {},
  });

  console.log("✅ Sample customer seeded");
  console.log("🎉 Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
