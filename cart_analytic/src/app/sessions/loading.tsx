import EditorialShell from "@/components/editorial/EditorialShell";
import PageSkeleton from "@/components/skeletons/PageSkeleton";

export default function SessionsLoading() {
  return (
    <EditorialShell activeNav="sessions" title="Сессүүд" subtitle="Ачааллаж байна…">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <PageSkeleton rows={8} />
      </div>
    </EditorialShell>
  );
}
