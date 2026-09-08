import { TableSkeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}
