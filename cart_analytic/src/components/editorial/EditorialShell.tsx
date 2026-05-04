"use client";

import type { ReactNode } from "react";
import Sidebar, { type NavKey } from "./Sidebar";
import TopAppBar from "./TopAppBar";
import { MAIN_OFFSET_CLASS } from "./layoutConstants";

const navHref: Partial<Record<NavKey, string>> = {
  dashboard:       "/dashboard",
  sessions:        "/sessions",
  analytics:       "/analytics",
  ablation:        "/analytics?tab=ablation",
  diagnosis:       "/diagnosis",
  recommendations: "/recommendations",
  settings:        "/settings",
  setup:           "/setup",
  admin:           "/admin",
  overview:        "/overview",
  diagnostics:     "/diagnostics",
  tenants:         "/tenants",
  installation:    "/installation",
};

function defaultBreadcrumbs(
  activeNav: NavKey,
  title: string,
  subtitle: string | undefined,
): { label: string; href?: string }[] {
  const href = navHref[activeNav];
  const crumbs: { label: string; href?: string }[] = [];
  if (href) {
    crumbs.push({ label: title, href });
  } else {
    crumbs.push({ label: title });
  }
  if (subtitle) {
    crumbs.push({ label: subtitle });
  }
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
  /** Override auto breadcrumbs (title + subtitle). */
  breadcrumbs?: { label: string; href?: string }[];
  children: ReactNode;
  right?: ReactNode;
}) {
  const crumbs = breadcrumbs ?? defaultBreadcrumbs(activeNav, title, subtitle);

  return (
    <>
      <Sidebar active={activeNav} />
      <TopAppBar breadcrumbs={crumbs} right={right} />

      <main className={`${MAIN_OFFSET_CLASS} pt-13 min-h-screen bg-canvas`}>{children}</main>
    </>
  );
}
