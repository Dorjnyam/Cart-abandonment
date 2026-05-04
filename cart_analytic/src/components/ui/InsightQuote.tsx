import type { ReactNode } from "react";

export default function InsightQuote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sky-200/60 bg-insight/90 px-4 py-3 text-on-insight dark:border-sky-800/50">
      <p className="text-sm italic leading-relaxed font-display">{children}</p>
    </div>
  );
}
