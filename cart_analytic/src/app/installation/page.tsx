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
  Workflow,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import {
  fetchDashboardIntegration,
  type IntegrationResponse,
} from "@/lib/services/dashboard-mvp";
import { fetchPipelineMonitor, type PipelineMonitor, type ServiceHealth } from "@/lib/services/pipeline";
import { healthLabel } from "@/lib/mn-labels";

function StatusPill({ health }: { health: ServiceHealth }) {
  const map: Record<ServiceHealth, { bg: string; text: string; dot: string; label: string }> = {
    healthy: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300", dot: "bg-emerald-500", label: healthLabel("healthy") },
    degraded: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-300", dot: "bg-amber-500", label: healthLabel("degraded") },
    down: { bg: "bg-error/10", text: "text-error", dot: "bg-rose-500", label: healthLabel("down") },
    unknown: { bg: "bg-surface-container-high/60", text: "text-on-surface-variant", dot: "bg-slate-400", label: healthLabel("unknown") },
  };
  const tone = map[health];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone.bg} ${tone.text}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {tone.label}
    </span>
  );
}

export default function InstallationPage() {
  const [integration, setIntegration] = useState<IntegrationResponse | null>(null);
  const [pipeline, setPipeline] = useState<PipelineMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [i, p] = await Promise.all([fetchDashboardIntegration(), fetchPipelineMonitor()]);
      setIntegration(i);
      setPipeline(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Интеграцийн хүсэлт амжилтгүй боллоо.");
      setIntegration(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      /* Алдааг зориуд үл тооно. */
    }
  }

  return (
    <EditorialShell
      activeNav="installation"
      title="Суулгалт"
      breadcrumbs={[{ label: "Суулгалт" }]}
    >
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-on-surface">Суулгалт</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-on-surface-variant">
              Storefront-оо сагс орхилтын pipeline-т холбоно. Observer эвент хүлээн авч, pipeline-ийн бусад хэсэг хэдхэн секундын дотор оноолно.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest px-3 py-1.5 text-[12px] font-medium text-on-surface hover:bg-surface-container-low"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Шинэчлэх
          </button>
        </div>

        {error ? (
          <div className="rounded-md border border-error/25 bg-error/5 px-4 py-3 text-[12.5px] text-error">{error}</div>
        ) : null}

        {loading || !integration ? (
          <div className="flex h-64 items-center justify-center text-on-surface-variant">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : (
          <>
            <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
              <header className="border-b border-outline-variant/[0.06] px-5 py-3">
                <h2 className="text-[13px] font-semibold text-on-surface">Суулгалтын checklist</h2>
                <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Бодит эвент хүлээн авах гурван алхам.</p>
              </header>
              <ol className="divide-y divide-outline-variant/[0.06]">
                <li className="grid grid-cols-[28px_1fr_auto] gap-3 px-5 py-3.5">
                  <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">1</span>
                  <div>
                    <p className="text-[13px] font-semibold text-on-surface">API түлхүүр үүсгэх</p>
                    <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Тохиргоо → Tracking &amp; API Keys хэсгийг нээж production түлхүүр үүсгэнэ.</p>
                  </div>
                  <Link href="/settings?tab=keys" className="self-center text-[11.5px] font-semibold text-primary hover:underline">
                    Тохиргоо нээх
                  </Link>
                </li>
                <li className="grid grid-cols-[28px_1fr_auto] gap-3 px-5 py-3.5">
                  <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">2</span>
                  <div>
                    <p className="text-[13px] font-semibold text-on-surface">Observer snippet суулгах</p>
                    <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Script tag-ийг storefront-ийн бүх хуудсанд, боломжтой бол хаагдах &lt;/head&gt; tag-аас өмнө нэмнэ.</p>
                  </div>
                  <button
                    onClick={() => void copySnippet()}
                    className="self-center inline-flex items-center gap-1.5 rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest px-2.5 py-1 text-[11.5px] font-medium text-on-surface hover:bg-surface-container-low"
                  >
                    {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    {copied ? "Хуулагдсан" : "Хуулах"}
                  </button>
                </li>
                <li className="grid grid-cols-[28px_1fr_auto] gap-3 px-5 py-3.5">
                  <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">3</span>
                  <div>
                    <p className="text-[13px] font-semibold text-on-surface">Эвент шалгах</p>
                    <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Бүтээгдэхүүн үзэж, сагсанд нэмээд доорх сүүлийн эвентийн хүснэгтийг шалгана.</p>
                  </div>
                  <Link href="/pipeline" className="self-center text-[11.5px] font-semibold text-primary hover:underline">
                    Шууд монитор
                  </Link>
                </li>
              </ol>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Observer endpoint</h2>
                  </div>
                </header>
                <dl className="divide-y divide-outline-variant/[0.06]">
                  <div className="grid grid-cols-[100px_1fr] gap-3 px-4 py-2.5 text-[12px]">
                    <dt className="text-on-surface-variant">URL</dt>
                    <dd className="truncate font-mono text-on-surface">{integration.observer.url}</dd>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-3 px-4 py-2.5 text-[12px]">
                    <dt className="text-on-surface-variant">Төлөв</dt>
                    <dd>
                      <StatusPill health={(integration.observer.health as ServiceHealth) ?? "unknown"} />
                    </dd>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-3 px-4 py-2.5 text-[12px]">
                    <dt className="text-on-surface-variant">Demo түлхүүр</dt>
                    <dd className="truncate font-mono text-on-surface">{integration.observer.demo_api_key}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Kafka topics</h2>
                  </div>
                </header>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-on-surface-variant">Кластерын төлөв</span>
                    <StatusPill health={(integration.kafka.health as ServiceHealth) ?? "unknown"} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {integration.kafka.topics.map((t) => (
                      <span key={t} className="rounded-md border border-outline-variant/[0.12] bg-surface-container-low/60 px-2 py-0.5 font-mono text-[11px] text-on-surface">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="border-b border-outline-variant/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Server className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Demo холбоосууд</h2>
                  </div>
                </header>
                <div className="space-y-1.5 px-4 py-3 text-[12.5px]">
                  <Link href={integration.demo_shop.url} className="flex items-center gap-2 text-primary hover:underline">
                    Demo дэлгүүр <ExternalLink className="size-3.5" aria-hidden />
                  </Link>
                  <Link href={integration.dashboard.url} className="flex items-center gap-2 text-primary hover:underline">
                    Dashboard <ExternalLink className="size-3.5" aria-hidden />
                  </Link>
                  <Link href="/pipeline" className="flex items-center gap-2 text-primary hover:underline">
                    Pipeline монитор <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </section>
            </div>

            <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/[0.06] px-5 py-3">
                <div>
                  <h2 className="text-[13px] font-semibold text-on-surface">Observer суулгах snippet</h2>
                  <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Тохиргооноос бодит түлхүүр үүсгэвэл энэ snippet-д шууд оруулж болно.</p>
                </div>
                <button
                  onClick={() => void copySnippet()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-on-primary hover:opacity-95"
                >
                  {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  {copied ? "Хуулагдсан" : "Snippet хуулах"}
                </button>
              </header>
              <pre className="overflow-x-auto bg-[#0b1220] px-5 py-4 text-[12px] leading-relaxed text-slate-100">
                <code>{integration.observer.snippet}</code>
              </pre>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Activity className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Storefront-оос ирсэн сүүлийн эвентүүд</h2>
                  </div>
                  <span className="text-[11px] text-on-surface-variant">Сүүлийн 10</span>
                </header>
                {integration.last_events.length ? (
                  <>
                    <div className="grid grid-cols-[1fr_1fr_auto] bg-surface-container-low/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                      <span>Сесс</span><span>Эвент</span><span className="text-right">Үүссэн</span>
                    </div>
                    {integration.last_events.map((event, i) => (
                      <div key={`${event.session_id}-${i}`} className="grid grid-cols-[1fr_1fr_auto] gap-3 border-t border-outline-variant/[0.06] px-5 py-2 text-[12px]">
                        <span className="truncate font-mono text-on-surface">{event.session_id}</span>
                        <span className="truncate text-on-surface-variant">{event.event_type}</span>
                        <span className="text-right text-on-surface-variant">{event.created_at}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="px-5 py-8 text-center text-[12px] text-on-surface-variant">
                    Эвент одоогоор алга. Шалгахын тулд storefront дээр урсгал ажиллуулна уу.
                  </div>
                )}
              </section>

              <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
                <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
                    <h2 className="text-[13px] font-semibold text-on-surface">Pipeline товч төлөв</h2>
                  </div>
                  <Link href="/pipeline" className="text-[11.5px] font-semibold text-primary hover:underline">
                    Монитор нээх
                  </Link>
                </header>
                {pipeline ? (
                  <ul className="divide-y divide-outline-variant/[0.06]">
                    {[...pipeline.services, ...pipeline.infra].map((s) => (
                      <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-2 text-[12px]">
                        <div className="min-w-0">
                          <p className="truncate text-on-surface">{s.name}</p>
                          {s.detail ? <p className="truncate text-[11px] text-on-surface-variant">{s.detail}</p> : null}
                        </div>
                        <StatusPill health={s.health} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-5 py-8 text-center text-[12px] text-on-surface-variant">Pipeline өгөгдөл боломжгүй байна.</div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </EditorialShell>
  );
}
