import { apiRequest, apiClient, ApiError } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import { fetchDashboardOverview, fetchDashboardSessions } from "@/lib/services/dashboard-mvp";
import type { AnalyticsOverview, FeatureImportancePoint, HistogramBin } from "@/types/api";

const EMPTY_ANALYTICS: AnalyticsOverview = {
  featureImportance:       [],
  abandonmentTrend:        [],
  predictionDistribution:  [],
  summary:                 null,
};

const HISTOGRAM_BUCKETS = ["0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.8", "0.8-1.0"] as const;

function buildPredictionDistribution(
  sessions: Array<{ prediction?: { abandonment_probability?: number } | null }>,
): HistogramBin[] {
  const bins = HISTOGRAM_BUCKETS.map((bucket) => ({ bucket, count: 0 }));
  for (const session of sessions) {
    const probability = session.prediction?.abandonment_probability;
    if (typeof probability !== "number" || Number.isNaN(probability)) continue;
    const index = Math.min(bins.length - 1, Math.max(0, Math.floor(probability * bins.length)));
    bins[index].count += 1;
  }
  return bins.some((bin) => bin.count > 0) ? bins : [];
}

export async function fetchFeatureImportance(
  variant?: string,
  topN?: number,
): Promise<FeatureImportancePoint[]> {
  const qs = new URLSearchParams();
  if (variant) qs.set("variant", variant);
  if (topN)    qs.set("top_n", String(topN));
  const endpoint = `${API_ENDPOINTS.featureImportance}?${qs.toString()}`;
  try {
    const data = await apiClient.get<
      | { features?: Array<{ feature: string; mean_abs_shap?: number; importance?: number }>; results?: FeatureImportancePoint[] }
      | FeatureImportancePoint[]
      | null
    >(endpoint);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.features) {
      const mapped = data.features.map((item) => ({
        feature: item.feature,
        importance: item.importance ?? item.mean_abs_shap ?? 0,
      }));
      const max = Math.max(...mapped.map((item) => item.importance), 0);
      if (max > 1) {
        return mapped.map((item) => ({ ...item, importance: item.importance / max }));
      }
      return mapped;
    }
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function triggerExport(
  exportType: string,
  variant?: string,
): Promise<{ task_id?: string; status?: string }> {
  const body: Record<string, string> = { export_type: exportType };
  if (variant) body.model_variant = variant;
  try {
    return await apiClient.post<{ task_id?: string; status?: string }>(
      API_ENDPOINTS.exportTrigger,
      body,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    return {};
  }
}

export async function getAnalyticsData(): Promise<AnalyticsOverview> {
  try {
    const [featureImportance, abandonmentTrend, overview, sessions] = await Promise.all([
      fetchFeatureImportance(),
      apiRequest<
        | { results?: Array<{ date: string; sessions: number; abandonment_rate?: number; abandonmentRate?: number }> }
        | AnalyticsOverview["abandonmentTrend"]
        | null
      >(API_ENDPOINTS.abandonmentRate).catch(() => null),
      fetchDashboardOverview().catch(() => null),
      fetchDashboardSessions("page_size=100").catch(() => null),
    ]);

    const trend = overview?.trend?.length
      ? overview.trend.map((t) => ({
          date: t.date,
          sessions: t.sessions,
          abandonmentRate: t.abandonment_rate,
        }))
      : Array.isArray(abandonmentTrend)
      ? abandonmentTrend.map((t) => ({
          date:             t.date,
          sessions:         t.sessions,
          abandonmentRate:  t.abandonmentRate ?? (t as { abandonment_rate?: number }).abandonment_rate ?? 0,
        }))
      : abandonmentTrend && "results" in abandonmentTrend && Array.isArray(abandonmentTrend.results)
        ? abandonmentTrend.results.map((t) => ({
            date:            t.date,
            sessions:        t.sessions,
            abandonmentRate: t.abandonmentRate ?? t.abandonment_rate ?? 0,
          }))
        : [];

    return {
      featureImportance,
      abandonmentTrend:       trend,
      predictionDistribution: buildPredictionDistribution(sessions?.results ?? overview?.recent_sessions ?? []),
      summary: overview
        ? {
            totalSessions: overview.summary.total_sessions,
            abandonedSessions: overview.summary.abandoned_sessions,
            convertedSessions: overview.summary.converted_sessions,
            abandonmentRate: overview.summary.abandonment_rate,
            conversionRate: overview.summary.conversion_rate,
            highRiskSessions: overview.summary.high_risk_sessions,
            averageAbandonmentProbability: overview.summary.average_abandonment_probability,
            activeRecommendations: overview.summary.active_recommendations,
          }
        : null,
    };
  } catch {
    return EMPTY_ANALYTICS;
  }
}
