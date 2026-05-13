"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export function Card({
  children,
  className,
  title,
  subtitle,
  icon: Icon,
  headerAction,
  noPadding = false,
}: {
  children?: ReactNode;
  className?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: IconType;
  headerAction?: ReactNode;
  noPadding?: boolean;
}) {
  const hasHeader = title || subtitle || Icon || headerAction;
  return (
    <div
      className={cn(
        "bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden transition-all",
        className,
      )}
    >
      {hasHeader ? (
        <div className="px-6 py-4 border-b border-surface-muted flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              {title ? (
                <h3 className="font-display font-bold text-lg leading-tight truncate text-text">
                  {title}
                </h3>
              ) : null}
              {subtitle ? (
                <p className="text-sm text-muted mt-1 truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {headerAction}
            {Icon ? <Icon className="w-5 h-5 text-muted opacity-50" /> : null}
          </div>
        </div>
      ) : null}
      <div className={cn(!noPadding && "p-6")}>{children}</div>
    </div>
  );
}

export function KpiCard({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  color = "bg-primary",
  trendNote,
}: {
  title: ReactNode;
  value: ReactNode;
  trend?: "up" | "down";
  trendValue?: ReactNode;
  icon?: IconType;
  color?: string;
  trendNote?: ReactNode;
}) {
  const iconColorClass = color.startsWith("bg-")
    ? color.replace("bg-", "text-")
    : "text-primary";
  return (
    <Card className="hover:shadow-md hover:border-primary/40 transition-all group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-semibold text-muted tracking-tight">{title}</span>
        {Icon ? (
          <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
            <Icon className={cn("w-5 h-5", iconColorClass)} />
          </div>
        ) : null}
      </div>
      <div className="text-2xl font-display font-extrabold tracking-tight mt-1 text-text">
        {value}
      </div>
      {trend ? (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-xs font-bold",
            trend === "up" ? "text-primary" : "text-error",
          )}
        >
          <span className="px-1.5 py-0.5 rounded bg-opacity-10 bg-current">
            {trend === "up" ? "+" : "-"}
            {trendValue}
          </span>
          {trendNote ? <span className="text-muted font-medium">{trendNote}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "error";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-surface-muted text-muted",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Section({
  title,
  subtitle,
  right,
  children,
  className,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || subtitle || right) && (
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            {title ? (
              <h2 className="font-display font-extrabold text-xl tracking-tight text-text">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="text-sm text-muted mt-1">{subtitle}</p> : null}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
