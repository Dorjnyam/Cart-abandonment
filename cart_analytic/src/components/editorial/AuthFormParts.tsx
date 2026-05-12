import { ArrowRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export const authInputClass =
  "w-full rounded-xl border border-[#cfdeda] bg-[#f8fbfa] px-4 py-3 text-[15px] text-[#13201e] placeholder:text-[#7f918d] outline-none transition focus:border-[#0f766e] focus:bg-white focus:ring-4 focus:ring-[#0f766e]/10 disabled:cursor-not-allowed disabled:opacity-60";

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
        <label className="text-sm font-medium text-[#243330]">{label}</label>
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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-65"
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
