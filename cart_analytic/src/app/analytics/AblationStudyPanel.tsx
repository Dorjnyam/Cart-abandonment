"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AblationBadge } from "@/components/ui/AblationBadge";
import { fetchAblationSummary, type AblationSummary, type VariantMetrics } from "@/lib/services/ablation";

const VARIANT_COLORS: Record<string, string> = {
  baseline: "#6B7280",
  extended: "#2563EB",
  full:     "#7C3AED",
};

function deltaLabel(baseline: VariantMetrics, current: VariantMetrics): string {
  if (current.model_variant === "baseline") return "—";
  const diff = Math.round((current.avg_confidence - baseline.avg_confidence) * 100);
  return diff >= 0 ? `+${diff}pp` : `${diff}pp`;
}

export default function AblationStudyPanel() {
  const [data, setData] = useState<AblationSummary | null>(null);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [loading, setLoading]   = useState(false);

  async function load(from?: string, to?: string) {
    setLoading(true);
    try {
      const result = await fetchAblationSummary(from, to);
      setData(result);
      setError("");
    } catch {
      setError("Ablation data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  if (!data) {
    return (
      <div className="rounded-lg border border-outline-variant/15 bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
        {loading ? "Loading ablation data..." : error || "No ablation data available."}
      </div>
    );
  }

  const baseline = data.variants.find((v) => v.model_variant === "baseline");

  return (
    <div className="space-y-6">
      {/* Огнооны range picker */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold text-on-surface-variant">Эхлэх огноо</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-1.5 text-sm text-on-surface focus:outline-none"
        />
        <label className="text-xs font-semibold text-on-surface-variant">Дуусах огноо</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-1.5 text-sm text-on-surface focus:outline-none"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(dateFrom || undefined, dateTo || undefined)}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary disabled:opacity-50"
        >
          {loading ? "Уншиж байна…" : "Хайх"}
        </button>
      </div>

      {/* Харьцуулалтын хүснэгт */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/10 shadow-card">
        <table className="w-full text-[0.8125rem] min-w-[640px]">
          <thead>
            <tr className="border-b border-outline-variant/10 bg-surface-alt/80">
              {["Загварын хувилбар", "Таамаглал", "Орхилтын хувь", "Дундаж итгэл", "Суурьтай харьцуулахад"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[0.66rem] font-bold uppercase tracking-wider text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.variants.map((v) => (
              <tr key={v.model_variant} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-4 py-3">
                  <AblationBadge variant={v.model_variant} size="sm" />
                </td>
                <td className="px-4 py-3 font-mono tabular-nums text-on-surface">
                  {v.count.toLocaleString()}
                </td>
                <td className="px-4 py-3 tabular-nums text-on-surface">
                  {Math.round(v.abandonment_rate * 100)}%
                </td>
                <td className="px-4 py-3 tabular-nums text-on-surface">
                  {v.avg_confidence.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  {baseline ? (
                    <span
                      className={
                        v.model_variant === "baseline"
                          ? "text-on-surface-variant"
                          : Math.round((v.avg_confidence - baseline.avg_confidence) * 100) >= 0
                            ? "font-semibold text-green-700"
                            : "font-semibold text-red-700"
                      }
                    >
                      {baseline ? deltaLabel(baseline, v) : "—"} conf
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart хэсэг */}
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
        <h4 className="text-sm font-bold text-on-surface mb-4">Загварын итгэлийн харьцуулалт</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.variants} barSize={40}>
            <XAxis dataKey="model_variant" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => v.toFixed(1)} />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(2), "Итгэл"]}
              labelFormatter={(label) => `Загвар: ${label}`}
            />
            <Bar dataKey="avg_confidence" radius={[6, 6, 0, 0]}>
              {data.variants.map((v) => (
                <Cell key={v.model_variant} fill={VARIANT_COLORS[v.model_variant] ?? "#6B7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Нэгтгэсэн delta */}
      {data.comparison ? (
        <div className="flex flex-wrap gap-4">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 shadow-sm">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Орхилтын хувийн өөрчлөлт</p>
            <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${data.comparison.abandonment_rate_delta <= 0 ? "text-green-700" : "text-red-700"}`}>
              {data.comparison.abandonment_rate_delta > 0 ? "+" : ""}
              {Math.round(data.comparison.abandonment_rate_delta * 100)}pp
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-4 shadow-sm">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Итгэлийн өөрчлөлт</p>
            <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${data.comparison.confidence_delta >= 0 ? "text-green-700" : "text-red-700"}`}>
              {data.comparison.confidence_delta > 0 ? "+" : ""}
              {Math.round(data.comparison.confidence_delta * 100)}pp
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
