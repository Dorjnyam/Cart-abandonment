"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useAuth } from "@/components/editorial/AuthContext";
import { API_ENDPOINTS } from "@/lib/api-config";
import { apiClient } from "@/lib/api-client";

function StatusMsg({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${type === "success" ? "bg-secondary-container/60 text-on-secondary-container" : "bg-error-container/50 text-on-error-container"}`}>
      {type === "success"
        ? <CheckCircle className="size-4 shrink-0" aria-hidden />
        : <AlertCircle className="size-4 shrink-0" aria-hidden />}
      {text}
    </div>
  );
}

export default function ProfilePage() {
  const { userName, role } = useAuth();
  const [fullName, setFullName] = useState(userName);
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    apiClient.get<{ email?: string; full_name?: string }>(API_ENDPOINTS.profile)
      .then((d: { email?: string; full_name?: string }) => {
        if (d.email) setEmail(d.email);
        if (d.full_name) setFullName(d.full_name);
      })
      .catch(() => {});
  }, []);

  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <EditorialShell activeNav="settings" title="Профайл" subtitle="Хувийн мэдээлэл">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* 1-р хэсэг: profile мэдээлэл */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary text-xl font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-on-surface text-base truncate">{fullName || "Хэрэглэгч"}</p>
              <span className="inline-flex rounded-full bg-secondary-container/80 text-on-secondary-container text-[0.6875rem] font-bold uppercase tracking-wide px-2.5 py-0.5 mt-1">
                {role}
              </span>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setProfileLoading(true);
              setProfileMsg(null);
              try {
                await apiClient.patch(API_ENDPOINTS.profile, { full_name: fullName });
                setProfileMsg({ type: "success", text: "Мэдээлэл амжилттай хадгалагдлаа." });
              } catch (err) {
                setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "Алдаа гарлаа." });
              } finally {
                setProfileLoading(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                Бүтэн нэр
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                Имэйл хаяг
              </label>
              <input
                value={email}
                readOnly
                disabled
                className="w-full rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-3 text-sm text-on-surface-variant cursor-not-allowed"
              />
            </div>

            {profileMsg ? <StatusMsg {...profileMsg} /> : null}

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {profileLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Хадгалах
            </button>
          </form>
        </section>

        {/* 2-р хэсэг: password солих */}
        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card space-y-5">
          <h3 className="text-base font-bold text-on-surface">Нууц үг солих</h3>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const old_password = String(fd.get("old_password") ?? "");
              const new_password1 = String(fd.get("new_password1") ?? "");
              const new_password2 = String(fd.get("new_password2") ?? "");

              if (new_password1 !== new_password2) {
                setPwMsg({ type: "error", text: "Шинэ нууц үг тохирохгүй байна." });
                return;
              }
              if (new_password1.length < 8) {
                setPwMsg({ type: "error", text: "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой." });
                return;
              }

              setPwLoading(true);
              setPwMsg(null);
              try {
                const data = await apiClient.post<{ access?: string; refresh?: string }>(
                  API_ENDPOINTS.changePassword,
                  { old_password, new_password1, new_password2 },
                );
                if (data.access) localStorage.setItem("access_token", data.access);
                if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
                setPwMsg({ type: "success", text: "Нууц үг амжилттай солигдлоо." });
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                setPwMsg({ type: "error", text: err instanceof Error ? err.message : "Алдаа гарлаа." });
              } finally {
                setPwLoading(false);
              }
            }}
          >
            {(["old_password", "new_password1", "new_password2"] as const).map((name, i) => (
              <div key={name} className="space-y-1.5">
                <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">
                  {i === 0 ? "Одоогийн нууц үг" : i === 1 ? "Шинэ нууц үг" : "Шинэ нууц үг давтах"}
                </label>
                <input
                  name={name}
                  type="password"
                  required
                  minLength={i > 0 ? 8 : undefined}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
              </div>
            ))}

            {pwMsg ? <StatusMsg {...pwMsg} /> : null}

            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {pwLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Нууц үг солих
            </button>
          </form>
        </section>
      </div>
    </EditorialShell>
  );
}
