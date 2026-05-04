import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";

export interface Prediction {
  session_id: string;
  visitor_id: string;
  model_variant: string;
  abandonment_probability: number;
  prediction: "abandon" | "convert";
  confidence: "high" | "medium" | "low";
  shap_values: Record<string, number>;
  model_version: string;
  predicted_at: string;
}

export interface PredictionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Prediction[];
}

const MOCK_PREDICTIONS: Prediction[] = [
  {
    session_id: "sess_a1b2c3",
    visitor_id: "vis_101",
    model_variant: "full",
    abandonment_probability: 0.82,
    prediction: "abandon",
    confidence: "high",
    shap_values: { tab_hidden_count: 0.28, copy_count: 0.14 },
    model_version: "v2.1.0",
    predicted_at: "2026-03-25T08:12:00.000Z",
  },
  {
    session_id: "sess_d4e5f6",
    visitor_id: "vis_311",
    model_variant: "extended",
    abandonment_probability: 0.41,
    prediction: "convert",
    confidence: "medium",
    shap_values: { visit_count: 0.09, checkout_step: 0.04 },
    model_version: "v2.1.0",
    predicted_at: "2026-03-25T09:52:00.000Z",
  },
  {
    session_id: "sess_g7h8i9",
    visitor_id: "vis_422",
    model_variant: "baseline",
    abandonment_probability: 0.77,
    prediction: "abandon",
    confidence: "high",
    shap_values: { back_button_count: 0.19, tab_hidden_count: 0.12 },
    model_version: "v1.0.0",
    predicted_at: "2026-03-25T10:30:00.000Z",
  },
];

export async function fetchPredictions(params?: {
  model_variant?: string;
  prediction?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}): Promise<PredictionsResponse> {
  const qs = new URLSearchParams();
  if (params?.model_variant) qs.set("model_variant", params.model_variant);
  if (params?.prediction)    qs.set("prediction", params.prediction);
  if (params?.date_from)     qs.set("date_from", params.date_from);
  if (params?.date_to)       qs.set("date_to", params.date_to);
  if (params?.page)          qs.set("page", String(params.page));

  try {
    return await apiClient.get<PredictionsResponse>(
      `${API_ENDPOINTS.predictions}?${qs.toString()}`,
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return { count: MOCK_PREDICTIONS.length, next: null, previous: null, results: MOCK_PREDICTIONS };
    }
    throw error;
  }
}

export async function fetchPredictionDetail(sessionId: string): Promise<Prediction> {
  try {
    return await apiClient.get<Prediction>(API_ENDPOINTS.predictionDetail(sessionId));
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        MOCK_PREDICTIONS.find((p) => p.session_id === sessionId) ?? {
          ...MOCK_PREDICTIONS[0]!,
          session_id: sessionId,
        }
      );
    }
    throw error;
  }
}
