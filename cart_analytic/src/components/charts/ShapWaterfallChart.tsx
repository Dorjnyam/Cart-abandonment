"use client";

import type { SHAPValues } from "@/types/api";

function contributionTone(value: number) {
  if (value > 0) return "bg-error";
  return "bg-primary/80";
}

export default function ShapWaterfallChart({ data }: { data: SHAPValues | null | undefined }) {
  if (!data || !data.values || data.values.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant rounded-lg bg-surface-container-low/50">SHAP өгөгдөл алга.</div>;
  }

  const max = Math.max(...data.values.map((item) => Math.abs(item.contribution)), 0.01);

  return (
    <div className="space-y-3">
      <div className="text-sm text-on-surface-variant">
        Суурь: <span className="font-semibold text-on-surface tabular-nums">{data.baseValue.toFixed(2)}</span> → Таамаглал:{" "}
        <span className="font-semibold text-on-surface tabular-nums">{data.prediction.toFixed(2)}</span>
      </div>
      {data.values.map((item) => (
        <div key={item.feature} className="grid grid-cols-[minmax(0,1fr)_minmax(120px,1fr)_4rem] items-center gap-3">
          <span className="font-mono text-[0.6875rem] text-on-surface truncate" title={item.feature}>
            {item.feature}
          </span>
          <div className="h-6 rounded-md bg-surface-container-high relative overflow-hidden">
            <div
              className={`h-full rounded-md ${contributionTone(item.contribution)}`}
              style={{ width: `${(Math.abs(item.contribution) / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-on-surface text-right tabular-nums">{item.contribution.toFixed(3)}</span>
        </div>
      ))}
      <p className="text-[0.625rem] text-on-surface-variant leading-relaxed pt-1">
        * Эерэг утга эрсдэл нэмэгдүүлж, сөрөг утга бууруулна.
      </p>
    </div>
  );
}
