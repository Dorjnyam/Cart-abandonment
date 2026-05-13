"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useAuth } from "@/components/editorial/AuthContext";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Card } from "@/components/ui/Card";
import { API_ENDPOINTS } from "@/lib/api-config";
import { apiClient } from "@/lib/api-client";
import { roleLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

function StatusMsg({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold",
        type === "success" ? "bg-success/10 text-success" : "bg-error/10 text-error",
      )}
    >
      {type === "success" ? (
        <CheckCircle className="size-4 shrink-0" />
      ) : (
        <AlertCircle className="size-4 shrink-0" />
      )}
      {text}
    </div>
  );
}

export default function ProfilePage() {
  const { userName, role } = useAuth();
  const { t, lang } = useLanguage();
  const [fullName, setFullName] = useState(userName);
  const [email, setEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ email?: string; full_name?: string }>(API_ENDPOINTS.profile)
      .then((d) => {
        if (d.email) setEmail(d.email);
        if (d.full_name) setFullName(d.full_name);
      })
      .catch(() => {});
  }, []);

  const initials =
    (fullName || "U")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const labels = {
    avatar: lang === "EN" ? "Profile Avatar" : "Профайл аватар",
    avatarSubtitle:
      lang === "EN"
        ? "Initials are displayed when no avatar is uploaded."
        : "Аватар оруулаагүй үед эхний үсгүүд харагдана.",
    saveProfile: lang === "EN" ? "Save Profile" : "Профайл хадгалах",
    saved: lang === "EN" ? "Profile saved successfully." : "Мэдээлэл амжилттай хадгалагдлаа.",
    pwMismatch: lang === "EN" ? "New passwords do not match." : "Шинэ нууц үг тохирохгүй байна.",
    pwShort:
      lang === "EN"
        ? "Password must be at least 8 characters."
        : "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой.",
    pwSaved: lang === "EN" ? "Password updated successfully." : "Нууц үг амжилттай солигдлоо.",
    pwOld: lang === "EN" ? "Current Password" : "Одоогийн нууц үг",
    pwNew: lang === "EN" ? "New Password" : "Шинэ нууц үг",
    pwRepeat: lang === "EN" ? "Repeat New Password" : "Шинэ нууц үг давтах",
    pwAction: lang === "EN" ? "Change Password" : "Нууц үг солих",
    genericErr: lang === "EN" ? "Something went wrong." : "Алдаа гарлаа.",
  };

  return (
    <EditorialShell activeNav="profile" title={t.profile.title} subtitle={t.profile.subtitle}>
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-white text-2xl font-extrabold shadow-md shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-display font-extrabold text-text truncate">
                {fullName || "—"}
              </h2>
              <p className="text-sm text-muted truncate">{email || "—"}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                {roleLabel(role)}
              </div>
            </div>
          </div>
        </Card>

        <Card title={labels.avatar} subtitle={labels.avatarSubtitle}>
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-surface-muted flex items-center justify-center text-muted">
              <UserIcon className="w-8 h-8" />
            </div>
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-surface-muted text-muted rounded-xl text-xs font-bold cursor-not-allowed"
            >
              {t.profile.uploadPhoto}
            </button>
          </div>
        </Card>

        <Card title={t.profile.title} subtitle={t.profile.subtitle}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setProfileLoading(true);
              setProfileMsg(null);
              try {
                await apiClient.patch(API_ENDPOINTS.profile, { full_name: fullName });
                setProfileMsg({ type: "success", text: labels.saved });
              } catch (err) {
                setProfileMsg({
                  type: "error",
                  text: err instanceof Error ? err.message : labels.genericErr,
                });
              } finally {
                setProfileLoading(false);
              }
            }}
          >
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                {t.profile.fullName}
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-surface-muted rounded-xl bg-bg text-text outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                {t.profile.email}
              </label>
              <input
                value={email}
                readOnly
                disabled
                className="w-full px-4 py-3 border border-surface-muted rounded-xl bg-surface-muted text-muted cursor-not-allowed"
              />
            </div>
            {profileMsg ? <StatusMsg {...profileMsg} /> : null}
            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {profileLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              {labels.saveProfile}
            </button>
          </form>
        </Card>

        <Card title={t.profile.resetPassword}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const old_password = String(fd.get("old_password") ?? "");
              const new_password1 = String(fd.get("new_password1") ?? "");
              const new_password2 = String(fd.get("new_password2") ?? "");

              if (new_password1 !== new_password2) {
                setPwMsg({ type: "error", text: labels.pwMismatch });
                return;
              }
              if (new_password1.length < 8) {
                setPwMsg({ type: "error", text: labels.pwShort });
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
                setPwMsg({ type: "success", text: labels.pwSaved });
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                setPwMsg({
                  type: "error",
                  text: err instanceof Error ? err.message : labels.genericErr,
                });
              } finally {
                setPwLoading(false);
              }
            }}
          >
            {(["old_password", "new_password1", "new_password2"] as const).map((name, i) => (
              <div key={name} className="space-y-2">
                <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                  {i === 0 ? labels.pwOld : i === 1 ? labels.pwNew : labels.pwRepeat}
                </label>
                <input
                  name={name}
                  type="password"
                  required
                  minLength={i > 0 ? 8 : undefined}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-surface-muted rounded-xl bg-bg text-text outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
                />
              </div>
            ))}
            {pwMsg ? <StatusMsg {...pwMsg} /> : null}
            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {pwLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              {labels.pwAction}
            </button>
          </form>
        </Card>
      </div>
    </EditorialShell>
  );
}
