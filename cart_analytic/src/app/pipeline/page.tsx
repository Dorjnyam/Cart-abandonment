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
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchPipelineMonitor,
  type PipelineMonitor,
  type ServiceHealth,
  type ServiceStatus,
} from "@/lib/services/pipeline";
import { healthLabel, predictionClassLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

function healthVariant(h: ServiceHealth): "success" | "warning" | "error" | "default" {
  if (h === "healthy") return "success";
  if (h === "degraded") return "warning";
  if (h === "down") return "error";
  return "default";
}

function StatusPill({ health }: { health: ServiceHealth }) {
  return <Badge variant={healthVariant(health)}>{healthLabel(health)}</Badge>;
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] items-center gap-3 px-5 py-3 border-b border-surface-muted/60 last:border-b-0 hover:bg-surface-muted/30 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-text">{service.name}</span>
          {service.version ? (
            <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-muted">
              {service.version}
            </span>
          ) : null}
        </div>
        {service.detail ? <p className="mt-0.5 truncate text-xs text-muted">{service.detail}</p> : null}
      </div>
      <div className="text-xs text-muted tabular-nums">
        {service.latency_p95_ms != null ? `p95 ${service.latency_p95_ms} ms` : "—"}
      </div>
      <div className="text-xs text-muted">{service.last_heartbeat ?? "—"}</div>
      <StatusPill health={service.health} />
    </div>
  );
}

function ServiceTable({
  title,
  subtitle,
  Icon,
  services,
  headers,
}: {
  title: string;
  subtitle?: string;
  Icon: typeof Server;
  services: ServiceStatus[];
  headers: { component: string; latency: string; heartbeat: string; status: string };
}) {
  return (
    <Card title={title} subtitle={subtitle} icon={Icon} noPadding>
      <div className="grid grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] gap-3 bg-bg border-b border-surface-muted px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        <span>{headers.component}</span>
        <span>{headers.latency}</span>
        <span>{headers.heartbeat}</span>
        <span className="text-right">{headers.status}</span>
      </div>
      <div>
        {services.map((s) => (
          <ServiceRow key={s.id} service={s} />
        ))}
      </div>
    </Card>
  );
}

function ThroughputTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 font-display font-extrabold tabular-nums text-2xl text-text leading-none">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted">{helper}</p>
    </Card>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function timeShort(value: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function PipelinePage() {
  const [data, setData] = useState<PipelineMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useLanguage();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setData(await fetchPipelineMonitor());
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : lang === "EN"
              ? "Pipeline monitor request failed."
              : "Pipeline мониторын хүсэлт амжилтгүй боллоо.",
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [lang],
  );

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const L = {
    events24: lang === "EN" ? "Events (24h)" : "24ц эвент",
    sessions24: lang === "EN" ? "Sessions (24h)" : "24ц сесс",
    features24: lang === "EN" ? "Features (24h)" : "24ц feature",
    predictions24: lang === "EN" ? "Predictions (24h)" : "24ц таамаглал",
    consumerLag: lang === "EN" ? "Consumer lag" : "Consumer lag",
    failures24: lang === "EN" ? "Failures (24h)" : "24ц алдаа",
    obs: lang === "EN" ? "Observer ingest" : "Observer ingest",
    sessSvc: lang === "EN" ? "Session service" : "Session Service",
    featSvc: lang === "EN" ? "Feature vectors" : "Feature vectors",
    mlSvc: lang === "EN" ? "ML service" : "ML Service",
    kafkaLag: lang === "EN" ? "Kafka offset lag" : "Kafka offset lag",
    allSvcs: lang === "EN" ? "Across all services" : "Бүх сервист",
    services: lang === "EN" ? "Services" : "Сервисүүд",
    servicesHint: lang === "EN" ? "Pipeline components" : "Pipeline бүрэлдэхүүн",
    infra: lang === "EN" ? "Infrastructure" : "Дэд бүтэц",
    infraHint: lang === "EN" ? "Core dependencies" : "Үндсэн хамаарлууд",
    component: lang === "EN" ? "Component" : "Бүрэлдэхүүн",
    latency: lang === "EN" ? "Latency" : "Latency",
    heartbeat: lang === "EN" ? "Heartbeat" : "Heartbeat",
    status: t.common.status,
    recentEvents: lang === "EN" ? "Recent events" : "Сүүлийн эвентүүд",
    recentSessions: lang === "EN" ? "Recent sessions" : "Сүүлийн сессүүд",
    recentFeatures: lang === "EN" ? "Recent feature vectors" : "Боловсруулсан feature vector",
    recentPredictions: lang === "EN" ? "Recent ML predictions" : "Үүссэн ML таамаглал",
    recentFailures: lang === "EN" ? "Recent failures & lag" : "Сүүлийн алдаа ба lag",
    last24h: lang === "EN" ? "Last 24h" : "Сүүлийн 24ц",
    noFailures: lang === "EN" ? "No failures in last 24h." : "Сүүлийн 24 цагт алдаа алга.",
    session: lang === "EN" ? "Session" : "Сесс",
    event: lang === "EN" ? "Event" : "Эвент",
    when: lang === "EN" ? "When" : "Хэзээ",
    visitor: lang === "EN" ? "Visitor" : "Зочин",
    events: lang === "EN" ? "Events" : "Эвент",
    started: lang === "EN" ? "Started" : "Эхэлсэн",
    feature: lang === "EN" ? "Features" : "Feature",
    produced: lang === "EN" ? "Produced" : "Үүссэн",
    classLabel: lang === "EN" ? "Class" : "Ангилал",
    prob: lang === "EN" ? "Probability" : "Магадлал",
  };

  return (
    <EditorialShell
      activeNav="pipeline"
      title={t.pipeline.title}
      subtitle={t.pipeline.subtitle}
      right={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{data ? timeShort(data.refreshed_at) : "—"}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-bold text-text hover:bg-surface-muted/70"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            {t.common.refresh}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {loading || !data ? (
          <div className="flex h-64 items-center justify-center text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <ThroughputTile label={L.events24} value={fmt(data.throughput.events_24h)} helper={L.obs} />
              <ThroughputTile label={L.sessions24} value={fmt(data.throughput.sessions_24h)} helper={L.sessSvc} />
              <ThroughputTile label={L.features24} value={fmt(data.throughput.features_24h)} helper={L.featSvc} />
              <ThroughputTile label={L.predictions24} value={fmt(data.throughput.predictions_24h)} helper={L.mlSvc} />
              <ThroughputTile label={L.consumerLag} value={fmt(data.throughput.consumer_lag)} helper={L.kafkaLag} />
              <ThroughputTile label={L.failures24} value={fmt(data.throughput.failures_24h)} helper={L.allSvcs} />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <ServiceTable
                title={L.services}
                subtitle={L.servicesHint}
                Icon={Workflow}
                services={data.services}
                headers={{ component: L.component, latency: L.latency, heartbeat: L.heartbeat, status: L.status }}
              />
              <ServiceTable
                title={L.infra}
                subtitle={L.infraHint}
                Icon={Database}
                services={data.infra}
                headers={{ component: L.component, latency: L.latency, heartbeat: L.heartbeat, status: L.status }}
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card
                title={L.recentEvents}
                icon={Zap}
                headerAction={<span className="text-[11px] text-muted">Observer → Kafka</span>}
                noPadding
              >
                <div className="grid grid-cols-[1fr_1fr_auto] bg-bg border-b border-surface-muted px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  <span>{L.session}</span>
                  <span>{L.event}</span>
                  <span className="text-right">{L.when}</span>
                </div>
                {data.latest_events.map((event, i) => (
                  <div
                    key={`${event.session_id}-${i}`}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 border-b border-surface-muted/60 last:border-b-0 px-5 py-2.5 text-xs"
                  >
                    <span className="truncate font-mono text-text">{event.session_id}</span>
                    <span className="truncate text-muted">{event.event_type}</span>
                    <span className="text-right tabular-nums text-muted">{timeShort(event.created_at)}</span>
                  </div>
                ))}
              </Card>

              <Card
                title={L.recentSessions}
                icon={Network}
                headerAction={<span className="text-[11px] text-muted">Session Service</span>}
                noPadding
              >
                <div className="grid grid-cols-[1fr_1fr_auto_auto] bg-bg border-b border-surface-muted px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  <span>{L.session}</span>
                  <span>{L.visitor}</span>
                  <span>{L.events}</span>
                  <span className="text-right">{L.started}</span>
                </div>
                {data.latest_sessions.map((s) => (
                  <div
                    key={s.session_id}
                    className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 border-b border-surface-muted/60 last:border-b-0 px-5 py-2.5 text-xs"
                  >
                    <span className="truncate font-mono text-text">{s.session_id}</span>
                    <span className="truncate text-muted">{s.visitor_id ?? "—"}</span>
                    <span className="tabular-nums text-muted">{s.events}</span>
                    <span className="text-right tabular-nums text-muted">{timeShort(s.started_at)}</span>
                  </div>
                ))}
              </Card>

              <Card
                title={L.recentFeatures}
                icon={Workflow}
                headerAction={<span className="text-[11px] text-muted">Feature Service</span>}
                noPadding
              >
                <div className="grid grid-cols-[1fr_auto_auto] bg-bg border-b border-surface-muted px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  <span>{L.session}</span>
                  <span>{L.feature}</span>
                  <span className="text-right">{L.produced}</span>
                </div>
                {data.latest_features.map((f) => (
                  <div
                    key={f.session_id}
                    className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-surface-muted/60 last:border-b-0 px-5 py-2.5 text-xs"
                  >
                    <span className="truncate font-mono text-text">{f.session_id}</span>
                    <span className="tabular-nums text-muted">{f.features_count}</span>
                    <span className="text-right tabular-nums text-muted">{timeShort(f.produced_at)}</span>
                  </div>
                ))}
              </Card>

              <Card
                title={L.recentPredictions}
                icon={Workflow}
                headerAction={<span className="text-[11px] text-muted">ML Service</span>}
                noPadding
              >
                <div className="grid grid-cols-[1fr_auto_auto_auto] bg-bg border-b border-surface-muted px-5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  <span>{L.session}</span>
                  <span>{L.classLabel}</span>
                  <span>{L.prob}</span>
                  <span className="text-right">{L.when}</span>
                </div>
                {data.latest_predictions.map((p) => (
                  <div
                    key={p.session_id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-surface-muted/60 last:border-b-0 px-5 py-2.5 text-xs"
                  >
                    <span className="truncate font-mono text-text">{p.session_id}</span>
                    <span className="text-muted">{predictionClassLabel(p.prediction)}</span>
                    <span className="tabular-nums text-muted">
                      {(p.abandonment_probability * 100).toFixed(1)}%
                    </span>
                    <span className="text-right tabular-nums text-muted">{timeShort(p.created_at)}</span>
                  </div>
                ))}
              </Card>
            </div>

            <Card
              title={L.recentFailures}
              icon={AlertTriangle}
              headerAction={<span className="text-[11px] text-muted">{L.last24h}</span>}
              noPadding
            >
              {data.recent_failures.length ? (
                <ul>
                  {data.recent_failures.map((failure, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[120px_1fr_auto] gap-3 border-b border-surface-muted/60 last:border-b-0 px-5 py-3 text-xs"
                    >
                      <span className="font-mono text-text">{failure.service}</span>
                      <span className="truncate text-muted">{failure.message}</span>
                      <span className="text-right tabular-nums text-muted">
                        {timeShort(failure.occurred_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-8 text-center text-sm text-muted">{L.noFailures}</div>
              )}
            </Card>
          </>
        )}
      </div>
    </EditorialShell>
  );
}
