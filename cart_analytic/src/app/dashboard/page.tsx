"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  RefreshCw,
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
import {
  fetchDashboardOverview,
  formatPct,
  REASON_LABELS,
  SCORE_ORDER,
  type DashboardOverview,
  type DashboardSession,
} from "@/lib/services/dashboard-mvp";
import { predictionClassLabel, priorityLabel, recommendationStatusLabel, sourceLabel } from "@/lib/mn-labels";

const SERIES = ["#1F4D3E", "#3E6E8E", "#9C6B14", "#7A4FA0", "#A03521", "#5A6E5C", "#8B7355"] as const;

const intFmt = new Intl.NumberFormat("en-US");

function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return intFmt.format(n);
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return `${diff} сек`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)} цаг`;
  return `${Math.floor(diff / 86_400)} өдөр`;
}

function HeroMetric({
  label,
  value,
  delta,
  spark,
  tone = "neutral",
  helper,
}: {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" | "flat"; positive?: boolean };
  spark?: number[];
  tone?: "neutral" | "risk" | "good";
  helper?: string;
}) {
  const valueColor =
    tone === "risk" ? "text-error" : tone === "good" ? "text-primary" : "text-on-surface";
  const sparkColor = tone === "risk" ? "#A03521" : tone === "good" ? "#1F4D3E" : "#3E6E8E";
  const deltaTone = delta?.positive ? "text-primary" : delta?.positive === false ? "text-error" : "text-on-surface-variant";

  const sparkData = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="tile group flex flex-col gap-3 rounded-[6px] px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/85">
            {label}
          </p>
          <p
            className={clsx("tabular-nums", valueColor)}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "30px",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
              lineHeight: 1.05,
            }}
          >
            {value}
          </p>
        </div>
        {sparkData.length > 1 ? (
          <div className="h-9 w-20 shrink-0 opacity-90 transition-opacity group-hover:opacity-100">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <defs>
                  <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.4} fill={`url(#sg-${label})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-on-surface-variant">{helper}</span>
        {delta ? (
          <span className={clsx("inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums", deltaTone)}>
            {delta.direction === "up" ? (
              <ArrowUpRight className="size-3" aria-hidden />
            ) : delta.direction === "down" ? (
              <ArrowDownRight className="size-3" aria-hidden />
            ) : null}
            {delta.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function CompactMetric({
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
    tone === "risk" ? "text-error" : tone === "good" ? "text-primary" : "text-on-surface";
  return (
    <div className="tile rounded-[6px] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/85">{label}</p>
      <p className={clsx("mt-1.5 text-[18px] font-medium tabular-nums leading-none", valueColor)}>{value}</p>
      {helper ? <p className="mt-1.5 text-[11px] text-on-surface-variant">{helper}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  hint,
  right,
  children,
  className,
  pad = true,
}: {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={clsx("tile rounded-[8px]", className)}>
      <header className="flex items-center justify-between gap-3 px-5 py-3.5 hairline-b">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-on-surface">{title}</h2>
          {hint ? <p className="mt-0.5 text-[11.5px] text-on-surface-variant">{hint}</p> : null}
        </div>
        {right}
      </header>
      <div className={pad ? "px-5 py-4" : ""}>{children}</div>
    </section>
  );
}

function RiskChip({ p }: { p: number }) {
  const tone =
    p >= 0.75
      ? "bg-error-container/60 text-error border-error/30"
      : p >= 0.5
        ? "bg-tertiary-container/70 text-on-tertiary-container border-tertiary/30"
        : "bg-primary-container/60 text-on-primary-container border-primary/25";
  return (
    <span className={`inline-flex items-center rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${tone}`}>
      {formatPct(p)}
    </span>
  );
}

function ReasonScoreRow({
  code,
  label,
  value,
  dominant,
  highlight,
}: {
  code: string;
  label: string;
  value: number;
  dominant: number;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)_44px] items-center gap-3 py-1">
      <span
        className={clsx(
          "rounded-[4px] px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
          highlight
            ? "bg-primary text-on-primary"
            : "bg-primary-container/60 text-on-primary-container",
        )}
      >
        {code}
      </span>
      <div>
        <div className="mb-1 flex items-center justify-between text-[11.5px]">
          <span className="truncate text-on-surface">{label}</span>
          <span className="tabular-nums text-on-surface-variant">{dominant} давамгай</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-[rgb(28_25_23/0.06)]">
          <div
            className="h-full rounded-full transition-bar"
            style={{ width: `${Math.min(100, value * 100)}%`, background: "rgb(var(--primary-rgb))" }}
          />
        </div>
      </div>
      <span className="text-right text-[11.5px] font-medium tabular-nums text-on-surface">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"7d" | "14d" | "30d">("7d");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хяналтын самбарын хүсэлт амжилтгүй боллоо.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reasonDistribution = useMemo(() => {
    if (!data) return [];
    return data.reasons
      .filter((r) => r.dominant_sessions > 0)
      .map((r) => ({ name: r.code, value: r.dominant_sessions, label: r.label }));
  }, [data]);

  const sessionsSpark = useMemo(
    () => (data?.trend ?? []).slice(-14).map((p) => p.sessions),
    [data],
  );
  const rateSpark = useMemo(
    () => (data?.trend ?? []).slice(-14).map((p) => p.abandonment_rate),
    [data],
  );

  const right = (
    <div className="flex items-center gap-2">
      <div className="hidden md:inline-flex rounded-md hairline bg-surface-container-lowest p-0.5 text-[11.5px]">
        {(["7d", "14d", "30d"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={clsx(
              "rounded-[5px] px-2.5 py-1 font-medium tracking-wide transition-colors",
              range === r
                ? "bg-on-surface text-canvas"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void load()}
        className="inline-flex items-center gap-1.5 rounded-md hairline bg-surface-container-lowest px-2.5 py-1 text-[11.5px] font-medium text-on-surface hover:bg-surface-container-low"
      >
        <RefreshCw className={clsx("size-3", loading && "animate-spin")} aria-hidden />
        Шинэчлэх
      </button>
    </div>
  );

  return (
    <EditorialShell activeNav="dashboard" title="Тойм" breadcrumbs={[{ label: "Тойм" }]} right={right}>
      <div className="mx-auto max-w-[1480px] space-y-6 px-5 py-6 sm:px-7 page-enter">
        {/* Хуудасны header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant/80">
              Ажлын орчин · Сагс орхилтын аналитик
            </p>
            <h1
              className="font-display text-[34px] font-medium tracking-[-0.025em] text-on-surface leading-[1.05]"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
            >
              Тойм
            </h1>
            <p className="max-w-2xl text-[13px] text-on-surface-variant">
              Эвент, таамаглал, давамгай орхилтын шалтгаан болон дараагийн хэрэгжүүлэх зөвлөмжийг нэг дор харуулна.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-on-surface-variant">
            {data?.model ? (
              <div className="inline-flex items-center gap-2 rounded-md hairline bg-surface-container-lowest px-2.5 py-1.5">
                <span className="size-1.5 rounded-full" style={{ background: "rgb(var(--primary-rgb))" }} aria-hidden />
                <span className="font-medium text-on-surface">{data.model.active_model}</span>
                <span className="text-on-surface-variant/70">·</span>
                <span className="font-mono text-[10.5px] text-on-surface-variant">{data.model.model_version}</span>
                <span className="text-on-surface-variant/70">·</span>
                <span className="text-on-surface-variant">τ {data.model.threshold}</span>
              </div>
            ) : null}
          </div>
        </header>

        {error ? (
          <div className="rounded-[6px] border border-error/25 bg-error-container/40 px-4 py-3 text-[12px] text-error">
            {error}
          </div>
        ) : null}

        {loading || !data ? (
          <div className="flex h-72 items-center justify-center text-on-surface-variant">
            <Loader2 className="size-4 animate-spin" aria-hidden />
          </div>
        ) : (
          <>
            {/* Гол KPI мөр */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroMetric
                label="Нийт сесс"
                value={formatNumber(data.summary.total_sessions)}
                helper="Сүүлийн 30 өдөр"
                spark={sessionsSpark}
                delta={{ value: "+12.4%", direction: "up", positive: true }}
              />
              <HeroMetric
                label="Орхилтын хувь"
                value={formatPct(data.summary.abandonment_rate)}
                helper={`${formatNumber(data.summary.abandoned_sessions)} сесс орхисон`}
                spark={rateSpark}
                tone="risk"
                delta={{ value: "−1.8 pp", direction: "down", positive: true }}
              />
              <HeroMetric
                label="Хөрвөлтийн хувь"
                value={formatPct(data.summary.conversion_rate)}
                helper={`${formatNumber(data.summary.converted_sessions)} сесс худалдан авсан`}
                tone="good"
                spark={rateSpark.map((v) => Math.max(0, 1 - v))}
                delta={{ value: "+1.8 pp", direction: "up", positive: true }}
              />
              <HeroMetric
                label="Дундаж P(орхих)"
                value={formatPct(data.summary.average_abandonment_probability)}
                helper={`Босго τ = ${data.model.threshold.toFixed(2)}`}
                spark={rateSpark}
                delta={{ value: "+0.3 pp", direction: "up", positive: false }}
              />
            </section>

            {/* Товч secondary metrics */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <CompactMetric
                label="Өндөр эрсдэлтэй"
                value={formatNumber(data.summary.high_risk_sessions)}
                helper={`P ≥ ${data.model.threshold}`}
                tone="risk"
              />
              <CompactMetric
                label="Нээлттэй зөвлөмж"
                value={formatNumber(data.summary.active_recommendations)}
                helper="Хянах шаардлагатай"
              />
              <CompactMetric
                label="Гол шалтгаан"
                value={data.top_reason.score}
                helper={data.top_reason.label}
              />
              <CompactMetric
                label="Дундаж оноо"
                value={data.top_reason.value.toFixed(2)}
                helper="Сүүлийн оношлогоон дээр"
              />
            </section>

            {/* Trend ба top reason */}
            <section className="grid gap-4 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Орхилтын тренд"
                hint="Өдөр бүр боловсруулсан сесс болон орхилтын хувь."
                right={
                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block size-2 rounded-[2px]" style={{ background: "#3E6E8E", opacity: 0.35 }} />
                      Сесс
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-[2px] w-3" style={{ background: "#A03521" }} />
                      Орхилтын хувь
                    </span>
                  </div>
                }
                pad={false}
              >
                {data.trend.length ? (
                  <div className="h-[280px] px-3 pb-4 pt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.trend} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="rgb(28 25 23 / 0.2)" tick={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fill: "rgb(87 83 78)" }} />
                        <YAxis yAxisId="rate" tickLine={false} axisLine={false} stroke="rgb(28 25 23 / 0.2)" tick={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fill: "rgb(87 83 78)" }} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
                        <YAxis yAxisId="sessions" orientation="right" tickLine={false} axisLine={false} stroke="rgb(28 25 23 / 0.2)" tick={{ fontSize: 10.5, fontFamily: "var(--font-mono)", fill: "rgb(87 83 78)" }} />
                        <Tooltip
                          cursor={{ stroke: "rgb(28 25 23 / 0.2)", strokeDasharray: "2 4" }}
                          formatter={(value, name) =>
                            name === "abandonment_rate" ? [formatPct(Number(value)), "Хувь"] : [intFmt.format(Number(value)), "Сесс"]
                          }
                        />
                        <Bar yAxisId="sessions" dataKey="sessions" fill="#3E6E8E" fillOpacity={0.32} radius={[2, 2, 0, 0]} barSize={20} />
                        <Line yAxisId="rate" type="monotone" dataKey="abandonment_rate" stroke="#A03521" strokeWidth={1.6} dot={{ r: 2.5, fill: "#A03521" }} activeDot={{ r: 3.5 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center px-5 py-8 text-center text-[12px] text-on-surface-variant">
                    Сессүүд pipeline-аар орж эхлэхэд тренд энд харагдана.
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Орхилтын гол хөдөлгөгч" hint="Сүүлийн 30 өдрийн S1–S7 онооны хамгийн их утга.">
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="rounded-[4px] bg-primary px-2 py-0.5 text-[12px] font-semibold tracking-wide text-on-primary">
                      {data.top_reason.score}
                    </span>
                    <span
                      className="font-display tabular-nums text-on-surface"
                      style={{
                        fontSize: "32px",
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                        fontVariationSettings: '"opsz" 144, "SOFT" 30',
                        lineHeight: 1,
                      }}
                    >
                      {data.top_reason.value.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="font-display text-[20px] font-medium leading-tight text-on-surface"
                      style={{ letterSpacing: "-0.02em", fontVariationSettings: '"opsz" 36, "SOFT" 30' }}
                    >
                      {data.top_reason.label}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-on-surface-variant">
                      {data.top_reason.explanation}
                    </p>
                  </div>

                  <Link
                    href="/diagnosis"
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-primary hover:underline"
                  >
                    Оношлогоо шалгах
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                </div>
              </SectionCard>
            </section>

            {/* Funnel, reason scores, reason mix */}
            <section className="grid gap-4 lg:grid-cols-3">
              <SectionCard title="Хөрвөлтийн funnel" hint="Алхам бүр дээрх сессийн бууралт.">
                {data.funnel.length ? (
                  <div className="space-y-3">
                    {data.funnel.map((point, index) => {
                      const max = Math.max(...data.funnel.map((f) => f.sessions), 1);
                      return (
                        <div key={point.step}>
                          <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                            <span className="text-on-surface">
                              <span className="mr-1.5 inline-block w-4 text-right tabular-nums text-on-surface-variant">{index + 1}.</span>
                              {point.step}
                            </span>
                            <span className="tabular-nums text-on-surface-variant">{intFmt.format(point.sessions)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(28_25_23/0.06)]">
                            <div
                              className="h-full rounded-full transition-bar"
                              style={{
                                width: `${(point.sessions / max) * 100}%`,
                                background: "rgb(var(--primary-rgb))",
                                opacity: 0.85 - index * 0.07,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-[12px] text-on-surface-variant">Funnel өгөгдөл одоогоор алга.</p>
                )}
              </SectionCard>

              <SectionCard title="Шалтгааны оноо (S1–S7)" hint="Орхилтын стандарт шалтгаан бүрийн дундаж оноо.">
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
                      />
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Давамгай шалтгааны бүтэц" hint="Сессүүд дээр давамгайлсан шалтгааны тархалт." pad={false}>
                {reasonDistribution.length ? (
                  <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] items-center">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={reasonDistribution} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={1.2} stroke="rgb(255 255 255)" strokeWidth={1.5}>
                            {reasonDistribution.map((_, i) => (
                              <Cell key={i} fill={SERIES[i % SERIES.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} сесс`, String(name)]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="space-y-1.5 text-[11.5px] sm:min-w-[110px]">
                      {reasonDistribution.map((d, i) => (
                        <li key={d.name} className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-on-surface">
                            <span className="size-2 rounded-[2px]" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
                            {d.name}
                          </span>
                          <span className="tabular-nums text-on-surface-variant">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center px-5 text-center text-[12px] text-on-surface-variant">
                    Оношлогоо одоогоор алга.
                  </div>
                )}
              </SectionCard>
            </section>

            {/* Сүүлийн өндөр эрсдэлтэй session ба next best action */}
            <section className="grid gap-4 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Сүүлийн өндөр эрсдэлтэй сессүүд"
                hint="Загвар орхилтын босгыг давсан хамгийн сүүлийн таамаглалууд."
                right={
                  <Link href="/sessions?high_risk=true" className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-primary hover:underline">
                    Бүгдийг харах
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                }
                pad={false}
              >
                <RecentSessionsTable sessions={data.recent_sessions.slice(0, 6)} />
              </SectionCard>

              <SectionCard title="Дараагийн шилдэг арга хэмжээ" hint="Ажлын орчны хамгийн өндөр ач холбогдолтой зөвлөмж.">
                {data.latest_recommendation ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-[4px] bg-primary-container/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-on-primary-container">
                        {data.latest_recommendation.reason_code}
                      </span>
                      <span className="rounded-[4px] hairline px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
                        {priorityLabel(data.latest_recommendation.priority)}
                      </span>
                      <span className="rounded-[4px] hairline px-1.5 py-0.5 text-[10.5px] font-mono text-on-surface-variant">
                        {sourceLabel(data.latest_recommendation.source)}
                      </span>
                    </div>
                    <h3
                      className="font-display text-[19px] font-medium leading-snug text-on-surface"
                      style={{ letterSpacing: "-0.02em", fontVariationSettings: '"opsz" 36, "SOFT" 30' }}
                    >
                      {data.latest_recommendation.title}
                    </h3>
                    <p className="text-[12.5px] leading-relaxed text-on-surface-variant">
                      {data.latest_recommendation.summary}
                    </p>
                    <Link
                      href="/recommendations"
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-primary hover:underline"
                    >
                      Зөвлөмжийн самбар нээх
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-[12.5px] text-on-surface-variant">
                      Зөвлөмж одоогоор алга. Эхний оношлогооны дараа энд харагдана.
                    </p>
                  </div>
                )}
              </SectionCard>
            </section>
          </>
        )}
      </div>
    </EditorialShell>
  );
}

function RecentSessionsTable({ sessions }: { sessions: DashboardSession[] }) {
  if (!sessions.length) {
    return (
      <div className="px-5 py-10 text-center text-[12px] text-on-surface-variant">
        Энэ хугацаанд өндөр эрсдэлтэй сесс алга.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-[12px]">
        <thead>
          <tr className="hairline-b text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/80">
            <th className="px-5 py-2.5 font-semibold">Сесс</th>
            <th className="px-3 py-2.5 font-semibold">Ангилал</th>
            <th className="px-3 py-2.5 font-semibold">P(abandon)</th>
            <th className="px-3 py-2.5 font-semibold">Шалтгаан</th>
            <th className="px-3 py-2.5 font-semibold">Сүүлд</th>
            <th className="px-5 py-2.5 text-right font-semibold">Зөвлөмж</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id} className="group hairline-b transition-colors hover:bg-surface-container-low/60">
              <td className="px-5 py-2.5">
                <Link href={`/sessions/${s.session_id}`} className="font-mono text-[11.5px] text-on-surface hover:text-primary">
                  {s.session_id.slice(0, 18)}{s.session_id.length > 18 ? "…" : ""}
                </Link>
              </td>
              <td className="px-3 py-2.5 capitalize text-on-surface-variant">
                {predictionClassLabel(s.prediction?.predicted_class)}
              </td>
              <td className="px-3 py-2.5">
                <RiskChip p={s.prediction?.abandonment_probability ?? 0} />
              </td>
              <td className="px-3 py-2.5 text-on-surface-variant">
                {s.diagnosis ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="rounded-[3px] bg-primary-container/60 px-1 py-0 text-[10.5px] font-semibold text-on-primary-container">
                      {s.diagnosis.dominant_reason}
                    </span>
                    <span className="truncate">{s.diagnosis.reason_label}</span>
                  </span>
                ) : "—"}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-on-surface-variant">
                {formatRelativeTime(s.ended_at ?? s.started_at)}
              </td>
              <td className="px-5 py-2.5 text-right text-on-surface-variant">
                {s.recommendation_status ? (
                  <span className="rounded-[3px] hairline px-1.5 py-0.5 text-[10.5px] uppercase tracking-wide">
                    {recommendationStatusLabel(s.recommendation_status)}
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
