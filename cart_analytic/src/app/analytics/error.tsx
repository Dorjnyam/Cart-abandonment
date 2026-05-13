"use client";

import EditorialShell from "@/components/editorial/EditorialShell";
import ErrorStateCard from "@/components/skeletons/ErrorStateCard";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EditorialShell activeNav="analytics" title="Аналитик" subtitle="Алдаа">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
        <ErrorStateCard title="Аналитик ачааллахад алдаа гарлаа" message={error.message} onRetry={reset} />
      </div>
    </EditorialShell>
  );
}
