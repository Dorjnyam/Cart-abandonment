"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  FileText,
  GitBranch,
  GitCompare,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  ShieldCheck,
  Stethoscope,
  Terminal,
  User as UserIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { cn } from "@/lib/utils";

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
  | "analytics"
  | "profile";

type NavItem = {
  key: NavKey;
  labelKey: keyof ReturnType<typeof useLanguage>["t"]["nav"];
  href: string;
  Icon: LucideIcon;
};

const primaryNav: NavItem[] = [
  { key: "dashboard", labelKey: "dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { key: "analytics", labelKey: "analytics", href: "/analytics", Icon: BarChart3 },
  { key: "sessions", labelKey: "sessions", href: "/sessions", Icon: Activity },
  { key: "diagnosis", labelKey: "diagnosis", href: "/diagnosis", Icon: Stethoscope },
  { key: "recommendations", labelKey: "recommendations", href: "/recommendations", Icon: Lightbulb },
  { key: "pipeline", labelKey: "pipeline", href: "/pipeline", Icon: GitBranch },
  { key: "installation", labelKey: "installation", href: "/installation", Icon: Terminal },
  { key: "settings", labelKey: "settings", href: "/settings", Icon: SettingsIcon },
  { key: "ablation", labelKey: "ablation", href: "/analytics?tab=ablation", Icon: GitCompare },
];

const adminNav: NavItem[] = [
  { key: "admin", labelKey: "admin", href: "/admin", Icon: ShieldCheck },
];

const secondaryNav: NavItem[] = [
  { key: "profile", labelKey: "profile", href: "/profile", Icon: UserIcon },
  { key: "installation", labelKey: "documentation", href: "/installation", Icon: FileText },
  { key: "installation", labelKey: "help", href: "/installation", Icon: HelpCircle },
];

function isActive(active: NavKey, item: NavItem): boolean {
  if (item.key === active) return true;
  if (item.key === "analytics" && (active === "ml-insights" || active === "ablation")) return true;
  if (item.key === "installation" && active === "setup") return true;
  return false;
}

export default function Sidebar({
  active,
  collapsed,
  onToggle,
}: {
  active: NavKey;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { role, signOut } = useAuth();
  const { t } = useLanguage();

  const items = role === "admin" ? [...adminNav, ...primaryNav] : primaryNav;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.25, ease: "circOut" }}
      className="hidden md:flex flex-col border-r border-surface-muted bg-surface sticky top-0 h-screen z-40 shrink-0"
    >
      <div className="p-6 flex items-center justify-between overflow-hidden whitespace-nowrap">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <BarChart3 className="text-white w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="font-display font-extrabold text-lg tracking-tight text-text truncate">
              Cart Analytics
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="p-1 text-muted hover:text-text shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar pt-2">
        {items.map((item) => {
          const activeItem = isActive(active, item);
          return (
            <Link
              key={`${item.key}-${item.labelKey}-${item.href}`}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group overflow-hidden whitespace-nowrap",
                activeItem
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-surface-muted text-muted",
              )}
            >
              <item.Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                  activeItem ? "text-primary" : "text-muted",
                )}
              />
              {!collapsed && (
                <span className="font-bold text-sm tracking-tight">
                  {t.nav[item.labelKey]}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-6 pb-2 px-3">
          <div className="h-px bg-surface-muted w-full" />
        </div>

        {secondaryNav.map((item, idx) => {
          const activeItem = isActive(active, item);
          return (
            <Link
              key={`secondary-${idx}`}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-muted hover:bg-surface-muted overflow-hidden whitespace-nowrap",
                activeItem && "bg-surface-muted text-primary",
              )}
            >
              <item.Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="font-bold text-sm tracking-tight">{t.nav[item.labelKey]}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-muted">
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-error hover:bg-error/10 transition-all overflow-hidden whitespace-nowrap"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-bold text-sm tracking-tight">{t.nav.signOut}</span>}
        </button>
      </div>
    </motion.aside>
  );
}
