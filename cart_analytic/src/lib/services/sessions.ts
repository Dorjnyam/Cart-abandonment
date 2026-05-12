import { apiRequest, ApiError } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import { SCORE_ORDER } from "@/lib/constants";
import type { PaginatedResponse, Session, SessionDetail, ApiSession, SHAPValues, ScoreLabel } from "@/types/api";

type SessionListParams = {
  page?: number;
  model_variant?: string;
  prediction?: string;
};

function dominantFromDiagnosis(reason?: string, scores?: Record<string, number>): ScoreLabel {
  if (SCORE_ORDER.includes(reason as ScoreLabel)) return reason as ScoreLabel;
  if (scores) {
    return SCORE_ORDER.reduce((best, key) => ((scores[key] ?? 0) > (scores[best] ?? 0) ? key : best), SCORE_ORDER[0]);
  }
  return SCORE_ORDER[0];
}

function mapApiSession(api: ApiSession): Session {
  const dominantScore = dominantFromDiagnosis(api.diagnosis?.dominant_reason, api.diagnosis?.scores);
  return {
    id: api.session_id,
    visitorId: api.visitor_id,
    createdAt: api.started_at,
    device: api.device_type === "mobile" ? "mobile" : "desktop",
    source: "Direct",
    cartValue: null,
    predictionScore: api.prediction?.abandonment_probability ?? 0,
    dominantScore,
    recommendationGenerated: Boolean(api.diagnosis?.recommendation),
    model_variant: api.prediction?.model_variant as Session["model_variant"] | undefined,
  };
}

const EMPTY_PAGE: PaginatedResponse<Session> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

type ApiSessionDetail = ApiSession & {
  shap_values?: Record<string, number>;
};

function normalizeShapValues(
  shapValues: Record<string, number> | undefined,
  predictionScore: number,
): SHAPValues {
  const values = Object.entries(shapValues ?? {})
    .map(([feature, contribution]) => ({ feature, value: contribution, contribution }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return { baseValue: 0, prediction: predictionScore, values };
}

function mapApiSessionDetail(api: ApiSessionDetail): SessionDetail {
  const session = mapApiSession(api);
  const score = api.prediction?.abandonment_probability ?? 0;
  return {
    session,
    prediction: {
      score,
      dominantScore: session.dominantScore,
      confidence: typeof api.prediction?.confidence === "number" ? api.prediction.confidence : score,
    },
    events: [],
    featureVector: {
      event_count: api.event_count,
      page_views: api.page_views,
      device_type: api.device_type,
      model_variant: api.prediction?.model_variant ?? null,
      model_version: api.prediction?.model_version ?? null,
    },
    shapValues: normalizeShapValues(api.shap_values, score),
  };
}

export async function getSessions(
  params: SessionListParams = {},
): Promise<PaginatedResponse<Session>> {
  const { page = 1, model_variant, prediction } = params;
  const qs = new URLSearchParams({ page: String(page) });
  if (model_variant) qs.set("model_variant", model_variant);
  if (prediction) qs.set("prediction", prediction);

  try {
    const raw = await apiRequest<PaginatedResponse<ApiSession | Session>>(
      `${API_ENDPOINTS.sessions}?${qs.toString()}`,
    );
    if (!raw) return EMPTY_PAGE;
    const results = raw.results.map((item) =>
      "session_id" in item ? mapApiSession(item as ApiSession) : (item as Session),
    );
    return { ...raw, results };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 0)) {
      return EMPTY_PAGE;
    }
    throw error;
  }
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  try {
    const raw = await apiRequest<SessionDetail | ApiSessionDetail>(API_ENDPOINTS.sessionDetail(sessionId));
    return "session_id" in raw ? mapApiSessionDetail(raw) : raw;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
