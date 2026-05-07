"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Command, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import ThemeToggle from "./ThemeToggle";
import { HEADER_LEFT_CLASS } from "./layoutConstants";
import { fetchPipelineMonitor, type ServiceHealth } from "@/lib/services/pipeline";

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 min-w-0 text-[12px]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronRight className="size-3 shrink-0 text-on-surface-variant/40" aria-hidden />}
          {item.href ? (
            <Link
              href={item.href}
              className="text-on-surface-variant hover:text-on-surface truncate transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface font-medium truncate">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function StatusIndicator({ health }: { health: ServiceHealth }) {
  const map: Record<ServiceHealth, { dot: string; label: string; tone: string }> = {
    healthy:  { dot: "#1F4D3E", label: "All systems operational", tone: "text-on-surface-variant" },
    degraded: { dot: "#9C6B14", label: "Partial degradation",     tone: "text-[#7C5410]" },
    down:     { dot: "#A03521", label: "Outage detected",         tone: "text-error" },
    unknown:  { dot: "#A8A29E", label: "Status unknown",          tone: "text-on-surface-variant" },
  };
  const { dot, label, tone } = map[health];
  return (
    <span
      className={`hidden md:inline-flex items-center gap-2 rounded-md hairline bg-surface-container-lowest px-2.5 py-1 text-[11px] font-medium ${tone}`}
      title={label}
    >
      <span aria-hidden className="relative flex size-1.5">
        {health === "healthy" ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40" style={{ background: dot }} />
        ) : null}
        <span className="relative inline-flex size-1.5 rounded-full" style={{ background: dot }} />
      </span>
      {label}
    </span>
  );
}

function CompanyChip() {
  const { storeName, role } = useAuth();
  const planByRole: Record<string, string> = {
    admin: "Internal admin",
    owner: "Owner workspace",
    member: "Member access",
    developer: "Developer access",
  };
  return (
    <Link
      href="/settings?tab=profile"
      className="hidden md:inline-flex items-center gap-2 rounded-md hairline pl-1 pr-3 py-1 text-[12px] text-on-surface bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
      title="Open company profile"
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[10.5px] font-semibold text-white"
        style={{ background: "rgb(var(--primary-rgb))" }}
      >
        {(storeName || "C").trim().slice(0, 1).toUpperCase()}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-semibold tracking-[-0.005em]">{storeName || "No company"}</span>
        <span className="text-[9.5px] uppercase tracking-[0.18em] text-on-surface-variant/80">
          {planByRole[role] ?? role}
        </span>
      </span>
    </Link>
  );
}

function MockDataBadge() {
  if (process.env.NEXT_PUBLIC_MOCK_FALLBACK !== "true") return null;
  return (
    <span className="inline-flex items-center rounded-md border border-error/30 bg-error/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-error">
      Mock data
    </span>
  );
}

export default function TopAppBar({
  breadcrumbs,
  right,
}: {
  breadcrumbs: { label: string; href?: string }[];
  right?: ReactNode;
}) {
  const pathname = usePathname();
  const { role, userName } = useAuth();
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
  }, [pathname]);

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    owner: "Owner",
    member: "Member",
    developer: "Developer",
  };

  const initials = userName
    .split(/[\s_]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header
      className={`fixed top-0 ${HEADER_LEFT_CLASS} right-0 z-40 h-13 px-4 sm:px-5 flex items-center justify-between gap-4 hairline-b bg-canvas/95 backdrop-blur-md`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <CompanyChip />
        <span aria-hidden className="hidden md:inline-block h-3.5 w-px bg-[rgb(28_25_23/0.12)]" />
        <div className="min-w-0 hidden sm:block">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <MockDataBadge />
        <StatusIndicator health={systemHealth} />

        <div className="hidden lg:flex relative items-center">
          <Search className="absolute left-2.5 size-3.5 text-on-surface-variant/55 pointer-events-none" aria-hidden />
          <input
            type="search"
            placeholder="Search session, key, event…"
            aria-label="Search"
            className="w-56 xl:w-72 h-8 rounded-md hairline bg-surface-container-lowest pl-8 pr-12 text-[12px] text-on-surface placeholder:text-on-surface-variant/45 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition"
          />
          <kbd
            aria-hidden
            className="absolute right-2 hidden xl:inline-flex items-center gap-0.5 rounded-[3px] hairline bg-surface-container-low px-1 py-0.5 text-[9.5px] font-mono text-on-surface-variant/70"
          >
            <Command className="size-2.5" aria-hidden /> K
          </kbd>
        </div>

        <button
          type="button"
          className="relative flex items-center justify-center w-8 h-8 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-[rgb(28_25_23/0.04)] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-[15px]" strokeWidth={1.7} />
        </button>

        <ThemeToggle />

        <div
          className="hidden sm:flex flex-col items-end leading-tight gap-0.5 px-2.5 ml-1 hairline-l"
          suppressHydrationWarning
        >
          <span className="text-[11px] font-semibold text-on-surface">{roleLabel[role] ?? role}</span>
          <span className="text-[10px] text-on-surface-variant max-w-30 truncate">{userName}</span>
        </div>
        <div
          className="size-8 rounded-md flex items-center justify-center text-[11px] font-semibold text-white"
          style={{ background: "rgb(var(--primary-rgb))" }}
          title={userName}
          suppressHydrationWarning
        >
          {initials || "U"}
        </div>

        {right && (
          <div className="hidden xl:flex items-center gap-2 pl-2 hairline-l">
            {right}
          </div>
        )}
      </div>
    </header>
  );
}
