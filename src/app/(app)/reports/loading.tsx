import { StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
      <StatCardsSkeleton count={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4 h-64 animate-pulse bg-muted/30" />
        <div className="rounded-lg border p-4 h-64 animate-pulse bg-muted/30" />
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
