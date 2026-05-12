import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import { DASHBOARD_LABELS } from "@/lib/constants";
import type { DashboardKpi, DropoffPoint, TrafficSourcePoint, TrendPoint } from "@/types/api";

export type DashboardPayload = {
  kpis: DashboardKpi[];
  trend: TrendPoint[];
  dropoff: DropoffPoint[];
  trafficSources: TrafficSourcePoint[];
};

type OverviewApiResponse = {
  total_sessions?: number;
  total_predictions?: number;
  abandonment_rate?: number;
  avg_confidence?: number;
  active_sessions?: number;
  avg_session_duration?: string;
  mobile_rate?: number;
  bounce_rate?: number;
  trend?: Array<{ date: string; sessions: number; abandonment_rate: number }>;
  trend_7d?: Array<{ date: string; sessions: number; abandonment_rate: number }>;
  dropoff?: Array<{ step: string; users: number; drop_percent: number }>;
  traffic_sources?: Array<{ source: string; value: number }>;
  kpis?: DashboardKpi[];
};

const EMPTY_DASHBOARD: DashboardPayload = {
  kpis: [
    { label: DASHBOARD_LABELS.totalSessions, value: 0, trendPercent: 0 },
    { label: DASHBOARD_LABELS.abandonmentRate, value: "-", trendPercent: 0 },
    { label: "Дундаж сесс", value: "-", trendPercent: 0 },
    { label: "Мобайл хувь", value: "-", trendPercent: 0 },
    { label: "Bounce хувь", value: "-", trendPercent: 0 },
  ],
  trend: [],
  dropoff: [],
  trafficSources: [],
};

function mapOverviewResponse(data: OverviewApiResponse): DashboardPayload {
  const trendSource = data.trend ?? data.trend_7d ?? [];
  if (data.kpis) {
    return {
      kpis: data.kpis,
      trend: trendSource.map((t) => ({ date: t.date, sessions: t.sessions, abandonmentRate: t.abandonment_rate })),
      dropoff: data.dropoff?.map((d) => ({ step: d.step, users: d.users, dropPercent: d.drop_percent })) ?? [],
      trafficSources: data.traffic_sources ?? [],
    };
  }

  const kpis: DashboardKpi[] = [
    { label: DASHBOARD_LABELS.totalSessions, value: data.total_sessions ?? 0, trendPercent: 0 },
    {
      label: DASHBOARD_LABELS.abandonmentRate,
      value: data.abandonment_rate != null ? `${(data.abandonment_rate * 100).toFixed(1)}%` : "-",
      trendPercent: 0,
    },
    { label: "Нийт таамаглал", value: data.total_predictions ?? 0, trendPercent: 0 },
    { label: "Идэвхтэй сесс", value: data.active_sessions ?? 0, trendPercent: 0 },
    {
      label: "Дундаж итгэл",
      value: data.avg_confidence != null ? `${(data.avg_confidence * 100).toFixed(1)}%` : "-",
      trendPercent: 0,
    },
  ];

  return {
    kpis,
    trend: trendSource.map((t) => ({ date: t.date, sessions: t.sessions, abandonmentRate: t.abandonment_rate })),
    dropoff: data.dropoff?.map((d) => ({ step: d.step, users: d.users, dropPercent: d.drop_percent })) ?? [],
    trafficSources: data.traffic_sources ?? [],
  };
}

export type ScoreMap = Record<string, number>;

export async function fetchOverview(): Promise<OverviewApiResponse | null> {
  try {
    return await apiRequest<OverviewApiResponse>(API_ENDPOINTS.overview);
  } catch {
    return null;
  }
}

export async function fetchScores(): Promise<ScoreMap> {
  try {
    const data = await apiRequest<
      | ScoreMap
      | { scores: Record<string, { score: number; label?: string; trend?: string }> }
      | Array<{ score: string; value: number } | { label: string; value: number }>
    >(
      API_ENDPOINTS.scores,
    );
    if (!data) return {};
    if (Array.isArray(data)) {
      return Object.fromEntries(
        data.map((d) => ["score" in d ? d.score : d.label, d.value]),
      );
    }
    if ("scores" in data) {
      return Object.fromEntries(
        Object.entries(data.scores).map(([key, value]) => [key, value.score]),
      );
    }
    return data;
  } catch {
    return {};
  }
}

export async function fetchAbandonmentRate(): Promise<unknown> {
  try {
    return await apiRequest<unknown>(API_ENDPOINTS.abandonmentRate);
  } catch {
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardPayload> {
  try {
    const data = await apiRequest<OverviewApiResponse>(API_ENDPOINTS.overview);
    if (!data) return EMPTY_DASHBOARD;
    return mapOverviewResponse(data);
  } catch {
    return EMPTY_DASHBOARD;
  }
}
