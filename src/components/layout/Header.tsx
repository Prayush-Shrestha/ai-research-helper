export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          className="font-display tracking-tight"
          style={{ fontSize: "clamp(30px,4vw,44px)", lineHeight: 1, color: "var(--color-primary-text)" }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[15px] leading-6" style={{ color: "var(--color-secondary-text)" }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
