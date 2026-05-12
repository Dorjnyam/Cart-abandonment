export const RISK_THRESHOLDS = {
  HIGH: 0.75,
  MEDIUM: 0.50,
  LOW: 0.25,
} as const;

export const MODEL_VARIANTS = ["baseline", "extended", "full"] as const;
export type ModelVariant = typeof MODEL_VARIANTS[number];

export const SCORE_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"] as const;
export type ReasonCode = typeof SCORE_ORDER[number];

export const REASON_LABELS: Record<ReasonCode, string> = {
  S1: "Psychological hesitation",
  S2: "Technical friction",
  S3: "Trust issue",
  S4: "Mobile usability issue",
  S5: "Price sensitivity",
  S6: "Indecision/navigation disorder",
  S7: "External influence/referral effect",
};

export const SCORE_LABELS = REASON_LABELS;

export const DASHBOARD_LABELS = {
  totalSessions: "Нийт сесс",
  abandonmentRate: "Сагс орхилтын хувь",
  convertedPurchases: "Амжилттай худалдан авалт",
  dominantReason: "Давамгай шалтгаан",
  recommendation: "Зөвлөмж",
  modelVersion: "Загварын хувилбар",
  predictionProbability: "Таамаглалын магадлал",
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const API_TIMEOUT_MS = 10_000;

export const FEATURE_TIERS = {
  T1: "tk_full_*",
  T2: "tk_smart_*",
  T3: "tk_basic_*",
} as const;
