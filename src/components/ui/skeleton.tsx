import { cn } from "@/lib/utils";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-surface-2/80 ring-1 ring-line/40",
        className
      )}
    />
  );
}

export function ServerCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
      <Skeleton className="h-14 w-14 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 max-w-[180px]" />
        <Skeleton className="h-3 w-1/3 max-w-[100px]" />
      </div>
    </div>
  );
}

export function PanelRowSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-5">
          <Skeleton className="mb-3 h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}
