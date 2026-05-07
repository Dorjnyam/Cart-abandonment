import { apiRequest, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";

export type ModelMetadata = {
  model_name: string;
  model_version: string;
  variant: "baseline" | "extended" | "full" | string;
  trained_at: string;
  threshold: number;
  dataset: string;
  prediction_count: number;
};

export type ProbabilityBin = { bucket: string; count: number };

export type ConfusionMatrix = {
  true_positive: number;
  true_negative: number;
  false_positive: number;
  false_negative: number;
};

export type ModelMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc?: number;
  log_loss?: number;
  confusion_matrix: ConfusionMatrix;
};

export type FeatureContribution = {
  feature: string;
  importance: number;
  shap_mean: number;
  direction: "increases" | "decreases" | "mixed";
};

export type MLInsights = {
  refreshed_at: string;
  model: ModelMetadata;
  metrics: ModelMetrics;
  probability_distribution: ProbabilityBin[];
  feature_contributions: FeatureContribution[];
};

const MOCK_INSIGHTS: MLInsights = {
  refreshed_at: new Date().toISOString(),
  model: {
    model_name: "xgboost",
    model_version: "xgboost-synthetic-mvp",
    variant: "full",
    trained_at: "2026-05-04T11:00:00Z",
    threshold: 0.5,
    dataset: "mock_frontend_only",
    prediction_count: 0,
  },
  metrics: {
    accuracy: 0.872,
    precision: 0.841,
    recall: 0.798,
    f1: 0.819,
    roc_auc: 0.913,
    log_loss: 0.341,
    confusion_matrix: {
      true_positive: 4_812,
      true_negative: 6_103,
      false_positive: 712,
      false_negative: 873,
    },
  },
  probability_distribution: [
    { bucket: "0.0–0.1", count: 1820 },
    { bucket: "0.1–0.2", count: 1244 },
    { bucket: "0.2–0.3", count: 1102 },
    { bucket: "0.3–0.4", count: 968 },
    { bucket: "0.4–0.5", count: 871 },
    { bucket: "0.5–0.6", count: 1342 },
    { bucket: "0.6–0.7", count: 1611 },
    { bucket: "0.7–0.8", count: 1488 },
    { bucket: "0.8–0.9", count: 1029 },
    { bucket: "0.9–1.0", count: 543 },
  ],
  feature_contributions: [
    { feature: "checkout_step_count", importance: 0.184, shap_mean: 0.142, direction: "increases" },
    { feature: "cart_value", importance: 0.143, shap_mean: -0.084, direction: "decreases" },
    { feature: "session_duration_s", importance: 0.121, shap_mean: 0.073, direction: "mixed" },
    { feature: "device_mobile", importance: 0.098, shap_mean: 0.062, direction: "increases" },
    { feature: "page_view_count", importance: 0.087, shap_mean: -0.041, direction: "decreases" },
    { feature: "shipping_view_time_s", importance: 0.076, shap_mean: 0.038, direction: "increases" },
    { feature: "promo_applied", importance: 0.062, shap_mean: -0.034, direction: "decreases" },
    { feature: "refer_organic", importance: 0.044, shap_mean: -0.022, direction: "decreases" },
  ],
};

export async function fetchMLInsights(): Promise<MLInsights> {
  if (isMockFallback()) return MOCK_INSIGHTS;
  return await apiRequest<MLInsights>(API_ENDPOINTS.mlInsights);
}
