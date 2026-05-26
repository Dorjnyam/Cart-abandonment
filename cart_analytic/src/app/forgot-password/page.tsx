"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, MailOpen } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

export default function ForgotPasswordPage() {
  const { t, lang } = useLanguage();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthShell
      eyebrow={t.login.forgotPassword}
      title={t.login.forgotTitle}
      description={t.login.forgotSubtitle}
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-2xl bg-success/10 p-5 text-success">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
              <div>
                <p className="font-extrabold">
                  {lang === "EN" ? "Check your inbox" : "Имэйлээ шалгана уу"}
                </p>
                <p className="mt-1 text-sm leading-6 font-medium">
                  {lang === "EN"
                    ? `${submittedEmail || "Your email"} — if it matches an account, a reset link has been sent.`
                    : `${submittedEmail || "Таны оруулсан хаяг"} бүртгэлтэй бол сэргээх холбоос илгээгдсэн.`}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setSubmittedEmail("");
            }}
            className="flex items-center gap-2 text-sm font-extrabold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            {lang === "EN" ? "Use a different email" : "Өөр имэйл оруулах"}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm font-extrabold text-primary hover:underline"
          >
            {t.login.backToLogin}
          </Link>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const email = String(form.get("email") ?? "").trim().toLowerCase();
            setSubmittedEmail(email);
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
          <div className="flex items-start gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm text-muted">
            <MailOpen className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="font-medium">
              {lang === "EN"
                ? "If the address is registered, we'll email a reset link."
                : "Хаяг бүртгэлтэй бол сэргээх холбоос илгээгдэнэ."}
            </p>
          </div>

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

          <SubmitButton
            isLoading={isLoading}
            loadingLabel={lang === "EN" ? "Sending" : "Илгээж байна"}
          >
            {t.login.sendReset}
          </SubmitButton>

          <p className="text-center text-sm text-muted">
            <Link href="/login" className="font-extrabold text-primary hover:underline">
              {t.login.backToLogin}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
