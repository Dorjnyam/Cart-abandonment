"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Badge, Card } from "@/components/ui/Card";
import {
  fetchDashboardIntegration,
  type IntegrationResponse,
} from "@/lib/services/dashboard-mvp";
import { fetchPipelineMonitor, type PipelineMonitor, type ServiceHealth } from "@/lib/services/pipeline";
import { healthLabel } from "@/lib/mn-labels";
import { cn } from "@/lib/utils";

function healthVariant(health: ServiceHealth): "success" | "warning" | "error" | "default" {
  if (health === "healthy") return "success";
  if (health === "degraded") return "warning";
  if (health === "down") return "error";
  return "default";
}

function StatusPill({ health }: { health: ServiceHealth }) {
  return <Badge variant={healthVariant(health)}>{healthLabel(health)}</Badge>;
}

export default function InstallationPage() {
  const [integration, setIntegration] = useState<IntegrationResponse | null>(null);
  const [pipeline, setPipeline] = useState<PipelineMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { t, lang } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [iRes, pRes] = await Promise.allSettled([
      fetchDashboardIntegration(),
      fetchPipelineMonitor(),
    ]);
    if (iRes.status === "fulfilled") {
      setIntegration(iRes.value);
    } else {
      setIntegration(null);
      setError(
        iRes.reason instanceof Error
          ? iRes.reason.message
          : lang === "EN"
            ? "Failed to load integration."
            : "Интеграцийн хүсэлт амжилтгүй боллоо.",
      );
    }
    setPipeline(pRes.status === "fulfilled" ? pRes.value : null);
    setLoading(false);
  }, [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copySnippet() {
    if (!integration) return;
    try {
      await navigator.clipboard.writeText(integration.observer.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const stepLabels = {
    apiKey: lang === "EN" ? "Generate API key" : "API түлхүүр үүсгэх",
    apiKeyDesc:
      lang === "EN"
        ? "Open Settings → Tracking & API Keys and create a production key."
        : "Тохиргоо → API түлхүүр хэсэгт production түлхүүр үүсгэнэ.",
    openSettings: lang === "EN" ? "Open settings" : "Тохиргоо нээх",
    install: lang === "EN" ? "Install observer snippet" : "Observer snippet суулгах",
    installDesc:
      lang === "EN"
        ? "Add the script tag to every storefront page, ideally just before </head>."
        : "Script tag-ийг storefront-ийн бүх хуудсанд оруулна.",
    verify: lang === "EN" ? "Verify events" : "Эвент шалгах",
    verifyDesc:
      lang === "EN"
        ? "Trigger a checkout and watch events appear in the live pipeline monitor."
        : "Сагсанд бараа нэмэхэд эвентүүд монитор дээр гарч ирэх ёстой.",
    openMonitor: lang === "EN" ? "Open monitor" : "Шууд монитор",
    copy: lang === "EN" ? "Copy" : t.installation.copy,
    copied: lang === "EN" ? "Copied" : t.installation.copied,
    refresh: t.common.refresh,
    observerEndpoint: lang === "EN" ? "Observer endpoint" : "Observer endpoint",
    kafkaTopics: lang === "EN" ? "Kafka topics" : "Kafka topics",
    demoLinks: lang === "EN" ? "Demo links" : "Demo холбоосууд",
    recentEvents:
      lang === "EN" ? "Recent events from storefront" : "Storefront-оос ирсэн сүүлийн эвентүүд",
    pipelineSummary: lang === "EN" ? "Pipeline status" : "Pipeline товч төлөв",
    snippetTitle: lang === "EN" ? "Installation snippet" : "Observer суулгах snippet",
    snippetSubtitle:
      lang === "EN"
        ? "Replace the demo key with a production key from Settings."
        : "Demo түлхүүрийг production-р солих боломжтой.",
    cluster: lang === "EN" ? "Cluster status" : "Кластерын төлөв",
    demoStore: lang === "EN" ? "Demo store" : "Demo дэлгүүр",
    dashboardL: lang === "EN" ? "Dashboard" : "Dashboard",
    pipelineMon: lang === "EN" ? "Pipeline monitor" : "Pipeline монитор",
    empty:
      lang === "EN"
        ? "No events yet. Trigger checkout flow on your storefront."
        : "Эвент одоогоор алга. Storefront дээр урсгал ажиллуулна уу.",
    last10: lang === "EN" ? "Last 10" : "Сүүлийн 10",
  };

  return (
    <EditorialShell
      activeNav="installation"
      title={t.installation.title}
      subtitle={t.installation.subtitle}
      right={
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-muted text-text text-xs font-bold hover:bg-surface-muted/70 transition-all"
        >
          <RefreshCw className="size-3.5" />
          {stepLabels.refresh}
        </button>
      }
    >
      <div className="space-y-6">
        {error ? (
          <div className="rounded-xl bg-error/10 border border-error/30 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {loading || !integration ? (
          <div className="flex h-64 items-center justify-center text-muted">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: 1, title: stepLabels.apiKey, desc: stepLabels.apiKeyDesc, href: "/settings?tab=keys", cta: stepLabels.openSettings, Icon: ShieldCheck, status: "done" as const },
                { step: 2, title: stepLabels.install, desc: stepLabels.installDesc, action: "copy" as const, Icon: Terminal, status: "current" as const },
                { step: 3, title: stepLabels.verify, desc: stepLabels.verifyDesc, href: "/pipeline", cta: stepLabels.openMonitor, Icon: Activity, status: "pending" as const },
              ].map((s) => (
                <div
                  key={s.step}
                  className={cn(
                    "rounded-xl bg-surface border-2 p-5 transition-all",
                    s.status === "current"
                      ? "border-primary"
                      : "border-surface-muted",
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                        s.status === "done"
                          ? "bg-success text-white"
                          : s.status === "current"
                            ? "bg-primary text-white"
                            : "bg-surface-muted text-muted",
                      )}
                    >
                      {s.status === "done" ? <Check className="w-4 h-4" /> : s.step}
                    </div>
                    <s.Icon className="w-5 h-5 text-muted" />
                  </div>
                  <h3 className="font-display font-bold text-text mb-1">{s.title}</h3>
                  <p className="text-xs text-muted leading-relaxed mb-4">{s.desc}</p>
                  {s.action === "copy" ? (
                    <button
                      type="button"
                      onClick={() => void copySnippet()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/15 transition-all"
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? stepLabels.copied : stepLabels.copy}
                    </button>
                  ) : s.href ? (
                    <Link
                      href={s.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      {s.cta} <ArrowUpRight className="size-3.5" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>

            <Card
              title={stepLabels.snippetTitle}
              subtitle={stepLabels.snippetSubtitle}
              headerAction={
                <button
                  onClick={() => void copySnippet()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? stepLabels.copied : stepLabels.copy}
                </button>
              }
              noPadding
            >
              <pre className="overflow-x-auto bg-[#0E1110] text-[#86D9A7] px-6 py-4 text-[12px] leading-relaxed font-mono">
                <code>{integration.observer.snippet}</code>
              </pre>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card title={stepLabels.observerEndpoint} icon={ShieldCheck}>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">URL</dt>
                    <dd className="font-mono text-text truncate">{integration.observer.url}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{t.common.status}</dt>
                    <dd>
                      <StatusPill health={(integration.observer.health as ServiceHealth) ?? "unknown"} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{lang === "EN" ? "Demo key" : "Demo түлхүүр"}</dt>
                    <dd className="font-mono text-text truncate">{integration.observer.demo_api_key}</dd>
                  </div>
                </dl>
              </Card>

              <Card title={stepLabels.kafkaTopics} icon={Workflow}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{stepLabels.cluster}</span>
                    <StatusPill health={(integration.kafka.health as ServiceHealth) ?? "unknown"} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(integration.kafka?.topics ?? []).map((tp) => (
                      <span
                        key={tp}
                        className="rounded-md border border-surface-muted bg-bg px-2 py-0.5 font-mono text-[11px] text-text"
                      >
                        {tp}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title={stepLabels.demoLinks} icon={Server}>
                <div className="space-y-2 text-sm">
                  <Link href={integration.demo_shop.url} className="flex items-center gap-2 text-primary hover:underline">
                    {stepLabels.demoStore} <ExternalLink className="size-3.5" />
                  </Link>
                  <Link href={integration.dashboard.url} className="flex items-center gap-2 text-primary hover:underline">
                    {stepLabels.dashboardL} <ExternalLink className="size-3.5" />
                  </Link>
                  <Link href="/pipeline" className="flex items-center gap-2 text-primary hover:underline">
                    {stepLabels.pipelineMon} <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card
                title={stepLabels.recentEvents}
                icon={Activity}
                headerAction={<span className="text-[11px] text-muted">{stepLabels.last10}</span>}
                noPadding
              >
                {(integration.last_events?.length ?? 0) > 0 ? (
                  <div className="divide-y divide-surface-muted">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-muted bg-bg">
                      <span>{t.sessions.table.session}</span>
                      <span>{lang === "EN" ? "Event" : "Эвент"}</span>
                      <span className="text-right">{lang === "EN" ? "When" : "Үүссэн"}</span>
                    </div>
                    {(integration.last_events ?? []).map((event, i) => (
                      <div
                        key={`${event.session_id}-${i}`}
                        className="grid grid-cols-[1fr_1fr_auto] gap-3 px-6 py-2.5 text-xs"
                      >
                        <span className="truncate font-mono text-text">{event.session_id}</span>
                        <span className="truncate text-muted">{event.event_type}</span>
                        <span className="text-right text-muted">{event.created_at}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-muted">{stepLabels.empty}</div>
                )}
              </Card>

              <Card
                title={stepLabels.pipelineSummary}
                icon={CheckCircle2}
                headerAction={
                  <Link href="/pipeline" className="text-xs font-bold text-primary hover:underline">
                    {stepLabels.openMonitor}
                  </Link>
                }
                noPadding
              >
                {pipeline ? (
                  <ul className="divide-y divide-surface-muted">
                    {[...pipeline.services, ...pipeline.infra].map((s) => (
                      <li key={s.id} className="grid grid-cols-[1fr_auto] gap-3 px-6 py-3 items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-text font-semibold">{s.name}</p>
                          {s.detail ? <p className="truncate text-xs text-muted mt-0.5">{s.detail}</p> : null}
                        </div>
                        <StatusPill health={s.health} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-12 text-center text-sm text-muted">
                    {lang === "EN" ? "Pipeline unavailable." : "Pipeline өгөгдөл боломжгүй байна."}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </EditorialShell>
  );
}
