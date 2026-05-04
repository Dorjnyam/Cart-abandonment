export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-16 animate-pulse rounded-xl border border-outline-variant/15 bg-surface-container-low" />
      ))}
    </div>
  );
}
