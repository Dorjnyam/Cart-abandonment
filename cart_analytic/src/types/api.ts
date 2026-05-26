export type ApiAuthMode = "none" | "jwt" | "api-key" | "both";

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type DashboardKpi = {
  label: string;
  value: number | string;
  trendPercent: number;
};

export type TrendPoint = {
  date: string;
  sessions: number;
  abandonmentRate: number;
};

export type DropoffPoint = {
  step: string;
  users: number;
  dropPercent: number;
};

export type TrafficSourcePoint = {
  source: string;
  value: number;
};

export type Session = {
  id: string;
  visitorId: string;
  createdAt: string;
  device: "mobile" | "desktop";
  source: string;
  cartValue: number | null;
  predictionScore: number;
  dominantScore: ScoreLabel;
  recommendationGenerated: boolean;
  model_variant?: "baseline" | "extended" | "full";
};

export type SessionEvent = {
  id: string;
  page_url: string;
  event_type: string;
  timestamp: string;
  time_on_page: number;
};

export type ScoreLabel = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";

export type PredictionResult = {
  score: number;
  dominantScore: ScoreLabel;
  confidence: number;
};

export type FeatureVector = Record<string, string | number | boolean | null>;

export type SHAPValueItem = {
  feature: string;
  value: number;
  contribution: number;
};

export type SHAPValues = {
  baseValue: number;
  prediction: number;
  values: SHAPValueItem[];
};

export type SessionDetail = {
  session: Session;
  prediction: PredictionResult;
  events: SessionEvent[];
  featureVector: FeatureVector;
  shapValues: SHAPValues;
};

export type FeatureImportancePoint = {
  feature: string;
  importance: number;
};

/** Session-д зориулсан Django API response хэлбэр (snake_case). */
export type ApiSession = {
  session_id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  event_count: number;
  page_views: number;
  device_type: string;
  prediction?: {
    abandonment_probability: number;
    prediction: "abandon" | "convert";
    confidence: number | "high" | "medium" | "low";
    model_variant: string;
    model_version?: string | null;
  };
  diagnosis?: {
    id: number;
    scores: Record<ScoreLabel, number>;
    dominant_reason: ScoreLabel;
    reason_label?: string;
    recommendation?: string | null;
  } | null;
};

/** Django response-той таарах Ablation study variant metrics. */
export type AblationVariant = {
  model_variant: "baseline" | "extended" | "full";
  count: number;
  abandonment_rate: number;
  avg_confidence: number;
  avg_score: number;
};

export type Tenant = {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: "active" | "inactive";
  created_at: string;
  total_sessions: number;
  abandonment_rate: number;
};

export type DiagnosisEntry = {
  id: string;
  session_id: string;
  risk: "high" | "medium" | "low";
  scores: Record<string, number>;
  created_at: string;
};

export type TeamMember = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  joined_at: string;
};

export type ApiKeyEnvironment = "production" | "staging" | "development";

export type ApiKey = {
  id: number;
  name: string;
  key_masked: string;
  key_plain?: string;
  observer_install_snippet?: string;
  tenant_external_id?: string;
  is_active: boolean;
  tier: string;
  environment?: ApiKeyEnvironment;
  status?: "active" | "revoked" | "expired";
  created_at: string;
  last_used_at?: string | null;
};

export type HistogramBin = {
  bucket: string;
  count: number;
};

export type AnalyticsSummary = {
  totalSessions: number;
  abandonedSessions: number;
  convertedSessions: number;
  abandonmentRate: number;
  conversionRate: number;
  highRiskSessions: number;
  averageAbandonmentProbability: number;
  activeRecommendations: number;
};

export type AnalyticsOverview = {
  featureImportance: FeatureImportancePoint[];
  abandonmentTrend: TrendPoint[];
  predictionDistribution: HistogramBin[];
  summary?: AnalyticsSummary | null;
};

