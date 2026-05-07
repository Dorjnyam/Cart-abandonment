import { apiClient, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { ApiKey, ApiKeyEnvironment } from "@/types/api";

const MOCK_KEYS: ApiKey[] = [
  {
    id: 1,
    name: "Production storefront",
    key_masked: "tk_full_••••••••a1b2",
    is_active: true,
    tier: "full",
    environment: "production",
    status: "active",
    created_at: "2026-01-15",
    last_used_at: "2026-05-07T08:14:00Z",
  },
  {
    id: 2,
    name: "Staging tracker",
    key_masked: "tk_smart_••••••••c3d4",
    is_active: true,
    tier: "smart",
    environment: "staging",
    status: "active",
    created_at: "2026-02-20",
    last_used_at: "2026-05-06T11:02:00Z",
  },
  {
    id: 3,
    name: "Local dev",
    key_masked: "tk_basic_••••••••e5f6",
    is_active: false,
    tier: "basic",
    environment: "development",
    status: "revoked",
    created_at: "2026-03-04",
    last_used_at: "2026-04-19T17:22:00Z",
  },
];

export type ApiKeyTier = "basic" | "smart" | "full";

export type ApiKeyCreateInput = {
  name?: string;
  tier?: ApiKeyTier;
  environment?: ApiKeyEnvironment;
};

export type GeneratedApiKey = ApiKey & {
  key?: string;
  raw_key?: string;
  key_plain?: string;
  observer_install_snippet?: string;
  tenant_external_id?: string;
};

function normalizeCreateInput(input?: ApiKeyCreateInput | string): ApiKeyCreateInput {
  if (typeof input === "string") return { name: input };
  return input ?? {};
}

function buildMockSnippet(key: string, tenantExternalId: string): string {
  return `<script src="http://localhost:8001/static/snippet/track.js?key=${key}" data-tenant-id="${tenantExternalId}" async></script>`;
}

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

export async function generateApiKey(input?: ApiKeyCreateInput | string): Promise<GeneratedApiKey> {
  const payload = normalizeCreateInput(input);
  const name = payload.name?.trim() || "Storefront key";
  const tier = payload.tier ?? "full";
  const environment = payload.environment ?? "production";

  try {
    const created = await apiClient.post<GeneratedApiKey>(API_ENDPOINTS.apiKeys, { name, tier, environment });
    return { ...created, key_plain: created.key_plain ?? created.key ?? created.raw_key };
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.apiKeys);
      const plain = `tk_${tier}_mock_${Math.random().toString(36).slice(2, 12)}`;
      const tenantExternalId = "00000000-0000-0000-0000-000000000001";
      return {
        id: Date.now(),
        name,
        key_masked: `tk_${tier}_••••••••${plain.slice(-8)}`,
        key_plain: plain,
        observer_install_snippet: buildMockSnippet(plain, tenantExternalId),
        tenant_external_id: tenantExternalId,
        is_active: true,
        tier,
        environment,
        status: "active",
        created_at: new Date().toISOString().slice(0, 10),
        last_used_at: null,
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
