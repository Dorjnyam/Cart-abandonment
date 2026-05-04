import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";

export type RecommendationStatus = "new" | "implemented" | "deferred";
export type RecommendationSeverity = "urgent" | "optimization" | "info" | "deferred";

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  status: RecommendationStatus;
  severity: RecommendationSeverity;
  scoreLabel: string;
  createdAt: string;
  tags: string[];
  impactBefore?: string;
  impactAfter?: string;
};

export type RecommendationStats = {
  total: number;
  implemented: number;
  deferred: number;
  new: number;
};

const EMPTY_STATS: RecommendationStats = { total: 0, implemented: 0, deferred: 0, new: 0 };

type ApiRecommendation = {
  id: number | string;
  title: string;
  description: string;
  status: "pending" | "done" | string;
  severity: "critical" | "high" | "medium" | "low" | string;
  score_ids?: string[];
  created_at?: string;
};

function mapStatus(status: ApiRecommendation["status"]): RecommendationStatus {
  if (status === "done" || status === "implemented") return "implemented";
  if (status === "deferred") return "deferred";
  return "new";
}

function mapSeverity(severity: ApiRecommendation["severity"]): RecommendationSeverity {
  if (severity === "critical" || severity === "high") return "urgent";
  if (severity === "medium") return "optimization";
  if (severity === "deferred") return "deferred";
  return "info";
}

function mapRecommendation(api: ApiRecommendation): Recommendation {
  const tags = api.score_ids?.length ? api.score_ids : ["S1"];
  return {
    id: String(api.id),
    title: api.title,
    description: api.description,
    status: mapStatus(api.status),
    severity: mapSeverity(api.severity),
    scoreLabel: tags[0] ?? "S1",
    createdAt: api.created_at ?? "",
    tags,
  };
}

function buildStats(results: Recommendation[]): RecommendationStats {
  return {
    total: results.length,
    implemented: results.filter((r) => r.status === "implemented").length,
    deferred: results.filter((r) => r.status === "deferred").length,
    new: results.filter((r) => r.status === "new").length,
  };
}

export async function getRecommendations(): Promise<{
  results: Recommendation[];
  stats: RecommendationStats;
}> {
  try {
    const data = await apiRequest<
      | { results: Recommendation[]; stats: RecommendationStats }
      | { recommendations: ApiRecommendation[] }
      | Recommendation[]
      | null
    >(API_ENDPOINTS.recommendations);
    if (!data) return { results: [], stats: EMPTY_STATS };
    if (Array.isArray(data)) {
      return { results: data, stats: buildStats(data) };
    }
    if ("recommendations" in data) {
      const results = data.recommendations.map(mapRecommendation);
      return { results, stats: buildStats(results) };
    }
    return { results: data.results ?? [], stats: data.stats ?? EMPTY_STATS };
  } catch {
    return { results: [], stats: EMPTY_STATS };
  }
}

export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus,
): Promise<void> {
  if (status !== "implemented") return;
  await apiRequest(API_ENDPOINTS.recommendationImplement(id), { method: "PATCH" });
}
