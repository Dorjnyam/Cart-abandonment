"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Plug,
  Settings,
  Shield,
  Stethoscope,
  UserCircle,
  LifeBuoy,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { SIDEBAR_WIDTH_CLASS } from "./layoutConstants";

export type NavKey =
  | "dashboard"
  | "sessions"
  | "analytics"
  | "ablation"
  | "diagnosis"
  | "recommendations"
  | "settings"
  | "setup"
  | "admin"
  | "overview"
  | "diagnostics"
  | "tenants"
  | "installation";

type NavItem = { key: NavKey; label: string; href: string; Icon: LucideIcon };

const mainNavItems: NavItem[] = [
  { key: "dashboard",       label: "Тойм",           href: "/dashboard",              Icon: LayoutDashboard },
  { key: "sessions",        label: "Сессүүд",         href: "/sessions",               Icon: Activity },
  { key: "analytics",       label: "Аналитик",        href: "/analytics",              Icon: BarChart3 },
  { key: "ablation",        label: "Ablation Study",  href: "/analytics?tab=ablation", Icon: FlaskConical },
  { key: "diagnosis",       label: "Оношлогоо",       href: "/diagnosis",              Icon: Stethoscope },
  { key: "recommendations", label: "Зөвлөмж",         href: "/recommendations",        Icon: Lightbulb },
];

const systemNavItems: NavItem[] = [
  { key: "settings", label: "Тохиргоо", href: "/settings", Icon: Settings },
  { key: "setup",    label: "Суулгалт", href: "/setup",    Icon: Plug },
];

function NavItem({
  active,
  label,
  href,
  Icon,
}: {
  active: boolean;
  label: string;
  href: string;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative flex items-center gap-3 rounded-lg py-2 px-3 text-[0.8125rem] transition-colors duration-150",
        active
          ? "bg-white/10 text-white font-medium"
          : "text-white/60 hover:text-white/90 hover:bg-white/5",
      ].join(" ")}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#2563eb]"
        />
      )}
      <Icon
        className={`size-4 shrink-0 ${active ? "text-[#3b82f6]" : "text-white/40"}`}
        strokeWidth={active ? 2 : 1.75}
        aria-hidden
      />
      <span className="whitespace-nowrap truncate">{label}</span>
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-5 pb-1 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-white/25">
      {label}
    </p>
  );
}

export default function Sidebar({ active }: { active: NavKey }): ReactNode {
  const { role, storeName, userName, signOut } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 ${SIDEBAR_WIDTH_CLASS} z-50 flex flex-col`}
      style={{ background: "#050c1a", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.07]">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden
            className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-white text-[10px] font-bold"
            style={{ background: "#2563eb" }}
          >
            CA
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white leading-tight"
              style={{ fontFamily: "var(--font-display, Newsreader), serif" }}>
              CartAnalytics
            </div>
            {storeName && (
              <div className="text-[10px] text-white/40 truncate mt-0.5">{storeName}</div>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 no-scrollbar">
        {role === "admin" && (
          <>
            <SectionLabel label="Админ" />
            <NavItem
              active={active === "admin"}
              label="Tenant удирдлага"
              href="/admin"
              Icon={Shield}
            />
          </>
        )}

        <SectionLabel label="Үндсэн" />
        {mainNavItems
          .filter((item) => item.key !== "ablation" || role === "admin" || role === "owner")
          .map((item) => (
            <NavItem
              key={item.key}
              active={item.key === active}
              label={item.label}
              href={item.href}
              Icon={item.Icon}
            />
          ))}

        <SectionLabel label="Систем" />
        {systemNavItems.map((item) => (
          <NavItem
            key={item.key}
            active={item.key === active}
            label={item.label}
            href={item.href}
            Icon={item.Icon}
          />
        ))}
      </nav>

      {/* Profile & logout */}
      <div className="p-3 border-t border-white/[0.07] space-y-0.5">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-lg py-2 px-3 text-white/60 hover:text-white hover:bg-white/5 text-[0.8125rem] transition-colors"
        >
          <UserCircle className="size-4 shrink-0 text-white/35" aria-hidden />
          <span className="truncate" suppressHydrationWarning>{userName || "Профайл"}</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-lg py-2 px-3 text-white/60 hover:text-white hover:bg-white/5 text-[0.8125rem] transition-colors"
        >
          <LifeBuoy className="size-4 shrink-0 text-white/35" aria-hidden />
          Дэмжлэг
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-lg py-2 px-3 text-white/50 hover:text-white hover:bg-white/5 text-[0.8125rem] transition-colors"
        >
          <LogOut className="size-4 shrink-0 text-white/30" aria-hidden />
          Гарах
        </button>
      </div>
    </aside>
  );
}
