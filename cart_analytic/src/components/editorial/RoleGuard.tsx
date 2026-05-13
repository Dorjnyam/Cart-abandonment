"use client";

import { useAuth, type UserRole } from "./AuthContext";
import { roleLabel } from "@/lib/mn-labels";

export default function RoleGuard({
  allow,
  fallback,
  children,
}: {
  allow: UserRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  if (!allow.includes(role)) {
    return (
      fallback ?? (
        <div className="p-8">
          <div className="bg-surface-container-lowest p-6 max-w-xl">
            <h2 className="text-lg font-bold text-on-surface">Хандах эрхгүй</h2>
            <p className="text-sm text-on-surface-variant mt-2">
              Энэ хэсгийг зөвхөн {allow.map(roleLabel).join(", ")} эрхтэй хэрэглэгч үзэх боломжтой.
            </p>
          </div>
        </div>
      )
    );
  }
  return <>{children}</>;
}
