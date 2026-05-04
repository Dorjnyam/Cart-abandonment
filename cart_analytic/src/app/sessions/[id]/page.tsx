import {
  BarChart3,
  Download,
  Globe,
  Monitor,
  ShoppingCart,
  Smartphone,
  User,
  Waves,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { RISK_THRESHOLDS } from "@/lib/constants";
import ShapWaterfallChart from "@/components/charts/ShapWaterfallChart";
import EventTimeline from "@/components/sessions/EventTimeline";
import InsightQuote from "@/components/ui/InsightQuote";
import { getSessionDetail } from "@/lib/services/sessions";

const scoreLabels: Record<string, string> = {
  S1: "Төлбөрийн хурд",
  S2: "Хаягийн form",
  S3: "Үнийн мэдрэмж",
  S4: "Хайлт / Навигаци",
  S5: "UX шилжилт",
  S6: "Хүргэлтийн сонголт",
  S7: "Итгэлцлийн дутагдал",
};

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSessionDetail(id);

  if (!detail) {
    return (
      <EditorialShell activeNav="sessions" title="Session" subtitle="Олдсонгүй">
        <div className="flex items-center justify-center py-24 text-sm text-on-surface-variant">
          Session олдсонгүй: {id}
        </div>
      </EditorialShell>
    );
  }

  const score = detail.prediction.score;
  const scoreColor = score >= RISK_THRESHOLDS.HIGH ? "text-error" : score >= RISK_THRESHOLDS.MEDIUM ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300";
  const scoreBg =
    score >= RISK_THRESHOLDS.HIGH
      ? "bg-error/8 border-error/25"
      : score >= RISK_THRESHOLDS.MEDIUM
        ? "bg-amber-100/40 border-amber-300/40 dark:bg-amber-950/25 dark:border-amber-800/50"
        : "bg-emerald-100/40 border-emerald-300/40 dark:bg-emerald-950/25 dark:border-emerald-800/50";
  const scoreBarColor = score >= RISK_THRESHOLDS.HIGH ? "bg-error" : score >= RISK_THRESHOLDS.MEDIUM ? "bg-amber-500" : "bg-emerald-500";

  const meta = [
    {
      label: "Зочин",
      value: detail.session.visitorId,
      sub: id,
      Icon: User,
    },
    {
      label: "Төхөөрөмж",
      value: detail.session.device,
      sub: detail.session.device === "mobile" ? "Safari · iOS" : "Desktop web",
      Icon: detail.session.device === "mobile" ? Smartphone : Monitor,
    },
    {
      label: "Эх үүсвэр",
      value: detail.session.source,
      sub: "Campaign attached",
      Icon: Globe,
    },
    {
      label: "Сагсны дүн",
      value: detail.session.cartValue != null ? `₮${detail.session.cartValue.toLocaleString()}` : "—",
      sub: "8 бараа",
      Icon: ShoppingCart,
    },
  ];

  return (
    <EditorialShell
      activeNav="sessions"
      title="Сессүүд"
      subtitle={id}
      breadcrumbs={[
        { label: "Сессүүд", href: "/sessions" },
        { label: id },
      ]}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-400 mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">Сесс #{id}</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Эрсдэлийн оноо, SHAP ойлголт, үйл явдлын хугацааны нэгдсэн харагдац.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant/[0.1] bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
              Өгөгдөл баталгаажсан
            </span>
            <span className="inline-flex items-center rounded-full border border-[#10b981]/20 bg-[#10b981]/8 px-2.5 py-1 text-[11px] font-semibold text-[#10b981]">
              Q3 session
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface shadow-card"
            >
              <Download className="size-4" aria-hidden />
              JSON татах
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {meta.map((item) => (
            <div
              key={item.label}
              className="flex gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-card"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/60 text-on-primary-container">
                <item.Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
                <p className="text-sm font-semibold text-on-surface mt-1 capitalize truncate">{item.value}</p>
                <p className="text-[0.6875rem] text-on-surface-variant mt-0.5 truncate">{item.sub}</p>
              </div>
            </div>
          ))}
        </section>

        <section className={`rounded-xl border p-5 md:p-6 flex flex-col lg:flex-row lg:items-center gap-6 ${scoreBg}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex rounded-md border border-error/30 bg-error-container/80 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-error">
                {score >= RISK_THRESHOLDS.HIGH ? "Өндөр эрсдэл" : score >= RISK_THRESHOLDS.MEDIUM ? "Дунд эрсдэл" : "Бага эрсдэл"}
              </span>
              <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
                Орхилтын магадлал
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className={`font-display text-5xl font-semibold tabular-nums ${scoreColor}`}>{(score * 100).toFixed(0)}%</span>
              <span className={`inline-flex items-center rounded-lg border bg-surface-container-lowest px-2.5 py-1 text-sm font-bold ${scoreColor} border-current/20`}>
                {detail.prediction.dominantScore} — {scoreLabels[detail.prediction.dominantScore] ?? "Тодорхойгүй"}
              </span>
            </div>
            <div className="mt-4 max-w-xl">
              <InsightQuote>
                Энэ сессийн хувьд хамгийн их нөлөө үзүүлж буй хүчин зүйлс нь төлбөрийн алхам болон хүргэлтийн сонголттой уялдаатай байна.
              </InsightQuote>
            </div>
          </div>
          <div className="w-full lg:max-w-md shrink-0">
            <p className="text-[0.625rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Эрсдэлийн түвшин</p>
            <div className="h-2.5 rounded-full bg-surface-container-high overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor}`} style={{ width: `${score * 100}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[0.625rem] text-on-surface-variant">
              <span>0%</span>
              <span className={`font-semibold ${scoreColor}`}>Итгэл үзүүлэлт: {(detail.prediction.confidence * 100).toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <section className="lg:col-span-7 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <Waves className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
              Үйл явдлын хугацаа
            </h3>
            <EventTimeline events={detail.events} />
          </section>

          <section className="lg:col-span-5 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
            <h3 className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2 flex-wrap">
              <BarChart3 className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
              SHAP — онцлогуудын нөлөө
              <span className="text-[0.625rem] font-normal text-on-surface-variant">Feature contributions</span>
            </h3>
            <ShapWaterfallChart data={detail.shapValues} />
          </section>
        </div>

        <section className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
          <h3 className="text-sm font-bold text-on-surface mb-4">Feature vector</h3>
          <div className="overflow-x-auto rounded-lg border border-outline-variant/10">
            <table className="w-full text-[0.8125rem] min-w-[480px]">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-alt/80">
                  <th className="text-left py-2.5 px-3 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">Feature</th>
                  <th className="text-left py-2.5 px-3 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">Утга</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {Object.entries(detail.featureVector).map(([key, value]) => (
                  <tr key={key} className="hover:bg-surface-container-low/60">
                    <td className="py-2.5 px-3 font-mono text-[0.6875rem] text-on-surface-variant uppercase tracking-wide">{key}</td>
                    <td className="py-2.5 px-3 font-semibold text-on-surface tabular-nums">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="mt-3 text-xs font-semibold text-primary hover:underline">
            JSON вектор татах
          </button>
        </section>
      </div>
    </EditorialShell>
  );
}
