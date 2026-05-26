"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FeatureImportancePoint } from "@/types/api";
import { CHART_TOKENS } from "@/lib/chart-tokens";

export default function FeatureImportanceBarChart({
  data,
}: {
  data: FeatureImportancePoint[] | null | undefined;
}) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant">Онцлогийн ач холбогдлын өгөгдөл алга.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={{ stroke: CHART_TOKENS.grid }} />
          <YAxis dataKey="feature" type="category" width={150} tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: CHART_TOKENS.tooltipBg, borderRadius: "0.5rem", border: `1px solid ${CHART_TOKENS.tooltipBorder}`, fontSize: "0.75rem" }}
          />
          <Bar dataKey="importance" fill={CHART_TOKENS.primary} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

