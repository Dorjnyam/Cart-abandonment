"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api-config";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import { MODEL_VARIANTS } from "@/lib/constants";

type ExportType = "analytics" | "sessions";

export default function ExportModal() {
  const { showToast } = useToast();
  const [open, setOpen]               = useState(false);
  const [exportType, setExportType]   = useState<ExportType>("analytics");
  const [modelVariant, setModelVariant] = useState("all");
  const [loading, setLoading]         = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const body: Record<string, string> = { export_type: exportType };
      if (modelVariant !== "all") body.model_variant = modelVariant;
      const data = await apiClient.post<{ task_id?: string }>(API_ENDPOINTS.exportTrigger, body);
      showToast(`Экспорт дараалалд орлоо — task_id: ${data.task_id ?? "—"}`, "success");
      setOpen(false);
    } catch {
      showToast("Экспорт эхлүүлэхэд алдаа гарлаа. Дахин оролдоно уу.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface shadow-card hover:bg-surface-alt transition-colors"
      >
        <Download className="size-4" aria-hidden />
        Экспорт
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-on-surface">Өгөгдөл экспортлох</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-on-surface-variant hover:bg-surface-alt transition-colors"
                aria-label="Хаах"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Экспортын төрөл
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none"
                >
                  <option value="analytics">Аналитик</option>
                  <option value="sessions">Сессийн өгөгдөл</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Загварын хувилбар
                </label>
                <select
                  value={modelVariant}
                  onChange={(e) => setModelVariant(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:outline-none"
                >
                  <option value="all">Бүгд</option>
                  {MODEL_VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {v === "baseline" ? "Суурь" : v === "extended" ? "Өргөтгөсөн" : "Бүрэн"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-outline-variant/15 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-alt transition-colors"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? "Илгээж байна…" : "Экспортлох"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
