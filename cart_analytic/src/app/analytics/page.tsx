import { Suspense } from "react";
import EditorialShell from "@/components/editorial/EditorialShell";
import AbandonmentTrendChart from "@/components/charts/AbandonmentTrendChart";
import FeatureImportanceBarChart from "@/components/charts/FeatureImportanceBarChart";
import PredictionHistogram from "@/components/charts/PredictionHistogram";
import InsightQuote from "@/components/ui/InsightQuote";
import { getAnalyticsData } from "@/lib/services/analytics";
import AblationStudyPanel from "./AblationStudyPanel";

const TABS = [
  { key: "overview",  label: "Тойм" },
  { key: "ablation",  label: "Ablation Study" },
] as const;
type TabKey = typeof TABS[number]["key"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: TabKey = sp.tab === "ablation" ? "ablation" : "overview";

  const data = await getAnalyticsData();

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

  return (
    <EditorialShell activeNav="analytics" title="Аналитик" subtitle="Орхилтын дүн шинжилгээ">
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-400 mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">Аналитик Deep-Dive</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Орхилтын жолоодогч болон сессийн эрсдэлийн профайлын нарийвчилсан тайлбар.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center rounded-full border border-outline-variant/[0.1] bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
              Q3 session өгөгдөл
            </span>
            <span className="inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#10b981]/8 px-2.5 py-1 text-[11px] font-semibold text-[#10b981]">
              Баталгаажсан
            </span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="inline-flex rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest p-0.5" role="tablist">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`/analytics${t.key === "overview" ? "" : `?tab=${t.key}`}`}
              className={[
                "px-4 py-1.5 rounded-md text-sm font-semibold transition-colors",
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
              <h3 className="text-sm font-bold text-on-surface">Ablation Study — Загварын хувилбаруудын харьцуулалт</h3>
              <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">
                Baseline, extended, full загваруудын гүйцэтгэлийн зөрүү
              </p>
            </div>
            <Suspense fallback={<div className="h-64 rounded-xl bg-surface-container-low animate-pulse" />}>
              <AblationStudyPanel />
            </Suspense>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Өндөр эрсдэлтэй сесс", value: highRiskCount.toLocaleString(), note: `+${highRiskPct}% нийтэд`, accent: "#ef4444" },
                { label: "Дундаж орхилт",         value: `${avgAbandon}%`,               note: "→ Тогтвортой",           accent: null },
                { label: "Сэргээлтийн хувь",      value: "18.5%",                        note: "↗ +2.1% сайжруулалт",   accent: "#10b981" },
                { label: "Онцлогийн мэдрэмж",     value: "0.82",                         note: "Өндөр нарийвчлал",      accent: null },
              ].map(({ label, value, note, accent }) => (
                <div key={label} className={`rounded-lg border p-4 ${accent === "#ef4444" ? "border-[#ef4444]/20 bg-[#ef4444]/5" : "border-outline-variant/[0.09] bg-surface-container-lowest"}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                  <p className={`mt-2 text-[1.5rem] font-semibold tabular-nums ${accent ? `text-[${accent}]` : "text-on-surface"}`}>{value}</p>
                  <p className={`mt-1 text-[11px] font-medium ${accent ? `text-[${accent}]/80` : "text-on-surface-variant"}`}>{note}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Орхилтын трендийн шинжилгээ</h3>
                    <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">Session тоо ба орхилтын хувь</p>
                  </div>
                  <div className="inline-flex rounded-lg border border-outline-variant/15 bg-surface-container-low p-0.5 text-xs font-semibold">
                    <span className="px-3 py-1.5 text-on-surface-variant">Өдөр</span>
                    <span className="px-3 py-1.5 rounded-md bg-primary text-on-primary shadow-sm">7 хоног</span>
                  </div>
                </div>
                <AbandonmentTrendChart data={data.abandonmentTrend} />
                <InsightQuote>
                  36-р долоо хоногийн бууралт нь &quot;One-click&quot; checkout шинэчлэлттэй шууд уялдаатай — эргэн тойрны baseline-тай харьцуулахад итгэлтэй.
                </InsightQuote>
              </div>

              <div className="lg:col-span-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
                <h3 className="text-sm font-bold text-on-surface mb-1">SHAP онцлогийн чухал байдал</h3>
                <p className="text-[0.6875rem] text-on-surface-variant mb-4">Орхилтод чиглэсэн хүчин зүйлс</p>
                <FeatureImportanceBarChart data={data.featureImportance} />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
                <h3 className="text-sm font-bold text-on-surface mb-1">Онооны хуваарилалт</h3>
                <p className="text-[0.6875rem] text-on-surface-variant mb-4">Сессүүдийн таамаглалын оноогоор ангилал</p>
                <PredictionHistogram data={data.predictionDistribution} />
              </div>
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
                <h3 className="text-sm font-bold text-on-surface mb-2">Загварын логик (товчлох)</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                  Gradient boosting ансамбль, SHAP-тай тайлбарлагддаг. Сургалтын өгөгдөл нь checkout алхмуудын telemetry-г агуулна.
                </p>
                <div className="rounded-lg border border-outline-variant/10 bg-surface-alt/50 p-4 text-xs text-on-surface-variant">
                  {data.featureImportance.length > 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.featureImportance.map((f) => (
                  <div
                    key={f.feature}
                    className="flex items-center gap-3 rounded-lg border border-outline-variant/10 bg-surface-alt/65 px-3 py-2.5"
                  >
                    <div className="w-1.5 h-8 rounded-full bg-primary shrink-0" style={{ opacity: Math.max(0.35, f.importance) }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-on-surface truncate">{f.feature}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div className="h-full rounded-full bg-secondary" style={{ width: `${f.importance * 100}%` }} />
                        </div>
                        <span className="text-[0.625rem] font-bold text-secondary shrink-0 tabular-nums">
                          {(f.importance * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </EditorialShell>
  );
}
