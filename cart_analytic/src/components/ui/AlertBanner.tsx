import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export default function AlertBanner({
  title,
  children,
  action,
  variant = "critical",
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  variant?: "critical" | "warning";
}) {
  const isCritical = variant === "critical";
  return (
    <div
      className={[
        "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl px-5 py-4 text-sm",
        isCritical
          ? "bg-[#991B1B] text-white shadow-card"
          : "bg-amber-50 text-amber-950 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-800/50",
      ].join(" ")}
      role="alert"
    >
      <AlertTriangle className={`size-5 shrink-0 ${isCritical ? "text-white" : "text-amber-600"}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${isCritical ? "" : "text-amber-900 dark:text-amber-100"}`}>{title}</p>
        {children ? <p className={`mt-1 text-[0.8125rem] leading-relaxed ${isCritical ? "text-white/90" : "text-amber-900/90"}`}>{children}</p> : null}
      </div>
      {action ? <div className="shrink-0 sm:ml-auto">{action}</div> : null}
    </div>
  );
}
