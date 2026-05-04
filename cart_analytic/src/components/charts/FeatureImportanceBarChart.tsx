"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FeatureImportancePoint } from "@/types/api";

export default function FeatureImportanceBarChart({
  data,
}: {
  data: FeatureImportancePoint[] | null | undefined;
}) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant">Feature importance өгөгдөл алга.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#edf2f7" }} />
          <YAxis dataKey="feature" type="category" width={150} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "0.5rem", border: "1px solid rgb(232 238 246)", fontSize: "0.75rem" }}
          />
          <Bar dataKey="importance" fill="#002D5B" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

