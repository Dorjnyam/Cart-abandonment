"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import AuthShell from "@/components/editorial/AuthShell";
import { authInputClass, FieldGroup, SubmitButton } from "@/components/editorial/AuthFormParts";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

type Plan = "basic" | "pro" | "enterprise";

const PLANS: { id: Plan; label: string; desc: string }[] = [
  { id: "basic", label: "Basic", desc: "Жижиг дэлгүүр" },
  { id: "pro", label: "Pro", desc: "Өсөж буй бизнес" },
  { id: "enterprise", label: "Enterprise", desc: "Том баг" },
];

export default function SignupPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("pro");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AuthShell
      eyebrow="Бүртгүүлэх"
      title="Шинэ данс үүсгэх"
      description="Дэлгүүрийн мэдээллээ оруулаад аналитикийн ажлын орчин үүсгэнэ."
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
              throw new Error(body.detail ?? body.email?.[0] ?? "Бүртгэл үүсгэхэд алдаа гарлаа.");
            }
            router.push("/login?registered=true");
          } catch (error) {
            setError(error instanceof Error ? error.message : "Бүртгэл үүсгэхэд алдаа гарлаа.");
          } finally {
            setIsLoading(false);
          }
        }}
      >
        <FieldGroup label="Дэлгүүрийн нэр">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup label="Нууц үг">
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
        </div>

        <FieldGroup label="Төлөвлөгөө">
          <div className="grid gap-2 sm:grid-cols-3">
            {PLANS.map((item) => {
              const active = plan === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPlan(item.id)}
                  className={[
                    "rounded-xl border px-3 py-3 text-left transition",
                    active
                      ? "border-[#0f766e] bg-[#e7f4f1] text-[#0f4f49]"
                      : "border-[#d9e6e2] bg-white text-[#637570] hover:border-[#0f766e]/50",
                  ].join(" ")}
                >
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </FieldGroup>

        {error ? (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        ) : null}

        <SubmitButton isLoading={isLoading} loadingLabel="Бүртгэж байна">
          Данс үүсгэх
        </SubmitButton>

        <p className="text-center text-sm text-[#637570]">
          Данс байгаа юу?{" "}
          <Link href="/login" className="font-semibold text-[#0f766e] hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
