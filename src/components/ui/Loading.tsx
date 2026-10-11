import { cx } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#4F46E5]",
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("animate-pulse rounded-md bg-[#E2E8F0]", className)} />;
}

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-10">
      <Spinner />
      <span className="text-sm text-[#64748B]">{label}</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] bg-white p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-[#F1F5F9] px-5 py-4 last:border-0">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-6 w-16 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div aria-hidden className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-3 h-3 w-1/2" />
        <Skeleton className="mt-6 h-9 w-full" />
      </div>
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-8">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
