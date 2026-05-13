"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Filter,
  Monitor,
  RefreshCw,
  Search,
  Smartphone,
  Tablet,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchDashboardSessions,
  formatPct,
  REASON_LABELS,
  SCORE_ORDER,
  type DashboardSession,
  type PaginatedDashboardSessions,
  type ReasonCode,
} from "@/lib/services/dashboard-mvp";
import {
  deviceLabel,
  predictionClassLabel,
  recommendationStatusLabel,
  riskLabel,
} from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

const EMPTY_PAGE: PaginatedDashboardSessions = { count: 0, next: null, previous: null, results: [] };

function RiskChip({ probability }: { probability: number }) {
  const variant: "error" | "warning" | "success" =
    probability >= 0.75 ? "error" : probability >= 0.5 ? "warning" : "success";
  const label =
    probability >= 0.75 ? riskLabel("high") : probability >= 0.5 ? riskLabel("medium") : riskLabel("low");
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant={variant}>{formatPct(probability)}</Badge>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
    </span>
  );
}

function StatusDot({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted">—</span>;
  const map: Record<string, string> = {
    done: "bg-success",
    in_progress: "bg-secondary",
    new: "bg-warning",
    dismissed: "bg-muted",
  };
  const dot = map[value] ?? map.dismissed;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {recommendationStatusLabel(value)}
    </span>
  );
}

function DeviceGlyph({ device }: { device: string | null | undefined }) {
  const Icon = device === "mobile" ? Smartphone : device === "tablet" ? Tablet : Monitor;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Icon className="size-3.5" strokeWidth={1.6} />
      {deviceLabel(device)}
    </span>
  );
}

function ReasonBadge({ code }: { code: ReasonCode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="primary">{code}</Badge>
      <span className="truncate text-xs text-muted">{REASON_LABELS[code]}</span>
    </span>
  );
}

function MetricTile({
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
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-display font-extrabold tabular-nums text-2xl leading-none",
          accent ? "text-error" : "text-text",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </Card>
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
  const { t, lang } = useLanguage();

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
      setError(
        err instanceof Error
          ? err.message
          : lang === "EN"
            ? "Sessions request failed."
            : "Сессийн API хүсэлт амжилтгүй боллоо.",
      );
      setData(EMPTY_PAGE);
    } finally {
      setLoading(false);
    }
  }, [query, lang]);

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

  const filtersActive = Boolean(search || predictedClass || dominantReason || highRiskOnly);

  return (
    <EditorialShell
      activeNav="sessions"
      title={t.sessions.sessionsOverview}
      subtitle={t.sessions.subtitle}
      right={
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-muted/70"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          {t.common.refresh}
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          <MetricTile
            label={t.common.total}
            value={stats.total.toLocaleString()}
            hint={lang === "EN" ? "Matching current filters" : "Одоогийн шүүлтүүрт"}
          />
          <MetricTile
            label={t.common.highRisk}
            value={stats.high}
            accent
            hint={lang === "EN" ? "P ≥ 75%" : "Магадлал ≥ 75%"}
          />
          <MetricTile
            label={t.common.abandoned}
            value={stats.abandoned}
            hint={lang === "EN" ? "Model prediction" : "Загварын таамаглал"}
          />
          <MetricTile
            label={t.common.completed}
            value={stats.converted}
            hint={lang === "EN" ? "Purchase reached" : "Худалдан авалт хүрсэн"}
          />
        </section>

        <Card
          title={lang === "EN" ? "Filters" : "Шүүлтүүр"}
          headerAction={
            filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPredictedClass("");
                  setDominantReason("");
                  setHighRiskOnly(false);
                }}
                className="text-xs font-extrabold text-primary hover:underline"
              >
                {lang === "EN" ? "Clear all" : "Бүгдийг цэвэрлэх"}
              </button>
            ) : null
          }
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px_180px]">
            <label className="relative flex items-center">
              <Search className="absolute left-3 size-4 text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.sessions.searchPlaceholder}
                className="w-full h-10 rounded-xl border border-surface-muted bg-bg pl-10 pr-3 text-sm text-text placeholder:text-muted outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
              />
            </label>
            <select
              value={predictedClass}
              onChange={(e) => setPredictedClass(e.target.value)}
              className="h-10 rounded-xl border border-surface-muted bg-bg px-3 text-sm text-text outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
            >
              <option value="">{lang === "EN" ? "All classes" : "Бүх ангилал"}</option>
              <option value="abandoned">{predictionClassLabel("abandoned")}</option>
              <option value="converted">{predictionClassLabel("converted")}</option>
            </select>
            <select
              value={dominantReason}
              onChange={(e) => setDominantReason(e.target.value)}
              className="h-10 rounded-xl border border-surface-muted bg-bg px-3 text-sm text-text outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all"
            >
              <option value="">{t.common.allReasons}</option>
              {SCORE_ORDER.map((code) => (
                <option key={code} value={code}>
                  {code} · {REASON_LABELS[code]}
                </option>
              ))}
            </select>
            <label className="inline-flex h-10 cursor-pointer items-center justify-between gap-2 rounded-xl border border-surface-muted bg-bg px-3 text-xs font-bold text-text">
              <span className="inline-flex items-center gap-1.5">
                <Filter className="size-3.5 text-muted" />
                {t.common.highRisk}
              </span>
              <input
                type="checkbox"
                checked={highRiskOnly}
                onChange={(e) => setHighRiskOnly(e.target.checked)}
                className="size-4 accent-primary"
              />
            </label>
          </div>
        </Card>

        {error ? (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <Card
          title={lang === "EN" ? "Predictions" : "Таамаглалууд"}
          headerAction={
            <span className="text-xs text-muted">
              {lang === "EN"
                ? `${data.results.length} of ${data.count}`
                : `${data.count}-аас ${data.results.length}`}
            </span>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-bg text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">
                  {[
                    t.sessions.table.session,
                    t.sessions.table.class,
                    t.sessions.table.probability,
                    t.sessions.table.reason,
                    t.sessions.table.device,
                    t.sessions.table.events,
                    t.sessions.table.recommendation,
                    "",
                  ].map((h, i) => (
                    <th key={i} className="border-b border-surface-muted px-4 py-3">
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
                        <td key={cell} className="border-b border-surface-muted/60 px-4 py-3.5">
                          <div className="h-3 w-full rounded bg-surface-muted animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : data.results.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="mx-auto max-w-md">
                        <p className="text-xl font-display font-extrabold text-text">
                          {lang === "EN" ? "No matching sessions." : "Таарах сесс алга."}
                        </p>
                        <p className="mt-2 text-sm text-muted leading-relaxed">
                          {lang === "EN"
                            ? "Adjust the filters or generate sessions on the demo storefront. New predictions arrive within seconds."
                            : "Шүүлтүүрээ өөрчлөх эсвэл demo shop дээр сесс үүсгэнэ үү. Шинэ таамаглал хэдхэн секундын дотор боловсруулагдана."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.results.map((session: DashboardSession) => {
                    const reason = session.diagnosis?.dominant_reason as ReasonCode | undefined;
                    const probability = session.prediction?.abandonment_probability ?? 0;
                    return (
                      <tr
                        key={session.session_id}
                        className="group transition-colors hover:bg-surface-muted/40 border-b border-surface-muted/60"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/sessions/${session.session_id}`}
                            className="font-mono text-xs text-text group-hover:text-primary transition-colors"
                          >
                            {session.session_id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {session.prediction?.predicted_class ? (
                            <Badge
                              variant={
                                session.prediction.predicted_class === "abandoned"
                                  ? "error"
                                  : "success"
                              }
                            >
                              {predictionClassLabel(session.prediction.predicted_class)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <RiskChip probability={probability} />
                        </td>
                        <td className="px-4 py-3">
                          {reason ? (
                            <ReasonBadge code={reason} />
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <DeviceGlyph device={session.device_type} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs tabular-nums text-text">
                            {session.event_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusDot value={session.recommendation_status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/sessions/${session.session_id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            {t.common.view}
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-xs text-muted leading-relaxed">
          <span className="font-bold text-text">
            {lang === "EN" ? "Tip." : "Зөвлөгөө."}
          </span>{" "}
          {lang === "EN"
            ? "Paste a demo session ID into search to inspect the prediction trace, SHAP contributions, and S1–S7 diagnosis."
            : "Storefront дээрээс demo session ID хуулж, хайлт дээр оруулаад нотолгооны дэлгэцээс загварын гаралт болон S1–S7 тайлбарыг шалгаарай."}
        </p>
      </div>
    </EditorialShell>
  );
}

export default function SessionsPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <EditorialShell activeNav="sessions" title={t.sessions.sessionsOverview}>
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-surface-muted animate-pulse" />
              ))}
            </div>
            <div className="h-[480px] rounded-xl bg-surface-muted animate-pulse" />
          </div>
        </EditorialShell>
      }
    >
      <SessionsContent />
    </Suspense>
  );
}
