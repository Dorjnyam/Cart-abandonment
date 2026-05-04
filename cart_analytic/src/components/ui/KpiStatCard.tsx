import type { ReactNode } from "react";

export default function KpiStatCard({
  label,
  value,
  footnote,
  tag,
  tagTone = "neutral",
  icon,
  borderAccent = false,
}: {
  label: string;
  value: ReactNode;
  footnote?: ReactNode;
  tag?: ReactNode;
  tagTone?: "neutral" | "risk" | "success" | "info";
  icon?: ReactNode;
  borderAccent?: boolean;
}) {
  const tagClass =
    tagTone === "risk"
      ? "bg-error-container/85 text-error border-error/15"
      : tagTone === "success"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800/70"
        : tagTone === "info"
          ? "bg-secondary-container/80 text-on-secondary-container border-secondary/15"
          : "bg-surface-alt text-on-surface-variant border-outline-variant/15";

  return (
    <div
      className={[
        "relative rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card",
        borderAccent ? "ring-1 ring-primary/10" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-on-surface-variant leading-tight">{label}</p>
        {icon ? <div className="text-on-surface-variant/60">{icon}</div> : null}
      </div>
      {tag ? (
        <div className={`mt-2 inline-flex items-center rounded-md border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${tagClass}`}>
          {tag}
        </div>
      ) : null}
      <div className="mt-3 font-display text-[1.95rem] sm:text-[2.1rem] font-semibold text-primary tracking-tight tabular-nums">{value}</div>
      {footnote ? <div className="mt-2 text-[0.7rem] text-on-surface-variant leading-snug">{footnote}</div> : null}
    </div>
  );
}
