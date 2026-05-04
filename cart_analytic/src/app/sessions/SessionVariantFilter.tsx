"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MODEL_VARIANTS } from "@/lib/constants";

export default function SessionVariantFilter() {
  const sp = useSearchParams();
  const router = useRouter();
  const current = sp.get("variant") ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(sp.toString());
    if (e.target.value) {
      params.set("variant", e.target.value);
    } else {
      params.delete("variant");
    }
    params.delete("page");
    router.push(`/sessions?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none"
      aria-label="Загварын хувилбараар шүүх"
    >
      <option value="">Бүх загвар</option>
      {MODEL_VARIANTS.map((v) => (
        <option key={v} value={v}>
          {v === "baseline" ? "Суурь" : v === "extended" ? "Өргөтгөсөн" : "Бүрэн"}
        </option>
      ))}
    </select>
  );
}
