"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/editorial/ThemeToggle";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const uid = searchParams.get("uid") ?? "";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const p1 = String(fd.get("password") ?? "");
        const p2 = String(fd.get("confirm") ?? "");

        if (p1.length < 8) {
          setError("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.");
          return;
        }
        if (p1 !== p2) {
          setError("Нууц үг тохирохгүй байна.");
          return;
        }

        setError("");
        setIsLoading(true);
        try {
          const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.resetPassword}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, token, new_password1: p1, new_password2: p2 }),
          });
          if (!res.ok) {
            throw new Error("Холбоос хүчингүй болсон байна. Дахин оролдоно уу.");
          }
          router.push("/login?reset=true");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Холбоос хүчингүй болсон байна. Дахин оролдоно уу.");
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant" htmlFor="password">
          Шинэ нууц үг <span className="normal-case font-normal">(хамгийн багадаа 8 тэмдэгт)</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          disabled={isLoading}
          className="w-full rounded-md bg-surface-container-high px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant" htmlFor="confirm">
          Шинэ нууц үг давтах
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          placeholder="••••••••"
          disabled={isLoading}
          className="w-full rounded-md bg-surface-container-high px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
        />
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-md bg-error-container/50 p-3 text-xs font-medium text-on-error-container">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </div>
      ) : null}

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
            Шинэчилж байна...
          </>
        ) : (
          "Нууц үг шинэчлэх"
        )}
      </button>

      <p className="text-center text-xs text-on-surface-variant">
        <a href="/login" className="font-semibold text-primary hover:underline">
          ← Нэвтрэх хуудас руу буцах
        </a>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
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
                Шинэ нууц үг<br />тохируулах
              </h2>
              <p className="mt-5 max-w-xs text-[1.05rem] italic leading-relaxed text-white/45">
                Аюулгүй, хүчтэй нууц үг сонгоно уу.
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
                <h1 className="text-[1.7rem] font-semibold text-on-surface tracking-tight leading-tight">Нууц үг шинэчлэх</h1>
                <p className="mt-1 text-[13px] text-on-surface-variant">Шинэ нууц үгээ оруулна уу</p>
              </div>

              <section className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-6">
                <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-surface-container-low" />}>
                  <ResetPasswordForm />
                </Suspense>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
