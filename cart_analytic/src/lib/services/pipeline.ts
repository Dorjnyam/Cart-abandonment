import { apiRequest, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";

export type ServiceHealth = "healthy" | "degraded" | "down" | "unknown";

export type ServiceStatus = {
  id: string;
  name: string;
  category: "service" | "infra";
  health: ServiceHealth;
  uptime_seconds?: number;
  latency_p95_ms?: number;
  version?: string;
  url?: string;
  last_heartbeat?: string;
  detail?: string;
};

export type PipelineThroughput = {
  events_24h: number;
  sessions_24h: number;
  features_24h: number;
  predictions_24h: number;
  failures_24h: number;
  consumer_lag: number;
};

export type PipelineEvent = {
  session_id: string;
  event_type: string;
  created_at: string;
  page_url?: string;
};

export type PipelineSessionRecord = {
  session_id: string;
  visitor_id?: string;
  started_at: string;
  events: number;
  status?: string;
};

export type PipelineFeatureRecord = {
  session_id: string;
  features_count: number;
  produced_at: string;
};

export type PipelinePredictionRecord = {
  session_id: string;
  prediction: string;
  abandonment_probability: number;
  model_version: string;
  created_at: string;
};

export type PipelineFailureRecord = {
  service: string;
  message: string;
  occurred_at: string;
};

export type PipelineMonitor = {
  refreshed_at: string;
  services: ServiceStatus[];
  infra: ServiceStatus[];
  throughput: PipelineThroughput;
  latest_events: PipelineEvent[];
  latest_sessions: PipelineSessionRecord[];
  latest_features: PipelineFeatureRecord[];
  latest_predictions: PipelinePredictionRecord[];
  recent_failures: PipelineFailureRecord[];
};

const MOCK_PIPELINE: PipelineMonitor = {
  refreshed_at: new Date().toISOString(),
  services: [
    { id: "observer", name: "Observer", category: "service", health: "healthy", version: "1.4.2", latency_p95_ms: 38, url: "http://observer:8001", last_heartbeat: "5s ago", detail: "Receiving events" },
    { id: "session", name: "Session Service", category: "service", health: "healthy", version: "0.9.7", latency_p95_ms: 22, url: "http://session:8002", last_heartbeat: "3s ago", detail: "Sessionising" },
    { id: "feature", name: "Feature Service", category: "service", health: "degraded", version: "0.5.1", latency_p95_ms: 412, url: "http://feature:8004", last_heartbeat: "4s ago", detail: "Elevated latency on enrichment" },
    { id: "ml", name: "ML Service", category: "service", health: "healthy", version: "xgboost-2.0", latency_p95_ms: 96, url: "http://ml:8005", last_heartbeat: "2s ago", detail: "Serving predictions" },
    { id: "main", name: "Main Consumer", category: "service", health: "healthy", version: "1.2.0", latency_p95_ms: 18, url: "http://main:8000", last_heartbeat: "1s ago", detail: "Persisting outputs" },
  ],
  infra: [
    { id: "kafka", name: "Kafka", category: "infra", health: "healthy", version: "3.7.0", latency_p95_ms: 6, last_heartbeat: "1s ago", detail: "5 topics, 3 brokers" },
    { id: "postgres", name: "Postgres", category: "infra", health: "healthy", version: "16.2", latency_p95_ms: 4, last_heartbeat: "1s ago", detail: "Replication lag 0ms" },
    { id: "redis", name: "Redis", category: "infra", health: "healthy", version: "7.2", latency_p95_ms: 1, last_heartbeat: "1s ago", detail: "Hit ratio 98%" },
  ],
  throughput: {
    events_24h: 184_223,
    sessions_24h: 12_842,
    features_24h: 12_340,
    predictions_24h: 12_018,
    failures_24h: 14,
    consumer_lag: 124,
  },
  latest_events: [
    { session_id: "sess_AcM90", event_type: "checkout_view", created_at: "2026-05-07T08:14:23Z" },
    { session_id: "sess_AcM89", event_type: "add_to_cart", created_at: "2026-05-07T08:14:21Z" },
    { session_id: "sess_AcM88", event_type: "page_view", created_at: "2026-05-07T08:14:20Z" },
    { session_id: "sess_AcM87", event_type: "product_view", created_at: "2026-05-07T08:14:19Z" },
    { session_id: "sess_AcM86", event_type: "search", created_at: "2026-05-07T08:14:18Z" },
  ],
  latest_sessions: [
    { session_id: "sess_AcM89", visitor_id: "v_8121", started_at: "2026-05-07T08:14:21Z", events: 14, status: "active" },
    { session_id: "sess_AcM88", visitor_id: "v_8117", started_at: "2026-05-07T08:14:11Z", events: 9, status: "active" },
    { session_id: "sess_AcM87", visitor_id: "v_8104", started_at: "2026-05-07T08:13:55Z", events: 22, status: "closed" },
  ],
  latest_features: [
    { session_id: "sess_AcM87", features_count: 47, produced_at: "2026-05-07T08:14:01Z" },
    { session_id: "sess_AcM86", features_count: 47, produced_at: "2026-05-07T08:13:48Z" },
    { session_id: "sess_AcM85", features_count: 47, produced_at: "2026-05-07T08:13:31Z" },
  ],
  latest_predictions: [
    { session_id: "sess_AcM87", prediction: "abandon", abandonment_probability: 0.81, model_version: "xgboost-v2.0", created_at: "2026-05-07T08:14:02Z" },
    { session_id: "sess_AcM86", prediction: "convert", abandonment_probability: 0.27, model_version: "xgboost-v2.0", created_at: "2026-05-07T08:13:49Z" },
    { session_id: "sess_AcM85", prediction: "abandon", abandonment_probability: 0.66, model_version: "xgboost-v2.0", created_at: "2026-05-07T08:13:32Z" },
  ],
  recent_failures: [
    { service: "feature", message: "Timeout enriching session sess_AcL55 (cart enrichment)", occurred_at: "2026-05-07T07:58:11Z" },
    { service: "ml", message: "Model fallback used for sess_AcL40 (feature vector incomplete)", occurred_at: "2026-05-07T07:31:09Z" },
  ],
};

export async function fetchPipelineMonitor(): Promise<PipelineMonitor> {
  if (isMockFallback()) return MOCK_PIPELINE;
  return await apiRequest<PipelineMonitor>(API_ENDPOINTS.pipelineMonitor);
}
