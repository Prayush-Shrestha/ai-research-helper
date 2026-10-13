interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      className="lift p-5"
      style={{ borderRadius: "var(--radius-panel)", border: "1px solid var(--color-hairline)", background: "var(--color-deep-black)" }}
    >
      <p className="micro-label" style={{ color: "var(--color-graphite)" }}>{label.toUpperCase()}</p>
      <p className="font-display mt-2" style={{ fontSize: 34, lineHeight: 1, color: "var(--color-frost)" }}>{value}</p>
    </div>
  );
}
