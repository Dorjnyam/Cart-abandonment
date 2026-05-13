import { ArrowRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export const authInputClass =
  "w-full rounded-2xl border border-surface-muted bg-bg px-4 py-3.5 text-sm font-medium text-text placeholder:text-muted outline-none transition-all focus:border-primary/40 focus:bg-surface focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

export function FieldGroup({
  label,
  right,
  children,
}: {
  index?: string;
  label: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-bold text-muted uppercase tracking-[0.2em] pl-1">{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

export function SubmitButton({
  isLoading,
  loadingLabel,
  children,
}: {
  isLoading: boolean;
  loadingLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:scale-100"
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="size-4" aria-hidden />
        </>
      )}
    </button>
  );
}
