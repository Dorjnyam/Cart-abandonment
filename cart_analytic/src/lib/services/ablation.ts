import { apiClient, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { ModelVariant } from "@/lib/constants";

export interface VariantMetrics {
  model_variant: ModelVariant;
  count: number;
  abandonment_rate: number;
  avg_confidence: number;
  avg_score: number;
}

export interface AblationSummary {
  tenant_id: number;
  date_range: { from: string | null; to: string | null };
  variants: VariantMetrics[];
  comparison: {
    abandonment_rate_delta: number;
    confidence_delta: number;
  } | null;
}

export const MOCK_ABLATION: AblationSummary = {
  tenant_id: 1,
  date_range: { from: null, to: null },
  variants: [
    { model_variant: "baseline", count: 1200, abandonment_rate: 0.61, avg_confidence: 0.72, avg_score: 0.63 },
    { model_variant: "extended", count: 980,  abandonment_rate: 0.58, avg_confidence: 0.78, avg_score: 0.70 },
    { model_variant: "full",     count: 870,  abandonment_rate: 0.54, avg_confidence: 0.85, avg_score: 0.79 },
  ],
  comparison: { abandonment_rate_delta: -0.07, confidence_delta: 0.13 },
};

export async function fetchAblationSummary(
  dateFrom?: string,
  dateTo?: string,
): Promise<AblationSummary> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo)   params.set("date_to", dateTo);
  const endpoint = `${API_ENDPOINTS.ablationSummary}?${params.toString()}`;
  try {
    return await apiClient.get<AblationSummary>(endpoint);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", endpoint);
      return MOCK_ABLATION;
    }
    throw error;
  }
}
