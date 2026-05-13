"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EditorialShell from "@/components/editorial/EditorialShell";
import AbandonmentTrendChart from "@/components/charts/AbandonmentTrendChart";
import FeatureImportanceBarChart from "@/components/charts/FeatureImportanceBarChart";
import PredictionHistogram from "@/components/charts/PredictionHistogram";
import InsightQuote from "@/components/ui/InsightQuote";
import { getAnalyticsData } from "@/lib/services/analytics";
import type { AnalyticsOverview } from "@/types/api";
import AblationStudyPanel from "./AblationStudyPanel";

const TABS = [
  { key: "overview",  label: "Тойм" },
  { key: "ablation",  label: "Ablation шинжилгээ" },
] as const;
type TabKey = typeof TABS[number]["key"];

const EMPTY_ANALYTICS: AnalyticsOverview = {
  featureImportance:      [],
  abandonmentTrend:       [],
  predictionDistribution: [],
};

function StatSkeleton() {
  return (
    <div className="rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest p-4 space-y-2">
      <div className="skeleton h-2.5 w-24 rounded" />
      <div className="skeleton h-8 w-16 rounded" />
      <div className="skeleton h-2.5 w-20 rounded" />
    </div>
  );
}

function ChartSkeleton({ height = "h-48" }: { height?: string }) {
  return <div className={`skeleton ${height} rounded-lg`} />;
}

function AnalyticsOverviewTab({ data, loading }: { data: AnalyticsOverview; loading: boolean }) {
  const totalSessions = data.predictionDistribution.reduce((s, b) => s + b.count, 0);
  const highRiskCount = data.predictionDistribution
    .filter((b) => b.bucket === "0.6-0.8" || b.bucket === "0.8-1.0")
    .reduce((s, b) => s + b.count, 0);
  const avgAbandon =
    data.abandonmentTrend.length > 0
      ? (
          data.abandonmentTrend.reduce((s, p) => s + p.abandonmentRate, 0) /
          data.abandonmentTrend.length
        ).toFixed(1)
      : "—";
  const highRiskPct = totalSessions > 0 ? Math.round((highRiskCount / totalSessions) * 100) : 0;

  const statCards = [
    { label: "Өндөр эрсдэлтэй сесс", value: loading ? null : highRiskCount.toLocaleString(), note: `+${highRiskPct}% нийтэд`, accent: "#ef4444" },
    { label: "Дундаж орхилт",         value: loading ? null : `${avgAbandon}%`,               note: "→ Тогтвортой",           accent: null },
    { label: "Сэргээлтийн хувь",      value: loading ? null : "18.5%",                        note: "↗ +2.1% сайжруулалт",   accent: "#10b981" },
    { label: "Онцлогийн мэдрэмж",     value: loading ? null : "0.82",                         note: "Өндөр нарийвчлал",      accent: null },
  ];

  return (
    <>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {statCards.map(({ label, value, note, accent }) =>
          loading ? (
            <StatSkeleton key={label} />
          ) : (
            <div
              key={label}
              className={`rounded-lg border p-4 transition-shadow duration-200 hover:shadow-md ${
                accent === "#ef4444"
                  ? "border-[#ef4444]/20 bg-[#ef4444]/5"
                  : "border-outline-variant/[0.09] bg-surface-container-lowest"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
              <p
                className="mt-2 text-[1.5rem] font-semibold tabular-nums"
                style={{ color: accent ?? undefined }}
              >
                {value}
              </p>
              <p
                className="mt-1 text-[11px] font-medium"
                style={{ color: accent ? `${accent}cc` : undefined }}
              >
                {!accent && <span className="text-on-surface-variant">{note}</span>}
                {accent && note}
              </p>
            </div>
          )
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Орхилтын трендийн шинжилгээ</h3>
              <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">Сессийн тоо ба орхилтын хувь</p>
            </div>
            <div className="inline-flex rounded-lg border border-outline-variant/15 bg-surface-container-low p-0.5 text-xs font-semibold">
              <span className="px-3 py-1.5 text-on-surface-variant">Өдөр</span>
              <span className="px-3 py-1.5 rounded-md bg-primary text-on-primary shadow-sm">7 хоног</span>
            </div>
          </div>
          {loading ? <ChartSkeleton height="h-52" /> : <AbandonmentTrendChart data={data.abandonmentTrend} />}
          <InsightQuote>
            36-р долоо хоногийн бууралт нь &quot;One-click&quot; checkout шинэчлэлттэй шууд уялдаатай. Эргэн тойрны baseline-тай харьцуулахад итгэлтэй.
          </InsightQuote>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
          <h3 className="text-sm font-bold text-on-surface mb-1">SHAP онцлогийн чухал байдал</h3>
          <p className="text-[0.6875rem] text-on-surface-variant mb-4">Орхилтод чиглэсэн хүчин зүйлс</p>
          {loading ? <ChartSkeleton height="h-48" /> : <FeatureImportanceBarChart data={data.featureImportance} />}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
          <h3 className="text-sm font-bold text-on-surface mb-1">Онооны хуваарилалт</h3>
          <p className="text-[0.6875rem] text-on-surface-variant mb-4">Сессүүдийн таамаглалын оноогоор ангилал</p>
          {loading ? <ChartSkeleton height="h-40" /> : <PredictionHistogram data={data.predictionDistribution} />}
        </div>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
          <h3 className="text-sm font-bold text-on-surface mb-2">Загварын логик (товчлох)</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
            Gradient boosting ансамбль, SHAP-тай тайлбарлагддаг. Сургалтын өгөгдөл нь checkout алхмуудын telemetry-г агуулна.
          </p>
          <div className="rounded-lg border border-outline-variant/10 bg-surface-alt/50 p-4 text-xs text-on-surface-variant">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="skeleton h-2.5 w-28 rounded" />
                    <div className="skeleton h-2.5 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : data.featureImportance.length > 0 ? (
              <div className="space-y-2">
                {data.featureImportance.slice(0, 4).map((feature) => (
                  <div key={feature.feature} className="flex items-center justify-between gap-3">
                    <span className="font-mono truncate">{feature.feature}</span>
                    <span className="font-semibold text-on-surface tabular-nums">
                      {(feature.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              "Загварын тайлбарлах өгөгдөл одоогоор байхгүй байна."
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
        <h3 className="text-sm font-bold text-on-surface mb-4">Онцлогуудын тайлбар</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-outline-variant/10 bg-surface-alt/65 px-3 py-2.5">
                <div className="skeleton w-1.5 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-2.5 w-24 rounded" />
                  <div className="skeleton h-1.5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.featureImportance.map((f) => (
              <div
                key={f.feature}
                className="flex items-center gap-3 rounded-lg border border-outline-variant/10 bg-surface-alt/65 px-3 py-2.5 transition-colors duration-150 hover:bg-surface-container-low"
              >
                <div className="w-1.5 h-8 rounded-full bg-primary shrink-0" style={{ opacity: Math.max(0.35, f.importance) }} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold text-on-surface truncate">{f.feature}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                      <div className="h-full rounded-full bg-secondary transition-bar" style={{ width: `${f.importance * 100}%` }} />
                    </div>
                    <span className="text-[0.625rem] font-bold text-secondary shrink-0 tabular-nums">
                      {(f.importance * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function AnalyticsPageContent() {
  const searchParams = useSearchParams();
  const tab: TabKey = searchParams.get("tab") === "ablation" ? "ablation" : "overview";

  const [data, setData] = useState<AnalyticsOverview>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAnalyticsData()
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
      <EditorialShell activeNav="analytics" title="Аналитик" subtitle="Орхилтын дүн шинжилгээ">
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-400 mx-auto page-enter">
        {/* Хуудасны header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">Аналитикийн нарийвчилсан шинжилгээ</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Орхилтын жолоодогч болон сессийн эрсдэлийн профайлын нарийвчилсан тайлбар.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-outline-variant/[0.1] bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
              Q3 сессийн өгөгдөл
            </span>
            <span className="inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#10b981]/8 px-2.5 py-1 text-[11px] font-semibold text-[#10b981]">
              Баталгаажсан
            </span>
          </div>
        </div>

        {/* Tab navigation хэсэг */}
        <div className="inline-flex rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest p-0.5" role="tablist">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`/analytics${t.key === "overview" ? "" : `?tab=${t.key}`}`}
              className={[
                "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors duration-150",
                tab === t.key
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
              role="tab"
              aria-selected={tab === t.key}
            >
              {t.label}
            </a>
          ))}
        </div>

        {tab === "ablation" ? (
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-on-surface">Ablation шинжилгээ — Загварын хувилбаруудын харьцуулалт</h3>
              <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">
                Baseline, extended, full загваруудын гүйцэтгэлийн зөрүү
              </p>
            </div>
            <AblationStudyPanel />
          </section>
        ) : (
          <AnalyticsOverviewTab data={data} loading={loading} />
        )}
      </div>
    </EditorialShell>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <EditorialShell activeNav="analytics" title="Аналитик" subtitle="Уншиж байна…">
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-400 mx-auto">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </EditorialShell>
    }>
      <AnalyticsPageContent />
    </Suspense>
  );
}
