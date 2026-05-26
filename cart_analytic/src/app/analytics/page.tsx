"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, TrendingUp } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import AbandonmentTrendChart from "@/components/charts/AbandonmentTrendChart";
import FeatureImportanceBarChart from "@/components/charts/FeatureImportanceBarChart";
import PredictionHistogram from "@/components/charts/PredictionHistogram";
import { Card } from "@/components/ui/Card";
import { getAnalyticsData } from "@/lib/services/analytics";
import type { AnalyticsOverview } from "@/types/api";
import AblationStudyPanel from "./AblationStudyPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", labelKey: "overviewTab" as const },
  { key: "ablation", labelKey: "ablationTab" as const },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const EMPTY_ANALYTICS: AnalyticsOverview = {
  featureImportance: [],
  abandonmentTrend: [],
  predictionDistribution: [],
  summary: null,
};

function formatRatioPct(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function StatTile({
  label,
  value,
  note,
  accent = "neutral",
  loading,
}: {
  label: string;
  value: string | null;
  note?: string;
  accent?: "neutral" | "risk" | "good";
  loading: boolean;
}) {
  const valueColor =
    accent === "risk" ? "text-error" : accent === "good" ? "text-primary" : "text-text";
  const noteColor =
    accent === "risk" ? "text-error/80" : accent === "good" ? "text-primary/80" : "text-muted";
  return (
    <Card className={cn(accent === "risk" && "border-error/30 bg-error/5")}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-20 rounded bg-surface-muted animate-pulse" />
      ) : (
        <p className={cn("mt-2 font-display font-extrabold tabular-nums text-2xl leading-none", valueColor)}>
          {value}
        </p>
      )}
      {note ? <p className={cn("mt-2 text-xs font-medium", noteColor)}>{note}</p> : null}
    </Card>
  );
}

function AnalyticsOverviewTab({
  data,
  loading,
}: {
  data: AnalyticsOverview;
  loading: boolean;
}) {
  const { lang } = useLanguage();

  const totalSessions = data.predictionDistribution.reduce((s, b) => s + b.count, 0);
  const highRiskCount = data.predictionDistribution
    .filter((b) => b.bucket === "0.6-0.8" || b.bucket === "0.8-1.0")
    .reduce((s, b) => s + b.count, 0);
  const trendAvgAbandon =
    data.abandonmentTrend.length > 0
      ? data.abandonmentTrend.reduce((s, p) => s + p.abandonmentRate, 0) /
        data.abandonmentTrend.length
      : null;
  const summary = data.summary;
  const resolvedTotalSessions = summary?.totalSessions ?? totalSessions;
  const resolvedHighRiskCount = summary?.highRiskSessions ?? highRiskCount;
  const avgAbandonmentRate = summary?.abandonmentRate ?? trendAvgAbandon;
  const conversionRate =
    summary?.conversionRate ?? (avgAbandonmentRate == null ? null : 1 - avgAbandonmentRate);
  const topFeature = data.featureImportance.reduce<AnalyticsOverview["featureImportance"][number] | null>(
    (current, item) => (!current || item.importance > current.importance ? item : current),
    null,
  );
  const highRiskPct = resolvedTotalSessions > 0
    ? Math.round((resolvedHighRiskCount / resolvedTotalSessions) * 100)
    : 0;

  const labels = {
    highRisk: lang === "EN" ? "High-risk sessions" : "Өндөр эрсдэлтэй сесс",
    highRiskNote:
      lang === "EN" ? `${highRiskPct}% of total` : `Нийтийн ${highRiskPct}%`,
    avgAbandon: lang === "EN" ? "Avg abandonment" : "Дундаж орхилт",
    stable: lang === "EN" ? "Stable" : "Тогтвортой",
    recovery: lang === "EN" ? "Conversion rate" : "Хөрвөлтийн хувь",
    recoveryNote: summary
      ? lang === "EN"
        ? `${summary.convertedSessions.toLocaleString()} converted sessions`
        : `${summary.convertedSessions.toLocaleString()} хөрвөсөн сесс`
      : lang === "EN"
        ? "Derived from abandonment trend"
        : "Орхилтын трендээс тооцсон",
    sensitivity: lang === "EN" ? "Top SHAP weight" : "Дээд SHAP жин",
    sensitivityNote: topFeature?.feature ?? (lang === "EN" ? "No feature data" : "Онцлогийн өгөгдөл алга"),
    trendTitle: lang === "EN" ? "Abandonment trend" : "Орхилтын трендийн шинжилгээ",
    trendSubtitle:
      lang === "EN" ? "Sessions and abandonment rate" : "Сессийн тоо ба орхилтын хувь",
    shapTitle: lang === "EN" ? "SHAP feature importance" : "SHAP онцлогийн чухал байдал",
    shapSubtitle: lang === "EN" ? "Drivers of abandonment" : "Орхилтод чиглэсэн хүчин зүйлс",
    distTitle: lang === "EN" ? "Score distribution" : "Онооны хуваарилалт",
    distSubtitle:
      lang === "EN"
        ? "Sessions classified by prediction score"
        : "Сессүүдийн таамаглалын оноогоор ангилал",
    logicTitle: lang === "EN" ? "Model logic" : "Загварын логик",
    logicBody:
      lang === "EN"
        ? "Gradient-boosted ensemble explained with SHAP. Trained on checkout-step telemetry."
        : "Gradient boosting ансамбль, SHAP-тай тайлбарлагддаг. Сургалтын өгөгдөл нь checkout алхмуудын telemetry.",
    explainTitle: lang === "EN" ? "Feature breakdown" : "Онцлогуудын тайлбар",
    daily: lang === "EN" ? "Daily" : "Өдөр",
    weekly: lang === "EN" ? "7 days" : "7 хоног",
    noFeatures: lang === "EN" ? "No feature data yet." : "Загварын тайлбарлах өгөгдөл алга.",
  };

  return (
    <>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label={labels.highRisk}
          value={loading ? null : resolvedHighRiskCount.toLocaleString()}
          note={labels.highRiskNote}
          accent="risk"
          loading={loading}
        />
        <StatTile
          label={labels.avgAbandon}
          value={loading ? null : formatRatioPct(avgAbandonmentRate)}
          note={labels.stable}
          loading={loading}
        />
        <StatTile
          label={labels.recovery}
          value={loading ? null : formatRatioPct(conversionRate)}
          note={labels.recoveryNote}
          accent="good"
          loading={loading}
        />
        <StatTile
          label={labels.sensitivity}
          value={loading ? null : (topFeature ? topFeature.importance.toFixed(2) : "—")}
          note={labels.sensitivityNote}
          loading={loading}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card
          className="lg:col-span-8"
          title={labels.trendTitle}
          subtitle={labels.trendSubtitle}
          headerAction={
            <div className="inline-flex rounded-xl bg-surface-muted p-1 text-xs font-bold">
              <span className="px-3 py-1 text-muted">{labels.daily}</span>
              <span className="px-3 py-1 rounded-lg bg-primary text-white shadow-sm">
                {labels.weekly}
              </span>
            </div>
          }
        >
          {loading ? (
            <div className="h-52 rounded-xl bg-surface-muted animate-pulse" />
          ) : (
            <AbandonmentTrendChart data={data.abandonmentTrend} />
          )}
        </Card>

        <Card className="lg:col-span-4" title={labels.shapTitle} subtitle={labels.shapSubtitle}>
          {loading ? (
            <div className="h-48 rounded-xl bg-surface-muted animate-pulse" />
          ) : (
            <FeatureImportanceBarChart data={data.featureImportance} />
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={labels.distTitle} subtitle={labels.distSubtitle}>
          {loading ? (
            <div className="h-40 rounded-xl bg-surface-muted animate-pulse" />
          ) : (
            <PredictionHistogram data={data.predictionDistribution} />
          )}
        </Card>
        <Card title={labels.logicTitle}>
          <p className="text-sm text-muted leading-relaxed mb-4">{labels.logicBody}</p>
          <div className="rounded-xl bg-surface-muted/50 border border-surface-muted p-4 text-xs">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="h-3 w-28 rounded bg-surface-muted animate-pulse" />
                    <div className="h-3 w-8 rounded bg-surface-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : data.featureImportance.length > 0 ? (
              <div className="space-y-2">
                {data.featureImportance.slice(0, 4).map((feature) => (
                  <div key={feature.feature} className="flex items-center justify-between gap-3">
                    <span className="font-mono truncate text-muted">{feature.feature}</span>
                    <span className="font-bold text-text tabular-nums">
                      {(feature.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">{labels.noFeatures}</p>
            )}
          </div>
        </Card>
      </section>

      <Card title={labels.explainTitle} icon={TrendingUp}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-surface-muted/50 px-3 py-3"
              >
                <div className="w-1.5 h-9 rounded-full bg-surface-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-surface-muted animate-pulse" />
                  <div className="h-2 rounded-full bg-surface-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : data.featureImportance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.featureImportance.map((f) => (
              <div
                key={f.feature}
                className="flex items-center gap-3 rounded-xl bg-surface-muted/50 px-3 py-3 hover:bg-surface-muted transition-colors"
              >
                <div
                  className="w-1.5 h-9 rounded-full bg-primary shrink-0"
                  style={{ opacity: Math.max(0.35, f.importance) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-text truncate">{f.feature}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-secondary transition-all duration-500"
                        style={{ width: `${f.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-secondary shrink-0 tabular-nums">
                      {(f.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted">
            <AlertTriangle className="mx-auto size-5 mb-2 text-muted" />
            {labels.noFeatures}
          </div>
        )}
      </Card>
    </>
  );
}

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const tab: TabKey = searchParams.get("tab") === "ablation" ? "ablation" : "overview";

  const [data, setData] = useState<AnalyticsOverview>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    getAnalyticsData()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <EditorialShell
      activeNav="analytics"
      title={t.analytics.title}
      subtitle={t.analytics.subtitle}
    >
      <div className="space-y-6">
        <div className="inline-flex rounded-xl border border-surface-muted bg-surface p-1" role="tablist">
          {TABS.map((tabItem) => {
            const label =
              tabItem.key === "ablation" ? t.analytics.ablationTab : t.analytics.overviewTab;
            return (
              <a
                key={tabItem.key}
                href={`/analytics${tabItem.key === "overview" ? "" : `?tab=${tabItem.key}`}`}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-colors duration-150",
                  tab === tabItem.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text",
                )}
                role="tab"
                aria-selected={tab === tabItem.key}
              >
                {label}
              </a>
            );
          })}
        </div>

        {tab === "ablation" ? (
          <Card title={t.ablation.title} subtitle={t.ablation.subtitle}>
            <AblationStudyPanel />
          </Card>
        ) : (
          <AnalyticsOverviewTab data={data} loading={loading} />
        )}
      </div>
    </EditorialShell>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsFallback />}>
      <AnalyticsPageContent />
    </Suspense>
  );
}

function AnalyticsFallback() {
  const { t } = useLanguage();
  return (
    <EditorialShell activeNav="analytics" title={t.analytics.title}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-surface-muted animate-pulse" />
      </div>
    </EditorialShell>
  );
}
