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
  // Auth
  login:             "/api/auth/login/",
  logout:            "/api/auth/logout/",
  refresh:           "/api/auth/token/refresh/",
  // Dashboard
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
  // Sessions
  sessions:          "/api/sessions/",
  sessionDetail:     (id: string) => `/api/sessions/${id}/`,
  // Predictions
  predictions:       "/api/predictions/",
  predictionDetail:  (id: string) => `/api/predictions/${id}/`,
  // Ablation study
  ablationSummary:   "/api/ablation/summary/",
  // SHAP
  featureImportance: "/api/analytics/feature-importance/",
  // Recommendations
  recommendations:   "/api/analytics/recommendation/",
  recommendationImplement: (id: number | string) => `/api/analytics/recommendation/${id}/implement/`,
  // Export
  exportTrigger:     "/api/export/",
  // Health
  health:            "/api/health/",
  // Auth extras
  register:          "/api/auth/register/",
  forgotPassword:    "/api/auth/password/reset/",
  resetPassword:     "/api/auth/password/reset/confirm/",
  changePassword:    "/api/auth/password/change/",
  profile:           "/api/auth/profile/",
  // Tenants
  tenants:           "/api/tenants/",
  tenantDetail:      (id: string) => `/api/tenants/${id}/`,
  // Diagnosis
  diagnosis:         "/api/diagnosis/",
  diagnosisDetail:   (id: string) => `/api/diagnosis/${id}/`,
  // Analytics history
  analyticsHistory:  "/api/analytics/history/",
  // API Keys
  apiKeys:           "/api/settings/api-keys/",
  apiKeyDetail:      (id: number | string) => `/api/settings/api-keys/${id}/`,
  // Store settings
  storeSettings:     "/api/settings/store/",
  // Team
  teamMembers:       "/api/settings/team/",
  teamMemberDetail:  (id: number | string) => `/api/settings/team/${id}/`,
  teamInvite:        "/api/settings/team/invite/",
  // Pipeline monitor
  pipelineMonitor:   "/api/pipeline/monitor/",
  // ML Insights
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
    // Access token refreshed via refresh flow takes priority
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
