"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Code2, Eye, EyeOff, Loader2, Shield, User } from "lucide-react";
import ThemeToggle from "@/components/editorial/ThemeToggle";
import type { UserRole } from "@/components/editorial/AuthContext";
import { useAuth } from "@/components/editorial/AuthContext";
import { loginWithCredentials } from "@/lib/services/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [errorText, setErrorText]       = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [role, setRole]                 = useState<UserRole>("owner");
  const [showPassword, setShowPassword] = useState(false);

  const registered = searchParams.get("registered") === "true";
  const resetDone  = searchParams.get("reset")      === "true";

  const isAdminEmail = (email: string) =>
    email === "admin@cartanalytics.mn" || email.endsWith("@admin.cartanalytics.mn");

  const roleOptions: { id: UserRole; label: string; Icon: typeof Shield }[] = [
    { id: "owner",     label: "Эзэмшигч",   Icon: Shield },
    { id: "developer", label: "Хөгжүүлэгч", Icon: Code2  },
    { id: "member",    label: "Гишүүн",      Icon: User   },
  ];

  return (
    <div className="flex w-full flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm space-y-7">

        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-xl text-white text-sm font-bold shrink-0"
            style={{ background: "#2563eb" }}
          >
            CA
          </span>
          <div>
            <div
              className="text-[15px] font-semibold text-on-surface leading-tight"
              style={{ fontFamily: "var(--font-display, Newsreader), serif" }}
            >
              CartAnalytics
            </div>
            <div className="text-[10px] text-on-surface-variant">Нарийвчилсан аналитик</div>
          </div>
        </div>

        <div>
          <h1 className="text-[1.7rem] font-semibold text-on-surface tracking-tight leading-tight">
            Нэвтрэх
          </h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">Байгууллагын нэвтрэх хэсэг</p>
        </div>

        {registered && (
          <div className="flex items-center gap-2 rounded-lg border border-[#10b981]/25 bg-[#10b981]/8 px-4 py-3 text-[13px] font-medium text-[#10b981]">
            <CheckCircle className="size-4 shrink-0" aria-hidden />
            Бүртгэл амжилттай! Одоо нэвтэрч болно.
          </div>
        )}
        {resetDone && (
          <div className="flex items-center gap-2 rounded-lg border border-[#10b981]/25 bg-[#10b981]/8 px-4 py-3 text-[13px] font-medium text-[#10b981]">
            <CheckCircle className="size-4 shrink-0" aria-hidden />
            Нууц үг амжилттай солигдлоо.
          </div>
        )}

        <div className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-6 space-y-5">
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd       = new FormData(e.currentTarget);
              const email    = String(fd.get("email")    ?? "").trim().toLowerCase();
              const password = String(fd.get("password") ?? "").trim();
              setErrorText("");
              setIsLoading(true);
              try {
                const resolvedRole: UserRole = isAdminEmail(email) ? "admin" : role;
                const session = await loginWithCredentials(email, password, resolvedRole);
                setSession({
                  token: session.token,
                  role: session.role,
                  userName: session.userName,
                  storeName: session.storeName,
                });
                router.push("/dashboard");
              } catch (err) {
                setErrorText(err instanceof Error ? err.message : "Нэвтрэх үед алдаа гарлаа");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold uppercase tracking-widest text-on-surface-variant">
                Хандалтын түвшин
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {roleOptions.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRole(id)}
                    aria-pressed={role === id}
                    className={[
                      "flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-semibold transition-colors",
                      role === id
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
                    ].join(" ")}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="text-[10.5px] font-bold uppercase tracking-widest text-on-surface-variant"
                htmlFor="email"
              >
                Имэйл
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant/[0.1] bg-surface-container-high px-3.5 py-2.5 text-[13px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition"
                id="email"
                name="email"
                placeholder="name@company.com"
                required
                type="email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="text-[10.5px] font-bold uppercase tracking-widest text-on-surface-variant"
                  htmlFor="password"
                >
                  Нууц үг
                </label>
                <Link href="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">
                  Мартсан уу?
                </Link>
              </div>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-outline-variant/[0.1] bg-surface-container-high px-3.5 py-2.5 pr-10 text-[13px] text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Нуух" : "Харуулах"}
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              className={[
                "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-on-primary transition-all",
                "bg-primary hover:brightness-110 active:brightness-95",
                isLoading ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Шалгаж байна...
                </>
              ) : (
                "Нэвтрэх"
              )}
            </button>

            {errorText && (
              <div className="flex items-start gap-2 rounded-lg border border-[#ef4444]/25 bg-[#ef4444]/7 p-3 text-[12px] font-medium text-[#ef4444]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {errorText}
              </div>
            )}
          </form>

          <p className="text-center text-[12px] text-on-surface-variant border-t border-outline-variant/[0.08] pt-4">
            Бүртгэл байхгүй юу?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Бүртгүүлэх →
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-on-surface-variant/50 italic">
          &ldquo;Жинхэнэ ойлголт бол өгөгдлийг ихэсгэх биш, шуугианыг багасгах юм.&rdquo;
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="grid min-h-screen md:grid-cols-[2fr_3fr]">

        {/* Left panel — dark navy brand */}
        <section
          className="relative hidden overflow-hidden md:flex"
          style={{ background: "#050c1a" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 10% 90%, rgba(37,99,235,0.12) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 items-center justify-center rounded-xl text-white text-sm font-bold"
                style={{ background: "#2563eb" }}
              >
                CA
              </span>
              <span
                className="text-white/90 text-[15px] font-semibold"
                style={{ fontFamily: "var(--font-display, Newsreader), serif" }}
              >
                CartAnalytics
              </span>
            </div>

            {/* Headline */}
            <div>
              <h2
                className="text-[3rem] leading-[1.1] font-semibold tracking-tight"
                style={{
                  fontFamily: "var(--font-display, Newsreader), serif",
                  color: "rgba(232,240,254,0.9)",
                }}
              >
                Precision<br />Analytics
              </h2>
              <p className="mt-5 max-w-xs text-[1.05rem] italic leading-relaxed text-white/45">
                Өгөгдлийг түүхий тоо биш, байгууллагын үнэн түүх болгон тайлбарлана.
              </p>

              <div className="mt-8 space-y-2.5">
                {[
                  "Бодит цагийн орхилтын хяналт",
                  "AI-д суурилсан эрсдэлийн оноо",
                  "Мульти-тенант, олон дүрийн удирдлага",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-[12.5px] text-white/55">
                    <span className="size-1.5 rounded-full shrink-0" style={{ background: "#2563eb" }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-white/20">
              © 2024 CartAnalytics. Бүх эрх хуулиар хамгаалагдсан.
            </p>
          </div>
        </section>

        {/* Right panel — form */}
        <section className="relative flex flex-col bg-background">
          <div className="flex items-center justify-end px-6 pt-5">
            <ThemeToggle />
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
