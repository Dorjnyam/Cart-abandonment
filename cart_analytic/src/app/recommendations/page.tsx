"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Lightbulb,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import {
  fetchDashboardRecommendations,
  updateDashboardRecommendationStatus,
  type RecommendationContract,
  type RecommendationStatus,
  type RecommendationsResponse,
} from "@/lib/services/dashboard-mvp";

type RecommendationItem = NonNullable<RecommendationContract>;

const STATUS_COLUMNS: Array<{
  key: RecommendationStatus;
  label: string;
  Icon: typeof Lightbulb;
  accent: string;
}> = [
  { key: "new", label: "New", Icon: Lightbulb, accent: "#9C6B14" },
  { key: "in_progress", label: "In progress", Icon: Clock3, accent: "#3E6E8E" },
  { key: "done", label: "Done", Icon: CheckCircle2, accent: "#1F4D3E" },
  { key: "dismissed", label: "Dismissed", Icon: XCircle, accent: "#A8A29E" },
];

function priorityTone(priority: string) {
  if (priority === "high") return { bg: "rgb(160 53 33 / 0.08)", fg: "#7E2A1A", dot: "#A03521" };
  if (priority === "medium") return { bg: "rgb(156 107 20 / 0.10)", fg: "#7C5410", dot: "#9C6B14" };
  return { bg: "rgb(31 77 62 / 0.08)", fg: "#1F4D3E", dot: "#1F4D3E" };
}

function MetricCell({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <div className="tile rounded-md px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">{label}</p>
      <p
        className={`mt-1.5 tabular-nums ${accent ? "text-error" : "text-on-surface"}`}
        style={{
          fontFamily: "var(--font-display)",
          fontVariationSettings: '"opsz" 144, "SOFT" 30',
          fontSize: 22,
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10.5px] text-on-surface-variant/70">{hint}</p> : null}
    </div>
  );
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardRecommendations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recommendations API request failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const grouped = useMemo(() => {
    const base: Record<RecommendationStatus, RecommendationItem[]> = {
      new: [],
      in_progress: [],
      done: [],
      dismissed: [],
    };
    for (const item of data?.results ?? []) {
      base[item.status]?.push(item);
    }
    return base;
  }, [data]);

  async function setStatus(item: RecommendationItem, status: RecommendationStatus) {
    setBusyId(item.id);
    try {
      const updated = await updateDashboardRecommendationStatus(item.id, status);
      setData((prev) => {
        if (!prev) return prev;
        const results = prev.results.map((r) => (r.id === item.id ? updated : r));
        const stats = {
          total: results.length,
          new: results.filter((r) => r.status === "new").length,
          in_progress: results.filter((r) => r.status === "in_progress").length,
          done: results.filter((r) => r.status === "done").length,
          dismissed: results.filter((r) => r.status === "dismissed").length,
        };
        return { results, stats };
      });
    } finally {
      setBusyId(null);
    }
  }

  function renderCard(item: RecommendationItem) {
    const tone = priorityTone(item.priority);
    return (
      <article
        key={item.id}
        className="tile rounded-md card-lift flex flex-col gap-3 px-4 py-3.5"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-[3px] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-[0.04em]"
            style={{ background: "rgb(31 77 62 / 0.08)", color: "#1F4D3E" }}
          >
            {item.reason_code}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em]"
            style={{ background: tone.bg, color: tone.fg }}
          >
            <span aria-hidden className="size-1 rounded-full" style={{ background: tone.dot }} />
            {item.priority}
          </span>
          <span className="ml-auto text-[10px] font-mono text-on-surface-variant/70">
            {item.source === "gemini" ? "Gemini" : "Fallback"}
          </span>
        </div>

        <h3
          className="text-[15px] leading-[1.25] text-on-surface"
          style={{
            fontFamily: "var(--font-display)",
            fontVariationSettings: '"opsz" 96, "SOFT" 30',
            fontWeight: 400,
            letterSpacing: "-0.018em",
          }}
        >
          {item.title}
        </h3>
        <p className="text-[12px] leading-[1.55] text-on-surface-variant">{item.summary}</p>

        <div className="space-y-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
              Expected impact
            </p>
            <p className="mt-1 text-[11.5px] leading-[1.5] text-on-surface">{item.expected_impact}</p>
          </div>

          {item.evidence.length ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                Evidence
              </p>
              <ul className="mt-1 space-y-1 text-[11.5px] leading-[1.5] text-on-surface-variant">
                {item.evidence.map((evidence) => (
                  <li key={evidence} className="flex gap-2">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-on-surface-variant/40" />
                    <span>{evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.action_steps.length ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70">
                Action steps
              </p>
              <ol className="mt-1 space-y-1.5 text-[11.5px] leading-[1.5] text-on-surface">
                {item.action_steps.map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span
                      className="flex size-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-semibold"
                      style={{ background: "rgb(28 25 23 / 0.06)", color: "rgb(28 25 23)" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-on-surface-variant">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 hairline-t">
          {item.status !== "in_progress" ? (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void setStatus(item, "in_progress")}
              className="inline-flex items-center gap-1 rounded-md hairline bg-surface-container-lowest px-2 py-1 text-[10.5px] font-medium text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              <Clock3 className="size-3" aria-hidden />
              Start
            </button>
          ) : null}
          {item.status !== "done" ? (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void setStatus(item, "done")}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-semibold text-white hover:opacity-95 transition-opacity disabled:opacity-50"
              style={{ background: "#1F4D3E" }}
            >
              <Check className="size-3" aria-hidden />
              Mark done
            </button>
          ) : null}
          {item.status !== "dismissed" ? (
            <button
              type="button"
              disabled={busyId === item.id}
              onClick={() => void setStatus(item, "dismissed")}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] font-medium text-on-surface-variant hover:text-on-surface hover:bg-[rgb(28_25_23/0.04)] transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <EditorialShell activeNav="recommendations" title="What To Fix Next" subtitle="Gemini / fallback action board">
      <div className="mx-auto max-w-[1400px] px-6 py-8 sm:px-8 lg:px-10">
        <header className="page-enter">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant/70">
            Recommendations · action queue
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
                What to fix next
              </h1>
              <p className="mt-1.5 max-w-[68ch] text-[12.5px] text-on-surface-variant">
                Gemini and fallback rules turn dominant reasons into concrete action items. Move them across columns to
                track which ones your team is shipping. Status changes persist through the Main service.
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

        {/* Stats хэсэг */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
          <MetricCell label="Total" value={data?.stats?.total ?? 0} hint="Active items" />
          <MetricCell label="New" value={data?.stats?.new ?? 0} hint="Awaiting review" />
          <MetricCell label="In progress" value={data?.stats?.in_progress ?? 0} hint="Team is shipping" />
          <MetricCell label="Done" value={data?.stats?.done ?? 0} hint="Marked complete" />
          <MetricCell label="Dismissed" value={data?.stats?.dismissed ?? 0} hint="Set aside" />
        </section>

        {error ? (
          <div className="mt-4 rounded-md border border-error/25 bg-error/[0.05] px-4 py-3 text-[12.5px] text-error">
            {error}
          </div>
        ) : null}

        {/* Board хэсэг */}
        {loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-md" />
            ))}
          </div>
        ) : data?.results.length ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-4">
            {STATUS_COLUMNS.map(({ key, label, Icon, accent }) => (
              <section key={key} className="rounded-md hairline bg-surface-container-low/30 p-3 flex flex-col">
                <header className="flex items-center justify-between gap-3 px-1 pb-2.5 mb-2 hairline-b">
                  <h2 className="inline-flex items-center gap-2 text-[12.5px] font-medium text-on-surface">
                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: accent }} />
                    <Icon className="size-3.5 text-on-surface-variant/60" aria-hidden />
                    {label}
                  </h2>
                  <span
                    className="rounded-md hairline bg-surface-container-lowest px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-on-surface"
                  >
                    {grouped[key].length}
                  </span>
                </header>
                <div className="space-y-3 flex-1">
                  {grouped[key].length ? (
                    grouped[key].map(renderCard)
                  ) : (
                    <div className="rounded-md hairline bg-surface-container-lowest/50 px-3 py-8 text-center">
                      <p className="text-[11.5px] text-on-surface-variant/70">Empty</p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6 tile rounded-md px-6 py-16 text-center">
            <Sparkles className="mx-auto size-6 text-on-surface-variant/60" aria-hidden />
            <p
              className="mt-3 text-[20px] text-on-surface"
              style={{
                fontFamily: "var(--font-display)",
                fontVariationSettings: '"opsz" 96',
                fontWeight: 400,
                letterSpacing: "-0.02em",
              }}
            >
              No recommendations yet
            </p>
            <p className="mx-auto mt-2 max-w-[42ch] text-[12.5px] text-on-surface-variant">
              Run a demo abandoned flow so the Main service produces a diagnosis. Recommendations are generated
              automatically once a dominant reason is set.
            </p>
          </div>
        )}
      </div>
    </EditorialShell>
  );
}
