"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar, { type NavKey } from "./Sidebar";
import TopAppBar from "./TopAppBar";
import MobileDrawer from "./MobileDrawer";
import { useLanguage } from "./LanguageContext";

const COLLAPSED_KEY = "cart_analytic_sidebar_collapsed";

const navHref: Partial<Record<NavKey, string>> = {
  dashboard: "/dashboard",
  pipeline: "/pipeline",
  sessions: "/sessions",
  "ml-insights": "/analytics",
  analytics: "/analytics",
  ablation: "/analytics?tab=ablation",
  diagnosis: "/diagnosis",
  recommendations: "/recommendations",
  settings: "/settings",
  setup: "/installation",
  admin: "/admin",
  overview: "/dashboard",
  diagnostics: "/diagnostics",
  tenants: "/tenants",
  installation: "/installation",
  profile: "/profile",
};

function defaultBreadcrumbs(
  activeNav: NavKey,
  title: string,
  subtitle: string | undefined,
): { label: string; href?: string }[] {
  const href = navHref[activeNav];
  const crumbs: { label: string; href?: string }[] = [{ label: "Cart Analytics", href: "/dashboard" }];
  if (href) crumbs.push({ label: title, href });
  else crumbs.push({ label: title });
  if (subtitle) crumbs.push({ label: subtitle });
  return crumbs;
}

export default function EditorialShell({
  activeNav,
  title,
  subtitle,
  breadcrumbs,
  children,
  right,
}: {
  activeNav: NavKey;
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: ReactNode;
  right?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang } = useLanguage();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_KEY);
      if (stored === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollapsed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const crumbs = breadcrumbs ?? defaultBreadcrumbs(activeNav, title, subtitle);

  return (
    <div className="min-h-screen flex bg-bg text-text">
      <Sidebar active={activeNav} collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopAppBar
          breadcrumbs={crumbs}
          right={right}
          onMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            <div className="mb-6">
              <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-text">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm md:text-base text-muted mt-1.5 max-w-3xl">{subtitle}</p>
              ) : null}
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${pathname}-${lang}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "circOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <MobileDrawer
        open={mobileOpen}
        activeNav={activeNav}
        onClose={() => setMobileOpen(false)}
      />
    </div>
  );
}
