"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Database,
  Loader2,
  Network,
  RefreshCw,
  Server,
  Workflow,
  Zap,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import {
  fetchPipelineMonitor,
  type PipelineMonitor,
  type ServiceHealth,
  type ServiceStatus,
} from "@/lib/services/pipeline";
import { healthLabel, predictionClassLabel } from "@/lib/mn-labels";

const HEALTH_TONE: Record<ServiceHealth, { bg: string; text: string; ring: string; label: string; dot: string }> = {
  healthy: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-300",
    ring: "ring-emerald-500/20",
    label: healthLabel("healthy"),
    dot: "bg-emerald-500",
  },
  degraded: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-300",
    ring: "ring-amber-500/20",
    label: healthLabel("degraded"),
    dot: "bg-amber-500",
  },
  down: {
    bg: "bg-error/10",
    text: "text-error",
    ring: "ring-error/20",
    label: healthLabel("down"),
    dot: "bg-rose-500",
  },
  unknown: {
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    ring: "ring-outline-variant/30",
    label: healthLabel("unknown"),
    dot: "bg-slate-400",
  },
};

function StatusPill({ health }: { health: ServiceHealth }) {
  const tone = HEALTH_TONE[health];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
    </span>
  );
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] items-center gap-3 border-t border-outline-variant/[0.06] px-4 py-2.5 first:border-t-0 hover:bg-surface-container-low/40 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-on-surface">{service.name}</span>
          {service.version ? (
            <span className="rounded-sm bg-surface-container-high/60 px-1.5 py-0.5 font-mono text-[10px] text-on-surface-variant">
              {service.version}
            </span>
          ) : null}
        </div>
        {service.detail ? (
          <p className="mt-0.5 truncate text-[11.5px] text-on-surface-variant">{service.detail}</p>
        ) : null}
      </div>
      <div className="text-[11.5px] text-on-surface-variant tabular-nums">
        {service.latency_p95_ms != null ? `p95 ${service.latency_p95_ms} ms` : "—"}
      </div>
      <div className="text-[11.5px] text-on-surface-variant">
        {service.last_heartbeat ?? "—"}
      </div>
      <StatusPill health={service.health} />
    </div>
  );
}

function ServiceTable({
  title,
  description,
  Icon,
  services,
}: {
  title: string;
  description?: string;
  Icon: typeof Server;
  services: ServiceStatus[];
}) {
  return (
    <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
      <header className="flex items-center justify-between gap-3 border-b border-outline-variant/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
          <h2 className="text-[13px] font-semibold text-on-surface">{title}</h2>
        </div>
        {description ? <span className="text-[11px] text-on-surface-variant">{description}</span> : null}
      </header>
      <div className="grid grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] border-b border-outline-variant/[0.06] bg-surface-container-low/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        <span>Бүрэлдэхүүн</span>
        <span>Latency</span>
        <span>Сүүлийн heartbeat</span>
        <span className="text-right">Төлөв</span>
      </div>
      <div>
        {services.map((s) => <ServiceRow key={s.id} service={s} />)}
      </div>
    </section>
  );
}

function ThroughputCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{label}</p>
      <p className="mt-1.5 text-[20px] font-semibold tabular-nums text-on-surface">{value}</p>
      <p className="mt-0.5 text-[11px] text-on-surface-variant">{helper}</p>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function timeShort(value: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return value;
  }
}

export default function PipelinePage() {
  const [data, setData] = useState<PipelineMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setData(await fetchPipelineMonitor());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline мониторын хүсэлт амжилтгүй боллоо.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <EditorialShell
      activeNav="pipeline"
      title="Pipeline"
      subtitle="Шууд монитор"
      breadcrumbs={[{ label: "Pipeline шууд монитор" }]}
    >
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-on-surface">Pipeline шууд монитор</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-on-surface-variant">
              Сагс орхилтын аналитикийн pipeline-ийн төлөв ба throughput:
              Observer → Session Service → Feature Service → ML Service → Main Consumer.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-on-surface-variant">
              {data ? `Шинэчилсэн ${timeShort(data.refreshed_at)}` : "—"}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest px-3 py-1.5 text-[12px] font-medium text-on-surface hover:bg-surface-container-low"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Шинэчлэх
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-error/25 bg-error/5 px-4 py-3 text-[12.5px] text-error">{error}</div>
        ) : null}

        {loading || !data ? (
          <div className="flex h-64 items-center justify-center text-on-surface-variant">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <ThroughputCard label="24ц эвент" value={fmt(data.throughput.events_24h)} helper="Observer ingest" />
              <ThroughputCard label="24ц сесс" value={fmt(data.throughput.sessions_24h)} helper="Session Service" />
              <ThroughputCard label="24ц feature" value={fmt(data.throughput.features_24h)} helper="Feature vectors" />
              <ThroughputCard label="24ц таамаглал" value={fmt(data.throughput.predictions_24h)} helper="ML Service" />
              <ThroughputCard label="Consumer lag" value={fmt(data.throughput.consumer_lag)} helper="Kafka offset lag" />
              <ThroughputCard label="24ц алдаа" value={fmt(data.throughput.failures_24h)} helper="Бүх сервист" />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <ServiceTable title="Сервисүүд" description="Pipeline бүрэлдэхүүн" Icon={Workflow} services={data.services} />
              <ServiceTable title="Дэд бүтэц" description="Үндсэн хамаарлууд" Icon={Database} services={data.infra} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Сүүлийн эвентүүд</h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Observer → Kafka</span>
                </header>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_auto] bg-surface-container-low/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    <span>Сесс</span><span>Эвент</span><span className="text-right">Хэзээ</span>
                  </div>
                  {data.latest_events.map((event, i) => (
                    <div key={`${event.session_id}-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-outline-variant/[0.06] px-4 py-2 text-[12px]">
                      <span className="truncate font-mono text-on-surface">{event.session_id}</span>
                      <span className="truncate text-on-surface-variant">{event.event_type}</span>
                      <span className="text-right tabular-nums text-on-surface-variant">{timeShort(event.created_at)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Network className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Сүүлийн сессүүд</h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Session Service</span>
                </header>
                <div className="grid grid-cols-[1fr_1fr_auto_auto] bg-surface-container-low/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  <span>Сесс</span><span>Зочин</span><span>Эвент</span><span className="text-right">Эхэлсэн</span>
                </div>
                {data.latest_sessions.map((s) => (
                  <div key={s.session_id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 border-t border-outline-variant/[0.06] px-4 py-2 text-[12px]">
                    <span className="truncate font-mono text-on-surface">{s.session_id}</span>
                    <span className="truncate text-on-surface-variant">{s.visitor_id ?? "—"}</span>
                    <span className="tabular-nums text-on-surface-variant">{s.events}</span>
                    <span className="text-right tabular-nums text-on-surface-variant">{timeShort(s.started_at)}</span>
                  </div>
                ))}
              </section>

              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Боловсруулсан feature vector</h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Feature Service</span>
                </header>
                <div className="grid grid-cols-[1fr_auto_auto] bg-surface-container-low/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  <span>Сесс</span><span>Feature</span><span className="text-right">Үүссэн</span>
                </div>
                {data.latest_features.map((f) => (
                  <div key={f.session_id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t border-outline-variant/[0.06] px-4 py-2 text-[12px]">
                    <span className="truncate font-mono text-on-surface">{f.session_id}</span>
                    <span className="tabular-nums text-on-surface-variant">{f.features_count}</span>
                    <span className="text-right tabular-nums text-on-surface-variant">{timeShort(f.produced_at)}</span>
                  </div>
                ))}
              </section>

              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Үүссэн ML таамаглалууд</h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">ML Service</span>
                </header>
                <div className="grid grid-cols-[1fr_auto_auto_auto] bg-surface-container-low/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  <span>Сесс</span><span>Ангилал</span><span>Магадлал</span><span className="text-right">Хэзээ</span>
                </div>
                {data.latest_predictions.map((p) => (
                  <div key={p.session_id} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-t border-outline-variant/[0.06] px-4 py-2 text-[12px]">
                    <span className="truncate font-mono text-on-surface">{p.session_id}</span>
                    <span className="text-on-surface-variant">{predictionClassLabel(p.prediction)}</span>
                    <span className="tabular-nums text-on-surface-variant">{(p.abandonment_probability * 100).toFixed(1)}%</span>
                    <span className="text-right tabular-nums text-on-surface-variant">{timeShort(p.created_at)}</span>
                  </div>
                ))}
              </section>
            </div>

            <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
              <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                  <h2 className="text-[13px] font-semibold text-on-surface">Сүүлийн алдаа ба lag</h2>
                </div>
                <span className="text-[11px] text-on-surface-variant">Сүүлийн 24ц</span>
              </header>
              {data.recent_failures.length ? (
                <ul>
                  {data.recent_failures.map((failure, i) => (
                    <li key={i} className="grid grid-cols-[120px_1fr_auto] gap-3 border-t border-outline-variant/[0.06] px-4 py-2.5 text-[12px]">
                      <span className="font-mono text-on-surface">{failure.service}</span>
                      <span className="truncate text-on-surface-variant">{failure.message}</span>
                      <span className="text-right tabular-nums text-on-surface-variant">{timeShort(failure.occurred_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center text-[12px] text-on-surface-variant">
                  Сүүлийн 24 цагт алдаа бүртгэгдээгүй.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </EditorialShell>
  );
}
