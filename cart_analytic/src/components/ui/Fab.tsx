import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export default function Fab({ onClick, label = "Туслах" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-dim transition-colors border border-white/10"
    >
      <Sparkles className="size-6" strokeWidth={1.75} />
    </button>
  );
}

export function EditorialNavyCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-primary px-5 py-5 text-on-primary shadow-md flex flex-col gap-3">
      <div className="font-display text-lg font-semibold leading-tight">{title}</div>
      <p className="text-sm text-white/85 leading-relaxed">{children}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
