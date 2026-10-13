import { cx } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx("inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-electric-blue)]", className)}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx("shimmer", className)} />;
}

export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 py-10">
      <Spinner />
      <span className="tech-label pulse-dot" style={{ color: "var(--color-graphite)" }}>{label}</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      <Skeleton className="h-12 w-2/3" />
      <div className="gallery-card space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-5" style={{ borderBottom: "1px solid var(--color-line)" }}>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-2 h-3 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="gallery-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-4" style={{ borderBottom: "1px solid var(--color-line)" }}>
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
      <div className="gallery-card">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-3 h-3 w-1/2" />
        <Skeleton className="mt-6 h-9 w-full" />
      </div>
      <div className="gallery-card">
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
