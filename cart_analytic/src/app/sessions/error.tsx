"use client";

import EditorialShell from "@/components/editorial/EditorialShell";
import ErrorStateCard from "@/components/skeletons/ErrorStateCard";

export default function SessionsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <EditorialShell activeNav="sessions" title="Сессүүд" subtitle="Алдаа">
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
        <ErrorStateCard title="Sessions ачааллахад алдаа гарлаа" message={error.message} onRetry={reset} />
      </div>
    </EditorialShell>
  );
}
