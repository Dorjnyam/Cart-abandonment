"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "./LanguageContext";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  size?: "md" | "lg";
};

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  size = "md",
}: AuthShellProps) {
  const { lang, toggleLang } = useLanguage();

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-4 sm:p-6">
      <div className="fixed top-5 right-5 flex items-center gap-2 z-50">
        <button
          type="button"
          onClick={toggleLang}
          className="px-3 py-2 rounded-2xl bg-surface border border-surface-muted shadow-md text-xs font-extrabold text-text hover:scale-105 transition-all"
        >
          {lang}
        </button>
        <div className="bg-surface border border-surface-muted shadow-md rounded-2xl p-1">
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "circOut" }}
        className={cn(
          "w-full bg-surface rounded-3xl p-8 md:p-10 border border-surface-muted shadow-2xl shadow-primary/5",
          size === "lg" ? "max-w-2xl" : "max-w-md",
        )}
      >
        <Link href="/" className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-primary/25">
            <BarChart3 className="text-white w-8 h-8" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted">{eyebrow}</p>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mt-2 text-text text-center">
            {title}
          </h1>
          <p className="text-sm text-muted mt-2 text-center max-w-sm">{description}</p>
        </Link>

        {children}
      </motion.div>
    </div>
  );
}
