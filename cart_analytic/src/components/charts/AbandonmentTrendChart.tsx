"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types/api";

const gridStroke = "#edf2f7";
const navy = "#002D5B";
const crimson = "#991B1B";

export default function AbandonmentTrendChart({ data }: { data: TrendPoint[] | null | undefined }) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant rounded-lg bg-surface-container-low/50">Өгөгдөл алга байна.</div>;
  }

  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: gridStroke }} tickLine={false} />
          <YAxis yAxisId="sessions" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="abandonment" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.5rem",
              border: "1px solid rgb(232 238 246)",
              fontSize: "0.75rem",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
          <Line yAxisId="sessions" type="monotone" dataKey="sessions" name="Sessions" stroke={navy} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} />
          <Line
            yAxisId="abandonment"
            type="monotone"
            dataKey="abandonmentRate"
            name="Орхилт %"
            stroke={crimson}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
