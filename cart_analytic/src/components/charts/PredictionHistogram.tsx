"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistogramBin } from "@/types/api";

export default function PredictionHistogram({ data }: { data: HistogramBin[] | null | undefined }) {
  if (!data || data.length === 0) {
    return <div className="h-72 grid place-items-center text-sm text-on-surface-variant">Prediction тархалтын өгөгдөл алга.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
          <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#edf2f7" }} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid rgb(232 238 246)", fontSize: "0.75rem" }} />
          <Bar dataKey="count" fill="#002D5B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

