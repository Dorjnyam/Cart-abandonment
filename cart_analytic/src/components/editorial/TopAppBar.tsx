"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Bell, ChevronRight, Languages, Menu, Search } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import ThemeToggle from "./ThemeToggle";
import { fetchPipelineMonitor, type ServiceHealth } from "@/lib/services/pipeline";
import { healthLabel, roleLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden md:flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-widest italic min-w-0"
    >
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-2 min-w-0">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" aria-hidden />}
          {item.href ? (
            <Link href={item.href} className="hover:text-text transition-colors truncate">
              {item.label}
            </Link>
          ) : (
            <span className="text-text not-italic truncate">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function StatusDot({ health }: { health: ServiceHealth }) {
  const tone: Record<ServiceHealth, string> = {
    healthy: "bg-success",
    degraded: "bg-warning",
    down: "bg-error",
    unknown: "bg-muted/50",
  };
  return (
    <span
      title={healthLabel(health)}
      className="hidden lg:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-muted text-[11px] font-bold text-muted"
    >
      <span className={cn("relative inline-flex w-1.5 h-1.5 rounded-full", tone[health])}>
        {health === "healthy" ? (
          <span className="absolute inset-0 rounded-full bg-success opacity-50 animate-ping" />
        ) : null}
      </span>
      {healthLabel(health)}
    </span>
  );
}

function MockBadge() {
  if (process.env.NEXT_PUBLIC_MOCK_FALLBACK !== "true") return null;
  return (
    <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error">
      Туршилт
    </span>
  );
}

export default function TopAppBar({
  breadcrumbs,
  right,
  onMobileMenu,
}: {
  breadcrumbs: { label: string; href?: string }[];
  right?: ReactNode;
  onMobileMenu?: () => void;
}) {
  const { role, userName } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [systemHealth, setSystemHealth] = useState<ServiceHealth>("healthy");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchPipelineMonitor();
        if (cancelled) return;
        const all = [...data.services, ...data.infra];
        if (all.some((s) => s.health === "down")) setSystemHealth("down");
        else if (all.some((s) => s.health === "degraded")) setSystemHealth("degraded");
        else setSystemHealth("healthy");
      } catch {
        if (!cancelled) setSystemHealth("unknown");
      }
    }
    void load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const initials = (userName || "U")
    .split(/[\s_]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <header className="h-16 border-b border-surface-muted flex items-center justify-between px-4 md:px-8 shrink-0 z-30 bg-surface">
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={onMobileMenu}
          className="md:hidden p-2 text-muted hover:text-text"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <MockBadge />
        <StatusDot health={systemHealth} />

        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="search"
            placeholder={t.common.search}
            className="pl-10 pr-4 py-2 rounded-xl text-sm w-56 xl:w-64 border border-surface-muted bg-bg text-text placeholder:text-muted outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
          />
        </div>

        <button
          type="button"
          onClick={toggleLang}
          aria-label="Toggle language"
          className="px-2 py-1.5 rounded-xl hover:bg-surface-muted transition-colors text-xs font-extrabold flex items-center gap-1.5 text-text"
        >
          <Languages className="w-4 h-4 text-primary" />
          <span className="w-5 inline-block">{lang}</span>
        </button>

        <ThemeToggle />

        <button
          type="button"
          className="hidden sm:flex p-2 rounded-xl hover:bg-surface-muted transition-colors relative text-text"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-error rounded-full" />
        </button>

        <Link
          href="/profile"
          className="flex items-center gap-3 pl-2 cursor-pointer group"
          suppressHydrationWarning
        >
          <div className="hidden sm:block text-right">
            <p className="text-xs font-extrabold leading-none truncate max-w-[140px] text-text">
              {userName || "—"}
            </p>
            <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-widest italic opacity-70">
              {roleLabel(role)}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:scale-105 transition-all"
            title={userName}
          >
            {initials}
          </div>
        </Link>

        {right && (
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-surface-muted">
            {right}
          </div>
        )}
      </div>
    </header>
  );
}
