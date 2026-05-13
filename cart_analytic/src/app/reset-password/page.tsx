"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const token = searchParams.get("token") ?? "";
  const uid = searchParams.get("uid") ?? "";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const password = String(form.get("password") ?? "");
        const confirm = String(form.get("confirm") ?? "");

        if (!token || !uid) {
          setError(
            lang === "EN"
              ? "Reset link is invalid. Please request a new one."
              : "Сэргээх холбоос буруу байна. Дахин хүсэлт илгээнэ үү.",
          );
          return;
        }
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
            lang === "EN" ? "Passwords do not match." : "Нууц үг давталттайгаа таарахгүй байна.",
          );
          return;
        }

        setError("");
        setIsLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.resetPassword}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid,
              token,
              new_password1: password,
              new_password2: confirm,
            }),
          });
          if (!response.ok) {
            throw new Error(
              lang === "EN"
                ? "Link is invalid or expired."
                : "Холбоос хүчингүй эсвэл хугацаа нь дууссан байна.",
            );
          }
          router.push("/login?reset=true");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : lang === "EN"
                ? "Failed to update password."
                : "Нууц үг шинэчлэхэд алдаа гарлаа.",
          );
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <FieldGroup label={t.profile.newPassword}>
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

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : null}

      <SubmitButton
        isLoading={isLoading}
        loadingLabel={lang === "EN" ? "Updating" : "Шинэчилж байна"}
      >
        {t.profile.resetPassword}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        <Link href="/forgot-password" className="font-extrabold text-primary hover:underline">
          {lang === "EN" ? "Send a new link" : "Дахин илгээх"}
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const { t, lang } = useLanguage();
  return (
    <AuthShell
      eyebrow={t.profile.newPassword}
      title={t.profile.resetPassword}
      description={
        lang === "EN"
          ? "Enter your new password twice to confirm."
          : "Шинэ нууц үгээ хоёр удаа оруулаад хадгална."
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
