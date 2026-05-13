"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Equal,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import {
  fetchMLInsights,
  type FeatureContribution,
  type MLInsights,
} from "@/lib/services/mlInsights";
import { directionLabel } from "@/lib/mn-labels";

const intFmt = new Intl.NumberFormat("en-US");

function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function MetricBlock({
  label,
  value,
  helper,
  emphasis = false,
}: {
  label: string;
  value: string;
  helper?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="tile rounded-[6px] px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/85">{label}</p>
      <p
        className={clsx("mt-1.5 tabular-nums leading-none", emphasis ? "text-primary" : "text-on-surface")}
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "26px",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          fontVariationSettings: '"opsz" 96, "SOFT" 30',
        }}
      >
        {value}
      </p>
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

function ConfusionCell({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant: "true" | "false";
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div
      className={clsx(
        "rounded-[6px] px-4 py-4",
        variant === "true"
          ? "border border-primary/20 bg-primary-container/50"
          : "border border-error/20 bg-error-container/40",
      )}
    >
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/80">{label}</p>
      <p
        className="mt-1 font-display tabular-nums leading-none text-on-surface"
        style={{
          fontSize: "26px",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          fontVariationSettings: '"opsz" 96, "SOFT" 30',
        }}
      >
        {intFmt.format(value)}
      </p>
      <p className="mt-1 text-[10.5px] tabular-nums text-on-surface-variant">{pct.toFixed(1)}%</p>
    </div>
  );
}

function DirectionGlyph({ direction }: { direction: FeatureContribution["direction"] }) {
  if (direction === "increases") return <ArrowUpRight className="size-3 text-error" aria-hidden />;
  if (direction === "decreases") return <ArrowDownRight className="size-3 text-primary" aria-hidden />;
  return <Equal className="size-3 text-on-surface-variant" aria-hidden />;
}

export default function MLInsightsPage() {
  const [data, setData] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchMLInsights());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ML дүгнэлтийн хүсэлт амжилтгүй боллоо.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featureMaxImportance = useMemo(() => {
    if (!data) return 1;
    return Math.max(...data.feature_contributions.map((f) => f.importance), 0.001);
  }, [data]);

  const peakBuckets = useMemo(() => {
    if (!data) return [];
    return data.probability_distribution
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map((b) => b.bucket);
  }, [data]);

  const totalConfusion = useMemo(() => {
    if (!data) return 0;
    const cm = data.metrics.confusion_matrix;
    return cm.true_positive + cm.true_negative + cm.false_positive + cm.false_negative;
  }, [data]);

  const right = (
    <button
      type="button"
      onClick={() => void load()}
      className="inline-flex items-center gap-1.5 rounded-md hairline bg-surface-container-lowest px-2.5 py-1 text-[11.5px] font-medium text-on-surface hover:bg-surface-container-low"
    >
      <RefreshCw className={clsx("size-3", loading && "animate-spin")} aria-hidden />
      Шинэчлэх
    </button>
  );

  return (
    <EditorialShell
      activeNav="ml-insights"
      title={t.analytics.title}
      subtitle={t.analytics.subtitle}
      right={right}
    >
      <div className="space-y-6">

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
            {/* Model meta мөр */}
            <section className="tile rounded-[8px]">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
                <Field label="Загвар" value={`${data.model.model_name} · ${data.model.model_version}`} />
                <Field
                  label="Хувилбар"
                  value={
                    <span className="inline-flex items-center rounded-[4px] bg-primary px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-on-primary">
                      {data.model.variant}
                    </span>
                  }
                />
                <Field label="Сургасан огноо" value={new Date(data.model.trained_at).toLocaleDateString("mn-MN", { day: "2-digit", month: "short", year: "numeric" })} />
                <Field label="Өгөгдлийн багц" value={<span className="font-mono text-[11.5px]">{data.model.dataset}</span>} />
                <Field label="Босго" value={<span className="tabular-nums">{data.model.threshold.toFixed(2)}</span>} />
                <Field
                  label="Таамаглал"
                  value={<span className="tabular-nums">{intFmt.format(data.model.prediction_count)}</span>}
                />
              </div>
            </section>

            {/* KPI grid хэсэг */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <MetricBlock label="Нарийвчлал" value={fmtPct(data.metrics.accuracy)} helper="нийт ангилалт" emphasis />
              <MetricBlock label="Эерэг нарийвчлал" value={fmtPct(data.metrics.precision)} helper="орхино гэж таамагласнаас" />
              <MetricBlock label="Илрүүлэлт" value={fmtPct(data.metrics.recall)} helper="бодит орхилтыг барьсан" />
              <MetricBlock label="F1 оноо" value={fmtPct(data.metrics.f1)} helper="гармоник дундаж" />
              <MetricBlock label="ROC AUC" value={data.metrics.roc_auc ? data.metrics.roc_auc.toFixed(3) : "—"} helper="эрэмбэлэлтийн чанар" />
              <MetricBlock label="Log loss" value={data.metrics.log_loss ? data.metrics.log_loss.toFixed(3) : "—"} helper="cross-entropy" />
            </section>

            {/* Distribution ба Confusion */}
            <div className="grid gap-4 lg:grid-cols-5">
              <SectionCard
                className="lg:col-span-3"
                title="Таамагласан магадлалын тархалт"
                hint={`${intFmt.format(data.model.prediction_count)} таамаглал · Босго τ = ${data.model.threshold.toFixed(2)}`}
                pad={false}
              >
                <div className="px-3 pb-2 pt-3">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.probability_distribution} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} />
                        <XAxis dataKey="bucket" tickLine={false} axisLine={false} stroke="rgb(28 25 23 / 0.2)" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "rgb(87 83 78)" }} />
                        <YAxis tickLine={false} axisLine={false} stroke="rgb(28 25 23 / 0.2)" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "rgb(87 83 78)" }} />
                        <Tooltip cursor={{ fill: "rgb(28 25 23 / 0.04)" }} formatter={(v) => [intFmt.format(Number(v)), "Таамаглал"]} />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {data.probability_distribution.map((bin) => {
                            const lower = parseFloat(bin.bucket.split(/[–-]/)[0]);
                            const isAbandon = lower >= data.model.threshold;
                            return (
                              <Cell key={bin.bucket} fill={isAbandon ? "#A03521" : "#3E6E8E"} fillOpacity={isAbandon ? 0.9 : 0.7} />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[11px] hairline-t">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px]" style={{ background: "#3E6E8E" }} aria-hidden />
                      Худалдан авна гэж таамагласан (P &lt; {(data.model.threshold * 100).toFixed(0)}%)
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-[2px]" style={{ background: "#A03521" }} aria-hidden />
                      Орхино гэж таамагласан (P ≥ {(data.model.threshold * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <span className="text-on-surface-variant">
                    Оргил bucket: <span className="font-mono text-on-surface">{peakBuckets.join(", ")}</span>
                  </span>
                </div>
              </SectionCard>

              <SectionCard
                className="lg:col-span-2"
                title="Алдааны матриц"
                hint={`Босго ${data.model.threshold.toFixed(2)} · ${intFmt.format(totalConfusion)} шошготой sample`}
              >
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2">
                  <div />
                  <div className="text-center text-[9.5px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/80">
                    Орхино гэж таамагласан
                  </div>
                  <div className="text-center text-[9.5px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/80">
                    Худалдан авна гэж таамагласан
                  </div>

                  <div className="self-center text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                    Бодитоор орхисон
                  </div>
                  <ConfusionCell label="Зөв эерэг" value={data.metrics.confusion_matrix.true_positive} total={totalConfusion} variant="true" />
                  <ConfusionCell label="Алдаатай сөрөг" value={data.metrics.confusion_matrix.false_negative} total={totalConfusion} variant="false" />

                  <div className="self-center text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                    Бодитоор худалдан авсан
                  </div>
                  <ConfusionCell label="Алдаатай эерэг" value={data.metrics.confusion_matrix.false_positive} total={totalConfusion} variant="false" />
                  <ConfusionCell label="Зөв сөрөг" value={data.metrics.confusion_matrix.true_negative} total={totalConfusion} variant="true" />
                </div>
              </SectionCard>
            </div>

            {/* Feature contribution-ууд */}
            <SectionCard
              title="Гол онцлогууд ба SHAP хувь нэмэр"
              hint="Gain importance-аар эрэмбэлсэн · holdout set дээрх дундаж SHAP-ийн тэмдэг ба чиглэл."
              pad={false}
            >
              <div className="overflow-x-auto">
                <div className="min-w-[820px]">
                  <div className="grid grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1.4fr)_120px_140px] bg-surface-container-low/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/80 hairline-b">
                    <span>#</span>
                    <span>Онцлог</span>
                    <span>Ач холбогдол</span>
                    <span className="text-right">Mean SHAP</span>
                    <span className="text-right">Чиглэл</span>
                  </div>
                  {data.feature_contributions.map((f, i) => (
                    <div
                      key={f.feature}
                      className={clsx(
                        "grid grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1.4fr)_120px_140px] items-center gap-3 px-5 py-2.5 text-[12px]",
                        i !== 0 && "hairline-t",
                      )}
                    >
                      <span className="font-mono text-[11px] tabular-nums text-on-surface-variant">{i + 1}</span>
                      <span className="font-mono text-[11.5px] text-on-surface">{f.feature}</span>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgb(28_25_23/0.06)]">
                          <div
                            className="h-full rounded-full transition-bar"
                            style={{
                              width: `${(f.importance / featureMaxImportance) * 100}%`,
                              background: "rgb(var(--primary-rgb))",
                            }}
                          />
                        </div>
                        <span className="w-12 text-right tabular-nums text-on-surface-variant">{f.importance.toFixed(3)}</span>
                      </div>
                      <span
                        className={clsx(
                          "text-right font-mono text-[11.5px] tabular-nums",
                          f.shap_mean >= 0 ? "text-error" : "text-primary",
                        )}
                      >
                        {f.shap_mean >= 0 ? "+" : ""}
                        {f.shap_mean.toFixed(3)}
                      </span>
                      <span className="flex items-center justify-end gap-1.5 text-[11.5px] text-on-surface-variant">
                        <DirectionGlyph direction={f.direction} />
                        <span>{directionLabel(f.direction)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Feature legend ба тайлбар */}
            <p className="text-[11px] text-on-surface-variant max-w-3xl">
              <span className="font-semibold text-on-surface">Хүснэгтийг унших нь.</span>{" "}
              Ач холбогдол нь тухайн онцлог split-д хэр их нөлөөлснийг илэрхийлнэ. Mean SHAP нь бүх сессийн
              хэмжээнд орхилт руу түлхэх эерэг эсвэл холдуулах сөрөг дундаж нөлөөг харуулна. Чиглэл нь
              тухайн онцлог эрсдэлийг тогтмол өсгөж эсвэл бууруулж байгааг нэгтгэнэ.
            </p>
          </>
        )}
      </div>
    </EditorialShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/85">
        {label}
      </span>
      <span className="text-[12.5px] text-on-surface">{value}</span>
    </div>
  );
}
