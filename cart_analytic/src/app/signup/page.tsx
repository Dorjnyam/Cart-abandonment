"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/editorial/ThemeToggle";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

type Plan = "basic" | "pro" | "enterprise";

const PLANS: { id: Plan; label: string; desc: string }[] = [
  { id: "basic", label: "Basic", desc: "Жижиг дэлгүүр" },
  { id: "pro", label: "Pro", desc: "Өсч буй бизнес" },
  { id: "enterprise", label: "Enterprise", desc: "Том байгууллага" },
];

export default function SignupPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("pro");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="grid min-h-screen md:grid-cols-[2fr_3fr]">
        {/* Left panel */}
        <section className="relative hidden overflow-hidden md:flex" style={{ background: "#050c1a" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 90% 70% at 10% 90%, rgba(37,99,235,0.12) 0%, transparent 60%)" }} />
          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl text-white text-sm font-bold" style={{ background: "#2563eb" }}>CA</span>
              <span className="text-white/90 text-[15px] font-semibold" style={{ fontFamily: "var(--font-display, Newsreader), serif" }}>CartAnalytics</span>
            </div>
            <div>
              <h2 className="text-[3rem] leading-[1.1] font-semibold tracking-tight" style={{ fontFamily: "var(--font-display, Newsreader), serif", color: "rgba(232,240,254,0.9)" }}>
                Нэгдэж<br />орох
              </h2>
              <p className="mt-5 max-w-xs text-[1.05rem] italic leading-relaxed text-white/45">
                Сагсны орхилтыг бууруулж, хөрвүүлэлтийг нэмэгдүүлэх аналитик платформ.
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/20">© 2024 CartAnalytics. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </section>

        {/* Right form panel */}
        <section className="relative flex flex-col bg-background">
          <div className="flex items-center justify-end px-6 pt-5">
            <ThemeToggle />
          </div>

          <div className="mx-auto flex w-full max-w-[720px] flex-1 items-center justify-center px-6 pb-10 pt-6">
            <div className="w-full max-w-[440px] space-y-8">
              <div>
                <h1 className="text-[1.7rem] font-semibold text-on-surface tracking-tight leading-tight">Бүртгүүлэх</h1>
                <p className="mt-1 text-[13px] text-on-surface-variant">Шинэ дэлгүүр нэмэх</p>
              </div>

              <section className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-6">
                <form
                  className="space-y-5"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const store_name = String(fd.get("store_name") ?? "").trim();
                    const email = String(fd.get("email") ?? "").trim().toLowerCase();
                    const password = String(fd.get("password") ?? "");
                    const confirm = String(fd.get("confirm") ?? "");

                    if (password.length < 8) {
                      setError("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.");
                      return;
                    }
                    if (password !== confirm) {
                      setError("Нууц үг тохирохгүй байна.");
                      return;
                    }

                    setError("");
                    setIsLoading(true);
                    try {
                      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.register}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ store_name, email, password, plan }),
                      });
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({})) as { detail?: string; email?: string[] };
                        throw new Error(err.detail ?? err.email?.[0] ?? "Бүртгэл үүсгэхэд алдаа гарлаа.");
                      }
                      router.push("/login?registered=true");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Алдаа гарлаа.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant" htmlFor="store_name">
                      Дэлгүүрийн нэр
                    </label>
                    <input
                      id="store_name"
                      name="store_name"
                      type="text"
                      required
                      placeholder="Central Market"
                      disabled={isLoading}
                      className="w-full rounded-md bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant" htmlFor="email">
                      Имэйл хаяг
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.mn"
                      disabled={isLoading}
                      className="w-full rounded-md bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant" htmlFor="password">
                      Нууц үг <span className="normal-case font-normal">(хамгийн багадаа 8 тэмдэгт)</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full rounded-md bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant" htmlFor="confirm">
                      Нууц үг давтах
                    </label>
                    <input
                      id="confirm"
                      name="confirm"
                      type="password"
                      required
                      placeholder="••••••••"
                      disabled={isLoading}
                      className="w-full rounded-md bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/35"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                      Төлбөрийн төлөвлөгөө
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PLANS.map(({ id, label, desc }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPlan(id)}
                          aria-pressed={plan === id}
                          className={[
                            "flex flex-col items-start gap-0.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                            plan === id
                              ? "bg-primary-container text-on-primary-container ring-1 ring-primary/30"
                              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container",
                          ].join(" ")}
                        >
                          <span className="font-bold">{label}</span>
                          <span className="text-[0.6875rem] opacity-75">{desc}</span>
                        </button>
                      ))}
                    </div>
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
                        Бүртгэж байна...
                      </>
                    ) : (
                      "Бүртгүүлэх"
                    )}
                  </button>

                  <p className="text-center text-xs text-on-surface-variant">
                    Бүртгэл байгаа юу?{" "}
                    <a href="/login" className="font-bold text-primary hover:underline">
                      Нэвтрэх →
                    </a>
                  </p>
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
