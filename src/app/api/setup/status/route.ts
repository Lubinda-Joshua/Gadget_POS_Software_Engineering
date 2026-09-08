import { NextResponse } from "next/server";
import { Client } from "pg";

interface SetupStatus {
  envOk: boolean;
  dbConnected: boolean;
  dbInitialized: boolean;
  hasAdmin: boolean;
  setupComplete: boolean;
  missingEnv: string[];
  dbError?: string;  // human-readable DB error surfaced to wizard UI
}

// Use a raw pg Client (not Prisma) so we never trigger prisma:error log spam
// during setup probing — Prisma logs at "error" level even for expected failures.
async function probeDb(url: string): Promise<{
  connected: boolean;
  initialized: boolean;
  hasAdmin: boolean;
  setupComplete: boolean;
  error?: string;
}> {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();

    // Check if the BusinessSettings table exists (schema init check)
    const tableCheck = await client.query(
      `SELECT to_regclass('public."BusinessSettings"') AS tbl`
    );
    const initialized = tableCheck.rows[0]?.tbl !== null;

    if (!initialized) {
      return { connected: true, initialized: false, hasAdmin: false, setupComplete: false };
    }

    const [settingsRes, adminRes] = await Promise.all([
      client.query(`SELECT "setupComplete" FROM "BusinessSettings" WHERE id = 'singleton' LIMIT 1`),
      client.query(`SELECT COUNT(*) AS cnt FROM "User" WHERE role = 'ADMIN'`),
    ]);

    const setupComplete = settingsRes.rows[0]?.setupComplete === true;
    const hasAdmin = parseInt(String(adminRes.rows[0]?.cnt ?? "0"), 10) > 0;

    return { connected: true, initialized: true, hasAdmin, setupComplete };
  } catch (err) {
    const pg = err as { code?: string; message?: string };
    let friendly = pg.message ?? "Unknown database error";
    // Map common PG error codes to helpful messages
    if (pg.code === "28P01") friendly = `Authentication failed — wrong password in DATABASE_URL (code 28P01)`;
    else if (pg.code === "28000") friendly = `Authentication failed — unknown user or role (code 28000)`;
    else if (pg.code === "3D000") friendly = `Database does not exist — create it first or check DATABASE_URL (code 3D000)`;
    else if (pg.code === "ECONNREFUSED") friendly = `Connection refused — is PostgreSQL running? (ECONNREFUSED)`;
    else if (pg.code === "ETIMEDOUT") friendly = `Connection timed out — check host/port in DATABASE_URL (ETIMEDOUT)`;
    return { connected: false, initialized: false, hasAdmin: false, setupComplete: false, error: friendly };
  } finally {
    await client.end().catch(() => {});
  }
}

export async function GET(): Promise<NextResponse<SetupStatus>> {
  const missingEnv: string[] = [];
  if (!process.env.DATABASE_URL) missingEnv.push("DATABASE_URL");
  if (!process.env.BETTER_AUTH_SECRET) missingEnv.push("BETTER_AUTH_SECRET");

  const envOk = missingEnv.length === 0;
  if (!envOk) {
    return NextResponse.json({
      envOk: false,
      dbConnected: false,
      dbInitialized: false,
      hasAdmin: false,
      setupComplete: false,
      missingEnv,
    });
  }

  const probe = await probeDb(process.env.DATABASE_URL!);

  const response = NextResponse.json({
    envOk: true,
    dbConnected: probe.connected,
    dbInitialized: probe.initialized,
    hasAdmin: probe.hasAdmin,
    setupComplete: probe.setupComplete,
    missingEnv: [],
    ...(probe.error ? { dbError: probe.error } : {}),
  });

  if (probe.setupComplete) {
    response.cookies.set("gadget-pos-setup-complete", "1", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 31536000,
      path: "/",
    });
  }

  return response;
}
