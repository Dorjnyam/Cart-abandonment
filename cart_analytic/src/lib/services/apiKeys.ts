import { apiClient, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { ApiKey } from "@/types/api";

const MOCK_KEYS: ApiKey[] = [
  { id: 1, name: "Production Key", key_masked: "tk_full_••••••••a1b2", is_active: true, tier: "full", created_at: "2026-01-15" },
  { id: 2, name: "Development Key", key_masked: "tk_smart_••••••••c3d4", is_active: false, tier: "smart", created_at: "2026-02-20" },
];

export async function fetchApiKeys(): Promise<ApiKey[]> {
  try {
    const data = await apiClient.get<ApiKey[] | { results: ApiKey[] }>(API_ENDPOINTS.apiKeys);
    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.apiKeys);
      return MOCK_KEYS;
    }
    throw error;
  }
}

export async function generateApiKey(name?: string): Promise<ApiKey & { key_plain?: string }> {
  try {
    const created = await apiClient.post<ApiKey & { key?: string; key_plain?: string }>(API_ENDPOINTS.apiKeys, { name: name ?? "New Key" });
    return { ...created, key_plain: created.key_plain ?? created.key };
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.apiKeys);
      const plain = `tk_full_mock_${Math.random().toString(36).slice(2, 10)}`;
      return {
        id: Date.now(),
        name: name ?? "New Key",
        key_masked: `tk_full_••••••••${plain.slice(-8)}`,
        key_plain: plain,
        is_active: true,
        tier: "full",
        created_at: new Date().toISOString().slice(0, 10),
      };
    }
    throw error;
  }
}

export async function revokeApiKey(id: number): Promise<void> {
  const endpoint = API_ENDPOINTS.apiKeyDetail(id);
  try {
    await apiClient.delete(endpoint);
  } catch (error) {
    if (isMockFallback()) {
      console.warn("[mock] DELETE", endpoint);
      return;
    }
    throw error;
  }
}
