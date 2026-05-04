"use client";

export default function ErrorStateCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-error/25 bg-error-container/15 p-6 shadow-sm">
      <h3 className="font-display text-lg font-semibold text-error">{title}</h3>
      <p className="mt-2 text-sm text-on-surface">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-error px-4 py-2 text-xs font-bold text-on-error hover:opacity-95 transition-opacity"
        >
          Дахин оролдох
        </button>
      ) : null}
    </div>
  );
}
