"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import EditorialShell from "@/components/editorial/EditorialShell";
import { apiClient, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import { RISK_THRESHOLDS } from "@/lib/constants";
import type { DiagnosisEntry, DiagnosisRisk } from "@/lib/services/diagnosis";

const riskConfig: Record<DiagnosisRisk, { label: string; color: string; icon: string }> = {
  high:   { label: "Өндөр", color: "bg-error/10 text-error border-error/20",             icon: "error" },
  medium: { label: "Дунд",  color: "bg-tertiary/10 text-tertiary border-tertiary/20",     icon: "warning" },
  low:    { label: "Бага",  color: "bg-secondary/10 text-secondary border-secondary/20",  icon: "check_circle" },
};

const MOCK_ENTRIES: DiagnosisEntry[] = [
  { id: "DX-001", sessionId: "sess_abc123", createdAt: "2026-04-22", riskLevel: "high",   dominantScore: "S1", predictionScore: 0.82 },
  { id: "DX-002", sessionId: "sess_def456", createdAt: "2026-04-21", riskLevel: "medium", dominantScore: "S3", predictionScore: 0.55 },
  { id: "DX-003", sessionId: "sess_ghi789", createdAt: "2026-04-21", riskLevel: "low",    dominantScore: "S6", predictionScore: 0.22 },
  { id: "DX-004", sessionId: "sess_jkl012", createdAt: "2026-04-20", riskLevel: "high",   dominantScore: "S7", predictionScore: 0.91 },
  { id: "DX-005", sessionId: "sess_mno345", createdAt: "2026-04-20", riskLevel: "medium", dominantScore: "S2", predictionScore: 0.61 },
];

async function fetchHistory(p: {
  from?: string;
  to?: string;
  risk?: string;
  search?: string;
  page?: number;
}): Promise<{ results: DiagnosisEntry[]; count: number }> {
  const qs = new URLSearchParams();
  if (p.from)             qs.set("from",   p.from);
  if (p.to)               qs.set("to",     p.to);
  if (p.risk)             qs.set("risk",   p.risk);
  if (p.search)           qs.set("search", p.search);
  if (p.page && p.page > 1) qs.set("page", String(p.page));
  const endpoint = `${API_ENDPOINTS.analyticsHistory}?${qs.toString()}`;
  try {
    const data = await apiClient.get<{ results: DiagnosisEntry[]; count: number } | DiagnosisEntry[]>(endpoint);
    if (Array.isArray(data)) return { results: data, count: data.length };
    return data;
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", endpoint);
      let results = MOCK_ENTRIES;
      if (p.risk)   results = results.filter((e) => e.riskLevel === p.risk);
      if (p.search) results = results.filter((e) => e.sessionId.includes(p.search!) || e.id.includes(p.search!));
      return { results, count: results.length };
    }
    throw error;
  }
}

async function triggerReport(from?: string, to?: string): Promise<{ task_id?: string }> {
  const body: Record<string, string> = { export_type: "analytics" };
  if (from) body.from = from;
  if (to)   body.to   = to;
  try {
    return await apiClient.post<{ task_id?: string }>(API_ENDPOINTS.exportTrigger, body);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.exportTrigger);
      return { task_id: "mock_task_123" };
    }
    throw error;
  }
}

export default function DiagnosticsPage() {
  const [entries, setEntries]         = useState<DiagnosisEntry[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [exporting, setExporting]     = useState(false);
  const [exportTaskId, setExportTaskId] = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [risk, setRisk]               = useState("");
  const [from, setFrom]               = useState("");
  const [to, setTo]                   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistory({ from, to, risk, search, page });
      setEntries(data.results);
      setTotal(data.count);
    } finally {
      setLoading(false);
    }
  }, [from, to, risk, search, page]);

  useEffect(() => { void load(); }, [load]);

  async function handleExport() {
    setExporting(true);
    setExportTaskId(null);
    try {
      const res = await triggerReport(from || undefined, to || undefined);
      setExportTaskId(res.task_id ?? "queued");
    } finally {
      setExporting(false);
    }
  }

  return (
    <EditorialShell activeNav="diagnosis" title="Оношлогооны түүх" subtitle="Session Diagnostics">
      <div className="px-8 py-6 max-w-[1400px] mx-auto space-y-5 pb-12">

        {/* Filters & Actions */}
        <section className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 px-3 py-2">
            <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden>search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none w-44"
              placeholder="Session ID хайх..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search ? (
              <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm" aria-hidden>close</span>
              </button>
            ) : null}
          </div>

          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none"
            title="Эхлэх огноо"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none"
            title="Дуусах огноо"
          />

          <select
            value={risk}
            onChange={(e) => { setRisk(e.target.value); setPage(1); }}
            className="border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none"
          >
            <option value="">Бүх эрсдэл</option>
            <option value="high">Өндөр</option>
            <option value="medium">Дунд</option>
            <option value="low">Бага</option>
          </select>

          <span className="text-[0.6875rem] text-on-surface-variant ml-auto">
            {loading ? "Ачааллаж байна..." : `${entries.length} / ${total} үр дүн`}
          </span>

          {exportTaskId ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1.5">
              <span className="material-symbols-outlined text-sm" aria-hidden>task_alt</span>
              Task: {exportTaskId}
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base" aria-hidden>download</span>
            {exporting ? "Боловсруулж байна..." : "Report татах"}
          </button>
        </section>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                {["Огноо", "Session ID", "Давамгай Score", "Эрсдэл", "Prediction", "Үйлдэл"].map((h) => (
                  <th
                    key={h}
                    className={`py-3 px-4 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant ${h === "Үйлдэл" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 rounded bg-surface-container-low animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 opacity-30" aria-hidden>search_off</span>
                    Үр дүн олдсонгүй.
                  </td>
                </tr>
              ) : (
                entries.map((e) => {
                  const rConf = riskConfig[e.riskLevel];
                  const pct   = Math.round(e.predictionScore * 100);
                  const barColor =
                    e.predictionScore >= RISK_THRESHOLDS.HIGH
                      ? "bg-error"
                      : e.predictionScore >= RISK_THRESHOLDS.MEDIUM
                        ? "bg-tertiary"
                        : "bg-secondary";
                  return (
                    <tr key={e.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant">{e.createdAt}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-on-surface">{e.sessionId}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 text-[0.625rem] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/20">
                          {e.dominantScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-bold border ${rConf.color}`}>
                          <span className="material-symbols-outlined text-[0.75rem]" aria-hidden style={{ fontVariationSettings: "'FILL' 1" }}>
                            {rConf.icon}
                          </span>
                          {rConf.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 h-1 bg-surface-container">
                            <div className={`h-1 ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              e.predictionScore >= RISK_THRESHOLDS.HIGH
                                ? "text-error"
                                : e.predictionScore >= RISK_THRESHOLDS.MEDIUM
                                  ? "text-tertiary"
                                  : "text-secondary"
                            }`}
                          >
                            {e.predictionScore.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/diagnosis/${e.id}`}
                          className="inline-flex items-center gap-1 text-secondary text-xs font-semibold hover:underline"
                        >
                          Нээх
                          <span className="material-symbols-outlined text-sm" aria-hidden>arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > entries.length ? (
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Хуудас {page}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-outline-variant/15 disabled:opacity-40 hover:bg-surface-container transition-colors"
              >
                ← Өмнөх
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-outline-variant/15 hover:bg-surface-container transition-colors"
              >
                Дараах →
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </EditorialShell>
  );
}
