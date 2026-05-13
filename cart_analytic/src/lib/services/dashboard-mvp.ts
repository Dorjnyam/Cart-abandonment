import { apiRequest, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import { REASON_LABELS, SCORE_ORDER, type ReasonCode } from "@/lib/constants";

export { REASON_LABELS, SCORE_ORDER, type ReasonCode };

export type RecommendationStatus = "new" | "in_progress" | "done" | "dismissed";

export type DashboardSummary = {
  total_sessions: number;
  abandoned_sessions: number;
  converted_sessions: number;
  abandonment_rate: number;
  conversion_rate: number;
  high_risk_sessions: number;
  average_abandonment_probability: number;
  active_recommendations: number;
};

export type ModelInfo = {
  active_model: string;
  model_version: string;
  threshold: number;
  dataset_type: string;
};

export type ReasonRow = {
  code: ReasonCode;
  label: string;
  average_score: number;
  dominant_sessions: number;
  severity: "low" | "medium" | "high";
  explanation: string;
  recommended_action: string;
};

export type TrendPoint = {
  date: string;
  sessions: number;
  abandoned: number;
  converted: number;
  abandonment_rate: number;
};

export type FunnelPoint = {
  step: string;
  sessions: number;
  drop_percent: number;
};

export type PredictionContract = {
  predicted_class: "abandoned" | "converted" | string;
  predicted_label: number;
  abandonment_probability: number;
  model_name: string;
  model_version: string;
  threshold: number;
  confidence?: number;
} | null;

export type DiagnosisContract = {
  id: number;
  scores: Record<ReasonCode, number>;
  dominant_reason: ReasonCode;
  reason_label: string;
  explanation: string;
  severity: "low" | "medium" | "high";
} | null;

export type RecommendationContract = {
  id: number;
  title: string;
  summary: string;
  body: string;
  reason_code: ReasonCode;
  reason_label: string;
  priority: "low" | "medium" | "high" | string;
  effort: "low" | "medium" | "high" | string;
  expected_impact: string;
  evidence: string[];
  action_steps: string[];
  warning: string;
  source: "gemini" | "fallback" | string;
  status: RecommendationStatus;
  created_at: string;
  session_id?: string | null;
} | null;

export type DashboardSession = {
  session_id: string;
  visitor_id: string;
  created_at: string;
  started_at: string;
  ended_at: string | null;
  device_type: string;
  event_count: number;
  page_views: number;
  cart_value: number | null;
  prediction: PredictionContract;
  diagnosis: DiagnosisContract;
  recommendation_status: RecommendationStatus | null;
};

export type DashboardOverview = {
  summary: DashboardSummary;
  model: ModelInfo;
  top_reason: {
    score: ReasonCode;
    label: string;
    value: number;
    explanation: string;
  };
  latest_recommendation: RecommendationContract;
  trend: TrendPoint[];
  funnel: FunnelPoint[];
  reasons: ReasonRow[];
  recent_sessions: DashboardSession[];
};

export type SessionEvent = {
  id: string;
  type: string;
  timestamp: string;
  page: string;
};

export type TopFeature = {
  feature: string;
  value: number | string | boolean | null;
  importance: number;
};

export type DashboardSessionDetail = DashboardSession & {
  organization_id: string | number;
  tenant_id: number;
  top_features: TopFeature[];
  events: SessionEvent[];
  recommendation: RecommendationContract;
  developer_details: Record<string, unknown>;
};

export type PaginatedDashboardSessions = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DashboardSession[];
};

export type ReasonsResponse = {
  dominant_reason_formula: string;
  reasons: ReasonRow[];
  distribution: Array<{ code: ReasonCode; label: string; sessions: number }>;
};

export type RecommendationsResponse = {
  results: NonNullable<RecommendationContract>[];
  stats: Record<RecommendationStatus | "total", number>;
};

export type IntegrationResponse = {
  observer: {
    url: string;
    health: string;
    demo_api_key: string;
    snippet: string;
  };
  kafka: {
    health: string;
    topics: string[];
  };
  demo_shop: { url: string };
  dashboard: { url: string };
  last_events: Array<{ session_id: string; event_type: string; created_at: string }>;
};

const MOCK_OVERVIEW: DashboardOverview = {
  summary: {
    total_sessions: 24,
    abandoned_sessions: 11,
    converted_sessions: 13,
    abandonment_rate: 0.4583,
    conversion_rate: 0.5417,
    high_risk_sessions: 6,
    average_abandonment_probability: 0.61,
    active_recommendations: 3,
  },
  model: {
    active_model: "xgboost",
    model_version: "xgboost-synthetic-mvp",
    threshold: 0.5,
    dataset_type: "mock_frontend_only",
  },
  top_reason: {
    score: "S5",
    label: REASON_LABELS.S5,
    value: 0.74,
    explanation: "Туршилтын өгөгдөл идэвхтэй байна. Бодит горимд Main API оношлогоо буцаах хүртэл хоосон төлөв харагдана.",
  },
  latest_recommendation: {
    id: 1,
    title: "Checkout-ийн эцсийн зардлыг эрт харуулах",
    summary: "Frontend хөгжүүлэлтэд зориулсан туршилтын зөвлөмж.",
    body: "Frontend хөгжүүлэлтэд зориулсан туршилтын зөвлөмж.",
    reason_code: "S5",
    reason_label: REASON_LABELS.S5,
    priority: "high",
    effort: "medium",
    expected_impact: "Checkout дээрх орхилтыг бууруулна.",
    evidence: ["Туршилтын нотолгоо"],
    action_steps: ["Туршилтын арга хэмжээ"],
    warning: "Туршилтын өгөгдөл",
    source: "fallback",
    status: "new",
    created_at: new Date().toISOString(),
    session_id: "mock-session",
  },
  trend: [],
  funnel: [],
  reasons: SCORE_ORDER.map((code, index) => ({
    code,
    label: REASON_LABELS[code],
    average_score: Math.max(0.1, 0.75 - index * 0.08),
    dominant_sessions: index === 4 ? 6 : index + 1,
    severity: index < 2 ? "high" : index < 5 ? "medium" : "low",
    explanation: "Туршилтын шалтгааны мөр.",
    recommended_action: "Туршилтын арга хэмжээ.",
  })),
  recent_sessions: [],
};

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  // Mock өгөгдлийг зөвхөн NEXT_PUBLIC_MOCK_FALLBACK === "true" үед ашиглана.
  // Defense/demo үед Main API-аас ирсэн бодит өгөгдөл заавал харагдах ёстой.
  if (isMockFallback()) return MOCK_OVERVIEW;
  return apiRequest<DashboardOverview>(API_ENDPOINTS.overview);
}

export async function fetchDashboardReasons(): Promise<ReasonsResponse> {
  if (isMockFallback()) {
    return {
      dominant_reason_formula: "dominant_reason = argmax(S1, S2, S3, S4, S5, S6, S7)",
      reasons: MOCK_OVERVIEW.reasons,
      distribution: MOCK_OVERVIEW.reasons.map((r) => ({ code: r.code, label: r.label, sessions: r.dominant_sessions })),
    };
  }
  return apiRequest<ReasonsResponse>(API_ENDPOINTS.dashboardReasons);
}

export async function fetchDashboardSessions(query = ""): Promise<PaginatedDashboardSessions> {
  if (isMockFallback()) return { count: 0, next: null, previous: null, results: [] };
  const qs = query ? `?${query}` : "";
  return apiRequest<PaginatedDashboardSessions>(`${API_ENDPOINTS.dashboardSessions}${qs}`);
}

export async function fetchDashboardSessionDetail(sessionId: string): Promise<DashboardSessionDetail | null> {
  if (isMockFallback()) return null;
  return apiRequest<DashboardSessionDetail>(API_ENDPOINTS.dashboardSessionDetail(sessionId));
}

export async function fetchDashboardRecommendations(): Promise<RecommendationsResponse> {
  if (isMockFallback()) {
    return {
      results: MOCK_OVERVIEW.latest_recommendation ? [MOCK_OVERVIEW.latest_recommendation] : [],
      stats: { total: 1, new: 1, in_progress: 0, done: 0, dismissed: 0 },
    };
  }
  return apiRequest<RecommendationsResponse>(API_ENDPOINTS.dashboardRecommendations);
}

export async function updateDashboardRecommendationStatus(
  id: number | string,
  status: RecommendationStatus,
): Promise<NonNullable<RecommendationContract>> {
  return apiRequest<NonNullable<RecommendationContract>>(API_ENDPOINTS.dashboardRecommendationStatus(id), {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchDashboardIntegration(): Promise<IntegrationResponse> {
  return apiRequest<IntegrationResponse>(API_ENDPOINTS.dashboardIntegration);
}

export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

export function severityForProbability(value: number): "low" | "medium" | "high" {
  if (value >= 0.75) return "high";
  if (value >= 0.5) return "medium";
  return "low";
}
