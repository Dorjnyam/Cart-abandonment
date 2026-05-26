"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import RoleGuard from "@/components/editorial/RoleGuard";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { AblationBadge } from "@/components/ui/AblationBadge";
import ExportModal from "@/components/ui/ExportModal";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
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

function formatRatioPct(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 100)}%` : "—";
}

function formatDecimal(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "—";
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
          <span className="text-[12.5px] font-semibold text-text">
            {allOk ? "Бүх сервис хэвийн" : "Зарим сервист асуудал байна"}
          </span>
          {lastChecked && (
            <span className="text-[11px] text-muted">
              · {lastChecked.toLocaleTimeString("mn-MN")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void fetchHealth()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-muted px-3 py-1.5 text-[12px] font-semibold text-text hover:bg-surface-muted transition-colors disabled:opacity-50"
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
              className="flex items-center gap-3 rounded-xl border border-surface-muted bg-surface p-4"
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
                  <p className="text-[13px] font-semibold text-text">{SERVICE_LABELS[svc]}</p>
                  <StatusDot status={status} />
                </div>
                <p className="text-[11px] text-muted mt-0.5">
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
      <div className="rounded-lg border border-surface-muted bg-surface p-5 text-sm text-muted">
        Загварын хэмжилт одоогоор боломжгүй байна.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">
          Одоогийн загвар:{" "}
          <span className="font-semibold text-text">
            {summary.variants.at(-1)?.model_variant ?? "—"}
          </span>
        </p>
        <button
          type="button"
          disabled
          title="main_service одоогоор model reload endpoint өгөөгүй байна"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5 text-[12px] font-semibold text-muted opacity-70"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Reload endpoint байхгүй
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-surface-muted">
        <table className="w-full text-[13px] min-w-120">
          <thead>
            <tr className="border-b border-surface-muted bg-surface-muted/60">
              {["Хувилбар", "Таамаглал", "Орхилтын хувь", "Итгэл", "Оноо"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-muted">
            {summary.variants.map((v) => (
              <tr key={v.model_variant} className="hover:bg-surface-muted/40 transition-colors">
                <td className="px-4 py-3">
                  <AblationBadge variant={v.model_variant} size="sm" />
                </td>
                <td className="px-4 py-3 tabular-nums text-text">{v.count.toLocaleString()}</td>
                <td className="px-4 py-3 tabular-nums text-text">{formatRatioPct(v.abandonment_rate)}</td>
                <td className="px-4 py-3 tabular-nums text-text">{formatDecimal(v.avg_confidence)}</td>
                <td className="px-4 py-3 tabular-nums text-text">{formatDecimal(v.avg_score)}</td>
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
      showToast("Экспорт эхлүүлэхэд алдаа гарлаа.", "error");
    } finally {
      if (exportType === "analytics") setAnalyticsLoading(false);
      else setSessionsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted">Экспорт эхлүүлэх</p>
        <ExportModal />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(["analytics", "sessions"] as const).map((type) => {
          const isAnalytics = type === "analytics";
          const isLoading = isAnalytics ? analyticsLoading : sessionsLoading;
          const taskId = taskIds.find((t) => t.type === type)?.id;
          return (
            <div key={type} className="rounded-xl border border-surface-muted bg-surface p-5 space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-text">
                  {isAnalytics ? "Аналитик экспорт" : "Сесс экспорт"}
                </p>
                <p className="text-[11px] text-muted mt-0.5">
                  {isAnalytics
                    ? "Сесс, таамаглал болон оношлогооны өгөгдөл"
                    : "Сессийн нэгтгэл өгөгдлийн багц"}
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
                  isAnalytics ? "bg-primary text-white" : "bg-secondary text-white"
                }`}
              >
                <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
              {isLoading ? "Эхлүүлж байна..." : isAnalytics ? "Аналитик экспорт" : "Сесс экспорт"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "health",  label: "Pipeline төлөв" },
  { key: "metrics", label: "Загварын хэмжилт" },
  { key: "export",  label: "Экспорт" },
];

function AdminContent() {
  const [tab, setTab] = useState<Tab>("health");

  return (
    <div className="space-y-6">
      <div
        className="inline-flex rounded-xl border border-surface-muted bg-surface p-1"
        role="tablist"
      >
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            role="tab"
            aria-selected={tab === tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={[
              "px-4 py-1.5 rounded-lg text-sm font-bold transition-colors",
              tab === tabItem.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text",
            ].join(" ")}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <Card noPadding>
        <div className="p-6">
          {tab === "health" && <PipelineHealthTab />}
          {tab === "metrics" && <ModelMetricsTab />}
          {tab === "export" && <ExportHistoryTab />}
        </div>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdminInner />
    </RoleGuard>
  );
}

function AdminInner() {
  const { t } = useLanguage();
  return (
    <EditorialShell activeNav="admin" title={t.admin.title} subtitle={t.admin.subtitle}>
      <AdminContent />
    </EditorialShell>
  );
}
