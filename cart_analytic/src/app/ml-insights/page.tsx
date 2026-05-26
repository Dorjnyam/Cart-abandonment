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
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchMLInsights,
  type FeatureContribution,
  type MLInsights,
} from "@/lib/services/mlInsights";
import { directionLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

const intFmt = new Intl.NumberFormat("en-US");

function fmtPct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

function MetricTile({
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
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-display font-extrabold tabular-nums leading-none text-2xl",
          emphasis ? "text-primary" : "text-text",
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-2 text-xs text-muted">{helper}</p> : null}
    </Card>
  );
}

function ConfusionCell({
  label,
  value,
  total,
  good,
}: {
  label: string;
  value: number;
  total: number;
  good: boolean;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-4 border",
        good ? "border-primary/25 bg-primary/5" : "border-error/25 bg-error/5",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-1.5 font-display font-extrabold tabular-nums leading-none text-2xl text-text">
        {intFmt.format(value)}
      </p>
      <p className="mt-1.5 text-xs tabular-nums text-muted">{pct.toFixed(1)}%</p>
    </div>
  );
}

function DirectionGlyph({ direction }: { direction: FeatureContribution["direction"] }) {
  if (direction === "increases") return <ArrowUpRight className="size-3.5 text-error" />;
  if (direction === "decreases") return <ArrowDownRight className="size-3.5 text-primary" />;
  return <Equal className="size-3.5 text-muted" />;
}

export default function MLInsightsPage() {
  const [data, setData] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchMLInsights());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "EN"
            ? "ML insights request failed."
            : "ML дүгнэлтийн хүсэлт амжилтгүй боллоо.",
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

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

  const labels = {
    refresh: t.common.refresh,
    modelMeta: t.analytics.modelMeta,
    model: lang === "EN" ? "Model" : "Загвар",
    variant: t.analytics.variant,
    trained: t.analytics.trained,
    dataset: t.analytics.dataset,
    threshold: t.analytics.threshold,
    predictions: lang === "EN" ? "Predictions" : "Таамаглал",
    accuracy: t.analytics.accuracy,
    accuracyHelper: lang === "EN" ? "Total classification" : "нийт ангилалт",
    precision: t.analytics.precision,
    precisionHelper:
      lang === "EN" ? "Of predicted abandons" : "Орхино гэж таамагласнаас",
    recall: t.analytics.recall,
    recallHelper: lang === "EN" ? "Caught real abandons" : "Бодит орхилтыг барьсан",
    f1: t.analytics.f1Score,
    f1Helper: lang === "EN" ? "Harmonic mean" : "гармоник дундаж",
    rocAuc: t.analytics.rocAuc,
    rocHelper: lang === "EN" ? "Ranking quality" : "эрэмбэлэлтийн чанар",
    logLoss: t.analytics.logLoss,
    logLossHelper: lang === "EN" ? "Cross-entropy" : "cross-entropy",
    distTitle: t.analytics.probHistogram,
    distHint:
      lang === "EN"
        ? `${data ? intFmt.format(data.model.prediction_count) : "—"} predictions · τ = ${data?.model.threshold.toFixed(2) ?? "—"}`
        : `${data ? intFmt.format(data.model.prediction_count) : "—"} таамаглал · τ = ${data?.model.threshold.toFixed(2) ?? "—"}`,
    convertedPredicted:
      lang === "EN"
        ? `Converted predicted (P < ${data ? (data.model.threshold * 100).toFixed(0) : "—"}%)`
        : `Худалдан авна (P < ${data ? (data.model.threshold * 100).toFixed(0) : "—"}%)`,
    abandonPredicted:
      lang === "EN"
        ? `Abandon predicted (P ≥ ${data ? (data.model.threshold * 100).toFixed(0) : "—"}%)`
        : `Орхино (P ≥ ${data ? (data.model.threshold * 100).toFixed(0) : "—"}%)`,
    peakBuckets: lang === "EN" ? "Peak buckets" : "Оргил bucket",
    cmTitle: t.analytics.confMatrix,
    cmHint:
      lang === "EN"
        ? `τ ${data?.model.threshold.toFixed(2) ?? "—"} · ${intFmt.format(totalConfusion)} labeled samples`
        : `Босго ${data?.model.threshold.toFixed(2) ?? "—"} · ${intFmt.format(totalConfusion)} шошготой sample`,
    actualAbandon: lang === "EN" ? "Actual abandoned" : "Бодитоор орхисон",
    actualConverted: lang === "EN" ? "Actual purchased" : "Бодитоор худалдан авсан",
    cmPredAbandon: lang === "EN" ? "Predicted abandon" : "Орхино гэж таамагласан",
    cmPredConvert: lang === "EN" ? "Predicted purchase" : "Худалдан авна гэж таамагласан",
    tp: lang === "EN" ? "True positive" : "Зөв эерэг",
    fp: lang === "EN" ? "False positive" : "Алдаатай эерэг",
    tn: lang === "EN" ? "True negative" : "Зөв сөрөг",
    fn: lang === "EN" ? "False negative" : "Алдаатай сөрөг",
    contribTitle: lang === "EN" ? "Top features & SHAP contribution" : "Гол онцлогууд ба SHAP",
    contribHint:
      lang === "EN"
        ? "Sorted by gain importance · mean SHAP sign + direction on holdout."
        : "Gain importance-аар эрэмбэлсэн · holdout set дээрх дундаж SHAP-ийн тэмдэг ба чиглэл.",
    rank: "#",
    feature: lang === "EN" ? "Feature" : "Онцлог",
    importance: t.analytics.featureImportance,
    meanShap: lang === "EN" ? "Mean SHAP" : "Mean SHAP",
    direction: lang === "EN" ? "Direction" : "Чиглэл",
    legendNote:
      lang === "EN"
        ? "Importance = split contribution. Mean SHAP shows the average push (positive = toward abandonment). Direction summarizes whether the feature consistently raises or lowers risk."
        : "Ач холбогдол нь split-ийн хувь нэмэр. Mean SHAP нь сесс бүрээр орхилт руу түлхэх эерэг/сөрөг дундаж. Чиглэл нь онцлог тогтмол өсгөж эсвэл бууруулж буйг нэгтгэнэ.",
    legendHeading: lang === "EN" ? "Reading the table." : "Хүснэгтийг унших нь.",
  };

  const right = (
    <button
      type="button"
      onClick={() => void load()}
      className="inline-flex items-center gap-1.5 rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-muted/70"
    >
      <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
      {labels.refresh}
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
            <Card title={labels.modelMeta}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
                <Field label={labels.model} value={`${data.model.model_name} · ${data.model.model_version}`} />
                <Field
                  label={labels.variant}
                  value={<Badge variant="primary">{data.model.variant}</Badge>}
                />
                <Field
                  label={labels.trained}
                  value={new Date(data.model.trained_at).toLocaleDateString(lang === "EN" ? "en-GB" : "mn-MN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                />
                <Field
                  label={labels.dataset}
                  value={<span className="font-mono text-xs">{data.model.dataset}</span>}
                />
                <Field label={labels.threshold} value={data.model.threshold.toFixed(2)} />
                <Field label={labels.predictions} value={intFmt.format(data.model.prediction_count)} />
              </div>
            </Card>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <MetricTile label={labels.accuracy} value={fmtPct(data.metrics.accuracy)} helper={labels.accuracyHelper} emphasis />
              <MetricTile label={labels.precision} value={fmtPct(data.metrics.precision)} helper={labels.precisionHelper} />
              <MetricTile label={labels.recall} value={fmtPct(data.metrics.recall)} helper={labels.recallHelper} />
              <MetricTile label={labels.f1} value={fmtPct(data.metrics.f1)} helper={labels.f1Helper} />
              <MetricTile
                label={labels.rocAuc}
                value={data.metrics.roc_auc ? data.metrics.roc_auc.toFixed(3) : "—"}
                helper={labels.rocHelper}
              />
              <MetricTile
                label={labels.logLoss}
                value={data.metrics.log_loss ? data.metrics.log_loss.toFixed(3) : "—"}
                helper={labels.logLossHelper}
              />
            </section>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="lg:col-span-3" title={labels.distTitle} subtitle={labels.distHint} noPadding>
                <div className="px-3 pb-2 pt-4">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.probability_distribution} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgb(0 0 0 / 0.06)" />
                        <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgb(107 107 99)" }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "rgb(107 107 99)" }} />
                        <Tooltip
                          cursor={{ fill: "rgb(0 0 0 / 0.04)" }}
                          contentStyle={{
                            background: "rgb(255 255 255 / 0.95)",
                            border: "1px solid rgb(0 0 0 / 0.08)",
                            borderRadius: 12,
                            fontSize: 12,
                          }}
                          formatter={(v) => [intFmt.format(Number(v)), labels.predictions]}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {data.probability_distribution.map((bin) => {
                            const lower = parseFloat(bin.bucket.split(/[–-]/)[0]);
                            const isAbandon = lower >= data.model.threshold;
                            return (
                              <Cell
                                key={bin.bucket}
                                fill={isAbandon ? "#A03521" : "#3E6E8E"}
                                fillOpacity={isAbandon ? 0.9 : 0.75}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 text-xs border-t border-surface-muted">
                  <div className="flex flex-wrap items-center gap-3 text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-secondary" />
                      {labels.convertedPredicted}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-error" />
                      {labels.abandonPredicted}
                    </span>
                  </div>
                  <span className="text-muted">
                    {labels.peakBuckets}:{" "}
                    <span className="font-mono text-text">{peakBuckets.join(", ")}</span>
                  </span>
                </div>
              </Card>

              <Card className="lg:col-span-2" title={labels.cmTitle} subtitle={labels.cmHint}>
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2">
                  <div />
                  <div className="text-center text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.cmPredAbandon}
                  </div>
                  <div className="text-center text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.cmPredConvert}
                  </div>

                  <div className="self-center text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.actualAbandon}
                  </div>
                  <ConfusionCell label={labels.tp} value={data.metrics.confusion_matrix.true_positive} total={totalConfusion} good />
                  <ConfusionCell label={labels.fn} value={data.metrics.confusion_matrix.false_negative} total={totalConfusion} good={false} />

                  <div className="self-center text-right text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    {labels.actualConverted}
                  </div>
                  <ConfusionCell label={labels.fp} value={data.metrics.confusion_matrix.false_positive} total={totalConfusion} good={false} />
                  <ConfusionCell label={labels.tn} value={data.metrics.confusion_matrix.true_negative} total={totalConfusion} good />
                </div>
              </Card>
            </div>

            <Card title={labels.contribTitle} subtitle={labels.contribHint} noPadding>
              <div className="overflow-x-auto">
                <div className="min-w-[820px]">
                  <div className="grid grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1.4fr)_120px_140px] bg-bg border-b border-surface-muted px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    <span>{labels.rank}</span>
                    <span>{labels.feature}</span>
                    <span>{labels.importance}</span>
                    <span className="text-right">{labels.meanShap}</span>
                    <span className="text-right">{labels.direction}</span>
                  </div>
                  {data.feature_contributions.map((f, i) => (
                    <div
                      key={f.feature}
                      className="grid grid-cols-[28px_minmax(0,1.4fr)_minmax(0,1.4fr)_120px_140px] items-center gap-3 px-6 py-3 text-sm border-b border-surface-muted/60 last:border-b-0 hover:bg-surface-muted/30 transition-colors"
                    >
                      <span className="font-mono text-xs tabular-nums text-muted">{i + 1}</span>
                      <span className="font-mono text-xs text-text">{f.feature}</span>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(f.importance / featureMaxImportance) * 100}%` }}
                          />
                        </div>
                        <span className="w-12 text-right tabular-nums text-muted text-xs">
                          {f.importance.toFixed(3)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-right font-mono text-xs tabular-nums",
                          f.shap_mean >= 0 ? "text-error" : "text-primary",
                        )}
                      >
                        {f.shap_mean >= 0 ? "+" : ""}
                        {f.shap_mean.toFixed(3)}
                      </span>
                      <span className="flex items-center justify-end gap-1.5 text-xs text-muted">
                        <DirectionGlyph direction={f.direction} />
                        <span>{directionLabel(f.direction)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <p className="text-xs text-muted max-w-3xl leading-relaxed">
              <span className="font-extrabold text-text">{labels.legendHeading}</span>{" "}
              {labels.legendNote}
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
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}
