"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import EditorialShell from "@/components/editorial/EditorialShell";
import { fetchFeatureImportance } from "@/lib/services/analytics";
import { getRecommendations } from "@/lib/services/recommendations";
import { getDashboardData } from "@/lib/services/dashboard";
import type { Recommendation } from "@/lib/services/recommendations";

const SCORE_LABELS: Record<string, string> = {
  S1: "Сэтгэл зүйн шалтгаан",
  S2: "Техникийн саад",
  S3: "Итгэлцлийн асуудал",
  S4: "Мобайл UI-н саад",
  S5: "Үнийн мэдрэмж",
  S6: "Шийдвэр гаргалтын саад",
  S7: "Нийгмийн нөлөөлөл",
};

type ScoreMap = Record<string, number>;

const MOCK_SCORES: ScoreMap = { S1: 0.82, S2: 0.45, S3: 0.12, S4: 0.24, S5: 0.58, S6: 0.08, S7: 0.71 };

export default function OverviewPage() {
  const [period, setPeriod]         = useState(0);
  const [scores, setScores]         = useState<ScoreMap>(MOCK_SCORES);
  const [features, setFeatures]     = useState(false);
  const [recs, setRecs]             = useState<Recommendation[]>([]);
  const [overview, setOverview]     = useState<{ totalSessions: number; abandonmentRate: number } | null>(null);

  useEffect(() => {
    fetchFeatureImportance(undefined, 7)
      .then((data) => {
        if (data.length > 0) {
          const map: ScoreMap = {};
          data.forEach((d, i) => { map[`S${i + 1}`] = d.importance; });
          setScores(map);
          setFeatures(true);
        }
      })
      .catch(() => {});

    getRecommendations()
      .then((d) => setRecs(d.results.slice(0, 5)))
      .catch(() => {});

    getDashboardData()
      .then((d) => {
        const sessions = d.kpis.find((k) => k.label === "Нийт session");
        const abandonment = d.kpis.find((k) => k.label === "Орхилтын хувь");
        if (sessions ?? abandonment) {
          setOverview({
            totalSessions: typeof sessions?.value === "number" ? sessions.value : 0,
            abandonmentRate: typeof abandonment?.value === "string" ? parseFloat(abandonment.value) / 100 : 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  const dominantKey = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "S1";

  return (
    <EditorialShell activeNav="dashboard" title="Тойм" subtitle="Analytics Overview">
      <div className="px-8 pb-12 pt-6">
        <div className="mb-8">
          <div className="inline-flex bg-surface-container-low p-1">
            {["Өнөөдөр", "7 хоног", "30 хоног", "Сар"].map((t, i) => (
              <button
                key={t}
                onClick={() => setPeriod(i)}
                className={[
                  "px-4 py-1.5 text-[0.75rem] font-semibold transition-colors",
                  i === period
                    ? "bg-surface-container-lowest text-primary"
                    : "text-on-surface-variant hover:text-on-surface",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-10">
          {[
            { label: "Нийт session",    value: overview ? overview.totalSessions.toLocaleString()                : "—",      delta: "12%",  deltaIcon: "trending_up",   tone: "secondary" },
            { label: "Орхилтын хувь",  value: overview ? `${(overview.abandonmentRate * 100).toFixed(1)}%`      : "—",      delta: "3.1%", deltaIcon: "trending_down",  tone: "error" },
            { label: "Дундаж session",  value: "02:45",   delta: "0:12", deltaIcon: "trending_up",   tone: "secondary" },
            { label: "Мобайл хувь",     value: "78.4%",   delta: "",     deltaIcon: "",               tone: "on-surface-variant" },
            { label: "Bounce хувь",     value: "41.2%",   delta: "5.4%", deltaIcon: "trending_down",  tone: "secondary" },
          ].map((k) => (
            <div key={k.label} className="bg-surface-container-lowest p-6 rounded-xl">
              <p className="text-[0.6875rem] font-bold text-on-surface-variant mb-2">{k.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[2rem] font-bold tracking-tight text-primary">{k.value}</span>
                {k.delta ? (
                  <span className={`text-[0.6875rem] font-bold flex items-center ${k.tone === "error" ? "text-error" : "text-secondary"}`}>
                    {k.deltaIcon ? (
                      <span className="material-symbols-outlined text-[0.875rem]" aria-hidden>{k.deltaIcon}</span>
                    ) : null}
                    {k.delta}
                  </span>
                ) : (
                  <span className="text-[0.6875rem] text-on-surface-variant font-medium">Тогтвортой</span>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Banner Alert */}
        <div className="mb-10 bg-tertiary-container/10 p-5 rounded-r-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-tertiary" aria-hidden>warning</span>
            <p className="text-on-tertiary-container font-semibold">
              Анхааруулга: {SCORE_LABELS[dominantKey] ?? dominantKey} өндөр байна.
            </p>
          </div>
          <Link href="/diagnosis" className="text-tertiary font-bold text-sm underline underline-offset-4">
            Зөвлөмж рүү очих
          </Link>
        </div>

        {/* Section 2: S-scores */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[1.75rem] font-bold text-primary">Оношлогооны дүн</h3>
            <span className="text-[0.6875rem] text-on-surface-variant">
              {features ? "Feature importance дата" : "Дефолт дата"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(scores).map(([key, val]) => {
              const isDominant = key === dominantKey;
              const color = val >= 0.7 ? "error" : val >= 0.4 ? "tertiary" : "secondary";
              return (
                <div
                  key={key}
                  className={[
                    "bg-surface-container-lowest p-6 rounded-xl",
                    isDominant ? "border-2 border-error/40 ring-4 ring-error/5" : "",
                  ].join(" ")}
                >
                  <p className="text-[0.6875rem] font-black text-on-surface-variant mb-1 uppercase">{key}</p>
                  <h4 className="font-bold text-primary mb-4 text-sm">{SCORE_LABELS[key] ?? key}</h4>
                  <div className="flex items-end justify-between mb-2">
                    <span className={`text-[2rem] font-black ${color === "error" ? "text-error" : color === "tertiary" ? "text-tertiary" : "text-secondary"}`}>
                      {val.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {color === "error" ? "Шүүмжлэлтэй" : color === "tertiary" ? "Анхаарах" : "Хэвийн"}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 overflow-hidden">
                    <div
                      className={`${color === "error" ? "bg-error" : color === "tertiary" ? "bg-tertiary" : "bg-secondary"} h-full`}
                      style={{ width: `${val * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-xl min-h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h4 className="font-bold text-primary">Session тоо ба орхилт</h4>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-secondary rounded-none" />
                    <span className="text-[0.6875rem] font-medium text-on-surface-variant uppercase tracking-wider">Session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-error rounded-none" />
                    <span className="text-[0.6875rem] font-medium text-on-surface-variant uppercase tracking-wider">Орхилт</span>
                  </div>
                </div>
              </div>
              <div className="grow flex items-end gap-2 px-2 pb-6 h-48">
                <div className="grow h-full relative">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
                    <path d="M0,130 Q50,90 100,105 T200,80 T300,120 T400,50 T500,145 T600,70" fill="none" stroke="#2b6868" strokeWidth="3" />
                    <path d="M0,150 Q50,145 100,155 T200,140 T300,150 T400,120 T500,160 T600,130" fill="none" stroke="#9e422c" strokeDasharray="4" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              <div className="flex justify-between mt-2 px-2">
                {["Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям", "Ням"].map((d) => (
                  <span key={d} className="text-[0.625rem] text-on-surface-variant">{d}</span>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-xl">
              <h4 className="font-bold text-primary mb-8">Checkout орхилтын алхам</h4>
              <div className="flex flex-col gap-3">
                {[
                  ["Сагс", 100, false],
                  ["Хаяг", 82, false],
                  ["Хүргэлт", 64, false],
                  ["Төлбөр", 31, true],
                  ["Баталгаажуулах", 28, false],
                ].map(([label, pct, isDrop]) => (
                  <div key={String(label)} className="flex items-center gap-4">
                    <div className="w-28 text-[0.75rem] font-medium text-on-surface-variant">{String(label)}</div>
                    <div className="grow bg-surface-container h-8 relative overflow-hidden">
                      <div className={`${isDrop ? "bg-error/30" : "bg-primary/20"} h-full`} style={{ width: `${Number(pct)}%` }} />
                      <span className="absolute inset-y-0 left-4 flex items-center text-[0.75rem] font-bold text-primary">
                        {Number(pct)}%{isDrop ? " Drop" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center">
              <h4 className="font-bold text-primary self-start mb-10">Трафикийн эх үүсвэр</h4>
              <div className="relative w-48 h-48 mb-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#edeeea" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#605e5b" strokeDasharray="40 100" strokeDashoffset="0" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#2b6868" strokeDasharray="30 100" strokeDashoffset="-40" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#914d00" strokeDasharray="20 100" strokeDashoffset="-70" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#a3dfdf" strokeDasharray="10 100" strokeDashoffset="-90" strokeWidth="4" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-primary">
                    {overview ? `${Math.round(overview.totalSessions / 1000)}k` : "—"}
                  </span>
                  <span className="text-[0.625rem] text-on-surface-variant font-bold uppercase tracking-widest">Total Hits</span>
                </div>
              </div>
              <div className="w-full grid grid-cols-2 gap-4">
                {[
                  ["bg-primary",            "Facebook (40%)"],
                  ["bg-secondary",          "Instagram (30%)"],
                  ["bg-tertiary",           "Google (20%)"],
                  ["bg-secondary-fixed-dim","Direct (10%)"],
                ].map(([dot, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-none ${dot}`} />
                    <span className="text-[0.75rem] text-on-surface-variant">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-xl">
              <h4 className="font-bold text-primary mb-8">Хэрэглэгчийн бүлэг</h4>
              <div className="w-full h-10 flex overflow-hidden mb-6">
                <div className="h-full bg-primary/80 w-[45%]" />
                <div className="h-full bg-secondary w-[35%]" />
                <div className="h-full bg-tertiary w-[20%]" />
              </div>
              <div className="space-y-3">
                {[
                  ["Шинэ хэрэглэгч", "45%", "bg-primary/80"],
                  ["Буцаж ирсэн",    "35%", "bg-secondary"],
                  ["VIP хэрэглэгч",  "20%", "bg-tertiary"],
                ].map((r) => (
                  <div key={r[0]} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-none ${r[2]}`} />
                      <span className="text-[0.75rem] text-on-surface-variant">{r[0]}</span>
                    </div>
                    <span className="text-[0.75rem] font-bold text-primary">{r[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Latest Recommendations */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[1.75rem] font-bold text-primary">Сүүлийн зөвлөмж</h3>
            <Link href="/recommendations" className="text-[0.6875rem] font-bold text-secondary flex items-center gap-1">
              Бүх зөвлөмжийг үзэх
              <span className="material-symbols-outlined text-sm" aria-hidden>chevron_right</span>
            </Link>
          </div>

          {recs.length > 0 ? (
            <div className="space-y-3">
              {recs.map((r) => (
                <div key={r.id} className="bg-surface-container-lowest p-5 rounded-xl flex gap-4 items-start">
                  <div className="w-10 h-10 bg-secondary-container flex items-center justify-center shrink-0 rounded-lg">
                    <span className="material-symbols-outlined text-secondary text-xl" aria-hidden>auto_awesome</span>
                  </div>
                  <div className="grow min-w-0">
                    <p className="font-bold text-primary text-sm truncate">{r.title}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{r.description}</p>
                  </div>
                  <span className={`text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${r.severity === "urgent" ? "bg-error/10 text-error" : r.severity === "optimization" ? "bg-tertiary/10 text-tertiary" : "bg-secondary/10 text-secondary"}`}>
                    {r.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-8 rounded-xl flex gap-8 items-start">
              <div className="w-16 h-16 bg-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-3xl" aria-hidden>auto_awesome</span>
              </div>
              <div className="grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[0.6875rem] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded-none tracking-widest uppercase">
                    AI Зөвлөмж
                  </span>
                  <span className="text-[0.6875rem] text-on-surface-variant">2 цагийн өмнө</span>
                </div>
                <h4 className="text-lg font-bold text-primary mb-3">Хүргэлтийн мэдээлэл оруулах алхамыг хялбарчлах</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-3xl">
                  Таны хэрэглэгчдийн 31% нь хүргэлтийн хаяг оруулах хэсэгт сагсаа орхиж байна.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-2.5 bg-primary text-on-primary text-sm font-bold hover:opacity-90 transition-opacity">
                    Шийдлийг хэрэгжүүлэх
                  </button>
                  <button className="px-6 py-2.5 bg-surface-container text-primary text-sm font-bold hover:bg-surface-container-high transition-colors">
                    Дэлгэрэнгүй
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary flex items-center justify-center hover:scale-110 transition-transform z-50">
          <span className="material-symbols-outlined text-3xl" aria-hidden>add</span>
        </button>
      </div>
    </EditorialShell>
  );
}
