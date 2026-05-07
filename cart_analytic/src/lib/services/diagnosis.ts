import { apiRequest, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
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
};

const mockDiagnoses: DiagnosisEntry[] = [];

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
  model_version?: string | null;
  scores?: Record<string, number>;
};

function mapApiEntry(api: ApiDiagnosisEntry): DiagnosisEntry {
  return {
    id: api.id,
    sessionId: api.session_id,
    createdAt: api.created_at,
    riskLevel: api.risk ?? api.risk_level ?? "low",
    dominantScore: ((api.dominant_reason ?? api.dominant_score_key) as ScoreLabel) ?? dominantFromScores(api.scores),
    predictionScore: api.abandonment_probability ?? api.prediction_score ?? 0,
    scores: api.scores,
  };
}

function dominantFromScores(scores?: Record<string, number>): ScoreLabel {
  const labels: ScoreLabel[] = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
  if (!scores) return labels[0];
  return labels.reduce((best, key) => ((scores[key] ?? 0) > (scores[best] ?? 0) ? key : best), labels[0]);
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
