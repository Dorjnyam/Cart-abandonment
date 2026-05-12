"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, MailOpen } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthShell
      eyebrow="Нууц үг сэргээх"
      title="Имэйлээр сэргээх"
      description="Бүртгэлтэй имэйлээ оруулна. Холбоос ирвэл шинэ нууц үг тохируулна."
    >
      {sent ? (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#e6f5ef] p-5 text-[#12352f]">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#0f766e]" aria-hidden />
              <div>
                <p className="font-semibold">Имэйлээ шалгана уу</p>
                <p className="mt-1 text-sm leading-6">
                  {submittedEmail || "Таны оруулсан хаяг"} бүртгэлтэй бол сэргээх холбоос
                  илгээгдсэн.
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
            className="flex items-center gap-2 text-sm font-medium text-[#0f766e] hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> Өөр имэйл оруулах
          </button>

          <Link href="/login" className="block text-center text-sm font-semibold text-[#0f766e] hover:underline">
            Нэвтрэх хуудас руу буцах
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
          <div className="flex items-start gap-3 rounded-xl bg-[#f2f8f6] px-4 py-3 text-sm text-[#4d625d]">
            <MailOpen className="mt-0.5 size-4 shrink-0 text-[#0f766e]" aria-hidden />
            <p>Хаяг бүртгэлтэй бол сэргээх холбоос илгээгдэнэ.</p>
          </div>

          <FieldGroup label="Имэйл">
            <input
              name="email"
              type="email"
              required
              disabled={isLoading}
              placeholder="name@example.mn"
              autoComplete="email"
              className={authInputClass}
            />
          </FieldGroup>

          <SubmitButton isLoading={isLoading} loadingLabel="Илгээж байна">
            Холбоос илгээх
          </SubmitButton>

          <p className="text-center text-sm text-[#637570]">
            Санасан уу?{" "}
            <Link href="/login" className="font-semibold text-[#0f766e] hover:underline">
              Нэвтрэх
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
