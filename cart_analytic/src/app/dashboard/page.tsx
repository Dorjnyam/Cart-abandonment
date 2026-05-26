"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Lightbulb,
  Loader2,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchDashboardOverview,
  formatPct,
  REASON_LABELS,
  SCORE_ORDER,
  type DashboardOverview,
  type DashboardSession,
} from "@/lib/services/dashboard-mvp";
import {
  predictionClassLabel,
  priorityLabel,
  recommendationStatusLabel,
  sourceLabel,
} from "@/lib/mn-labels";
import { CHART_TOKENS, chartSeries } from "@/lib/chart-tokens";
import { cn } from "@/lib/utils";

const intFmt = new Intl.NumberFormat("en-US");

function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return intFmt.format(n);
}

function formatRelativeTime(iso: string | null | undefined, lang: "EN" | "MN"): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Math.floor((Date.now() - d) / 1000);
  const u = (s: string, m: string) => (lang === "EN" ? s : m);
  if (diff < 60) return `${diff}${u("s", " сек")}`;
  if (diff < 3600) return `${Math.floor(diff / 60)}${u("m", " мин")}`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}${u("h", " цаг")}`;
  return `${Math.floor(diff / 86_400)}${u("d", " өдөр")}`;
}

function KpiTile({
  label,
  value,
  delta,
  spark,
  tone = "neutral",
  helper,
  Icon,
}: {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down"; positive: boolean };
  spark?: number[];
  tone?: "neutral" | "risk" | "good";
  helper?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  const valueColor =
    tone === "risk" ? "text-error" : tone === "good" ? "text-primary" : "text-text";
  const sparkColor =
    tone === "risk" ? CHART_TOKENS.riskHigh : tone === "good" ? CHART_TOKENS.primary : CHART_TOKENS.secondary;
  const sparkData = (spark ?? []).map((v, i) => ({ i, v }));
  const id = `sg-${label.replace(/\s/g, "")}`;
  const toneVars =
    tone === "risk"
      ? { fg: "var(--error)", bg: "rgb(var(--error-rgb) / 0.12)" }
      : tone === "good"
        ? { fg: "var(--primary)", bg: "rgb(var(--primary-rgb) / 0.12)" }
        : { fg: "var(--secondary)", bg: "rgb(var(--secondary-rgb) / 0.12)" };
  const deltaVars = delta?.positive
    ? { fg: "var(--primary)", bg: "rgb(var(--primary-rgb) / 0.10)" }
    : { fg: "var(--error)", bg: "rgb(var(--error-rgb) / 0.10)" };

  return (
    <Card className="hover:shadow-md hover:border-primary/30 transition-all group">
      <div className="flex justify-between items-start mb-2 gap-3">
        <span className="text-xs font-bold text-muted tracking-tight uppercase">{label}</span>
        {Icon ? (
          <div
            className="p-2 rounded-lg"
            style={{ background: toneVars.bg, color: toneVars.fg }}
          >
            <Icon className="w-5 h-5" />
          </div>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-4">
        <div
          className={cn("font-display font-extrabold tracking-tight tabular-nums", valueColor)}
          style={{ fontSize: 30, lineHeight: 1.05 }}
        >
          {value}
        </div>
        {sparkData.length > 1 ? (
          <div className="h-10 w-20 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <defs>
                  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.6} fill={`url(#${id})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 mt-3">
        {helper ? <span className="text-xs text-muted truncate">{helper}</span> : <span />}
        {delta ? (
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums"
            style={{ background: deltaVars.bg, color: deltaVars.fg }}
          >
              {delta.direction === "up" ? (
                <ArrowUpRight className="size-3 inline" />
              ) : (
                <ArrowDownRight className="size-3 inline" />
              )}
              {delta.value}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

function metricDelta(
  values: number[],
  format: "percent-change" | "percentage-points",
  positiveWhen: "up" | "down",
): { value: string; direction: "up" | "down"; positive: boolean } | undefined {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length < 2) return undefined;

  const first = valid[0];
  const last = valid[valid.length - 1];
  const diff = last - first;
  const direction = diff >= 0 ? "up" : "down";
  const positive = positiveWhen === direction || Math.abs(diff) < 0.0001;

  if (format === "percent-change") {
    if (first === 0) return undefined;
    return {
      value: `${Math.abs((diff / Math.abs(first)) * 100).toFixed(1)}%`,
      direction,
      positive,
    };
  }

  return {
    value: `${Math.abs(diff * 100).toFixed(1)} pp`,
    direction,
    positive,
  };
}

function CompactTile({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "risk" | "good";
}) {
  const valueColor =
    tone === "risk" ? "text-error" : tone === "good" ? "text-primary" : "text-text";
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className={cn("mt-2 text-2xl font-display font-extrabold tabular-nums leading-none", valueColor)}>
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs text-muted truncate">{helper}</p> : null}
    </Card>
  );
}

function RiskChip({ p }: { p: number }) {
  const variant: "error" | "warning" | "success" = p >= 0.75 ? "error" : p >= 0.5 ? "warning" : "success";
  return <Badge variant={variant}>{formatPct(p)}</Badge>;
}

function ReasonScoreRow({
  code,
  label,
  value,
  dominant,
  highlight,
  dominantLabel,
}: {
  code: string;
  label: string;
  value: number;
  dominant: number;
  highlight?: boolean;
  dominantLabel: string;
}) {
  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)_48px] items-center gap-3 py-1.5">
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-center text-[11px] font-extrabold tabular-nums",
          highlight ? "bg-primary text-white" : "bg-primary/10 text-primary",
        )}
      >
        {code}
      </span>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="truncate text-text">{label}</span>
          <span className="tabular-nums text-muted">
            {dominant} {dominantLabel}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, value * 100)}%` }}
          />
        </div>
      </div>
      <span className="text-right text-xs font-bold tabular-nums text-text">{value.toFixed(2)}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7d" | "14d" | "30d">("7d");
  const { t, lang } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardOverview());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "EN"
            ? "Dashboard request failed."
            : "Хяналтын самбарын хүсэлт амжилтгүй боллоо.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const reasonDistribution = useMemo(() => {
    if (!data) return [];
    return data.reasons
      .filter((r) => r.dominant_sessions > 0)
      .map((r) => ({ name: r.code, value: r.dominant_sessions, label: r.label }));
  }, [data]);

  const rangeDays = range === "30d" ? 30 : range === "14d" ? 14 : 7;
  const trendWindow = useMemo(
    () => (data?.trend ?? []).slice(-rangeDays),
    [data, rangeDays],
  );
  const sessionsSpark = useMemo(
    () => trendWindow.map((p) => p.sessions),
    [trendWindow],
  );
  const rateSpark = useMemo(
    () => trendWindow.map((p) => p.abandonment_rate),
    [trendWindow],
  );
  const conversionSpark = useMemo(
    () => rateSpark.map((v) => Math.max(0, 1 - v)),
    [rateSpark],
  );
  const sessionsDelta = useMemo(
    () => metricDelta(sessionsSpark, "percent-change", "up"),
    [sessionsSpark],
  );
  const abandonmentDelta = useMemo(
    () => metricDelta(rateSpark, "percentage-points", "down"),
    [rateSpark],
  );
  const conversionDelta = useMemo(
    () => metricDelta(conversionSpark, "percentage-points", "up"),
    [conversionSpark],
  );

  const dominantWord = lang === "EN" ? "dominant" : "давамгай";
  const trendDataLabel = lang === "EN" ? "Sessions" : "Сесс";
  const trendRateLabel = lang === "EN" ? "Abandon rate" : "Орхилт";
  const inactiveActionLabel = lang === "EN" ? "No recommendations yet." : "Зөвлөмж одоогоор алга.";

  const right = (
    <div className="flex items-center gap-2">
      <div className="hidden md:inline-flex rounded-xl bg-surface-muted p-1 text-xs">
        {(["7d", "14d", "30d"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={cn(
              "rounded-lg px-2.5 py-1 font-bold transition-colors",
              range === r ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void load()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted text-text text-xs font-bold hover:bg-surface-muted/70"
      >
        <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        {t.common.refresh}
      </button>
    </div>
  );

  return (
    <EditorialShell
      activeNav="dashboard"
      title={t.dashboard.title}
      subtitle={t.dashboard.subtitle}
      right={right}
    >
      <div className="space-y-6">
        {data?.model ? (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="inline-flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-1.5 text-text">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="font-extrabold">{data.model.active_model}</span>
              <span className="text-muted">·</span>
              <span className="font-mono text-[10.5px] text-muted">{data.model.model_version}</span>
              <span className="text-muted">·</span>
              <span className="text-muted">τ {data.model.threshold}</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {loading || !data ? (
          <div className="flex h-72 items-center justify-center text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiTile
                label={t.dashboard.totalSessions}
                value={formatNumber(data.summary.total_sessions)}
                helper={t.common.last30d}
                spark={sessionsSpark}
                Icon={Users}
                delta={sessionsDelta}
              />
              <KpiTile
                label={t.dashboard.abandonmentRate}
                value={formatPct(data.summary.abandonment_rate)}
                helper={`${formatNumber(data.summary.abandoned_sessions)} · ${t.common.abandoned.toLowerCase()}`}
                spark={rateSpark}
                tone="risk"
                Icon={TrendingDown}
                delta={abandonmentDelta}
              />
              <KpiTile
                label={t.dashboard.conversionRate}
                value={formatPct(data.summary.conversion_rate)}
                helper={`${formatNumber(data.summary.converted_sessions)} · ${t.common.completed.toLowerCase()}`}
                tone="good"
                Icon={ShoppingCart}
                spark={conversionSpark}
                delta={conversionDelta}
              />
              <KpiTile
                label={t.dashboard.avgAbandonProb}
                value={formatPct(data.summary.average_abandonment_probability)}
                helper={`τ = ${data.model.threshold.toFixed(2)}`}
                Icon={Activity}
              />
            </section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <CompactTile
                label={t.dashboard.highRiskSessions}
                value={formatNumber(data.summary.high_risk_sessions)}
                helper={`P ≥ ${data.model.threshold}`}
                tone="risk"
              />
              <CompactTile
                label={t.dashboard.activeRecommendations}
                value={formatNumber(data.summary.active_recommendations)}
              />
              <CompactTile
                label={t.dashboard.topReason}
                value={data.top_reason.score}
                helper={data.top_reason.label}
              />
              <CompactTile
                label={t.dashboard.averageReason}
                value={data.top_reason.value.toFixed(2)}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card
                className="lg:col-span-2"
                title={t.dashboard.abandonmentTrend}
                subtitle={
                  lang === "EN"
                    ? "Sessions processed daily and the abandonment rate."
                    : "Өдөр бүр боловсруулсан сесс ба орхилтын хувь."
                }
                headerAction={
                  <div className="hidden md:flex items-center gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-secondary/40" />
                      {trendDataLabel}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-0.5 w-3 bg-error" />
                      {trendRateLabel}
                    </span>
                  </div>
                }
                noPadding
              >
                {trendWindow.length ? (
                  <div className="h-[280px] px-4 pb-4 pt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trendWindow} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke={CHART_TOKENS.gridSoft} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: CHART_TOKENS.tick }} />
                        <YAxis yAxisId="rate" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: CHART_TOKENS.tick }} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
                        <YAxis yAxisId="sessions" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 10.5, fill: CHART_TOKENS.tick }} />
                        <Tooltip
                          cursor={{ stroke: CHART_TOKENS.tooltipBorder, strokeDasharray: "2 4" }}
                          contentStyle={{
                            background: CHART_TOKENS.tooltipBg,
                            border: `1px solid ${CHART_TOKENS.tooltipBorder}`,
                            borderRadius: 12,
                            fontSize: 12,
                            backdropFilter: "blur(6px)",
                          }}
                          formatter={(value, name) =>
                            name === "abandonment_rate"
                              ? [formatPct(Number(value)), trendRateLabel]
                              : [intFmt.format(Number(value)), trendDataLabel]
                          }
                        />
                        <Bar yAxisId="sessions" dataKey="sessions" fill={CHART_TOKENS.secondary} fillOpacity={0.35} radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="rate" type="monotone" dataKey="abandonment_rate" stroke={CHART_TOKENS.riskHigh} strokeWidth={1.8} dot={{ r: 2.5, fill: CHART_TOKENS.riskHigh }} activeDot={{ r: 3.5 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-muted">
                    {lang === "EN"
                      ? "Trend will appear once sessions start flowing."
                      : "Сесс орж эхлэхэд тренд гарч ирнэ."}
                  </div>
                )}
              </Card>

              <Card title={t.dashboard.topReason} subtitle={data.top_reason.label}>
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <Badge variant="primary">{data.top_reason.score}</Badge>
                    <span className="font-display font-extrabold tabular-nums text-text" style={{ fontSize: 32, lineHeight: 1 }}>
                      {data.top_reason.value.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{data.top_reason.explanation}</p>
                  <Link
                    href="/diagnosis"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
                  >
                    {lang === "EN" ? "Open diagnosis" : "Оношлогоо нээх"}
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card title={t.dashboard.conversionFunnel}>
                {data.funnel.length ? (
                  <div className="space-y-3">
                    {data.funnel.map((point, index) => {
                      const max = Math.max(...data.funnel.map((f) => f.sessions), 1);
                      return (
                        <div key={point.step}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-text">
                              <span className="mr-1.5 inline-block w-4 text-right tabular-nums text-muted">{index + 1}.</span>
                              {point.step}
                            </span>
                            <span className="tabular-nums text-muted">{intFmt.format(point.sessions)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{
                                width: `${(point.sessions / max) * 100}%`,
                                opacity: 0.9 - index * 0.07,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted">
                    {lang === "EN" ? "Funnel will appear soon." : "Funnel өгөгдөл одоогоор алга."}
                  </p>
                )}
              </Card>

              <Card title={t.dashboard.reasonScores}>
                <div className="space-y-1">
                  {SCORE_ORDER.map((code) => {
                    const reason = data.reasons.find((r) => r.code === code);
                    return (
                      <ReasonScoreRow
                        key={code}
                        code={code}
                        label={reason?.label ?? REASON_LABELS[code]}
                        value={reason?.average_score ?? 0}
                        dominant={reason?.dominant_sessions ?? 0}
                        highlight={code === data.top_reason.score}
                        dominantLabel={dominantWord}
                      />
                    );
                  })}
                </div>
              </Card>

              <Card title={t.dashboard.dominantReasonMix} noPadding>
                {reasonDistribution.length ? (
                  <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] items-center">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reasonDistribution}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={42}
                            outerRadius={68}
                            paddingAngle={1.5}
                            stroke={CHART_TOKENS.pieStroke}
                            strokeWidth={2}
                          >
                            {reasonDistribution.map((_, i) => (
                              <Cell key={i} fill={chartSeries(i)} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: CHART_TOKENS.tooltipBg,
                              border: `1px solid ${CHART_TOKENS.tooltipBorder}`,
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                            formatter={(value, name) => [`${value}`, String(name)]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="space-y-1.5 text-xs sm:min-w-[110px]">
                      {reasonDistribution.map((d, i) => (
                        <li key={d.name} className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-text">
                            <span className="size-2 rounded-sm" style={{ background: chartSeries(i) }} />
                            {d.name}
                          </span>
                          <span className="tabular-nums text-muted">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center px-5 text-center text-sm text-muted">
                    {lang === "EN" ? "No diagnosis yet." : "Оношлогоо одоогоор алга."}
                  </div>
                )}
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card
                className="lg:col-span-2"
                title={t.dashboard.recentHighRisk}
                headerAction={
                  <Link
                    href="/sessions?high_risk=true"
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline"
                  >
                    {t.dashboard.viewAllSessions}
                    <ArrowRight className="size-3" />
                  </Link>
                }
                noPadding
              >
                <RecentSessionsTable sessions={data.recent_sessions.slice(0, 6)} lang={lang} t={t} />
              </Card>

              <Card title={t.dashboard.nextBestAction} icon={Lightbulb}>
                {data.latest_recommendation ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="primary">{data.latest_recommendation.reason_code}</Badge>
                      <Badge>{priorityLabel(data.latest_recommendation.priority)}</Badge>
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-mono text-muted">
                        {sourceLabel(data.latest_recommendation.source)}
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-lg leading-snug text-text">
                      {data.latest_recommendation.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {data.latest_recommendation.summary}
                    </p>
                    <Link
                      href="/recommendations"
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
                    >
                      {lang === "EN" ? "Open recommendations" : "Зөвлөмжийн самбар"}
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-sm text-muted">{inactiveActionLabel}</p>
                  </div>
                )}
              </Card>
            </section>
          </>
        )}
      </div>
    </EditorialShell>
  );
}

function RecentSessionsTable({
  sessions,
  lang,
  t,
}: {
  sessions: DashboardSession[];
  lang: "EN" | "MN";
  t: ReturnType<typeof useLanguage>["t"];
}) {
  if (!sessions.length) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted">
        {lang === "EN" ? "No high-risk sessions in this window." : "Энэ хугацаанд өндөр эрсдэлтэй сесс алга."}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-surface-muted bg-bg text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">
            <th className="px-5 py-2.5">{t.sessions.table.session}</th>
            <th className="px-3 py-2.5">{t.sessions.table.class}</th>
            <th className="px-3 py-2.5">{t.sessions.table.probability}</th>
            <th className="px-3 py-2.5">{t.sessions.table.reason}</th>
            <th className="px-3 py-2.5">{t.common.time}</th>
            <th className="px-5 py-2.5 text-right">{t.sessions.table.recommendation}</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id} className="border-b border-surface-muted/60 hover:bg-surface-muted/40 transition-colors">
              <td className="px-5 py-3">
                <Link
                  href={`/sessions/${s.session_id}`}
                  className="font-mono text-xs text-text hover:text-primary"
                >
                  {s.session_id.slice(0, 18)}{s.session_id.length > 18 ? "…" : ""}
                </Link>
              </td>
              <td className="px-3 py-3 capitalize text-muted">
                {predictionClassLabel(s.prediction?.predicted_class)}
              </td>
              <td className="px-3 py-3">
                <RiskChip p={s.prediction?.abandonment_probability ?? 0} />
              </td>
              <td className="px-3 py-3 text-muted">
                {s.diagnosis ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Badge variant="primary">{s.diagnosis.dominant_reason}</Badge>
                    <span className="truncate text-xs">{s.diagnosis.reason_label}</span>
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-3 font-mono text-xs text-muted">
                {formatRelativeTime(s.ended_at ?? s.started_at, lang)}
              </td>
              <td className="px-5 py-3 text-right text-muted">
                {s.recommendation_status ? (
                  <Badge>{recommendationStatusLabel(s.recommendation_status)}</Badge>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
