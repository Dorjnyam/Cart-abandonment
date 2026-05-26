import { apiRequest, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import { SCORE_ORDER } from "@/lib/constants";
import type { PaginatedResponse, ScoreLabel } from "@/types/api";

export type DiagnosisRisk = "high" | "medium" | "low";

export type DiagnosisEntry = {
  id: string;
  sessionId: string;
  createdAt: string;
  riskLevel: DiagnosisRisk;
  dominantScore: ScoreLabel;
  predictionScore: number;
  scores?: Record<string, number>;
  reasonLabel?: string;
  explanation?: string;
  recommendation?: DiagnosisRecommendation | null;
};

const mockDiagnoses: DiagnosisEntry[] = [];

export type DiagnosisRecommendation = {
  title?: string;
  summary?: string;
  body?: string;
  reason_code?: string;
  priority?: string;
  effort?: string;
  expected_impact?: string;
  evidence?: string[];
  action_steps?: string[];
  warning?: string;
  source?: string;
};

type ApiDiagnosisEntry = {
  id: string;
  session_id: string;
  created_at: string;
  risk?: DiagnosisRisk;
  risk_level?: DiagnosisRisk;
  dominant_score?: string | number;
  dominant_reason?: string;
  dominant_score_key?: string;
  prediction_score?: number;
  abandonment_probability?: number;
  recommendation?: string | null;
  reason_label?: string;
  explanation?: string;
  model_version?: string | null;
  scores?: Record<string, number>;
};

function parseRecommendation(value: ApiDiagnosisEntry["recommendation"]): DiagnosisRecommendation | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as DiagnosisRecommendation;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return {
      title: "Recommendation",
      summary: value,
      body: value,
      source: "fallback",
    };
  }
}

function mapApiEntry(api: ApiDiagnosisEntry): DiagnosisEntry {
  return {
    id: api.id,
    sessionId: api.session_id,
    createdAt: api.created_at,
    riskLevel: api.risk ?? api.risk_level ?? "low",
    dominantScore: ((api.dominant_reason ?? api.dominant_score_key) as ScoreLabel) ?? dominantFromScores(api.scores),
    predictionScore: api.abandonment_probability ?? api.prediction_score ?? 0,
    scores: api.scores,
    reasonLabel: api.reason_label,
    explanation: api.explanation,
    recommendation: parseRecommendation(api.recommendation),
  };
}

function dominantFromScores(scores?: Record<string, number>): ScoreLabel {
  if (!scores) return SCORE_ORDER[0];
  return SCORE_ORDER.reduce((best, key) => ((scores[key] ?? 0) > (scores[best] ?? 0) ? key : best), SCORE_ORDER[0]);
}

export type DiagnosisFilters = {
  query?: string;
  riskLevel?: DiagnosisRisk | "";
  page?: number;
};

export async function getDiagnoses(
  filters: DiagnosisFilters = {},
): Promise<PaginatedResponse<DiagnosisEntry>> {
  const { query, riskLevel, page = 1 } = filters;
  const params = new URLSearchParams();
  if (query) params.set("search", query);
  if (riskLevel) params.set("risk", riskLevel);
  params.set("page", String(page));

  const endpoint = `${API_ENDPOINTS.diagnosis}?${params.toString()}`;
  try {
    const raw = await apiRequest<PaginatedResponse<ApiDiagnosisEntry | DiagnosisEntry>>(endpoint);
    const results = raw.results.map((item) =>
      "session_id" in item ? mapApiEntry(item as ApiDiagnosisEntry) : (item as DiagnosisEntry),
    );
    return { ...raw, results };
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", endpoint);
      let results = mockDiagnoses;
      if (query) {
        const q = query.toLowerCase();
        results = results.filter((d) => d.id.toLowerCase().includes(q) || d.sessionId.toLowerCase().includes(q));
      }
      if (riskLevel) results = results.filter((d) => d.riskLevel === riskLevel);
      return { count: results.length, next: null, previous: null, results };
    }
    throw error;
  }
}

export async function getDiagnosisDetail(id: string): Promise<DiagnosisEntry> {
  const endpoint = API_ENDPOINTS.diagnosisDetail(id);
  try {
    const raw = await apiRequest<ApiDiagnosisEntry | DiagnosisEntry>(endpoint);
    return "session_id" in raw ? mapApiEntry(raw as ApiDiagnosisEntry) : (raw as DiagnosisEntry);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", endpoint);
      const found = mockDiagnoses.find((d) => d.id === id);
      if (found) return found;
    }
    throw error;
  }
}
