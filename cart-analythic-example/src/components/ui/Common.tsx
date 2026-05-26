import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const Card = ({ children, className, title, subtitle, icon: Icon, headerAction, noPadding = false }: any) => (
  <div className={cn(
    "bg-surface border border-surface-muted rounded-xl shadow-sm overflow-hidden transition-all",
    className
  )}>
    {(title || subtitle || Icon || headerAction) && (
      <div className="px-6 py-4 border-b border-surface-muted flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            {title && <h3 className="font-display font-bold text-lg leading-none truncate">{title}</h3>}
            {subtitle && <p className="text-sm text-muted mt-1 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {headerAction}
          {Icon && <Icon className="w-5 h-5 text-muted opacity-50" />}
        </div>
      </div>
    )}
    <div className={cn(!noPadding && "p-6")}>{children}</div>
  </div>
);

export const KpiCard = ({ title, value, trend, trendValue, icon: Icon, color }: any) => (
  <Card className="hover:shadow-md hover:border-primary transition-all group">
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-semibold text-muted tracking-tight">{title}</span>
      <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
        <Icon className={cn("w-5 h-5", color.replace('bg-', 'text-').replace('-light', '').replace('-dark', ''))} />
      </div>
    </div>
    <div className="text-2xl font-display font-extrabold tracking-tight mt-1">{value}</div>
    {trend && (
      <div className={cn(
        "flex items-center gap-1 mt-2 text-xs font-bold",
        trend === 'up' ? "text-primary" : "text-error"
      )}>
        <span className="px-1.5 py-0.5 rounded bg-opacity-10 bg-current">
          {trend === 'up' ? '+' : '-'}{trendValue}
        </span>
        <span className="text-muted font-medium">vs last month</span>
      </div>
    )}
  </Card>
);

export const Badge = ({ children, variant = 'default', className }: any) => {
  const variants = {
    default: "bg-surface-muted text-muted",
    primary: "bg-primary bg-opacity-10 text-primary",
    success: "bg-success bg-opacity-10 text-success",
    warning: "bg-warning bg-opacity-10 text-warning",
    error: "bg-error bg-opacity-10 text-error",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", variants[variant as keyof typeof variants], className)}>
      {children}
    </span>
  );
};
