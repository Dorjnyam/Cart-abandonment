import type { ReactNode } from "react";

export default function KanbanCard({
  riskTag,
  riskTone = "med",
  title,
  description,
  metrics,
  synthesis,
  footer,
  muted,
}: {
  riskTag?: string;
  riskTone?: "high" | "med" | "low" | "top";
  title: string;
  description?: string;
  metrics?: ReactNode;
  synthesis?: ReactNode;
  footer?: ReactNode;
  muted?: boolean;
}) {
  const riskStyles =
    riskTone === "high"
      ? "bg-red-100 text-red-900 border-red-200/70 dark:bg-red-950/60 dark:text-red-100 dark:border-red-800/70"
      : riskTone === "low"
        ? "bg-slate-100 text-slate-700 border-slate-200/70 dark:bg-slate-800 dark:text-slate-200"
        : riskTone === "top"
          ? "bg-primary text-on-primary border-primary-dim"
          : "bg-amber-50 text-amber-950 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-100";

  return (
    <article
      className={[
        "rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-card space-y-3",
        muted ? "opacity-75" : "hover:shadow-md transition-shadow",
      ].join(" ")}
    >
      {riskTag ? (
        <span className={`inline-flex text-[0.625rem] font-bold uppercase tracking-wide rounded-md border px-2 py-0.5 ${riskStyles}`}>
          {riskTag}
        </span>
      ) : null}
      <h4 className="text-sm font-bold text-on-surface leading-snug">{title}</h4>
      {description ? <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p> : null}
      {metrics ? <div className="text-xs">{metrics}</div> : null}
      {synthesis ? <div className="rounded-lg bg-insight/45 border border-sky-200/25 dark:border-sky-800/25 px-3 py-2 text-xs italic text-on-insight">{synthesis}</div> : null}
      {footer ? <div className="pt-1">{footer}</div> : null}
    </article>
  );
}
