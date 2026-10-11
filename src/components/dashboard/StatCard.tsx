interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 transition-shadow hover:shadow-sm">
      <p className="text-[13px] font-medium text-[#64748B]">{label}</p>
      <p className="mt-2 text-[26px] font-semibold tracking-tight text-[#0F172A]">{value}</p>
    </div>
  );
}
