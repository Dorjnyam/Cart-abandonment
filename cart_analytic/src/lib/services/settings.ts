import { apiClient, ApiError, isMockFallback } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { TeamMember } from "@/types/api";

export type StoreSettings = {
  name: string;
  domain: string;
  plan: string;
  timezone: string;
};

const MOCK_STORE: StoreSettings = { name: "Central Market", domain: "central-market.mn", plan: "full", timezone: "Asia/Ulaanbaatar" };

const MOCK_TEAM: TeamMember[] = [
  { id: 1, email: "bat-erdene@cartanalytics.mn", full_name: "Бат-Эрдэнэ", role: "owner", joined_at: "2023-10-12" },
  { id: 2, email: "saraa.s@retail.mn", full_name: "Сарантуяа", role: "member", joined_at: "2024-01-05" },
  { id: 3, email: "temuulen.dev@gmail.com", full_name: "Тэмүүлэн", role: "developer", joined_at: "2024-02-14" },
];

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    return await apiClient.get<StoreSettings>(API_ENDPOINTS.storeSettings);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.storeSettings);
      return MOCK_STORE;
    }
    throw error;
  }
}

export async function updateStoreSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
  try {
    return await apiClient.patch<StoreSettings>(API_ENDPOINTS.storeSettings, data);
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock] PATCH", API_ENDPOINTS.storeSettings);
      return { ...MOCK_STORE, ...data };
    }
    throw error;
  }
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const data = await apiClient.get<TeamMember[] | { results: TeamMember[] }>(API_ENDPOINTS.teamMembers);
    return Array.isArray(data) ? data : data.results;
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.teamMembers);
      return MOCK_TEAM;
    }
    throw error;
  }
}

export async function inviteMember(email: string, role: string): Promise<void> {
  try {
    await apiClient.post<{ message?: string }>(API_ENDPOINTS.teamInvite, { email, role });
  } catch (error) {
    if (error instanceof ApiError && isMockFallback()) {
      console.warn("[mock]", API_ENDPOINTS.teamInvite);
      return;
    }
    throw error;
  }
}

export async function removeMember(id: number): Promise<void> {
  const endpoint = API_ENDPOINTS.teamMemberDetail(id);
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
