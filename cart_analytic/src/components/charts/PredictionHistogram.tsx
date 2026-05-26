"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistogramBin } from "@/types/api";
import { CHART_TOKENS } from "@/lib/chart-tokens";

export default function PredictionHistogram({ data }: { data: HistogramBin[] | null | undefined }) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant">Таамаглалын тархалтын өгөгдөл алга.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} vertical={false} />
          <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={{ stroke: CHART_TOKENS.grid }} />
          <YAxis tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: CHART_TOKENS.tooltipBg, borderRadius: "0.5rem", border: `1px solid ${CHART_TOKENS.tooltipBorder}`, fontSize: "0.75rem" }} />
          <Bar dataKey="count" fill={CHART_TOKENS.secondary} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

