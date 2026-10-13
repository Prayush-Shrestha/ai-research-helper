import { Button } from "./Button";

function LibraryIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: "var(--color-slate)" }}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 18.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7.5h8M8 11h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div className="gallery-card flex flex-col items-center px-6 py-14 text-center">
      <LibraryIcon />
      <h3 className="mt-4" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.009em", color: "var(--color-apple-ink)" }}>{title}</h3>
      <p className="mt-2 max-w-sm text-[17px]" style={{ color: "var(--color-graphite)", lineHeight: 1.47 }}>{description}</p>
      {actionLabel && (onAction || actionHref) && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref} className="primary-button">{actionLabel}</a>
          ) : (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong.",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="gallery-card flex flex-col items-center px-6 py-10 text-center">
      <h3 className="text-[21px] font-semibold" style={{ color: "var(--color-apple-ink)" }}>{title}</h3>
      <p className="mt-2 max-w-md text-[17px]" style={{ color: "var(--color-graphite)", lineHeight: 1.47 }}>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
