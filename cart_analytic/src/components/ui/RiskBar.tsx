export default function RiskBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const high = value >= max * 0.65;
  return (
    <div className="flex items-center gap-2 min-w-[88px]">
      <div className="h-1.5 flex-1 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${high ? "bg-error" : "bg-on-surface-variant/35"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums shrink-0 ${high ? "text-error" : "text-on-surface-variant"}`}>{value}</span>
    </div>
  );
}
