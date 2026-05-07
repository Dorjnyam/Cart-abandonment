"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Code2,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import {
  fetchDashboardSessionDetail,
  formatPct,
  REASON_LABELS,
  SCORE_ORDER,
  type DashboardSessionDetail,
} from "@/lib/services/dashboard-mvp";

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

function ProbabilityDial({ probability }: { probability: number }) {
  const pct = Math.max(0, Math.min(1, probability));
  const tone =
    pct >= 0.75
      ? { stroke: "#A03521", label: "High abandonment risk", lightFg: "#7E2A1A", bg: "rgb(160 53 33 / 0.06)" }
      : pct >= 0.5
        ? { stroke: "#9C6B14", label: "Medium risk", lightFg: "#7C5410", bg: "rgb(156 107 20 / 0.08)" }
        : { stroke: "#1F4D3E", label: "Low risk", lightFg: "#1F4D3E", bg: "rgb(31 77 62 / 0.06)" };
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dash = pct * circumference;
  return (
    <div className="flex items-center gap-5">
      <div className="relative size-[160px] shrink-0">
        <svg width={160} height={160} viewBox="0 0 160 160" className="-rotate-90">
          <circle cx={80} cy={80} r={radius} fill="none" stroke="rgb(28 25 23 / 0.08)" strokeWidth={6} />
          <circle
            cx={80}
            cy={80}
            r={radius}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.2, 0.6, 0.2, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className="tabular-nums text-on-surface"
            style={{
              fontFamily: "var(--font-display)",
              fontVariationSettings: '"opsz" 144, "SOFT" 30',
              fontSize: 38,
              lineHeight: 1,
              fontWeight: 400,
              letterSpacing: "-0.025em",
            }}
          >
            {formatPct(probability)}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">probability</p>
        </div>
      </div>
      <div className="flex-1">
        <span
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
          style={{ background: tone.bg, color: tone.lightFg }}
        >
          <span aria-hidden className="size-1.5 rounded-full" style={{ background: tone.stroke }} />
          {tone.label}
        </span>
        <p className="mt-3 text-[12.5px] leading-[1.55] text-on-surface-variant">
          The classifier evaluates this session against the trained cart-abandon distribution. Confidence above the
          threshold flags the session as abandoned.
        </p>
      </div>
    </div>
  );
}

function ScoreBars({ detail }: { detail: DashboardSessionDetail }) {
  const scores = detail.diagnosis?.scores;
  if (!scores) {
    return <p className="text-[12.5px] text-on-surface-variant">No S1–S7 diagnosis yet for this session.</p>;
  }
  return (
    <div className="space-y-3">
      {SCORE_ORDER.map((code) => {
        const value = scores[code] ?? 0;
        const isDominant = detail.diagnosis?.dominant_reason === code;
        const fill = isDominant ? "#1F4D3E" : "rgb(28 25 23 / 0.18)";
        return (
          <div key={code}>
            <div className="mb-1 flex items-center justify-between text-[11.5px]">
              <span className="inline-flex items-center gap-2">
                <span
                  className="rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]"
                  style={{
                    background: isDominant ? "rgb(31 77 62 / 0.10)" : "rgb(28 25 23 / 0.04)",
                    color: isDominant ? "#1F4D3E" : "rgb(87 83 78)",
                  }}
                >
                  {code}
                </span>
                <span className={isDominant ? "font-medium text-on-surface" : "text-on-surface-variant"}>
                  {REASON_LABELS[code]}
                </span>
              </span>
              <span className="font-mono tabular-nums text-on-surface">{value.toFixed(2)}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full" style={{ background: "rgb(28 25 23 / 0.05)" }}>
              <div
                className="h-full rounded-full transition-bar"
                style={{ width: `${value * 100}%`, background: fill }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MetaField({ label, value, mono = false }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">{label}</dt>
      <dd
        className={`mt-1 text-[12.5px] text-on-surface ${mono ? "font-mono text-[11.5px]" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = decodeURIComponent(params.id);
  const [detail, setDetail] = useState<DashboardSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await fetchDashboardSessionDetail(sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session detail request failed.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <EditorialShell
      activeNav="sessions"
      title="Session Evidence"
      subtitle={sessionId}
      breadcrumbs={[{ label: "Sessions", href: "/sessions" }, { label: sessionId }]}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <header className="page-enter">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to ledger
          </Link>
          <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant/70">
            Session evidence · ML reasoning chain
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1
                className="text-[36px] leading-[1.05] text-on-surface"
                style={{
                  fontFamily: "var(--font-display)",
                  fontVariationSettings: '"opsz" 144, "SOFT" 30',
                  fontWeight: 400,
                  letterSpacing: "-0.024em",
                }}
              >
                Evidence view
              </h1>
              <p className="mt-1.5 font-mono text-[12px] text-on-surface-variant">{sessionId}</p>
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

        {loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-12">
            <div className="skeleton h-56 rounded-md lg:col-span-7" />
            <div className="skeleton h-56 rounded-md lg:col-span-5" />
            <div className="skeleton h-72 rounded-md lg:col-span-4" />
            <div className="skeleton h-72 rounded-md lg:col-span-4" />
            <div className="skeleton h-72 rounded-md lg:col-span-4" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-md border border-error/25 bg-error/[0.05] px-4 py-3 text-[12.5px] text-error">
            {error}
          </div>
        ) : !detail ? (
          <SectionCard className="mt-6" title="Not found" hint="Verify the session reached Main service.">
            <p className="text-[12.5px] text-on-surface-variant">
              This session ID isn’t in the ledger. It may still be in transit, or the demo flow may not have completed.
            </p>
          </SectionCard>
        ) : (
          <>
            {/* Top: Prediction + Dominant reason */}
            <div className="mt-6 grid gap-4 lg:grid-cols-12 stagger-children">
              <SectionCard
                className="lg:col-span-7"
                title="ML prediction"
                hint={detail.prediction?.predicted_class ? `Predicted: ${detail.prediction.predicted_class}` : "No prediction"}
                right={
                  detail.prediction ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md hairline bg-surface-container-lowest px-2 py-0.5 text-[10.5px] font-mono text-on-surface-variant">
                      {detail.prediction.model_name ?? "model"} · v{detail.prediction.model_version ?? "—"}
                    </span>
                  ) : null
                }
              >
                <ProbabilityDial probability={detail.prediction?.abandonment_probability ?? 0} />
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <MetaField label="Threshold" value={detail.prediction?.threshold ?? "—"} />
                  <MetaField label="Predicted class" value={detail.prediction?.predicted_class ?? "—"} />
                  <MetaField label="Tenant" value={String(detail.organization_id)} />
                  <MetaField label="Events" value={detail.event_count} />
                </dl>
              </SectionCard>

              <SectionCard
                className="lg:col-span-5"
                title="Dominant reason"
                hint="From S1–S7 diagnosis · argmax"
              >
                {detail.diagnosis ? (
                  <>
                    <div className="flex items-baseline gap-3">
                      <span
                        className="font-mono text-[28px] tabular-nums"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontVariationSettings: '"opsz" 96, "SOFT" 30',
                          fontWeight: 400,
                          color: "#1F4D3E",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {detail.diagnosis.dominant_reason}
                      </span>
                      <span className="text-[14px] font-medium text-on-surface">
                        {detail.diagnosis.reason_label}
                      </span>
                    </div>
                    <p className="mt-3 text-[12.5px] leading-[1.6] text-on-surface-variant">
                      {detail.diagnosis.explanation}
                    </p>
                  </>
                ) : (
                  <p className="text-[12.5px] text-on-surface-variant">No diagnosis yet.</p>
                )}
              </SectionCard>
            </div>

            {/* Middle: Timeline + Scores + Features */}
            <div className="mt-4 grid gap-4 lg:grid-cols-12 stagger-children">
              <SectionCard
                className="lg:col-span-4"
                title="Event timeline"
                hint={`${detail.events.length} events captured`}
                right={<Clock3 className="size-3.5 text-on-surface-variant/60" aria-hidden />}
              >
                {detail.events.length ? (
                  <ol className="space-y-0">
                    {detail.events.map((event, index) => {
                      const last = index === detail.events.length - 1;
                      return (
                        <li key={event.id} className="relative flex gap-3">
                          <div className="flex flex-col items-center pt-0.5">
                            <span
                              className="flex size-6 items-center justify-center rounded-full text-[10px] font-mono font-semibold"
                              style={{
                                background: "rgb(31 77 62 / 0.08)",
                                color: "#1F4D3E",
                              }}
                            >
                              {index + 1}
                            </span>
                            {!last ? <span className="my-1 w-px flex-1" style={{ background: "rgb(28 25 23 / 0.10)" }} /> : null}
                          </div>
                          <div className={`min-w-0 flex-1 ${last ? "" : "pb-3"}`}>
                            <p className="text-[12.5px] font-medium text-on-surface">{event.type}</p>
                            <p className="mt-0.5 truncate font-mono text-[10.5px] text-on-surface-variant">
                              {event.page || "—"}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-on-surface-variant/70">
                              {event.timestamp || "—"}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-[12.5px] text-on-surface-variant">
                    No raw events surfaced from Observer for this session.
                  </p>
                )}
              </SectionCard>

              <SectionCard className="lg:col-span-4" title="S1–S7 scores" hint="Normalized 0–1 · dominant emphasized">
                <ScoreBars detail={detail} />
              </SectionCard>

              <SectionCard
                className="lg:col-span-4"
                title="Top model features"
                hint="XGBoost contribution magnitude"
              >
                {detail.top_features.length ? (
                  <div className="space-y-3">
                    {detail.top_features.map((feature) => {
                      const importance = Number(feature.importance ?? 0);
                      return (
                        <div key={feature.feature}>
                          <div className="mb-1 flex items-baseline justify-between gap-3 text-[11.5px]">
                            <span className="truncate font-mono text-[11px] text-on-surface">{feature.feature}</span>
                            <span className="font-mono tabular-nums text-on-surface">{importance.toFixed(3)}</span>
                          </div>
                          <div className="h-1 rounded-full" style={{ background: "rgb(28 25 23 / 0.05)" }}>
                            <div
                              className="h-full rounded-full transition-bar"
                              style={{
                                width: `${Math.min(100, importance * 100)}%`,
                                background: "#3E6E8E",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[12.5px] text-on-surface-variant">No feature attributions for this prediction.</p>
                )}
              </SectionCard>
            </div>

            {/* Recommendation */}
            {detail.recommendation ? (
              <SectionCard
                className="mt-4"
                title="Recommendation"
                hint={`${detail.recommendation.source === "gemini" ? "Generated by Gemini" : "Generated by fallback"} · ${detail.recommendation.status}`}
                right={<Lightbulb className="size-3.5 text-on-surface-variant/60" aria-hidden />}
              >
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]"
                        style={{ background: "rgb(31 77 62 / 0.08)", color: "#1F4D3E" }}
                      >
                        {detail.recommendation.reason_code}
                      </span>
                      <span className="rounded-[3px] hairline px-1.5 py-0.5 font-mono text-[10.5px] text-on-surface-variant">
                        {detail.recommendation.source}
                      </span>
                    </div>
                    <h3
                      className="mt-3 text-[22px] leading-[1.2] text-on-surface"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontVariationSettings: '"opsz" 144, "SOFT" 30',
                        fontWeight: 400,
                        letterSpacing: "-0.018em",
                      }}
                    >
                      {detail.recommendation.title}
                    </h3>
                    <p className="mt-3 text-[13px] leading-[1.65] text-on-surface-variant">
                      {detail.recommendation.summary}
                    </p>
                  </div>
                  <div className="lg:col-span-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                      Action steps
                    </p>
                    <ol className="mt-2 space-y-2 text-[12.5px] text-on-surface">
                      {detail.recommendation.action_steps.map((step, i) => (
                        <li key={step} className="flex gap-2.5">
                          <span
                            className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold"
                            style={{ background: "rgb(28 25 23 / 0.06)", color: "rgb(28 25 23)" }}
                          >
                            {i + 1}
                          </span>
                          <span className="leading-[1.5] text-on-surface-variant">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard className="mt-4" title="Recommendation" hint="Awaiting generation">
                <p className="text-[12.5px] text-on-surface-variant">
                  No recommendation yet. Once diagnosis completes, Gemini or the fallback engine will compose an action
                  plan tied to the dominant reason.
                </p>
              </SectionCard>
            )}

            {/* Developer details */}
            <details className="mt-4 tile rounded-md group">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 list-none">
                <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-on-surface">
                  <Code2 className="size-3.5 text-on-surface-variant/70" aria-hidden />
                  Developer payload
                </span>
                <ChevronDown className="size-3.5 text-on-surface-variant/60 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="px-5 pb-5">
                <pre className="max-h-[480px] overflow-auto rounded-md hairline bg-surface-container-low/50 p-4 font-mono text-[11px] leading-[1.55] text-on-surface">
                  {JSON.stringify(detail.developer_details, null, 2)}
                </pre>
              </div>
            </details>
          </>
        )}
      </div>
    </EditorialShell>
  );
}
