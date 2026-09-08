import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getTranslations } from "@/lib/translations";
import { auth } from "@/lib/auth";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  noStore();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/pos");
  }

  const t = await getTranslations("reports");

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <ReportsDashboard />
    </div>
  );
}
