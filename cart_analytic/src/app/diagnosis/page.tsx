"use client";

import { useEffect, useMemo, useState } from "react";
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
import { RefreshCw, Sigma, Sparkles } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchDashboardReasons,
  type ReasonCode,
  type ReasonsResponse,
} from "@/lib/services/dashboard-mvp";
import { riskLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

const REASON_BLURB: Record<ReasonCode, string> = {
  S1: "Сэтгэлзүйн эргэлзээ: checkout дуусахаас өмнө эргэлзэх дохио илэрсэн.",
  S2: "Техникийн саатал: алдаа, удаан харилцан үйлдэл эсвэл checkout доголдол.",
  S3: "Итгэлцлийн асуудал: худалдаачин, төлбөр эсвэл бүтээгдэхүүний баталгаа дутмаг.",
  S4: "Мобайл хэрэглээний хүндрэл: гар утсан дээрх UX дуусгалтад нөлөөлж байна.",
  S5: "Үнийн мэдрэмж: сагсны нийт дүн, хүргэлт эсвэл хөнгөлөлтийн хүлээлт.",
  S6: "Шийдвэргүй байдал / навигацийн төөрөгдөл: давтан шилжилт, харьцуулалт.",
  S7: "Гадны нөлөө / эх сурвалжийн эффект: referral эсвэл гадны контекст.",
};

function severityVariant(severity: string): "error" | "warning" | "success" {
  if (severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "success";
}

function severityBarColor(severity: string): string {
  if (severity === "high") return "#A03521";
  if (severity === "medium") return "#9C6B14";
  return "#1F4D3E";
}

export default function DiagnosisPage() {
  const [data, setData] = useState<ReasonsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useLanguage();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardReasons());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "EN"
            ? "Reasons API request failed."
            : "Шалтгааны шинжилгээний API хүсэлт амжилтгүй боллоо.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reasons = useMemo(() => {
    return data?.reasons ?? [];
  }, [data]);

  const sortedByScore = useMemo(
    () => [...reasons].sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0)),
    [reasons],
  );

  const top = sortedByScore[0];
  const totalDominant = reasons.reduce((acc, r) => acc + (r.dominant_sessions ?? 0), 0);

  const chartData = reasons.map((row) => ({
    code: row.code,
    label: row.label,
    score: row.average_score,
    dominant: row.dominant_sessions,
  }));

  const labels = {
    formula: lang === "EN" ? "Dominant reason formula" : "Давамгай шалтгааны томьёо",
    formulaHint:
      lang === "EN"
        ? "Pick the maximum of the seven standard scores"
        : "Долоон стандарт онооноос хамгийн ихийг сонгоно",
    topReason: lang === "EN" ? "Highest scoring reason" : "Хамгийн өндөр оноотой шалтгаан",
    diagnosed:
      lang === "EN"
        ? `${totalDominant} sessions diagnosed`
        : `${totalDominant} сесс оношлогдсон`,
    avgScore: lang === "EN" ? "Average score" : "Дундаж оноо",
    dominantSessions: lang === "EN" ? "Dominant sessions" : "Давамгай сесс",
    chartTitle:
      lang === "EN" ? "Average S1–S7 score across diagnosed sessions" : "S1–S7 дундаж оноо",
    chartHint:
      lang === "EN"
        ? "Higher means the reason is showing up more strongly"
        : "Өндөр байх тусам шалтгаан илүү хүчтэй илэрч байна",
    suggested: lang === "EN" ? "Suggested action" : "Санал болгосон арга хэмжээ",
    dominantSuffix: lang === "EN" ? "sessions dominant" : "сесс давамгай",
    share: lang === "EN" ? "share" : "эзлэх хувь",
    noDiag:
      lang === "EN"
        ? "No diagnosis yet. Generate demo sessions and wait for predictions to land."
        : "Оношлогоо одоогоор алга. Demo сесс үүсгээд таамаглал боловсруулагдахыг хүлээнэ үү.",
    noSessions:
      lang === "EN"
        ? "No sessions diagnosed yet."
        : "Оношлогдсон сесс одоогоор алга.",
    formulaExplain:
      lang === "EN"
        ? "Argmax keeps the dashboard truthful: every dominant label here came from the Main service, not a local recompute."
        : "Argmax зарчим нь dashboard-ийг үнэн зөв байлгана: давамгай label бүр Main сервисээс ирсэн утга.",
  };

  return (
    <EditorialShell
      activeNav="diagnosis"
      title={t.diagnosis.title}
      subtitle={t.diagnosis.subtitle}
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
        {error ? (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-12 stagger-children">
          <Card
            className="lg:col-span-7"
            title={labels.formula}
            subtitle={labels.formulaHint}
            icon={Sigma}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <pre className="m-0 flex-1 rounded-xl bg-bg border border-surface-muted px-4 py-3 font-mono text-xs leading-relaxed text-text overflow-x-auto">
                {data?.dominant_reason_formula ??
                  "dominant_reason = argmax(S1, S2, S3, S4, S5, S6, S7)"}
              </pre>
              <p className="max-w-[42ch] text-xs leading-relaxed text-muted">
                {labels.formulaExplain}
              </p>
            </div>
          </Card>

          <Card className="lg:col-span-5" title={labels.topReason} subtitle={labels.diagnosed}>
            {loading ? (
              <div className="space-y-4">
                <div className="skeleton h-9 w-40 rounded-md" />
                <div className="skeleton h-16 rounded-md" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="skeleton h-12 rounded-md" />
                  <div className="skeleton h-12 rounded-md" />
                </div>
              </div>
            ) : top ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="font-display font-extrabold text-primary text-4xl leading-none tracking-tight">
                    {top.code}
                  </span>
                  <span className="text-base font-bold text-text">{top.label}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {REASON_BLURB[top.code as ReasonCode] ?? top.explanation}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                      {labels.avgScore}
                    </dt>
                    <dd className="mt-1 font-display font-extrabold tabular-nums text-text text-xl">
                      {top.average_score.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                      {labels.dominantSessions}
                    </dt>
                    <dd className="mt-1 font-display font-extrabold tabular-nums text-text text-xl">
                      {top.dominant_sessions}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-sm text-muted">{labels.noSessions}</p>
            )}
          </Card>
        </div>

        <Card title={labels.chartTitle} subtitle={labels.chartHint} noPadding>
          {loading ? (
            <div className="h-72 m-6 rounded-xl bg-surface-muted animate-pulse" />
          ) : chartData.length ? (
            <div className="h-[320px] px-4 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 16, right: 24, top: 8, bottom: 8 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid horizontal={false} stroke="rgb(0 0 0 / 0.06)" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => v.toFixed(1)}
                    tick={{ fontSize: 10.5, fill: "rgb(107 107 99)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="code"
                    tick={{ fontSize: 11, fill: "rgb(107 107 99)" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value) => Number(value ?? 0).toFixed(3)}
                    cursor={{ fill: "rgb(0 0 0 / 0.04)" }}
                    contentStyle={{
                      background: "rgb(255 255 255 / 0.95)",
                      border: "1px solid rgb(0 0 0 / 0.08)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                    {chartData.map((row) => {
                      const tone =
                        row.score >= 0.66 ? "#A03521" : row.score >= 0.33 ? "#9C6B14" : "#1F4D3E";
                      return <Cell key={row.code} fill={tone} fillOpacity={0.9} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="m-6 rounded-xl bg-surface-muted/40 px-6 py-12 text-center">
              <Sparkles className="mx-auto size-5 text-muted" />
              <p className="mt-3 text-sm text-muted">{labels.noDiag}</p>
            </div>
          )}
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {!loading && reasons.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-sm text-muted">{labels.noDiag}</p>
            </Card>
          ) : null}

          {reasons.map((reason) => {
            const code = reason.code as ReasonCode;
            return (
              <Card
                key={code}
                title={
                  <span className="inline-flex items-baseline gap-3">
                    <span className="font-display font-extrabold text-primary text-2xl leading-none tracking-tight">
                      {code}
                    </span>
                    <span className="text-sm font-bold text-text truncate">{reason.label}</span>
                  </span>
                }
                headerAction={<Badge variant={severityVariant(reason.severity)}>{riskLabel(reason.severity)}</Badge>}
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                        {labels.avgScore}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-text">
                        {reason.average_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${reason.average_score * 100}%`,
                          background: severityBarColor(reason.severity),
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted">
                    {reason.explanation || REASON_BLURB[code]}
                  </p>

                  <div className="rounded-xl bg-surface-muted/50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                      {labels.suggested}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-text">{reason.recommended_action}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-muted">
                    <span className="text-xs text-muted">
                      <span className="font-bold tabular-nums text-text">
                        {reason.dominant_sessions}
                      </span>{" "}
                      {labels.dominantSuffix}
                    </span>
                    <span className="text-xs text-muted">
                      {totalDominant > 0
                        ? `${((reason.dominant_sessions / totalDominant) * 100).toFixed(0)}% ${labels.share}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      </div>
    </EditorialShell>
  );
}
