"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

type Status = "live" | "demo" | "checking";

export default function ConnectionStatus() {
  const [status, setStatus] = useState<Status>("checking");

  async function check() {
    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.health}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      setStatus(res.ok ? "live" : "demo");
    } catch {
      setStatus("demo");
    }
  }

  useEffect(() => {
    const initial = setTimeout(() => { void check(); }, 0);
    const interval = setInterval(() => { void check(); }, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  if (status === "checking") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <span
        className={[
          "size-2 rounded-full shrink-0",
          status === "live"
            ? "bg-emerald-500 animate-pulse"
            : "bg-surface-container-high",
        ].join(" ")}
        aria-hidden
      />
      <span
        className={
          status === "live"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-on-surface-variant"
        }
      >
        {status === "live" ? "Live" : "Demo"}
      </span>
    </div>
  );
}
