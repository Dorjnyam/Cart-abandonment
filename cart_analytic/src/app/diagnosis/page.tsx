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
import {
  fetchDashboardReasons,
  SCORE_ORDER,
  type ReasonCode,
  type ReasonsResponse,
} from "@/lib/services/dashboard-mvp";
import { riskLabel } from "@/lib/mn-labels";

const REASON_BLURB: Record<ReasonCode, string> = {
  S1: "Сэтгэлзүйн эргэлзээ: checkout дуусахаас өмнө эргэлзэх дохио илэрсэн.",
  S2: "Техникийн саатал: алдаа, удаан харилцан үйлдэл эсвэл checkout доголдол явцыг хаасан.",
  S3: "Итгэлцлийн асуудал: худалдаачин, төлбөр эсвэл бүтээгдэхүүний баталгааг илүү тодруулах шаардлагатай.",
  S4: "Мобайл хэрэглээний хүндрэл: гар утас дээрх харилцан үйлдлийн чанар дуусгалтад нөлөөлж байна.",
  S5: "Үнийн мэдрэмж: сагсны нийт дүн, хүргэлт эсвэл хөнгөлөлтийн хүлээлт худалдан авалтыг саатуулж байна.",
  S6: "Шийдвэргүй байдал / навигацийн төөрөгдөл: давтан шилжилт, харьцуулалт нь эргэлзээг харуулж байна.",
  S7: "Гадны нөлөө / эх сурвалжийн эффект: referral эсвэл гадны контекст худалдан авалтад нөлөөлж байна.",
};

function severityTone(severity: string) {
  if (severity === "high") return { bg: "rgb(160 53 33 / 0.08)", fg: "#7E2A1A", dot: "#A03521" };
  if (severity === "medium") return { bg: "rgb(156 107 20 / 0.10)", fg: "#7C5410", dot: "#9C6B14" };
  return { bg: "rgb(31 77 62 / 0.08)", fg: "#1F4D3E", dot: "#1F4D3E" };
}

function SectionCard({
  title,
  hint,
  right,
  children,
  className = "",
  pad = true,
}: {
  title?: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`tile rounded-md ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 px-5 py-3 hairline-b">
          <div>
            <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-on-surface">{title}</h2>
            {hint ? <p className="mt-0.5 text-[11px] text-on-surface-variant">{hint}</p> : null}
          </div>
          {right}
        </header>
      ) : null}
      <div className={pad ? "px-5 py-4" : ""}>{children}</div>
    </section>
  );
}

export default function DiagnosisPage() {
  const [data, setData] = useState<ReasonsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardReasons());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Шалтгааны шинжилгээний API хүсэлт амжилтгүй боллоо.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const reasons = useMemo(() => {
    if (!data) {
      return SCORE_ORDER.map((code) => ({
        code,
        label: code,
        average_score: 0,
        dominant_sessions: 0,
        severity: "low" as const,
        explanation: REASON_BLURB[code as ReasonCode] ?? "—",
        recommended_action: "—",
      }));
    }
    return data.reasons;
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
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          {t.common.refresh}
        </button>
      }
    >
      <div className="space-y-6">

        {error ? (
          <div className="mt-6 rounded-md border border-error/25 bg-error/[0.05] px-4 py-3 text-[12.5px] text-error">
            {error}
          </div>
        ) : null}

        {/* Дээд хэсэг: formula ба top reason summary */}
        <div className="mt-6 grid gap-4 lg:grid-cols-12 stagger-children">
          <SectionCard
            className="lg:col-span-7"
            title="Давамгай шалтгааны томьёо"
            hint="Долоон стандарт онооноос хамгийн ихийг сонгоно"
            right={<Sigma className="size-3.5 text-on-surface-variant/60" aria-hidden />}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <pre
                className="m-0 rounded-md hairline bg-surface-container-low/50 px-4 py-3 font-mono text-[12.5px] leading-[1.6] text-on-surface"
                style={{ overflowX: "auto" }}
              >
                {data?.dominant_reason_formula ??
                  "dominant_reason = argmax(S1, S2, S3, S4, S5, S6, S7)"}
              </pre>
              <p className="max-w-[42ch] text-[11.5px] leading-[1.55] text-on-surface-variant">
                Argmax зарчим нь dashboard-ийг үнэн зөв байлгана: энд харагдах давамгай label бүр
                Main сервисээс ирсэн утга бөгөөд локал дахин тооцоолол биш.
              </p>
            </div>
          </SectionCard>

          <SectionCard className="lg:col-span-5" title="Хамгийн өндөр оноотой шалтгаан" hint={`${totalDominant} сесс оношлогдсон`}>
            {top ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontVariationSettings: '"opsz" 144, "SOFT" 30',
                      fontSize: 38,
                      lineHeight: 1,
                      fontWeight: 400,
                      color: "#1F4D3E",
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {top.code}
                  </span>
                  <span className="text-[15px] font-medium text-on-surface">{top.label}</span>
                </div>
                <p className="mt-3 text-[12.5px] leading-[1.6] text-on-surface-variant">
                  {REASON_BLURB[top.code as ReasonCode] ?? top.explanation}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Дундаж оноо
                    </dt>
                    <dd
                      className="mt-1 font-mono tabular-nums text-on-surface"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontVariationSettings: '"opsz" 96',
                        fontSize: 22,
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {top.average_score.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Давамгай сесс
                    </dt>
                    <dd
                      className="mt-1 tabular-nums text-on-surface"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontVariationSettings: '"opsz" 96',
                        fontSize: 22,
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {top.dominant_sessions}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-[12.5px] text-on-surface-variant">Оношлогдсон сесс одоогоор алга.</p>
            )}
          </SectionCard>
        </div>

        {/* Chart хэсэг */}
        <SectionCard
          className="mt-4"
          title="Оношлогдсон сессүүдийн S1–S7 дундаж оноо"
          hint="Өндөр байх тусам тухайн шалтгаан илүү хүчтэй илэрч байна"
        >
          {loading ? (
            <div className="skeleton h-72 rounded-md" />
          ) : chartData.length ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 16, right: 24, top: 8, bottom: 8 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid horizontal={false} stroke="rgb(28 25 23 / 0.06)" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={(v) => v.toFixed(1)}
                    tick={{ fontSize: 10.5 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="code"
                    tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value) => Number(value ?? 0).toFixed(3)}
                    cursor={{ fill: "rgb(28 25 23 / 0.04)" }}
                  />
                  <Bar dataKey="score" radius={[0, 3, 3, 0]} barSize={14}>
                    {chartData.map((row) => {
                      const tone = row.score >= 0.66 ? "#A03521" : row.score >= 0.33 ? "#9C6B14" : "#1F4D3E";
                      return <Cell key={row.code} fill={tone} fillOpacity={0.85} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-md hairline bg-surface-container-low/40 px-6 py-12 text-center">
              <Sparkles className="mx-auto size-5 text-on-surface-variant/60" aria-hidden />
              <p className="mt-3 text-[12.5px] text-on-surface-variant">
                Оношлогоо одоогоор алга. Demo сесс үүсгээд таамаглал боловсруулагдахыг хүлээнэ үү.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Reason card-ууд */}
        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {reasons.map((reason) => {
            const code = reason.code as ReasonCode;
            const tone = severityTone(reason.severity);
            return (
              <article
                key={code}
                className="tile rounded-md card-lift flex flex-col"
              >
                <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 hairline-b">
                  <div className="min-w-0 flex items-baseline gap-3">
                    <span
                      className="font-mono"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontVariationSettings: '"opsz" 96, "SOFT" 30',
                        fontSize: 26,
                        lineHeight: 1,
                        fontWeight: 400,
                        color: "#1F4D3E",
                        letterSpacing: "-0.022em",
                      }}
                    >
                      {code}
                    </span>
                    <span className="truncate text-[13px] font-medium text-on-surface">{reason.label}</span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em]"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: tone.dot }} />
                    {riskLabel(reason.severity)}
                  </span>
                </header>

                <div className="flex flex-col gap-4 px-5 py-4 flex-1">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                        Дундаж оноо
                      </span>
                      <span className="font-mono tabular-nums text-[12.5px] text-on-surface">
                        {reason.average_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full" style={{ background: "rgb(28 25 23 / 0.05)" }}>
                      <div
                        className="h-full rounded-full transition-bar"
                        style={{ width: `${reason.average_score * 100}%`, background: tone.dot }}
                      />
                    </div>
                  </div>

                  <p className="text-[12.5px] leading-[1.6] text-on-surface-variant">
                    {reason.explanation || REASON_BLURB[code]}
                  </p>

                  <div className="rounded-md hairline bg-surface-container-low/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Санал болгосон арга хэмжээ
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.55] text-on-surface">{reason.recommended_action}</p>
                  </div>
                </div>

                <footer className="mt-auto flex items-center justify-between gap-3 px-5 py-3 hairline-t">
                  <span className="text-[11px] text-on-surface-variant">
                    <span className="tabular-nums text-on-surface">{reason.dominant_sessions}</span> сесс давамгай
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {totalDominant > 0
                      ? `${((reason.dominant_sessions / totalDominant) * 100).toFixed(0)}% эзлэх хувь`
                      : "—"}
                  </span>
                </footer>
              </article>
            );
          })}
        </section>
      </div>
    </EditorialShell>
  );
}
