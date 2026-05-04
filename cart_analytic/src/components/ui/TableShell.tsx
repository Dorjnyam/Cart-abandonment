import type { ReactNode } from "react";

export default function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-card overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
