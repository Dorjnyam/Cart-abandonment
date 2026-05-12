"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
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
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const password = String(form.get("password") ?? "");
        const confirm = String(form.get("confirm") ?? "");

        if (!token || !uid) {
          setError("Сэргээх холбоос буруу байна. Дахин хүсэлт илгээнэ үү.");
          return;
        }
        if (password.length < 8) {
          setError("Нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой.");
          return;
        }
        if (password !== confirm) {
          setError("Нууц үг давталттайгаа таарахгүй байна.");
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
            throw new Error("Холбоос хүчингүй эсвэл хугацаа нь дууссан байна.");
          }
          router.push("/login?reset=true");
        } catch (error) {
          setError(error instanceof Error ? error.message : "Нууц үг шинэчлэхэд алдаа гарлаа.");
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <FieldGroup label="Шинэ нууц үг">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          disabled={isLoading}
          placeholder="8+ тэмдэгт"
          autoComplete="new-password"
          className={authInputClass}
        />
      </FieldGroup>

      <FieldGroup label="Нууц үг давтах">
        <input
          name="confirm"
          type="password"
          required
          disabled={isLoading}
          placeholder="Давтаж оруулах"
          autoComplete="new-password"
          className={authInputClass}
        />
      </FieldGroup>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      ) : null}

      <SubmitButton isLoading={isLoading} loadingLabel="Шинэчилж байна">
        Нууц үг шинэчлэх
      </SubmitButton>

      <p className="text-center text-sm text-[#637570]">
        Холбоос ажиллахгүй юу?{" "}
        <Link href="/forgot-password" className="font-semibold text-[#0f766e] hover:underline">
          Дахин илгээх
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Шинэ нууц үг"
      title="Нууц үг солих"
      description="Шинэ нууц үгээ хоёр удаа оруулаад хадгална."
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-[#f2f8f6]" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
