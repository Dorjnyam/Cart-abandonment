import type { ReactNode } from "react";

export default function FilterToolbar({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {trailing ? <div className="flex items-center gap-2 shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function FilterSelect({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className="inline-flex flex-col gap-1 text-[0.66rem] font-semibold uppercase tracking-wide text-on-surface-variant">
      {label ? <span>{label}</span> : null}
      <div className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface shadow-card">
        {children}
      </div>
    </label>
  );
}
