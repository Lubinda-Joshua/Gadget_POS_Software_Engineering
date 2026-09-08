import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export const maxDuration = 60; // 60s timeout

export async function POST(): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 400 });
  }

  // Guard: if already fully set up, refuse
  try {
    const { prisma } = await import("@/lib/db");
    const settings = await prisma.businessSettings.findUnique({
      where: { id: "singleton" },
      select: { setupComplete: true },
    });
    if (settings?.setupComplete) {
      return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
    }
  } catch {
    // DB not init yet — proceed
  }

  const cwd = process.cwd();
  const prismaBin = path.join(cwd, "node_modules", ".bin", "prisma");

  try {
    // Use migrate deploy in production, db push in development
    const isDev = process.env.NODE_ENV !== "production";
    const command = isDev
      ? `"${prismaBin}" db push`
      : `"${prismaBin}" migrate deploy`;

    const output = execSync(command, {
      cwd,
      timeout: 55_000,
      env: { ...process.env },
      encoding: "utf-8",
    });

    return NextResponse.json({ ok: true, output });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration failed";
    // execSync throws with .stdout/.stderr on non-zero exit
    const stderr =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err as any)?.stderr?.toString() ?? (err as any)?.stdout?.toString() ?? message;
    return NextResponse.json({ ok: false, error: stderr }, { status: 500 });
  }
}
