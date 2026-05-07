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
import {
  fetchDashboardReasons,
  SCORE_ORDER,
  type ReasonCode,
  type ReasonsResponse,
} from "@/lib/services/dashboard-mvp";

const REASON_BLURB: Record<ReasonCode, string> = {
  S1: "Psychological hesitation: the session shows hesitation signals before checkout completion.",
  S2: "Technical friction: errors, slow interactions, or checkout failures blocked progress.",
  S3: "Trust issue: the buyer may need stronger merchant, payment, or product reassurance.",
  S4: "Mobile usability issue: mobile interaction quality may be reducing completion.",
  S5: "Price sensitivity: cart total, shipping, or discount expectations may be blocking purchase.",
  S6: "Indecision/navigation disorder: repeated navigation or comparison behavior suggests uncertainty.",
  S7: "External influence/referral effect: referrer or external context may affect completion.",
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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardReasons());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reason analysis API request failed.");
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
    <EditorialShell activeNav="diagnosis" title="Why Customers Abandon" subtitle="Canonical S1–S7 reason analysis">
      <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <header className="page-enter">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant/70">
            Diagnosis · canonical S1–S7 reasoning
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1
                className="text-[36px] leading-[1.05] text-on-surface"
                style={{
                  fontFamily: "var(--font-display)",
                  fontVariationSettings: '"opsz" 144, "SOFT" 30',
                  fontWeight: 400,
                  letterSpacing: "-0.024em",
                }}
              >
                Why customers abandon
              </h1>
              <p className="mt-1.5 max-w-[68ch] text-[12.5px] text-on-surface-variant">
                Each session is scored across seven canonical reasons, normalized 0–1. The Main service
                computes the dominant reason; the dashboard surfaces it without inventing one locally.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-md hairline bg-surface-container-lowest px-3 py-1.5 text-[12px] font-medium text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
              Refresh
            </button>
          </div>
        </header>

        <div className="editorial-rule mt-6" />

        {error ? (
          <div className="mt-6 rounded-md border border-error/25 bg-error/[0.05] px-4 py-3 text-[12.5px] text-error">
            {error}
          </div>
        ) : null}

        {/* Top: Formula + Top reason summary */}
        <div className="mt-6 grid gap-4 lg:grid-cols-12 stagger-children">
          <SectionCard
            className="lg:col-span-7"
            title="Dominant reason formula"
            hint="Argmax across the seven canonical scores"
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
                The argmax convention keeps the dashboard truthful: every dominant label here is exactly the one
                the Main service emitted, not a recomputation.
              </p>
            </div>
          </SectionCard>

          <SectionCard className="lg:col-span-5" title="Highest-scoring reason" hint={`${totalDominant} sessions diagnosed`}>
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
                      Average score
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
                      Sessions dominant
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
              <p className="text-[12.5px] text-on-surface-variant">No sessions diagnosed yet.</p>
            )}
          </SectionCard>
        </div>

        {/* Chart */}
        <SectionCard
          className="mt-4"
          title="S1–S7 average scores across diagnosed sessions"
          hint="Higher means the reason fires more strongly on average"
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
                No diagnosis yet. Generate a demo session and wait for prediction processing.
              </p>
            </div>
          )}
        </SectionCard>

        {/* Reason cards */}
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
                    {reason.severity}
                  </span>
                </header>

                <div className="flex flex-col gap-4 px-5 py-4 flex-1">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                        Average score
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
                      Suggested action
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.55] text-on-surface">{reason.recommended_action}</p>
                  </div>
                </div>

                <footer className="mt-auto flex items-center justify-between gap-3 px-5 py-3 hairline-t">
                  <span className="text-[11px] text-on-surface-variant">
                    <span className="tabular-nums text-on-surface">{reason.dominant_sessions}</span> sessions dominant
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {totalDominant > 0
                      ? `${((reason.dominant_sessions / totalDominant) * 100).toFixed(0)}% share`
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
