import { apiClient, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { PaginatedResponse, Tenant } from "@/types/api";

export type TenantListParams = {
  page?: number;
  search?: string;
};

export type TenantSummary = {
  total: number;
  active: number;
  new_30d: number;
};

export type TenantListResponse = PaginatedResponse<Tenant> & {
  summary?: TenantSummary;
};

const MOCK_TENANTS: Tenant[] = [
  { id: 1, name: "Central Market", email: "admin@central-market.mn", plan: "full", status: "active", created_at: "2023-10-12", total_sessions: 42891, abandonment_rate: 0.64 },
  { id: 2, name: "Urban Fashion", email: "owner@urban-store.mn", plan: "smart", status: "inactive", created_at: "2023-11-05", total_sessions: 18200, abandonment_rate: 0.71 },
  { id: 3, name: "Nomadic Kitchen", email: "hello@nomad-kitchen.io", plan: "basic", status: "active", created_at: "2024-01-20", total_sessions: 7600, abandonment_rate: 0.58 },
  { id: 4, name: "Eco Living", email: "shop@eco-shop.mn", plan: "full", status: "inactive", created_at: "2023-08-15", total_sessions: 31000, abandonment_rate: 0.69 },
];

const MOCK_SUMMARY: TenantSummary = { total: 1284, active: 1102, new_30d: 48 };

export async function fetchTenants(params: TenantListParams = {}): Promise<TenantListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  const endpoint = `${API_ENDPOINTS.tenants}?${qs.toString()}`;
  try {
    return await apiClient.get<TenantListResponse>(endpoint);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", endpoint);
      const search = params.search?.toLowerCase();
      const results = search
        ? MOCK_TENANTS.filter((t) => t.name.toLowerCase().includes(search) || t.email.toLowerCase().includes(search))
        : MOCK_TENANTS;
      return { count: results.length, next: null, previous: null, results, summary: MOCK_SUMMARY };
    }
    throw error;
  }
}

export async function fetchTenantDetail(id: string | number): Promise<Tenant> {
  const endpoint = API_ENDPOINTS.tenantDetail(String(id));
  try {
    return await apiClient.get<Tenant>(endpoint);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", endpoint);
      return MOCK_TENANTS.find((t) => t.id === Number(id)) ?? MOCK_TENANTS[0]!;
    }
    throw error;
  }
}
