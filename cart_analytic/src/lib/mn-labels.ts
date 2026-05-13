import type { ServiceHealth } from "@/lib/services/pipeline";

export function roleLabel(role: string | null | undefined): string {
  const labels: Record<string, string> = {
    admin: "Админ",
    owner: "Эзэмшигч",
    member: "Гишүүн",
    developer: "Хөгжүүлэгч",
  };
  return labels[role ?? ""] ?? (role || "Хэрэглэгч");
}

export function roleAccessLabel(role: string | null | undefined): string {
  const labels: Record<string, string> = {
    admin: "Дотоод админ",
    owner: "Эзэмшигчийн орчин",
    member: "Гишүүний эрх",
    developer: "Хөгжүүлэгчийн эрх",
  };
  return labels[role ?? ""] ?? roleLabel(role);
}

export function predictionClassLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    abandoned: "Орхисон",
    converted: "Худалдан авсан",
  };
  return labels[value ?? ""] ?? (value || "—");
}

export function riskLabel(value: "high" | "medium" | "low" | string): string {
  const labels: Record<string, string> = {
    high: "Өндөр",
    medium: "Дунд",
    low: "Бага",
  };
  return labels[value] ?? value;
}

export function recommendationStatusLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    new: "Шинэ",
    in_progress: "Хийгдэж байна",
    done: "Дууссан",
    dismissed: "Хассан",
  };
  return labels[value ?? ""] ?? (value ? value.replace(/_/g, " ") : "—");
}

export function priorityLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    high: "Өндөр",
    medium: "Дунд",
    low: "Бага",
  };
  return labels[value ?? ""] ?? (value || "—");
}

export function sourceLabel(value: string | null | undefined): string {
  if (value === "gemini") return "Gemini";
  if (value === "fallback") return "Нөөц дүрэм";
  return value || "—";
}

export function deviceLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    mobile: "Гар утас",
    tablet: "Таблет",
    desktop: "Компьютер",
  };
  return labels[value ?? ""] ?? "Тодорхойгүй";
}

export function healthLabel(health: ServiceHealth): string {
  const labels: Record<ServiceHealth, string> = {
    healthy: "Хэвийн",
    degraded: "Доголдолтой",
    down: "Унасан",
    unknown: "Тодорхойгүй",
  };
  return labels[health];
}

export function serviceStatusLabel(status: string | null | undefined): string {
  const labels: Record<string, string> = {
    active: "Идэвхтэй",
    pending: "Хүлээгдэж байна",
    revoked: "Хүчингүй",
    expired: "Дууссан",
    inactive: "Идэвхгүй",
    ok: "Хэвийн",
    failed: "Алдаатай",
    not_configured: "Тохируулаагүй",
  };
  return labels[status ?? ""] ?? (status || "—");
}

export function directionLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    increases: "Эрсдэл нэмэгдүүлнэ",
    decreases: "Эрсдэл бууруулна",
    neutral: "Саармаг",
  };
  return labels[value ?? ""] ?? (value || "—");
}

export function relativeTimeLabel(value?: string | null): string {
  if (!value) return "Хэзээ ч үгүй";
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 60) return `${diff} сек өмнө`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин өмнө`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)} цаг өмнө`;
  return `${Math.floor(diff / 86_400)} өдөр өмнө`;
}
