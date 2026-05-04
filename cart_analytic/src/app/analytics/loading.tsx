import EditorialShell from "@/components/editorial/EditorialShell";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function AnalyticsLoading() {
  return (
    <EditorialShell activeNav="analytics" title="Аналитик" subtitle="Ачааллаж байна…">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <PageSkeleton rows={5} />
      </div>
    </EditorialShell>
  );
}
