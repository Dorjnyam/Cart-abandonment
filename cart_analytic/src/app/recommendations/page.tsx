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
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchDashboardRecommendations,
  updateDashboardRecommendationStatus,
  type RecommendationContract,
  type RecommendationStatus,
  type RecommendationsResponse,
} from "@/lib/services/dashboard-mvp";
import { priorityLabel, sourceLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

type RecommendationItem = NonNullable<RecommendationContract>;

const STATUS_COLUMNS: Array<{
  key: RecommendationStatus;
  Icon: typeof Lightbulb;
  accent: string;
}> = [
  { key: "new", Icon: Lightbulb, accent: "bg-warning" },
  { key: "in_progress", Icon: Clock3, accent: "bg-secondary" },
  { key: "done", Icon: CheckCircle2, accent: "bg-primary" },
  { key: "dismissed", Icon: XCircle, accent: "bg-muted" },
];

function priorityVariant(priority: string): "error" | "warning" | "success" {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "success";
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-display font-extrabold tabular-nums text-2xl leading-none",
          accent ? "text-error" : "text-text",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const { t, lang } = useLanguage();

  const COLUMNS = useMemo(
    () =>
      STATUS_COLUMNS.map((col) => ({
        ...col,
        label:
          col.key === "new"
            ? t.recommendations.new
            : col.key === "in_progress"
              ? t.recommendations.inProgress
              : col.key === "done"
                ? t.recommendations.done
                : t.recommendations.dismissed,
      })),
    [t],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardRecommendations());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === "EN"
            ? "Recommendations request failed."
            : "Зөвлөмжийн API хүсэлт амжилтгүй боллоо.",
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

  const labels = {
    expectedImpact: lang === "EN" ? "Expected impact" : "Хүлээгдэж буй нөлөө",
    evidence: lang === "EN" ? "Evidence" : "Нотолгоо",
    steps: lang === "EN" ? "Steps" : "Хэрэгжүүлэх алхмууд",
    start: lang === "EN" ? "Start" : "Эхлүүлэх",
    markDone: lang === "EN" ? "Mark done" : "Дууссан болгох",
    dismiss: lang === "EN" ? "Dismiss" : "Хасах",
    empty: lang === "EN" ? "Empty" : "Хоосон",
    noTitle: lang === "EN" ? "No recommendations yet" : "Зөвлөмж одоогоор алга",
    noBody:
      lang === "EN"
        ? "Once Main service generates diagnoses, recommendations will appear here automatically."
        : "Main сервис оношлогоо үүсгэмэгц зөвлөмж энд автоматаар гарч ирнэ.",
  };

  function renderCard(item: RecommendationItem) {
    return (
      <Card
        key={item.id}
        className="flex flex-col hover:border-primary/40"
      >
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge variant="primary">{item.reason_code}</Badge>
          <Badge variant={priorityVariant(item.priority)}>{priorityLabel(item.priority)}</Badge>
          <span className="ml-auto text-[10px] font-mono text-muted">
            {sourceLabel(item.source)}
          </span>
        </div>

        <h3 className="font-display font-extrabold text-base leading-snug text-text">
          {item.title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted">{item.summary}</p>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              {labels.expectedImpact}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text">{item.expected_impact}</p>
          </div>

          {item.evidence.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                {labels.evidence}
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-relaxed text-muted">
                {item.evidence.map((evidence) => (
                  <li key={evidence} className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted/60" />
                    <span>{evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {item.action_steps.length ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                {labels.steps}
              </p>
              <ol className="mt-1 space-y-1.5 text-xs leading-relaxed text-text">
                {item.action_steps.map((step, i) => (
                  <li key={step} className="flex gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold bg-primary/10 text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4 border-t border-surface-muted -mx-6 px-6 mt-4">
          <div className="pt-4 flex flex-wrap items-center gap-1.5 w-full">
            {item.status !== "in_progress" ? (
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void setStatus(item, "in_progress")}
                className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-text hover:bg-surface-muted/70 transition-colors disabled:opacity-50"
              >
                <Clock3 className="size-3" />
                {labels.start}
              </button>
            ) : null}
            {item.status !== "done" ? (
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void setStatus(item, "done")}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check className="size-3" />
                {labels.markDone}
              </button>
            ) : null}
            {item.status !== "dismissed" ? (
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void setStatus(item, "dismissed")}
                className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-muted hover:text-text hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                {labels.dismiss}
              </button>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <EditorialShell
      activeNav="recommendations"
      title={t.recommendations.title}
      subtitle={t.recommendations.subtitle}
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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
          <MetricTile label={t.common.total} value={data?.stats?.total ?? 0} />
          <MetricTile label={t.recommendations.new} value={data?.stats?.new ?? 0} accent />
          <MetricTile label={t.recommendations.inProgress} value={data?.stats?.in_progress ?? 0} />
          <MetricTile label={t.recommendations.done} value={data?.stats?.done ?? 0} />
          <MetricTile label={t.recommendations.dismissed} value={data?.stats?.dismissed ?? 0} />
        </section>

        {error ? (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 rounded-xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : data?.results.length ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {COLUMNS.map(({ key, label, Icon, accent }) => (
              <section
                key={key}
                className="rounded-xl bg-surface-muted/40 border border-surface-muted p-3 flex flex-col"
              >
                <header className="flex items-center justify-between gap-3 px-2 pb-3 mb-3 border-b border-surface-muted">
                  <h2 className="inline-flex items-center gap-2 text-sm font-bold text-text">
                    <span className={cn("size-2 rounded-full", accent)} />
                    <Icon className="size-4 text-muted" />
                    {label}
                  </h2>
                  <Badge>{grouped[key].length}</Badge>
                </header>
                <div className="space-y-3 flex-1">
                  {grouped[key].length ? (
                    grouped[key].map(renderCard)
                  ) : (
                    <div className="rounded-xl bg-surface border border-dashed border-surface-muted px-3 py-8 text-center">
                      <p className="text-xs text-muted">{labels.empty}</p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <Card className="px-6 py-16 text-center">
            <Sparkles className="mx-auto size-7 text-muted" />
            <p className="mt-4 font-display font-extrabold text-xl text-text">
              {labels.noTitle}
            </p>
            <p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted leading-relaxed">
              {labels.noBody}
            </p>
          </Card>
        )}
      </div>
    </EditorialShell>
  );
}
