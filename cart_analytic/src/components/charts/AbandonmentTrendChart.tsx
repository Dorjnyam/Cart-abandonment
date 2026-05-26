"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types/api";
import { CHART_TOKENS } from "@/lib/chart-tokens";

export default function AbandonmentTrendChart({ data }: { data: TrendPoint[] | null | undefined }) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant rounded-lg bg-surface-container-low/50">Өгөгдөл алга байна.</div>;
  }

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_TOKENS.grid} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={{ stroke: CHART_TOKENS.grid }} tickLine={false} />
          <YAxis yAxisId="sessions" tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="abandonment" orientation="right" tick={{ fontSize: 11, fill: CHART_TOKENS.tick }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              background: CHART_TOKENS.tooltipBg,
              border: `1px solid ${CHART_TOKENS.tooltipBorder}`,
              fontSize: "0.75rem",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          <Line yAxisId="sessions" type="monotone" dataKey="sessions" name="Сесс" stroke={CHART_TOKENS.secondary} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
          <Line
            yAxisId="abandonment"
            type="monotone"
            dataKey="abandonmentRate"
            name="Орхилт %"
            stroke={CHART_TOKENS.riskHigh}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
