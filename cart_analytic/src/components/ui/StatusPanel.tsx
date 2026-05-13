import { Radio } from "lucide-react";

export default function StatusPanel({
  live = true,
  statusText = "Сонсож байна…",
  uptimePct = 99.98,
}: {
  live?: boolean;
  statusText?: string;
  uptimePct?: number;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <span
          className={[
            "text-[0.625rem] font-bold uppercase tracking-wider rounded-md px-2 py-0.5",
            live ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" : "bg-slate-200 text-slate-700",
          ].join(" ")}
        >
          {live ? "ШУУД" : "УНТРААСАН"}
        </span>
        <Radio className="size-4 text-on-surface-variant" aria-hidden />
      </div>
      <div>
        <p className="text-xs font-semibold text-on-surface flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {live ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
            )}
          </span>
          {statusText}
        </p>
        <p className="mt-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-on-surface-variant">Ажилласан хугацаа</p>
        <div className="mt-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
          <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(100, uptimePct)}%` }} />
        </div>
        <p className="mt-1 text-sm font-display font-semibold text-primary tabular-nums">{uptimePct}%</p>
      </div>
    </div>
  );
}
