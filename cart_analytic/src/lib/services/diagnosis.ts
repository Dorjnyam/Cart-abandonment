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

const mockDiagnoses: DiagnosisEntry[] = [
  { id: "DG-401", sessionId: "sess_a1b2c3", createdAt: "2026-04-10", riskLevel: "high", dominantScore: "S1", predictionScore: 0.91, scores: { S1: 0.91, S2: 0.43, S3: 0.29, S4: 0.54, S5: 0.63, S6: 0.37, S7: 0.71 } },
  { id: "DG-402", sessionId: "sess_d4e5f6", createdAt: "2026-04-09", riskLevel: "medium", dominantScore: "S3", predictionScore: 0.58, scores: { S1: 0.31, S2: 0.25, S3: 0.58, S4: 0.42, S5: 0.19, S6: 0.11, S7: 0.34 } },
  { id: "DG-403", sessionId: "sess_g7h8i9", createdAt: "2026-04-08", riskLevel: "high", dominantScore: "S2", predictionScore: 0.84, scores: { S1: 0.62, S2: 0.84, S3: 0.41, S4: 0.57, S5: 0.38, S6: 0.29, S7: 0.51 } },
  { id: "DG-404", sessionId: "sess_j1k2l3", createdAt: "2026-04-07", riskLevel: "low", dominantScore: "S5", predictionScore: 0.21, scores: { S1: 0.12, S2: 0.09, S3: 0.14, S4: 0.18, S5: 0.21, S6: 0.07, S7: 0.10 } },
  { id: "DG-405", sessionId: "sess_m4n5o6", createdAt: "2026-04-06", riskLevel: "medium", dominantScore: "S4", predictionScore: 0.47, scores: { S1: 0.33, S2: 0.28, S3: 0.39, S4: 0.47, S5: 0.22, S6: 0.18, S7: 0.31 } },
  { id: "DG-406", sessionId: "sess_p7q8r9", createdAt: "2026-04-05", riskLevel: "high", dominantScore: "S1", predictionScore: 0.88, scores: { S1: 0.88, S2: 0.51, S3: 0.44, S4: 0.67, S5: 0.72, S6: 0.43, S7: 0.81 } },
];

type ApiDiagnosisEntry = {
  id: string;
  session_id: string;
  created_at: string;
  risk?: DiagnosisRisk;
  risk_level?: DiagnosisRisk;
  dominant_score?: string;
  prediction_score?: number;
  scores?: Record<string, number>;
};

function mapApiEntry(api: ApiDiagnosisEntry): DiagnosisEntry {
  return {
    id: api.id,
    sessionId: api.session_id,
    createdAt: api.created_at,
    riskLevel: api.risk ?? api.risk_level ?? "low",
    dominantScore: (api.dominant_score as ScoreLabel) ?? "S1",
    predictionScore: api.prediction_score ?? 0,
    scores: api.scores,
  };
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
      return mockDiagnoses.find((d) => d.id === id) ?? { ...mockDiagnoses[0]!, id };
    }
    throw error;
  }
}
