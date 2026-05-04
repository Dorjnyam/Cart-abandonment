"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import ThemeToggle from "./ThemeToggle";
import { HEADER_LEFT_CLASS } from "./layoutConstants";

type AppSegment = "admin" | "main" | "system";

function detectSegment(pathname: string | null): AppSegment {
  if (!pathname) return "main";
  if (pathname.startsWith("/admin") || pathname.startsWith("/tenants")) return "admin";
  if (
    pathname.startsWith("/settings") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/installation")
  ) return "system";
  return "main";
}

function SegmentTabs({ active }: { active: AppSegment }) {
  const tabs: { id: AppSegment; label: string; href: string }[] = [
    { id: "admin",  label: "Админ",  href: "/admin" },
    { id: "main",   label: "Үндсэн", href: "/dashboard" },
    { id: "system", label: "Систем", href: "/settings" },
  ];

  return (
    <nav
      className="hidden md:flex items-center gap-0.5 rounded-lg bg-surface-container-high/60 p-0.5 border border-outline-variant/[0.08]"
      aria-label="Хэсэг"
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={[
            "px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap",
            active === t.id
              ? "bg-surface-container-lowest text-on-surface shadow-sm border border-outline-variant/[0.08]"
              : "text-on-surface-variant hover:text-on-surface",
          ].join(" ")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0 text-[13px]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight className="size-3 shrink-0 text-on-surface-variant/50" aria-hidden />}
          {item.href ? (
            <Link href={item.href} className="text-on-surface-variant hover:text-on-surface truncate transition-colors">
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

export default function TopAppBar({
  breadcrumbs,
  right,
}: {
  breadcrumbs: { label: string; href?: string }[];
  right?: ReactNode;
}) {
  const pathname = usePathname();
  const segment = detectSegment(pathname);
  const { role, userName, storeName } = useAuth();

  const roleLabel: Record<string, string> = {
    admin: "Админ",
    owner: "Эзэмшигч",
    member: "Гишүүн",
    developer: "Хөгжүүлэгч",
  };

  const initials = userName
    .split(/[\s_]/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header
      className={`fixed top-0 ${HEADER_LEFT_CLASS} right-0 z-40 h-13 px-4 sm:px-5 flex items-center justify-between gap-4 border-b border-outline-variant/[0.08] bg-surface/95 backdrop-blur-sm`}
    >
      {/* Left: breadcrumbs + segment tabs */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="min-w-0 hidden sm:block">
          <Breadcrumbs items={breadcrumbs} />
        </div>
        <SegmentTabs active={segment} />
      </div>

      {/* Right: search, bell, theme, user */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Search */}
        <div className="hidden lg:flex relative items-center mr-1">
          <Search className="absolute left-2.5 size-3.5 text-on-surface-variant/60 pointer-events-none" aria-hidden />
          <input
            type="search"
            placeholder="Хайлт…"
            aria-label="Хайлт"
            className="w-44 xl:w-56 h-8 rounded-lg border border-outline-variant/[0.1] bg-surface-container-high/60 pl-8 pr-3 text-[12px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition"
            readOnly
          />
        </div>

        {/* Bell */}
        <button
          type="button"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          aria-label="Мэдэгдэл"
        >
          <Bell className="size-4" strokeWidth={1.75} />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User info + avatar */}
        <div className="hidden sm:flex flex-col items-end leading-tight gap-0.5 px-2 border-l border-outline-variant/[0.1] ml-1" suppressHydrationWarning>
          <span className="text-[11px] font-semibold text-on-surface">{roleLabel[role] ?? role}</span>
          <span className="text-[10px] text-on-surface-variant max-w-27.5 truncate">{storeName || "Идэвхтэй"}</span>
        </div>
        <div
          className="size-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white ml-0.5"
          style={{ background: "#2563eb" }}
          title={userName}
          suppressHydrationWarning
        >
          {initials || "U"}
        </div>

        {right && (
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-outline-variant/[0.1]">
            {right}
          </div>
        )}
      </div>
    </header>
  );
}
