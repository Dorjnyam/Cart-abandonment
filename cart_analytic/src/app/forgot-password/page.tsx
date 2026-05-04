"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import ThemeToggle from "@/components/editorial/ThemeToggle";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="grid min-h-screen md:grid-cols-[2fr_3fr]">
        <section className="relative hidden overflow-hidden md:flex" style={{ background: "#050c1a" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 70% at 10% 90%, rgba(37,99,235,0.12) 0%, transparent 60%)" }} />
          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl text-white text-sm font-bold" style={{ background: "#2563eb" }}>CA</span>
              <span className="text-white/90 text-[15px] font-semibold" style={{ fontFamily: "var(--font-display, Newsreader), serif" }}>CartAnalytics</span>
            </div>
            <div>
              <h2 className="text-[3rem] leading-[1.1] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display, Newsreader), serif", color: "rgba(232,240,254,0.9)" }}>
                Нууц үг<br />сэргээх
              </h2>
              <p className="mt-5 max-w-xs text-[1.05rem] italic leading-relaxed text-white/45">
                Бүртгэлтэй имэйл рүүгээ сэргээх холбоосыг хүлээн авна уу.
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/20">© 2024 CartAnalytics. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </section>

        <section className="relative flex flex-col bg-background">
          <div className="flex items-center justify-end px-6 pt-5">
            <ThemeToggle />
          </div>

          <div className="flex w-full flex-1 items-center justify-center px-6 py-10">
            <div className="w-full max-w-sm space-y-7">
              <div>
                <h1 className="text-[1.7rem] font-semibold text-on-surface tracking-tight leading-tight">Нууц үг сэргээх</h1>
                <p className="mt-1 text-[13px] text-on-surface-variant">Бүртгэлтэй имэйлдээ сэргээх холбоос хүлээн авна уу</p>
              </div>

              <section className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-6">
                {sent ? (
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <CheckCircle className="size-12 text-secondary" aria-hidden />
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed">
                      Хэрэв энэ имэйл бүртгэлтэй бол сэргээх холбоос илгээгдлээ.
                    </p>
                    <a
                      href="/login"
                      className="block text-center text-sm font-semibold text-primary hover:underline"
                    >
                      ← Нэвтрэх хуудас руу буцах
                    </a>
                  </div>
                ) : (
                  <form
                    className="space-y-5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const email = String(fd.get("email") ?? "").trim().toLowerCase();
                      setIsLoading(true);
                      try {
                        await fetch(`${API_BASE_URL}${API_ENDPOINTS.forgotPassword}`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email }),
                        });
                      } finally {
                        setIsLoading(false);
                        setSent(true);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <label
                        className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant"
                        htmlFor="email"
                      >
                        Бүртгэлтэй имэйл
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="name@example.mn"
                        disabled={isLoading}
                        className="w-full rounded-md bg-surface-container-high px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={[
                        "flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-on-primary transition-all duration-200",
                        isLoading ? "cursor-not-allowed opacity-70" : "hover:brightness-110",
                      ].join(" ")}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          Илгээж байна...
                        </>
                      ) : (
                        "Сэргээх холбоос илгээх"
                      )}
                    </button>

                    <p className="text-center text-xs text-on-surface-variant">
                      <a href="/login" className="font-semibold text-primary hover:underline">
                        ← Нэвтрэх хуудас руу буцах
                      </a>
                    </p>
                  </form>
                )}
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
