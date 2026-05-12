import type { ApiAuthMode } from "@/types/api";

export type ApiConfig = {
  baseUrl: string;
  authMode: ApiAuthMode;
  apiKey?: string;
  jwtToken?: string;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const API_ENDPOINTS = {
  // Auth endpoint-ууд
  login:             "/api/auth/login/",
  logout:            "/api/auth/logout/",
  refresh:           "/api/auth/token/refresh/",
  // Dashboard endpoint-ууд
  overview:          "/api/dashboard/overview/",
  dashboardTrends:   "/api/dashboard/trends/",
  dashboardReasons:  "/api/dashboard/reasons/",
  dashboardSessions: "/api/dashboard/sessions/",
  dashboardSessionDetail: (id: string) => `/api/dashboard/sessions/${id}/`,
  dashboardRecommendations: "/api/dashboard/recommendations/",
  dashboardRecommendationStatus: (id: number | string) => `/api/dashboard/recommendations/${id}/status/`,
  dashboardIntegration: "/api/dashboard/integration/",
  scores:            "/api/analytics/scores/",
  abandonmentRate:   "/api/analytics/abandonment-rate/",
  // Session endpoint-ууд
  sessions:          "/api/sessions/",
  sessionDetail:     (id: string) => `/api/sessions/${id}/`,
  // Prediction endpoint-ууд
  predictions:       "/api/predictions/",
  predictionDetail:  (id: string) => `/api/predictions/${id}/`,
  // Ablation study endpoint-ууд
  ablationSummary:   "/api/ablation/summary/",
  // SHAP endpoint-ууд
  featureImportance: "/api/analytics/feature-importance/",
  // Recommendation endpoint-ууд
  recommendations:   "/api/analytics/recommendation/",
  recommendationImplement: (id: number | string) => `/api/analytics/recommendation/${id}/implement/`,
  // Export endpoint-ууд
  exportTrigger:     "/api/export/",
  // Health endpoint хэсэг
  health:            "/api/health/",
  // Auth нэмэлт endpoint-ууд
  register:          "/api/auth/register/",
  forgotPassword:    "/api/auth/password/reset/",
  resetPassword:     "/api/auth/password/reset/confirm/",
  changePassword:    "/api/auth/password/change/",
  profile:           "/api/auth/profile/",
  // Tenant endpoint-ууд
  tenants:           "/api/tenants/",
  tenantDetail:      (id: string) => `/api/tenants/${id}/`,
  // Diagnosis endpoint-ууд
  diagnosis:         "/api/diagnosis/",
  diagnosisDetail:   (id: string) => `/api/diagnosis/${id}/`,
  // Analytics history endpoint-ууд
  analyticsHistory:  "/api/analytics/history/",
  // API key endpoint-ууд
  apiKeys:           "/api/settings/api-keys/",
  apiKeyDetail:      (id: number | string) => `/api/settings/api-keys/${id}/`,
  // Store settings endpoint-ууд
  storeSettings:     "/api/settings/store/",
  // Team endpoint-ууд
  teamMembers:       "/api/settings/team/",
  teamMemberDetail:  (id: number | string) => `/api/settings/team/${id}/`,
  teamInvite:        "/api/settings/team/invite/",
  // Pipeline monitor endpoint-ууд
  pipelineMonitor:   "/api/pipeline/monitor/",
  // ML insights endpoint-ууд
  mlInsights:        "/api/ml/insights/",
} as const;

function parseAuthMode(value: string | undefined): ApiAuthMode {
  if (value === "jwt" || value === "api-key" || value === "both" || value === "none") {
    return value;
  }
  return "jwt";
}

function getStoredToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    // Refresh flow-оор шинэчлэгдсэн access token түрүүлж ашиглагдана.
    const direct = localStorage.getItem("access_token");
    if (direct) return direct;
    const stored = localStorage.getItem("cart_analytic_ui_session");
    if (!stored) return undefined;
    const parsed = JSON.parse(stored) as { token?: string };
    return parsed.token ?? undefined;
  } catch {
    return undefined;
  }
}

export function getApiConfig(): ApiConfig {
  const storedToken = getStoredToken();
  return {
    baseUrl: API_BASE_URL,
    authMode: parseAuthMode(process.env.NEXT_PUBLIC_API_AUTH_MODE),
    apiKey: process.env.NEXT_PUBLIC_API_KEY,
    jwtToken: storedToken ?? process.env.NEXT_PUBLIC_API_JWT,
  };
}
