import type { ReactNode } from "react";

export default function KanbanColumn({
  title,
  count,
  dotClass,
  children,
}: {
  title: string;
  count: number;
  dotClass: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-[280px] max-w-sm flex-1 flex-col rounded-xl border border-outline-variant/10 bg-surface-alt/70 dark:bg-surface-alt/70 shadow-card">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className={`size-2 rounded-full ${dotClass}`} aria-hidden />
        <h3 className="text-sm font-bold text-on-surface tracking-tight">{title}</h3>
        <span className="ml-auto text-xs font-bold tabular-nums text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-3 min-h-[200px]">{children}</div>
    </div>
  );
}
