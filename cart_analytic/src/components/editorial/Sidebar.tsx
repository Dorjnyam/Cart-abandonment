"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  BrainCircuit,
  LayoutDashboard,
  LifeBuoy,
  Lightbulb,
  LogOut,
  Plug,
  Radio,
  Settings,
  Shield,
  Stethoscope,
  UserCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { SIDEBAR_WIDTH_CLASS } from "./layoutConstants";

export type NavKey =
  | "dashboard"
  | "pipeline"
  | "sessions"
  | "ml-insights"
  | "ablation"
  | "diagnosis"
  | "recommendations"
  | "settings"
  | "setup"
  | "admin"
  | "overview"
  | "diagnostics"
  | "tenants"
  | "installation"
  | "analytics";

type NavItemType = { key: NavKey; label: string; href: string; Icon: LucideIcon };

const productNavItems: NavItemType[] = [
  { key: "dashboard", label: "Overview", href: "/dashboard", Icon: LayoutDashboard },
  { key: "ml-insights", label: "Analytics", href: "/ml-insights", Icon: BrainCircuit },
  { key: "sessions", label: "Sessions", href: "/sessions", Icon: Activity },
  { key: "diagnosis", label: "Diagnosis", href: "/diagnosis", Icon: Stethoscope },
  { key: "recommendations", label: "Recommendations", href: "/recommendations", Icon: Lightbulb },
];

const operationsNavItems: NavItemType[] = [
  { key: "pipeline", label: "Live Pipeline", href: "/pipeline", Icon: Radio },
];

const systemNavItems: NavItemType[] = [
  { key: "installation", label: "Installation", href: "/installation", Icon: Plug },
  { key: "settings", label: "Settings", href: "/settings", Icon: Settings },
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
        "group relative flex items-center gap-2.5 rounded-md py-1.5 pl-3 pr-2.5",
        "text-[12.5px] transition-colors duration-150",
        active
          ? "bg-[rgb(28_25_23/0.06)] text-on-surface font-medium"
          : "text-on-surface-variant hover:bg-[rgb(28_25_23/0.04)] hover:text-on-surface",
      ].join(" ")}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full"
          style={{ background: "rgb(var(--primary-rgb))" }}
        />
      ) : null}
      <Icon
        className={`size-[15px] shrink-0 ${active ? "text-primary" : "text-on-surface-variant/70 group-hover:text-on-surface-variant"}`}
        strokeWidth={1.6}
        aria-hidden
      />
      <span className="truncate whitespace-nowrap tracking-[-0.005em]">{label}</span>
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
      {label}
    </p>
  );
}

export default function Sidebar({ active }: { active: NavKey }): ReactNode {
  const { role, storeName, userName, signOut } = useAuth();

  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 ${SIDEBAR_WIDTH_CLASS} z-50 flex flex-col`}
      style={{
        background: "rgb(var(--sidebar-bg-rgb))",
        borderRight: "1px solid rgb(28 25 23 / 0.08)",
      }}
    >
      {/* Wordmark ба workspace */}
      <div className="px-4 pt-5 pb-4 hairline-b">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[10.5px] font-semibold text-white"
            style={{ background: "rgb(var(--primary-rgb))", letterSpacing: "0.02em" }}
          >
            CA
          </span>
          <div className="min-w-0">
            <div
              className="text-[14px] font-medium leading-tight text-on-surface"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.022em" }}
            >
              Cart Analytics
            </div>
            <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.22em] text-on-surface-variant/70">
              Recovery Intelligence
            </div>
          </div>
        </Link>

        {storeName ? (
          <div className="mt-3.5 flex items-center gap-2 rounded-md hairline px-2.5 py-1.5 bg-surface-container-lowest">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: "rgb(var(--primary-rgb))" }} aria-hidden />
            <span className="truncate text-[11.5px] font-medium text-on-surface">{storeName}</span>
          </div>
        ) : null}
      </div>

      {/* Navigation хэсэг */}
      <nav className="no-scrollbar flex-1 overflow-y-auto px-2 py-2">
        {role === "admin" ? (
          <>
            <SectionLabel label="Admin" />
            <NavItem active={active === "admin"} label="Tenant control" href="/admin" Icon={Shield} />
          </>
        ) : null}

        <SectionLabel label="Product" />
        {productNavItems.map((item) => (
          <NavItem
            key={item.key}
            active={
              item.key === active ||
              (item.key === "ml-insights" && (active === "analytics" || active === "ablation"))
            }
            label={item.label}
            href={item.href}
            Icon={item.Icon}
          />
        ))}

        <SectionLabel label="Operations" />
        {operationsNavItems.map((item) => (
          <NavItem
            key={item.key}
            active={item.key === active}
            label={item.label}
            href={item.href}
            Icon={item.Icon}
          />
        ))}

        <SectionLabel label="System" />
        {systemNavItems.map((item) => (
          <NavItem
            key={item.key}
            active={item.key === active || (item.key === "installation" && active === "setup")}
            label={item.label}
            href={item.href}
            Icon={item.Icon}
          />
        ))}
      </nav>

      {/* Footer хэсэг */}
      <div className="space-y-0.5 px-2 py-2.5 hairline-t">
        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12.5px] text-on-surface-variant transition-colors hover:bg-[rgb(28_25_23/0.04)] hover:text-on-surface"
        >
          <UserCircle className="size-[15px] shrink-0 text-on-surface-variant/70" aria-hidden strokeWidth={1.6} />
          <span className="truncate" suppressHydrationWarning>{userName || "Profile"}</span>
        </Link>
        <Link
          href="/installation"
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12.5px] text-on-surface-variant transition-colors hover:bg-[rgb(28_25_23/0.04)] hover:text-on-surface"
        >
          <BookOpen className="size-[15px] shrink-0 text-on-surface-variant/70" aria-hidden strokeWidth={1.6} />
          Documentation
        </Link>
        <Link
          href="/installation"
          className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12.5px] text-on-surface-variant transition-colors hover:bg-[rgb(28_25_23/0.04)] hover:text-on-surface"
        >
          <LifeBuoy className="size-[15px] shrink-0 text-on-surface-variant/70" aria-hidden strokeWidth={1.6} />
          Help &amp; support
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="mt-0.5 flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[12.5px] text-on-surface-variant/80 transition-colors hover:bg-[rgb(28_25_23/0.04)] hover:text-on-surface"
        >
          <LogOut className="size-[15px] shrink-0 text-on-surface-variant/70" aria-hidden strokeWidth={1.6} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
