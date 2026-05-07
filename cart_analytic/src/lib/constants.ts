export const RISK_THRESHOLDS = {
  HIGH: 0.75,
  MEDIUM: 0.50,
  LOW: 0.25,
} as const;

export const MODEL_VARIANTS = ["baseline", "extended", "full"] as const;
export type ModelVariant = typeof MODEL_VARIANTS[number];

export const SCORE_LABELS: Record<string, string> = {
  S1: "Psychological hesitation",
  S2: "Technical friction",
  S3: "Trust issue",
  S4: "Mobile usability issue",
  S5: "Price sensitivity",
  S6: "Indecision/navigation disorder",
  S7: "External influence/referral effect",
};

export const DEFAULT_PAGE_SIZE = 20;

export const API_TIMEOUT_MS = 10_000;

export const FEATURE_TIERS = {
  T1: "tk_full_*",
  T2: "tk_smart_*",
  T3: "tk_basic_*",
} as const;
