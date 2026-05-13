"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  BarChart3,
  GitBranch,
  GitCompare,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  Stethoscope,
  Terminal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import type { NavKey } from "./Sidebar";
import { cn } from "@/lib/utils";

type Item = {
  key: NavKey;
  labelKey: keyof ReturnType<typeof useLanguage>["t"]["nav"];
  href: string;
  Icon: LucideIcon;
};

const items: Item[] = [
  { key: "dashboard", labelKey: "dashboard", href: "/dashboard", Icon: LayoutDashboard },
  { key: "analytics", labelKey: "analytics", href: "/analytics", Icon: BarChart3 },
  { key: "sessions", labelKey: "sessions", href: "/sessions", Icon: Activity },
  { key: "diagnosis", labelKey: "diagnosis", href: "/diagnosis", Icon: Stethoscope },
  { key: "recommendations", labelKey: "recommendations", href: "/recommendations", Icon: Lightbulb },
  { key: "pipeline", labelKey: "pipeline", href: "/pipeline", Icon: GitBranch },
  { key: "installation", labelKey: "installation", href: "/installation", Icon: Terminal },
  { key: "settings", labelKey: "settings", href: "/settings", Icon: SettingsIcon },
  { key: "ablation", labelKey: "ablation", href: "/analytics?tab=ablation", Icon: GitCompare },
  { key: "admin", labelKey: "admin", href: "/admin", Icon: ShieldCheck },
];

export default function MobileDrawer({
  open,
  activeNav,
  onClose,
}: {
  open: boolean;
  activeNav: NavKey;
  onClose: () => void;
}) {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-3/4 max-w-xs z-[60] p-6 flex flex-col md:hidden bg-surface"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="font-display font-extrabold text-xl tracking-tight text-text">
                Cart Analytics
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 text-muted hover:text-text"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
              {items.map((item) => {
                const active =
                  item.key === activeNav ||
                  (item.key === "analytics" &&
                    (activeNav === "ml-insights" || activeNav === "ablation"));
                return (
                  <Link
                    key={`${item.key}-${item.labelKey}`}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 w-full p-3 rounded-2xl text-left transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted hover:bg-surface-muted",
                    )}
                  >
                    <item.Icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{t.nav[item.labelKey]}</span>
                  </Link>
                );
              })}
            </div>
            <div className="pt-6 mt-6 border-t border-surface-muted">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  signOut();
                }}
                className="flex items-center gap-3 text-error font-bold text-sm"
              >
                <LogOut className="w-5 h-5" />
                {t.nav.signOut}
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
