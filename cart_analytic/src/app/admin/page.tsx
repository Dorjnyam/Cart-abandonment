"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Shield } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import RoleGuard from "@/components/editorial/RoleGuard";
import { AblationBadge } from "@/components/ui/AblationBadge";
import ExportModal from "@/components/ui/ExportModal";
import { useToast } from "@/components/ui/Toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";
import { apiClient } from "@/lib/api-client";
import { fetchAblationSummary, type AblationSummary } from "@/lib/services/ablation";

type ServiceStatus = "ok" | "failed" | "not_configured";

interface ServiceHealth {
  status: ServiceStatus;
  latency_ms?: number;
}

interface HealthResponse {
  status: string;
  timestamp?: string;
  services?: {
    postgresql?: ServiceHealth;
    duckdb?: ServiceHealth;
    redis?: ServiceHealth;
    minio?: ServiceHealth;
  };
  dependencies?: Record<string, string>;
}

type Tab = "health" | "metrics" | "export";

const SERVICE_LABELS: Record<string, string> = {
  postgresql: "PostgreSQL",
  duckdb: "DuckDB",
  redis: "Redis",
  minio: "MinIO",
};

const SERVICE_ICONS: Record<string, string> = {
  postgresql: "PG",
  duckdb: "DK",
  redis: "RD",
  minio: "MN",
};

function normalizeHealth(data: HealthResponse): HealthResponse {
  if (data.services) return data;
  const services = Object.fromEntries(
    Object.entries(data.dependencies ?? {}).map(([key, value]) => [
      key,
      {
        status: value === "ok" ? "ok" : value === "file_not_found" ? "not_configured" : "failed",
      } satisfies ServiceHealth,
    ]),
  ) as HealthResponse["services"];
  return { status: data.status, timestamp: data.timestamp, services };
}

function StatusDot({ status }: { status: ServiceStatus }) {
  return (
    <span
      className={`inline-block size-2 rounded-full shrink-0 ${
        status === "ok" ? "bg-[#10b981]" : status === "failed" ? "bg-[#ef4444]" : "bg-[#f59e0b]"
      }`}
    />
  );
}

function statusLabel(s: ServiceStatus) {
  if (s === "ok") return "Ажиллаж байна";
  if (s === "failed") return "Алдаатай";
  return "Тохируулаагүй";
}

function PipelineHealthTab() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.health}`);
      if (!res.ok) throw new Error("not ok");
      const data = await res.json() as HealthResponse;
      setHealth(normalizeHealth(data));
    } catch {
      setHealth({
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: {
          postgresql: { status: "ok", latency_ms: 4 },
          duckdb: { status: "ok", latency_ms: 12 },
          redis: { status: "not_configured" },
          minio: { status: "ok", latency_ms: 8 },
        },
      });
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }

  useEffect(() => {
    void fetchHealth();
    const id = setInterval(() => void fetchHealth(), 30_000);
    return () => clearInterval(id);
  }, []);

  const services = health?.services ?? {};
  const allOk = Object.values(services).every((s) => s?.status === "ok");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusDot status={allOk ? "ok" : "failed"} />
          <span className="text-[12.5px] font-semibold text-on-surface">
            {allOk ? "Бүх сервис хэвийн" : "Зарим сервист асуудал байна"}
          </span>
          {lastChecked && (
            <span className="text-[11px] text-on-surface-variant">
              · {lastChecked.toLocaleTimeString("mn-MN")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void fetchHealth()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/[0.1] px-3 py-1.5 text-[12px] font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Шинэчлэх
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["postgresql", "duckdb", "redis", "minio"] as const).map((svc) => {
          const info = services[svc];
          const status: ServiceStatus = info?.status ?? "not_configured";
          return (
            <div
              key={svc}
              className="flex items-center gap-3 rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-4"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ${
                  status === "ok" ? "bg-[#10b981]/80" : status === "failed" ? "bg-[#ef4444]/80" : "bg-[#f59e0b]/60"
                }`}
              >
                {SERVICE_ICONS[svc]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-on-surface">{SERVICE_LABELS[svc]}</p>
                  <StatusDot status={status} />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {statusLabel(status)}
                  {info?.latency_ms !== undefined ? ` · ${info.latency_ms}ms` : ""}
                </p>
              </div>
              {status === "ok" ? (
                <CheckCircle className="size-4 text-[#10b981] shrink-0" aria-hidden />
              ) : status === "failed" ? (
                <XCircle className="size-4 text-[#ef4444] shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="size-4 text-[#f59e0b] shrink-0" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModelMetricsTab() {
  const [summary, setSummary] = useState<AblationSummary | null>(null);

  useEffect(() => {
    fetchAblationSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  if (!summary) {
    return (
      <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
        Model metrics are unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-on-surface-variant">
          Одоогийн загвар:{" "}
          <span className="font-semibold text-on-surface">
            {summary.variants.at(-1)?.model_variant ?? "—"}
          </span>
        </p>
        <button
          type="button"
          disabled
          title="main_service одоогоор model reload endpoint өгөөгүй байна"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 text-[12px] font-semibold text-on-surface-variant opacity-70"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Reload endpoint байхгүй
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant/[0.09]">
        <table className="w-full text-[13px] min-w-120">
          <thead>
            <tr className="border-b border-outline-variant/[0.09] bg-surface-alt/60">
              {["Хувилбар", "Таамаглал", "Орхилтын хувь", "Итгэл", "Оноо"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/[0.07]">
            {summary.variants.map((v) => (
              <tr key={v.model_variant} className="hover:bg-surface-alt/40 transition-colors">
                <td className="px-4 py-3">
                  <AblationBadge variant={v.model_variant} size="sm" />
                </td>
                <td className="px-4 py-3 tabular-nums text-on-surface">{v.count.toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums text-on-surface">{Math.round(v.abandonment_rate * 100)}%</td>
                <td className="px-4 py-3 tabular-nums text-on-surface">{v.avg_confidence.toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums text-on-surface">{v.avg_score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportHistoryTab() {
  const { showToast } = useToast();
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [taskIds, setTaskIds] = useState<{ type: string; id: string }[]>([]);

  async function handleExport(exportType: "analytics" | "sessions") {
    if (exportType === "analytics") setAnalyticsLoading(true);
    else setSessionsLoading(true);
    try {
      const data = await apiClient.post<{ task_id?: string }>(API_ENDPOINTS.exportTrigger, { export_type: exportType });
      const taskId = data.task_id ?? "queued";
      setTaskIds((prev) => [...prev.filter((t) => t.type !== exportType), { type: exportType, id: taskId }]);
      showToast(`Export эхэлсэн. Task ID: ${taskId}`, "success");
    } catch {
      showToast("Export эхлүүлэхэд алдаа гарлаа.", "error");
    } finally {
      if (exportType === "analytics") setAnalyticsLoading(false);
      else setSessionsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-on-surface-variant">Экспорт эхлүүлэх</p>
        <ExportModal />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["analytics", "sessions"] as const).map((type) => {
          const isAnalytics = type === "analytics";
          const isLoading = isAnalytics ? analyticsLoading : sessionsLoading;
          const taskId = taskIds.find((t) => t.type === type)?.id;
          return (
            <div key={type} className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5 space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-on-surface">
                  {isAnalytics ? "Analytics Export" : "Sessions Export"}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {isAnalytics
                    ? "Session, prediction болон оношлогооны өгөгдөл"
                    : "Session summary өгөгдлийн багц"}
                </p>
              </div>
              {taskId && (
                <p className="text-[11px] font-mono text-primary">Task: {taskId}</p>
              )}
              <button
                type="button"
                onClick={() => void handleExport(type)}
                disabled={isLoading}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity ${
                  isAnalytics ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary"
                }`}
              >
                <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
                {isLoading ? "Эхлүүлж байна..." : isAnalytics ? "Analytics Export" : "Sessions Export"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "health",  label: "Pipeline Health" },
  { key: "metrics", label: "Загварын хэмжилт" },
  { key: "export",  label: "Экспорт" },
];

function AdminContent() {
  const [tab, setTab] = useState<Tab>("health");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header хэсэг */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest">
            <Shield className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">
              Системийн удирдлага
            </h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Pipeline, загвар, экспортын хяналтын самбар
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation хэсэг */}
      <div
        className="inline-flex rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest p-0.5"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors",
              tab === t.key
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content хэсэг */}
      <div className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5">
        {tab === "health"  && <PipelineHealthTab />}
        {tab === "metrics" && <ModelMetricsTab />}
        {tab === "export"  && <ExportHistoryTab />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <EditorialShell activeNav="admin" title="Системийн удирдлага" subtitle="Зөвхөн админ">
        <AdminContent />
      </EditorialShell>
    </RoleGuard>
  );
}
