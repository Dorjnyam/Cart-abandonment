"use client";

import EditorialShell from "@/components/editorial/EditorialShell";
import ErrorStateCard from "@/components/skeletons/ErrorStateCard";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EditorialShell activeNav="dashboard" title="Тойм" subtitle="Алдаа">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
        <ErrorStateCard title="Хяналтын самбар ачааллахад алдаа гарлаа" message={error.message} onRetry={reset} />
      </div>
    </EditorialShell>
  );
}
