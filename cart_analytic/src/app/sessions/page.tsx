"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Filter,
  Monitor,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tablet,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import {
  fetchDashboardSessions,
  formatPct,
  REASON_LABELS,
  SCORE_ORDER,
  type DashboardSession,
  type PaginatedDashboardSessions,
  type ReasonCode,
} from "@/lib/services/dashboard-mvp";

const EMPTY_PAGE: PaginatedDashboardSessions = { count: 0, next: null, previous: null, results: [] };

function RiskChip({ probability }: { probability: number }) {
  const tone =
    probability >= 0.75
      ? { bg: "rgb(160 53 33 / 0.08)", fg: "#7E2A1A", dot: "#A03521", label: "High" }
      : probability >= 0.5
        ? { bg: "rgb(156 107 20 / 0.10)", fg: "#7C5410", dot: "#9C6B14", label: "Med" }
        : { bg: "rgb(31 77 62 / 0.08)", fg: "#1F4D3E", dot: "#1F4D3E", label: "Low" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: tone.dot }} />
      {formatPct(probability)}
      <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">{tone.label}</span>
    </span>
  );
}

function StatusDot({ value }: { value: string | null }) {
  if (!value) return <span className="text-[11px] text-on-surface-variant/60">—</span>;
  const map: Record<string, { dot: string; fg: string }> = {
    done:        { dot: "#1F4D3E", fg: "#1F4D3E" },
    in_progress: { dot: "#3E6E8E", fg: "#3E6E8E" },
    new:         { dot: "#9C6B14", fg: "#7C5410" },
    dismissed:   { dot: "#A8A29E", fg: "#57534E" },
  };
  const tone = map[value] ?? map.dismissed;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] capitalize" style={{ color: tone.fg }}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: tone.dot }} />
      {value.replace(/_/g, " ")}
    </span>
  );
}

function DeviceGlyph({ device }: { device: string | null | undefined }) {
  const Icon = device === "mobile" ? Smartphone : device === "tablet" ? Tablet : Monitor;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] capitalize text-on-surface-variant">
      <Icon className="size-3.5 text-on-surface-variant/60" strokeWidth={1.6} aria-hidden />
      {device || "unknown"}
    </span>
  );
}

function ReasonBadge({ code }: { code: ReasonCode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]"
        style={{ background: "rgb(31 77 62 / 0.08)", color: "#1F4D3E" }}
      >
        {code}
      </span>
      <span className="truncate text-[12px] text-on-surface-variant">{REASON_LABELS[code]}</span>
    </span>
  );
}

function MetricCell({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="tile rounded-md px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">{label}</p>
      <p
        className={`mt-1.5 text-[22px] tabular-nums ${accent ? "text-error" : "text-on-surface"}`}
        style={{
          fontFamily: "var(--font-display)",
          fontVariationSettings: '"opsz" 144, "SOFT" 30',
          letterSpacing: "-0.02em",
          fontWeight: 400,
        }}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10.5px] text-on-surface-variant/70">{hint}</p> : null}
    </div>
  );
}

function SessionsContent() {
  const [data, setData] = useState<PaginatedDashboardSessions>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [predictedClass, setPredictedClass] = useState("");
  const [dominantReason, setDominantReason] = useState("");
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (predictedClass) params.set("predicted_class", predictedClass);
    if (dominantReason) params.set("dominant_reason", dominantReason);
    if (highRiskOnly) params.set("high_risk", "true");
    return params.toString();
  }, [dominantReason, highRiskOnly, predictedClass, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardSessions(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sessions API request failed.");
      setData(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const list = data.results;
    return {
      total: data.count,
      high: list.filter((s) => (s.prediction?.abandonment_probability ?? 0) >= 0.75).length,
      abandoned: list.filter((s) => s.prediction?.predicted_class === "abandoned").length,
      converted: list.filter((s) => s.prediction?.predicted_class === "converted").length,
    };
  }, [data]);

  return (
    <EditorialShell activeNav="sessions" title="Sessions" subtitle="Evidence view for each prediction">
      <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 lg:px-10">
        {/* Header хэсэг */}
        <header className="page-enter">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant/70">
            Session ledger · per-prediction evidence
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1
                className="text-[36px] leading-[1.05] text-on-surface"
                style={{
                  fontFamily: "var(--font-display)",
                  fontVariationSettings: '"opsz" 144, "SOFT" 30',
                  fontWeight: 400,
                  letterSpacing: "-0.024em",
                }}
              >
                Sessions
              </h1>
              <p className="mt-1.5 max-w-[60ch] text-[12.5px] text-on-surface-variant">
                Search a session to inspect its event timeline, model output, S1–S7 diagnosis, and the resulting recommendation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-1.5 rounded-md hairline bg-surface-container-lowest px-3 py-1.5 text-[12px] font-medium text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="editorial-rule mt-6" />

        {/* Stat мөр */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <MetricCell label="Total sessions" value={stats.total.toLocaleString()} hint="Matching current filters" />
          <MetricCell label="High-risk" value={stats.high} accent hint="Probability ≥ 75%" />
          <MetricCell label="Abandoned" value={stats.abandoned} hint="Model-predicted" />
          <MetricCell label="Converted" value={stats.converted} hint="Reached purchase" />
        </section>

        {/* Filter-үүд */}
        <section className="mt-6 tile rounded-md">
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2 hairline-b">
            <SlidersHorizontal className="size-3.5 text-on-surface-variant/70" aria-hidden />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/80">
              Filter ledger
            </span>
            {(search || predictedClass || dominantReason || highRiskOnly) ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPredictedClass("");
                  setDominantReason("");
                  setHighRiskOnly(false);
                }}
                className="ml-auto text-[11px] font-medium text-primary hover:underline"
              >
                Clear all
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_180px_220px_140px]">
            <label className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-on-surface-variant/55 pointer-events-none" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by session_id"
                className="w-full h-9 rounded-md hairline bg-surface-container-lowest pl-8 pr-3 text-[12.5px] text-on-surface placeholder:text-on-surface-variant/45 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition"
              />
            </label>
            <select
              value={predictedClass}
              onChange={(e) => setPredictedClass(e.target.value)}
              className="h-9 rounded-md hairline bg-surface-container-lowest px-2.5 text-[12.5px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="">All classes</option>
              <option value="abandoned">Abandoned</option>
              <option value="converted">Converted</option>
            </select>
            <select
              value={dominantReason}
              onChange={(e) => setDominantReason(e.target.value)}
              className="h-9 rounded-md hairline bg-surface-container-lowest px-2.5 text-[12.5px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="">All dominant reasons</option>
              {SCORE_ORDER.map((code) => (
                <option key={code} value={code}>
                  {code} · {REASON_LABELS[code]}
                </option>
              ))}
            </select>
            <label className="inline-flex h-9 cursor-pointer items-center justify-between gap-2 rounded-md hairline bg-surface-container-lowest px-3 text-[12px] font-medium text-on-surface">
              <span className="inline-flex items-center gap-1.5">
                <Filter className="size-3.5 text-on-surface-variant/70" aria-hidden />
                High-risk only
              </span>
              <input
                type="checkbox"
                checked={highRiskOnly}
                onChange={(e) => setHighRiskOnly(e.target.checked)}
                className="size-3.5 accent-primary"
              />
            </label>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-md border border-error/25 bg-error/[0.05] px-4 py-3 text-[12.5px] text-error">
            {error}
          </div>
        ) : null}

        {/* Хүснэгт */}
        <section className="mt-4 overflow-hidden tile rounded-md">
          <div className="flex items-center justify-between px-4 py-3 hairline-b">
            <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-on-surface">Predictions</h2>
            <span className="text-[11px] text-on-surface-variant">
              Showing <span className="tabular-nums text-on-surface">{data.results.length}</span> of{" "}
              <span className="tabular-nums text-on-surface">{data.count}</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-[12.5px]">
              <thead>
                <tr className="bg-surface-container-low/40 text-left">
                  {[
                    "Session",
                    "Class",
                    "Probability",
                    "Dominant reason",
                    "Device",
                    "Events",
                    "Recommendation",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/75 hairline-b"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index}>
                      {Array.from({ length: 8 }).map((__, cell) => (
                        <td key={cell} className="px-4 py-3 hairline-b">
                          <div className="skeleton h-3 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <p
                          className="text-[20px] text-on-surface"
                          style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 96', fontWeight: 400, letterSpacing: "-0.02em" }}
                        >
                          No sessions match.
                        </p>
                        <p className="mt-2 text-[12.5px] text-on-surface-variant">
                          Adjust filters or generate a session in the demo shop. The Main service ingests new predictions
                          within a few seconds.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.results.map((session: DashboardSession) => {
                    const reason = session.diagnosis?.dominant_reason as ReasonCode | undefined;
                    const probability = session.prediction?.abandonment_probability ?? 0;
                    return (
                      <tr key={session.session_id} className="group transition-colors hover:bg-surface-container-low/40">
                        <td className="px-4 py-3 hairline-b">
                          <Link
                            href={`/sessions/${session.session_id}`}
                            className="font-mono text-[11.5px] text-on-surface group-hover:text-primary transition-colors"
                          >
                            {session.session_id}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hairline-b">
                          {session.prediction?.predicted_class ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize"
                              style={{
                                background:
                                  session.prediction.predicted_class === "abandoned"
                                    ? "rgb(160 53 33 / 0.08)"
                                    : "rgb(31 77 62 / 0.08)",
                                color:
                                  session.prediction.predicted_class === "abandoned"
                                    ? "#7E2A1A"
                                    : "#1F4D3E",
                              }}
                            >
                              {session.prediction.predicted_class}
                            </span>
                          ) : (
                            <span className="text-[11.5px] text-on-surface-variant/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hairline-b">
                          <RiskChip probability={probability} />
                        </td>
                        <td className="px-4 py-3 hairline-b">
                          {reason ? (
                            <ReasonBadge code={reason} />
                          ) : (
                            <span className="text-[11.5px] text-on-surface-variant/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hairline-b">
                          <DeviceGlyph device={session.device_type} />
                        </td>
                        <td className="px-4 py-3 hairline-b">
                          <span className="font-mono text-[11.5px] tabular-nums text-on-surface">
                            {session.event_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 hairline-b">
                          <StatusDot value={session.recommendation_status} />
                        </td>
                        <td className="px-4 py-3 text-right hairline-b">
                          <Link
                            href={`/sessions/${session.session_id}`}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            Open
                            <ArrowUpRight className="size-3.5" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footnote хэсэг */}
        <div className="mt-6 flex items-start gap-2 text-[11.5px] text-on-surface-variant/80">
          <span aria-hidden className="mt-1 size-1 shrink-0 rounded-full bg-on-surface-variant/40" />
          <p>
            <span className="font-medium text-on-surface-variant">Tip.</span> Copy a demo session ID from the storefront,
            paste it into search, then open the evidence view to inspect the model output and S1–S7 reasoning.
          </p>
        </div>
      </div>
    </EditorialShell>
  );
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <EditorialShell activeNav="sessions" title="Sessions" subtitle="Loading sessions">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <div className="skeleton h-10 w-64 rounded" />
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-md" />
              ))}
            </div>
            <div className="mt-6 skeleton h-96 rounded-md" />
          </div>
        </EditorialShell>
      }
    >
      <SessionsContent />
    </Suspense>
  );
}
