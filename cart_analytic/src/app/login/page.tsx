"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle, Code2, Eye, EyeOff, Shield, User } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import type { UserRole } from "@/components/editorial/AuthContext";
import { useAuth } from "@/components/editorial/AuthContext";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { loginWithCredentials } from "@/lib/services/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("owner");
  const [showPassword, setShowPassword] = useState(false);

  const registered = searchParams.get("registered") === "true";
  const resetDone = searchParams.get("reset") === "true";

  const isAdminEmail = (email: string) =>
    email === "admin@cartanalytics.mn" || email.endsWith("@admin.cartanalytics.mn");

  const roleOptions: { id: UserRole; label: string; Icon: typeof Shield }[] = [
    { id: "owner", label: "Эзэмшигч", Icon: Shield },
    { id: "developer", label: "Хөгжүүлэгч", Icon: Code2 },
    { id: "member", label: "Гишүүн", Icon: User },
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
        <div className="flex items-start gap-3 rounded-xl bg-[#e6f5ef] px-4 py-3 text-sm text-[#12352f]">
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-[#0f766e]" aria-hidden />
          <p>
            {registered
              ? "Бүртгэл амжилттай. Одоо нэвтэрнэ үү."
              : "Нууц үг шинэчлэгдсэн. Шинэ нууц үгээрээ нэвтэрнэ үү."}
          </p>
        </div>
      )}

      <FieldGroup label="Хандах эрх">
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
                  "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-sm transition",
                  active
                    ? "border-[#0f766e] bg-[#e7f4f1] text-[#0f4f49]"
                    : "border-[#d9e6e2] bg-white text-[#687b76] hover:border-[#0f766e]/50",
                ].join(" ")}
              >
                <Icon className="size-4" strokeWidth={1.8} aria-hidden />
                <span className="text-center font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup label="Имэйл">
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
        label="Нууц үг"
        right={
          <Link href="/forgot-password" className="text-sm font-medium text-[#0f766e] hover:underline">
            Мартсан уу?
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
            aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-[#687b76] hover:text-[#0f766e]"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </FieldGroup>

      {errorText ? (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{errorText}</p>
        </div>
      ) : null}

      <SubmitButton isLoading={isLoading} loadingLabel="Шалгаж байна">
        Нэвтрэх
      </SubmitButton>

      <p className="text-center text-sm text-[#637570]">
        Данс байхгүй юу?{" "}
        <Link href="/signup" className="font-semibold text-[#0f766e] hover:underline">
          Бүртгүүлэх
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Нэвтрэх"
      title="Данс руугаа орох"
      description="Имэйл, нууц үг, хандах эрхээ сонгоод хяналтын самбар руу орно."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
