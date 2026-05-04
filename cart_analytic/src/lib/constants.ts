export const RISK_THRESHOLDS = {
  HIGH:   0.75,
  MEDIUM: 0.50,
  LOW:    0.25,
} as const;

export const MODEL_VARIANTS = ["baseline", "extended", "full"] as const;
export type ModelVariant = typeof MODEL_VARIANTS[number];

export const SCORE_LABELS: Record<string, string> = {
  S1: "Гарцын саад",
  S2: "Итгэлийн хүчин зүйл",
  S3: "Ачаалалын хурд",
  S4: "Сэтгэл хөдлөлийн дохио",
  S5: "Мобайл туршлага",
  S6: "Гүйлгээний урсгал",
  S7: "Үнийн мэдрэмж",
};

export const DEFAULT_PAGE_SIZE = 20;

export const API_TIMEOUT_MS = 10_000;

export const FEATURE_TIERS = {
  T1: "tk_full_*",
  T2: "tk_smart_*",
  T3: "tk_basic_*",
} as const;
