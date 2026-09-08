import { AlertTriangle } from "lucide-react";

interface DbErrorProps {
  page?: string;
}

export function DbError({ page }: DbErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div>
        <h2 className="text-xl font-semibold">Database unavailable</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {page
            ? `Could not load ${page}.`
            : "Could not connect to the database."}{" "}
          Please check your database connection and try again.
        </p>
      </div>
      <a
        href="."
        className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground"
      >
        Retry
      </a>
    </div>
  );
}
