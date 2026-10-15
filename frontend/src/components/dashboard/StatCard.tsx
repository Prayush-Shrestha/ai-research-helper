interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="glass-stat">
      <p className="tech-label" style={{ color: "var(--color-electric-blue)" }}>{label.toUpperCase()}</p>
      <p className="mt-2" style={{ fontFamily: "var(--font-sf-pro-display)", fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--color-apple-ink)" }}>{value}</p>
    </div>
  );
}
