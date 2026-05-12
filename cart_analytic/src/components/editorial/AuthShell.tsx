"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

/* Auth хуудсуудын энгийн layout: богино текст, sans font, цэвэр background. */
export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#eef5f2] font-sans text-[#13201e]">
      <div className="min-h-screen bg-[linear-gradient(180deg,#0f766e_0,#0f766e_220px,#eef5f2_220px,#eef5f2_100%)]">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-sm font-bold">
              CA
            </span>
            <span className="text-base font-semibold tracking-tight">CartAnalytics</span>
          </Link>
          <div className="rounded-full bg-white/12 p-1 text-white">
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:pt-16">
          <section className="max-w-xl text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-7 text-white/80">{description}</p>
          </section>

          <section className="rounded-2xl border border-[#d9e6e2] bg-white p-5 shadow-[0_22px_70px_rgb(15_118_110/0.18)] sm:p-7 lg:p-8">
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}
