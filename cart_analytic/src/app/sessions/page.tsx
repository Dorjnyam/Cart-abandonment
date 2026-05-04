import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Eye,
  Fingerprint,
  Monitor,
  Search,
  Smartphone,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { getSessions } from "@/lib/services/sessions";
import FilterToolbar from "@/components/ui/FilterToolbar";
import { FilterSelect } from "@/components/ui/FilterToolbar";
import TableShell from "@/components/ui/TableShell";
import { AblationBadge } from "@/components/ui/AblationBadge";
import SessionsRiskTabs from "./SessionsRiskTabs";
import SessionVariantFilter from "./SessionVariantFilter";
import { RISK_THRESHOLDS } from "@/lib/constants";

const scoreColors: Record<string, string> = {
  S1: "bg-error/10 text-error border-error/20",
  S2: "bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/70",
  S3: "bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/70",
  S4: "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/70",
  S5: "bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800/70",
  S6: "bg-surface-container-high text-on-surface-variant border-outline-variant/15",
  S7: "bg-surface-container-high text-on-surface-variant border-outline-variant/15",
};

function PredictionBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score >= RISK_THRESHOLDS.HIGH
      ? "bg-error"
      : score >= RISK_THRESHOLDS.MEDIUM
        ? "bg-amber-500"
        : "bg-emerald-500";
  const textColor =
    score >= RISK_THRESHOLDS.HIGH
      ? "text-error"
      : score >= RISK_THRESHOLDS.MEDIUM
        ? "text-amber-600 dark:text-amber-300"
        : "text-emerald-600 dark:text-emerald-300";
  return (
    <div className="flex items-center gap-2 min-w-22">
      <div className="flex-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums shrink-0 ${textColor}`}>
        {score.toFixed(2)}
      </span>
    </div>
  );
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; risk?: string; variant?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const highRisk = params.risk === "high";
  const variant = params.variant ?? "";

  const data = await getSessions({ page, model_variant: variant || undefined });

  const rows = highRisk
    ? data.results.filter((s) => s.predictionScore >= RISK_THRESHOLDS.HIGH)
    : data.results;
  const totalPages = data.count > 0 ? Math.ceil(data.count / 20) : 1;

  const mobile = data.results.filter((s) => s.device === "mobile").length;
  const desktop = Math.max(0, data.results.length - mobile);
  const highCount = data.results.filter((s) => s.predictionScore >= RISK_THRESHOLDS.HIGH).length;

  return (
    <EditorialShell activeNav="sessions" title="Сессүүд" subtitle={`Нийт ${data.count} бүртгэл`}>
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-400 mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">Сессийн аудит</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Хэрэглэгчийн амьдралын мөчлөг, эрсдэлийн векторуудыг нарийвчлан хянах.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Suspense fallback={<div className="h-8 w-56 rounded-lg bg-surface-container-low animate-pulse" />}>
              <SessionsRiskTabs />
            </Suspense>
            <Suspense fallback={<div className="h-8 w-36 rounded-lg bg-surface-container-low animate-pulse" />}>
              <SessionVariantFilter />
            </Suspense>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Нийт сессүүд</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-on-surface tabular-nums">{data.count}</p>
          </div>
          <div className="rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#ef4444]/80">Өндөр эрсдэл</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-[#ef4444] tabular-nums">{highCount}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Мобайл</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-on-surface tabular-nums">{mobile}</p>
          </div>
          <div className="rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Дэлгэц</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-on-surface tabular-nums">{desktop}</p>
          </div>
        </div>

        <FilterToolbar
          trailing={
            <div className="text-[0.6875rem] font-medium text-on-surface-variant tabular-nums">
              {rows.length} / {data.count} харуулж байна
              {highRisk ? " · Өндөр эрсдэл" : ""}
              {variant ? ` · ${variant}` : ""}
            </div>
          }
        >
          <FilterSelect label="Хугацаа">
            <span className="text-on-surface">Сүүлийн 7 хоног</span>
          </FilterSelect>
          <FilterSelect label="Төхөөрөмж">
            <span className="text-on-surface">Desktop &amp; Tablet</span>
          </FilterSelect>
          <FilterSelect label="Эрсдэл">
            <span className="text-on-surface">Оноо &gt; 0.4</span>
          </FilterSelect>
          <FilterSelect label="Эх үүсвэр">
            <span className="text-on-surface">Direct / Social</span>
          </FilterSelect>
        </FilterToolbar>

        <div className="flex items-center gap-2 rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-3 py-2 shadow-card max-w-md">
          <Search className="size-4 text-on-surface-variant shrink-0" aria-hidden />
          <input
            className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 flex-1 focus:outline-none min-w-0"
            placeholder="Visitor ID хайх…"
            readOnly
          />
        </div>

        <TableShell>
          <table className="w-full text-[0.8125rem] min-w-205">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-alt/80">
                {["Session ID", "Visitor", "Загвар", "Төхөөрөмж", "Эх үүсвэр", "Prob", "Ангилал", "Үйлдэл"].map((h) => (
                  <th
                    key={h}
                    className={`py-3.5 px-4 text-[0.66rem] font-bold uppercase tracking-wider text-on-surface-variant ${h === "Үйлдэл" ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {rows.map((session) => {
                const risky = session.predictionScore >= RISK_THRESHOLDS.HIGH;
                return (
                  <tr
                    key={session.id}
                    className={[
                      "transition-colors group",
                      risky ? "bg-error/5 hover:bg-error/10" : "hover:bg-surface-alt/60",
                    ].join(" ")}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Fingerprint
                          className={[
                            "size-4 shrink-0",
                            risky ? "text-error" : "text-on-surface-variant/50 group-hover:text-on-surface-variant",
                          ].join(" ")}
                          aria-hidden
                        />
                        <span className={`font-mono text-xs truncate ${risky ? "text-error font-semibold" : "text-on-surface"}`}>
                          {session.id}
                        </span>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-sm truncate max-w-30 ${risky ? "text-error font-medium" : "text-on-surface-variant"}`}>
                      {session.visitorId}
                    </td>
                    <td className="py-3.5 px-4">
                      {session.model_variant ? (
                        <AblationBadge variant={session.model_variant} size="sm" />
                      ) : (
                        <span className="text-xs text-on-surface-variant/50">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        {session.device === "mobile" ? (
                          <Smartphone className="size-4 shrink-0" aria-hidden />
                        ) : (
                          <Monitor className="size-4 shrink-0" aria-hidden />
                        )}
                        <span className="text-xs capitalize">{session.device}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={[
                            "size-4 rounded-full inline-flex items-center justify-center text-[0.55rem] font-bold",
                            session.source.toLowerCase().includes("facebook")
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                              : session.source.toLowerCase().includes("google")
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-surface-alt text-on-surface-variant",
                          ].join(" ")}
                        >
                          {session.source.slice(0, 1).toUpperCase()}
                        </span>
                        <span className={`text-xs ${risky ? "text-error font-semibold" : "text-on-surface-variant/90"}`}>
                          {session.source}
                        </span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <PredictionBar score={session.predictionScore} />
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-bold ring-1",
                            session.predictionScore >= RISK_THRESHOLDS.HIGH
                              ? "bg-error-container/80 text-error ring-error/20"
                              : session.predictionScore >= RISK_THRESHOLDS.MEDIUM
                                ? "bg-amber-100 text-amber-800 ring-amber-300/40 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-emerald-100 text-emerald-800 ring-emerald-300/40 dark:bg-emerald-900/40 dark:text-emerald-200",
                          ].join(" ")}
                        >
                          {session.predictionScore >= RISK_THRESHOLDS.HIGH ? (
                            <CircleAlert className="size-3" aria-hidden />
                          ) : null}
                          {session.predictionScore >= RISK_THRESHOLDS.HIGH
                            ? "Critical"
                            : session.predictionScore >= RISK_THRESHOLDS.MEDIUM
                              ? "Warn"
                              : "Safe"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[0.625rem] font-bold border ${scoreColors[session.dominantScore] ?? "bg-surface-container text-on-surface-variant"}`}
                      >
                        {session.dominantScore}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        className={[
                          "inline-flex items-center gap-1 text-xs font-semibold",
                          risky ? "text-error hover:underline" : "text-primary hover:underline",
                        ].join(" ")}
                        href={`/sessions/${session.id}`}
                      >
                        {risky ? (
                          <>
                            <AlertTriangle className="size-4" aria-hidden />
                            Анхаар
                          </>
                        ) : (
                          <>
                            <Eye className="size-4" aria-hidden />
                            Нээх
                          </>
                        )}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-on-surface-variant">
                    Одоогоор session бүртгэгдээгүй байна
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableShell>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-sky-200/60 bg-insight/60 dark:bg-insight/20 px-4 py-3">
          <p className="text-sm italic text-on-insight leading-relaxed flex-1 min-w-0 font-display">
            Энэ хуудсанд харагдаж буй сессүүдийн эрсдэлийн профайл нь төлбөр болон хүргэлтийн алхмуудтай холбоотой давтагдах хэв маягийг илэрхийлж байна.
          </p>
          <div className="flex flex-wrap gap-2 shrink-0 sm:ml-auto">
            <button type="button" className="rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface shadow-card">
              CSV татах
            </button>
            <button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-sm">
              Бүгдийг аудит
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-[0.6875rem] text-on-surface-variant tabular-nums">
            Хуудас {page} / {totalPages} · {data.count} нийт бүртгэл
          </span>
          <div className="flex items-center gap-2">
            {data.previous ? (
              <Link
                href={`/sessions?page=${page - 1}${highRisk ? "&risk=high" : ""}${variant ? `&variant=${variant}` : ""}`}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface shadow-sm hover:bg-surface-container-low transition-colors"
              >
                <ChevronLeft className="size-4" aria-hidden />
                Өмнөх
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface-variant/50 cursor-not-allowed">
                <ChevronLeft className="size-4" aria-hidden />
                Өмнөх
              </span>
            )}
            {data.next ? (
              <Link
                href={`/sessions?page=${page + 1}${highRisk ? "&risk=high" : ""}${variant ? `&variant=${variant}` : ""}`}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/15 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface shadow-sm hover:bg-surface-container-low transition-colors"
              >
                Дараах
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/15 bg-surface-container px-3 py-2 text-xs font-semibold text-on-surface-variant/50 cursor-not-allowed">
                Дараах
                <ChevronRight className="size-4" aria-hidden />
              </span>
            )}
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">Дундаж session</p>
            <p className="mt-2 font-display text-3xl font-semibold text-primary tabular-nums">04:12</p>
            <span className="mt-2 inline-flex rounded-full bg-secondary-container/80 text-on-secondary-container text-[0.6875rem] font-semibold px-2.5 py-1 border border-secondary/20">
              +12% өмнөх 7 хоногт
            </span>
          </div>
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Төхөөрөмжийн хувь</p>
            <div className="flex items-center gap-4">
              <div
                className="size-20 rounded-full ring-4 ring-surface-container-high shrink-0"
                style={{
                  background: `conic-gradient(rgb(var(--primary-rgb)) ${data.results.length ? (desktop / data.results.length) * 360 : 0}deg, rgb(var(--secondary-rgb)) 0deg)`,
                }}
                aria-hidden
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-on-surface-variant">
                    <span className="size-2 rounded-full bg-primary" aria-hidden />
                    Desktop
                  </span>
                  <span className="font-semibold tabular-nums">{desktop}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-on-surface-variant">
                    <span className="size-2 rounded-full bg-secondary" aria-hidden />
                    Mobile
                  </span>
                  <span className="font-semibold tabular-nums">{mobile}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[#991B1B] text-white p-5 shadow-md flex flex-col justify-between">
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-white/80">Эрсдэлийн анхааруулга</p>
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{highCount} идэвхтэй</p>
              <p className="mt-1 text-sm text-white/85">Энэ хуудсанд тооцогдсон өндөр оноотой сесс.</p>
            </div>
            <Link
              href="/sessions?risk=high"
              className="mt-4 inline-flex justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#991B1B] hover:bg-sky-50 transition-colors"
            >
              Эрсдэл шалгах
            </Link>
          </div>
        </section>
      </div>
    </EditorialShell>
  );
}
