import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function LibraryIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden style={{ color: "var(--color-tertiary-text)" }}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 18.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7.5h8M8 11h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center px-6 py-14 text-center"
      style={{ borderRadius: "var(--radius-panel)", border: "1px dashed var(--color-hairline)", background: "var(--color-deep-black)" }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center"
        style={{ borderRadius: 14, background: "var(--color-graphite)", border: "1px solid var(--color-hairline)" }}
      >
        <LibraryIcon />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold" style={{ color: "var(--color-primary-text)" }}>{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6" style={{ color: "var(--color-secondary-text)" }}>{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong.",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center px-6 py-10 text-center"
      style={{ borderRadius: "var(--radius-panel)", border: "1px solid #4A2E2E", background: "rgba(255,157,157,0.04)" }}
    >
      <h3 className="text-[15px] font-semibold" style={{ color: "#ff9d9d" }}>{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6" style={{ color: "var(--color-secondary-text)" }}>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
