"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import RoleGuard from "@/components/editorial/RoleGuard";
import { useToast } from "@/components/ui/Toast";
import { fetchTenantDetail } from "@/lib/services/tenants";
import type { Tenant } from "@/types/api";

const PLAN_COLORS: Record<string, string> = {
  full: "bg-secondary-container text-on-secondary-container",
  smart: "bg-primary-container text-on-primary-container",
  basic: "bg-surface-container-high text-on-surface-variant",
  pro: "bg-tertiary-container text-on-tertiary-container",
  enterprise: "bg-error-container/70 text-on-error-container",
};

function TenantDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    fetchTenantDetail(params.id)
      .then(setTenant)
      .catch(() => showToast("Tenant мэдээлэл ачааллахад алдаа гарлаа.", "error"))
      .finally(() => setLoading(false));
  }, [params.id, showToast]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center text-sm text-on-surface-variant">Tenant олдсонгүй.</div>
    );
  }

  const stats = [
    { label: "Нийт session", value: tenant.total_sessions.toLocaleString() },
    { label: "Орхилтын хувь", value: `${(tenant.abandonment_rate * 100).toFixed(1)}%` },
    { label: "Статус", value: tenant.status === "active" ? "Идэвхтэй" : "Идэвхгүй" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        type="button"
        onClick={() => router.push("/tenants")}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Тenants жагсаалт руу буцах
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container text-lg font-bold">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-on-surface truncate">{tenant.name}</h2>
              <p className="text-sm text-on-surface-variant truncate">{tenant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${PLAN_COLORS[tenant.plan] ?? "bg-surface-container text-on-surface"}`}>
              {tenant.plan}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tenant.status === "active" ? "bg-secondary-container/70 text-on-secondary-container" : "bg-error-container/60 text-on-error-container"}`}>
              <span className={`size-1.5 rounded-full ${tenant.status === "active" ? "bg-secondary" : "bg-error"}`} aria-hidden />
              {tenant.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
            </span>
          </div>
        </div>

        <div className="text-xs text-on-surface-variant">
          Үүсгэсэн: {new Date(tenant.created_at).toLocaleDateString("mn-MN")}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-sm text-center">
            <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-on-surface tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* API keys placeholder */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-on-surface">API Түлхүүрүүд</h3>
        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-3 font-mono text-sm text-on-surface-variant">
          tk_full_••••••••{tenant.id.toString().padStart(4, "0")}
        </div>
        <p className="text-xs text-on-surface-variant">Бүтэн түлхүүрийг харахын тулд тухайн tenant-ийн API Key хуудасруу очно уу.</p>
      </div>

      {/* Toggle button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled
          title="main_service одоогоор tenant төлөв өөрчлөх endpoint өгөөгүй байна"
          className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-5 py-2.5 text-sm font-semibold text-on-surface-variant opacity-70"
        >
          Төлөв өөрчлөх endpoint байхгүй
        </button>
      </div>
    </div>
  );
}

export default function TenantDetailPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <EditorialShell activeNav="tenants" title="Tenant дэлгэрэнгүй" subtitle="Admin Panel">
        <TenantDetailContent />
      </EditorialShell>
    </RoleGuard>
  );
}
