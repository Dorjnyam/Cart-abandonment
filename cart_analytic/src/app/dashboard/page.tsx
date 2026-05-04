import { Clock, Smartphone, TrendingDown, TrendingUp, Users, Zap } from "lucide-react";
import AbandonmentTrendChart from "@/components/charts/AbandonmentTrendChart";
import EditorialShell from "@/components/editorial/EditorialShell";
import ExportModal from "@/components/ui/ExportModal";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import { getDashboardData, fetchScores } from "@/lib/services/dashboard";

const scoreDescriptions: Record<string, string> = {
  S1: "Төлбөр",
  S2: "Хаяг",
  S3: "Үнэ",
  S4: "Хайлт",
  S5: "UX",
  S6: "Хүргэлт",
  S7: "Итгэлцэл",
};

const SCORE_KEYS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"] as const;

const scoreAccent: Record<string, string> = {
  S1: "#ef4444",
  S2: "#f59e0b",
  S3: "#f59e0b",
  S4: "#06b6d4",
  S5: "#10b981",
  S6: "#3b82f6",
  S7: "#2563eb",
};

const kpiIcons = [Users, TrendingDown, Clock, Smartphone];

function KpiCard({
  label,
  value,
  trend,
  trendPositive,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  icon: typeof Users;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-3 ${
        accent
          ? "border-[#2563eb]/30 bg-[#2563eb]/7 dark:bg-[#2563eb]/10"
          : "border-outline-variant/[0.09] bg-surface-container-lowest"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
          {label}
        </span>
        <span className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high/70">
          <Icon className="size-3.5 text-on-surface-variant" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div className="text-[1.75rem] font-semibold text-on-surface tabular-nums leading-none">
        {value}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${trendPositive ? "text-[#10b981]" : "text-[#ef4444]"}`}>
          {trendPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {trend}
        </div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [data, scoreMap] = await Promise.all([getDashboardData(), fetchScores()]);
  const heroKpis = data.kpis.slice(0, 4);
  const hasScores = Object.keys(scoreMap).length > 0;

  return (
    <EditorialShell activeNav="dashboard" title="Тойм" subtitle="Өнөөдрийн төлөв байдал">
      <div className="px-5 sm:px-6 lg:px-8 py-6 space-y-6 max-w-400 mx-auto">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">
              Нарийвчилсан тойм
            </h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Орхилт, сэргээлт, төхөөрөмжийн зөрүүг нэг дор хянах удирдлагын самбар.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <ConnectionStatus />
            <span className="inline-flex items-center rounded-full border border-outline-variant/[0.1] bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
              Сүүлийн 7 хоног
            </span>
            <ExportModal />
          </div>
        </div>

        {/* Alert */}
        <div className="flex items-center gap-3 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/6 px-4 py-3">
          <Zap className="size-4 text-[#ef4444] shrink-0" strokeWidth={2} aria-hidden />
          <p className="text-[12.5px] text-on-surface">
            Сагсны орхилт сүүлийн 2 цагт{" "}
            <strong className="text-[#ef4444]">24%</strong>-иар өссөн.
            Checkout-ийн 2-р алхам (Хүргэлт) гол саад болж байна.
          </p>
        </div>

        {/* KPI grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {heroKpis.map((kpi, i) => {
            const Icon = kpiIcons[i] ?? Users;
            const isAbandonment = kpi.label.includes("Орхилт");
            return (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={String(kpi.value)}
                accent={isAbandonment}
                icon={Icon}
                trend={`${kpi.trendPercent >= 0 ? "+" : ""}${kpi.trendPercent}% 7 хоногт`}
                trendPositive={kpi.trendPercent >= 0}
              />
            );
          })}
        </section>

        {/* Score grid S1–S7 */}
        <section className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-[12.5px] font-semibold text-on-surface">
              Орхилтын шалтгаан <span className="text-on-surface-variant font-normal">(S1–S7)</span>
            </h2>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Өнөөдөр
            </span>
          </div>
          {!hasScores ? (
            <p className="text-sm text-on-surface-variant text-center py-6">Оноо тооцоологдоогүй байна</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {SCORE_KEYS.map((s) => {
                const raw = scoreMap[s] ?? 0;
                const pct = Math.min(100, Math.round(raw <= 1 ? raw * 100 : raw));
                const color = scoreAccent[s] ?? "#2563eb";
                return (
                  <div
                    key={s}
                    className="space-y-2.5 rounded-lg border border-outline-variant/[0.08] bg-surface-alt/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-bold text-on-surface">{s}</span>
                      <span className="text-[10px] text-on-surface-variant tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-snug">{scoreDescriptions[s]}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Trend chart + Dropoff */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[12.5px] font-semibold text-on-surface">Орхилтын хурд</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Сүүлийн 7 хоног
              </span>
            </div>
            <AbandonmentTrendChart data={data.trend} />
            <p className="text-[11.5px] text-on-surface-variant italic leading-relaxed border-t border-outline-variant/[0.08] pt-3">
              Орхилтын хувь баазын шугамын зөрүүг ажиглаж, checkout алхмууд дээрх зөрчлийг шууд тодорхойлно.
            </p>
          </div>

          <div className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-[12.5px] font-semibold text-on-surface">Алхмуудын нөлөө</h2>
              <span className="text-[10px] text-on-surface-variant">Орхилт %</span>
            </div>
            <div className="space-y-3">
              {data.dropoff.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-6">Өгөгдөл байхгүй</p>
              ) : null}
              {data.dropoff.map((point, idx) => {
                const pct = Math.max(5, 100 - point.dropPercent);
                const isWorst =
                  point.dropPercent === Math.max(...data.dropoff.map((d) => d.dropPercent));
                return (
                  <div key={point.step}>
                    <div className="flex items-center justify-between text-[11.5px] mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-surface-container-high text-[9px] font-bold text-on-surface-variant">
                          {idx + 1}
                        </span>
                        <span className={`truncate ${isWorst ? "text-[#ef4444] font-semibold" : "text-on-surface"}`}>
                          {point.step}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-semibold text-on-surface tabular-nums">{point.users}</span>
                        {point.dropPercent > 0 && (
                          <span className={`text-[10px] tabular-nums ${isWorst ? "text-[#ef4444] font-bold" : "text-on-surface-variant"}`}>
                            -{point.dropPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isWorst ? "#ef4444" : "#2563eb",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Traffic sources */}
        <section className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5">
          <h2 className="text-[12.5px] font-semibold text-on-surface mb-4">Трафикийн эх үүсвэр</h2>
          {data.trafficSources.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-6">Өгөгдөл байхгүй</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.trafficSources.map((source) => (
                <div
                  key={source.source}
                  className="rounded-lg border border-outline-variant/[0.08] bg-surface-alt/50 p-4"
                >
                  <p className="text-[11px] text-on-surface-variant font-medium mb-2 truncate">
                    {source.source}
                  </p>
                  <p className="text-[1.5rem] font-semibold text-primary tabular-nums">{source.value}%</p>
                  <div className="mt-2.5 h-1 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${source.value}%`, background: "#2563eb" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom insight cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Хэрэглэгчийн сэтгэл хөдлөл
              </p>
              <p className="mt-2 text-[1.75rem] font-semibold text-primary tabular-nums">7.2</p>
            </div>
            <span className="rounded-full border border-outline-variant/[0.1] bg-surface-container-low px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
              Тогтвортой
            </span>
          </div>
          <div className="rounded-xl border border-[#2563eb]/20 bg-[#2563eb]/[0.05] p-5 flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2563eb]/15">
              <TrendingDown className="size-4 text-[#3b82f6]" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] mb-1">
                Сүүлийн зөвлөмж
              </p>
              <p className="text-[13px] text-on-surface leading-relaxed">
                Төлбөрийн өмнөх алхамд итгэлцлийн micro-copy нэмснээр abandonment буурах магадлал өндөр.
              </p>
            </div>
          </div>
        </section>

      </div>
    </EditorialShell>
  );
}
