"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";
import { cn } from "@/lib/utils";

type Plan = "basic" | "pro" | "enterprise";

export default function SignupPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [plan, setPlan] = useState<Plan>("pro");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const PLANS: { id: Plan; label: string; desc: string }[] = [
    { id: "basic", label: "Basic", desc: lang === "EN" ? "Small store" : "Жижиг дэлгүүр" },
    { id: "pro", label: "Pro", desc: lang === "EN" ? "Growing business" : "Өсөж буй бизнес" },
    {
      id: "enterprise",
      label: "Enterprise",
      desc: lang === "EN" ? "Large team" : "Том баг",
    },
  ];

  return (
    <AuthShell
      eyebrow={t.login.signUp}
      title={t.login.newAccount}
      description={
        lang === "EN"
          ? "Add your store details and spin up a new analytics workspace."
          : "Дэлгүүрийн мэдээллээ оруулаад аналитикийн ажлын орчин үүсгэнэ."
      }
      size="lg"
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const store_name = String(form.get("store_name") ?? "").trim();
          const email = String(form.get("email") ?? "").trim().toLowerCase();
          const password = String(form.get("password") ?? "");
          const confirm = String(form.get("confirm") ?? "");

          if (password.length < 8) {
            setError(
              lang === "EN"
                ? "Password must be at least 8 characters."
                : "Нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой.",
            );
            return;
          }
          if (password !== confirm) {
            setError(
              lang === "EN"
                ? "Passwords do not match."
                : "Нууц үг давталттайгаа таарахгүй байна.",
            );
            return;
          }

          setError("");
          setIsLoading(true);
          try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.register}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ store_name, email, password, plan }),
            });
            if (!response.ok) {
              const body = (await response.json().catch(() => ({}))) as {
                detail?: string;
                email?: string[];
              };
              throw new Error(
                body.detail ??
                  body.email?.[0] ??
                  (lang === "EN" ? "Failed to create account." : "Бүртгэл үүсгэхэд алдаа гарлаа."),
              );
            }
            router.push("/login?registered=true");
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : lang === "EN"
                  ? "Failed to create account."
                  : "Бүртгэл үүсгэхэд алдаа гарлаа.",
            );
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <FieldGroup label={t.login.storeName}>
          <input
            name="store_name"
            type="text"
            required
            disabled={isLoading}
            placeholder="Central Market"
            autoComplete="organization"
            className={authInputClass}
          />
        </FieldGroup>

        <FieldGroup label={t.login.email}>
          <input
            name="email"
            type="email"
            required
            disabled={isLoading}
            placeholder="name@company.mn"
            autoComplete="email"
            className={authInputClass}
          />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label={t.login.password}>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              disabled={isLoading}
              placeholder={lang === "EN" ? "8+ characters" : "8+ тэмдэгт"}
              autoComplete="new-password"
              className={authInputClass}
            />
          </FieldGroup>
          <FieldGroup label={t.login.confirmPassword}>
            <input
              name="confirm"
              type="password"
              required
              disabled={isLoading}
              placeholder="••••••••"
              autoComplete="new-password"
              className={authInputClass}
            />
          </FieldGroup>
        </div>

        <FieldGroup label={lang === "EN" ? "Plan" : "Төлөвлөгөө"}>
          <div className="grid gap-2 sm:grid-cols-3">
            {PLANS.map((item) => {
              const active = plan === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-muted bg-surface text-muted hover:border-primary/40",
                  )}
                >
                  <span className="block font-extrabold text-sm">{item.label}</span>
                  <span className="mt-1 block text-xs">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </FieldGroup>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        ) : null}

        <SubmitButton
          isLoading={isLoading}
          loadingLabel={lang === "EN" ? "Creating" : "Бүртгэж байна"}
        >
          {t.login.createAccount}
        </SubmitButton>

        <p className="text-center text-sm text-muted">
          {t.login.haveAccount}{" "}
          <Link href="/login" className="font-extrabold text-primary hover:underline">
            {t.login.signIn}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
