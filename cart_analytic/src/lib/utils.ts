import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RISK_THRESHOLDS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(p: number): string {
  if (p >= RISK_THRESHOLDS.HIGH)   return "text-red-600 bg-red-50";
  if (p >= RISK_THRESHOLDS.MEDIUM) return "text-amber-600 bg-amber-50";
  return "text-green-600 bg-green-50";
}

export function getVariantColor(variant: string): string {
  const map: Record<string, string> = {
    baseline: "text-gray-600 bg-gray-100",
    extended: "text-blue-600 bg-blue-100",
    full:     "text-violet-600 bg-violet-100",
  };
  return map[variant] ?? "text-gray-600 bg-gray-100";
}
