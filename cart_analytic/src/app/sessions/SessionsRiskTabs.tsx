"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SessionsRiskTabs() {
  const sp = useSearchParams();
  const high = sp.get("risk") === "high";

  const base =
    "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border border-transparent";
  const active = "bg-primary text-on-primary shadow-sm";
  const idle = "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low";

  return (
    <div className="inline-flex rounded-lg border border-outline-variant/15 bg-surface-container-low p-0.5" role="tablist" aria-label="Шүүлтүүр">
      <Link href="/sessions" className={[base, !high ? active : idle].join(" ")} scroll={false}>
        Бүх идэвхь
      </Link>
      <Link href="/sessions?risk=high" className={[base, high ? active : idle].join(" ")} scroll={false}>
        Өндөр эрсдэл
      </Link>
    </div>
  );
}
