"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Code2, Eye, EyeOff, Shield, User } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import type { UserRole } from "@/components/editorial/AuthContext";
import { useAuth } from "@/components/editorial/AuthContext";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { loginWithCredentials } from "@/lib/services/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const { t, lang } = useLanguage();
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("owner");
  const [showPassword, setShowPassword] = useState(false);

  const registered = searchParams.get("registered") === "true";
  const resetDone = searchParams.get("reset") === "true";

  const isAdminEmail = (email: string) =>
    email === "admin@cartanalytics.mn" || email.endsWith("@admin.cartanalytics.mn");

  const roleOptions: { id: UserRole; label: string; Icon: typeof Shield }[] = [
    { id: "owner", label: t.login.owner, Icon: Shield },
    { id: "developer", label: t.login.developer, Icon: Code2 },
    { id: "member", label: t.login.member, Icon: User },
  ];

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "").trim().toLowerCase();
        const password = String(form.get("password") ?? "").trim();
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
        } catch (error) {
          setErrorText(
            error instanceof Error
              ? error.message
              : "Нэвтрэхэд алдаа гарлаа. Имэйл болон нууц үгээ шалгана уу.",
          );
        } finally {
          setIsLoading(false);
        }
      }}
    >
      {(registered || resetDone) && (
        <div className="flex items-start gap-3 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
          <CheckCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="font-medium">
            {registered
              ? lang === "EN"
                ? "Registration complete. Sign in to continue."
                : "Бүртгэл амжилттай. Одоо нэвтэрнэ үү."
              : lang === "EN"
                ? "Password updated. Sign in with your new password."
                : "Нууц үг шинэчлэгдсэн. Шинэ нууц үгээрээ нэвтэрнэ үү."}
          </p>
        </div>
      )}

      <FieldGroup label={t.login.role}>
        <div className="grid grid-cols-3 gap-2">
          {roleOptions.map(({ id, label, Icon }) => {
            const active = role === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                aria-pressed={active}
                className={[
                  "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-surface-muted bg-surface text-muted hover:border-primary/40",
                ].join(" ")}
              >
                <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                <span className="text-center font-bold leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
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

      <FieldGroup
        label={t.login.password}
        right={
          <Link href="/forgot-password" className="text-xs font-extrabold text-primary hover:underline">
            {t.login.forgotPassword}
          </Link>
        }
      >
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            disabled={isLoading}
            placeholder="••••••••"
            autoComplete="current-password"
            className={`${authInputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-muted hover:text-primary"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </FieldGroup>

      {errorText ? (
        <div className="flex items-start gap-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="font-medium">{errorText}</p>
        </div>
      ) : null}

      <SubmitButton
        isLoading={isLoading}
        loadingLabel={lang === "EN" ? "Signing in" : "Шалгаж байна"}
      >
        {t.login.signIn}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        {t.login.noAccount}{" "}
        <Link href="/signup" className="font-extrabold text-primary hover:underline">
          {t.login.signUp}
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { t } = useLanguage();
  return (
    <AuthShell
      eyebrow={t.login.title}
      title={t.login.welcomeBack}
      description={t.login.subtitle}
    >
      <LoginForm />
    </AuthShell>
  );
}
