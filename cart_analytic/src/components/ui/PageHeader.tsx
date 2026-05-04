import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  badges,
  actions,
}: {
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <h1 className="font-display text-[2rem] sm:text-[2.35rem] font-semibold text-primary tracking-tight text-balance leading-[1.05]">{title}</h1>
        {subtitle ? <p className="text-sm sm:text-[0.95rem] text-on-surface-variant max-w-2xl leading-relaxed">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {badges}
        {actions}
      </div>
    </div>
  );
}
