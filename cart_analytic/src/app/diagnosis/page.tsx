"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { getDiagnoses, type DiagnosisEntry, type DiagnosisRisk } from "@/lib/services/diagnosis";
import { RISK_THRESHOLDS } from "@/lib/constants";

const riskConfig: Record<DiagnosisRisk, { label: string; color: string; icon: string }> = {
  high: { label: "Өндөр", color: "bg-error/10 text-error border-error/20", icon: "error" },
  medium: { label: "Дунд", color: "bg-tertiary/10 text-tertiary border-tertiary/20", icon: "warning" },
  low: { label: "Бага", color: "bg-secondary/10 text-secondary border-secondary/20", icon: "check_circle" },
};

export default function DiagnosisPage() {
  const [entries, setEntries] = useState<DiagnosisEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<DiagnosisRisk | "">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDiagnoses({ query: debouncedQuery, riskLevel: riskFilter, page });
      setEntries(data.results);
      setTotal(data.count);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, riskFilter, page]);

  useEffect(() => { void load(); }, [load]);

  const stats = {
    total,
    high: entries.filter((d) => d.riskLevel === "high").length,
    medium: entries.filter((d) => d.riskLevel === "medium").length,
    low: entries.filter((d) => d.riskLevel === "low").length,
  };

  return (
    <EditorialShell activeNav="diagnosis" title="Оношлогоо" subtitle="Сессийн оношлогооны түүх">
      <div className="px-8 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Нийт", value: total, color: "text-on-surface", bg: "bg-surface-container-lowest" },
            { label: "Өндөр эрсдэл", value: stats.high, color: "text-error", bg: "bg-error/5" },
            { label: "Дунд эрсдэл", value: stats.medium, color: "text-tertiary", bg: "bg-tertiary/5" },
            { label: "Бага эрсдэл", value: stats.low, color: "text-secondary", bg: "bg-secondary/5" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} border border-outline-variant/15 p-4`}>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-on-surface-variant mb-2">{item.label}</p>
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 px-3 py-2">
            <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden>search</span>
            <input
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none w-48"
              placeholder="Session ID хайх..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
            {query ? (
              <button type="button" onClick={() => { setQuery(""); setPage(1); }} className="text-on-surface-variant hover:text-on-surface" aria-label="Цэвэрлэх">
                <span className="material-symbols-outlined text-sm" aria-hidden>close</span>
              </button>
            ) : null}
          </div>

          <div className="flex gap-1">
            {(["", "high", "medium", "low"] as (DiagnosisRisk | "")[]).map((r) => (
              <button
                key={r || "all"}
                type="button"
                onClick={() => { setRiskFilter(r); setPage(1); }}
                className={[
                  "px-3 py-1.5 text-xs font-semibold border transition-colors",
                  riskFilter === r
                    ? "bg-secondary text-on-secondary border-secondary"
                    : "bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low",
                ].join(" ")}
              >
                {r === "" ? "Бүгд" : riskConfig[r].label}
              </button>
            ))}
          </div>

          <span className="ml-auto text-[0.6875rem] text-on-surface-variant">
            {loading ? "Ачааллаж байна..." : `${entries.length} / ${total} үр дүн`}
          </span>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant/15">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                {["Diagnosis ID", "Session", "Огноо", "Эрсдэл", "Ангилал", "Prediction", "Үйлдэл"].map((h) => (
                  <th key={h} className={`py-3 px-4 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant ${h === "Үйлдэл" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 rounded bg-surface-container-low animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 opacity-30" aria-hidden>search_off</span>
                    Хайлтын үр дүн олдсонгүй.
                  </td>
                </tr>
              ) : (
                entries.map((d) => {
                  const risk = riskConfig[d.riskLevel];
                  const pct = Math.round(d.predictionScore * 100);
                  const barColor = d.predictionScore >= RISK_THRESHOLDS.HIGH ? "bg-error" : d.predictionScore >= RISK_THRESHOLDS.MEDIUM ? "bg-tertiary" : "bg-secondary";
                  return (
                    <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-on-surface">{d.id}</td>
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant font-mono">{d.sessionId}</td>
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant">{d.createdAt}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.625rem] font-bold border ${risk.color}`}>
                          <span className="material-symbols-outlined text-[0.75rem]" aria-hidden style={{ fontVariationSettings: "'FILL' 1" }}>{risk.icon}</span>
                          {risk.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 text-[0.625rem] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/20">
                          {d.dominantScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 h-1 bg-surface-container">
                            <div className={`h-1 ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${d.predictionScore >= RISK_THRESHOLDS.HIGH ? "text-error" : d.predictionScore >= RISK_THRESHOLDS.MEDIUM ? "text-tertiary" : "text-secondary"}`}>
                            {d.predictionScore.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/diagnosis/${d.id}`} className="inline-flex items-center gap-1 text-secondary text-xs font-semibold hover:underline">
                          Нээх
                          <span className="material-symbols-outlined text-sm" aria-hidden>arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > entries.length ? (
          <div className="flex items-center justify-between text-xs text-on-surface-variant">
            <span>Хуудас {page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-outline-variant/15 disabled:opacity-40 hover:bg-surface-container transition-colors">
                ← Өмнөх
              </button>
              <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-outline-variant/15 hover:bg-surface-container transition-colors">
                Дараах →
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </EditorialShell>
  );
}
