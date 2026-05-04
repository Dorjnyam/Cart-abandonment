import { getVariantColor } from "@/lib/utils";

interface AblationBadgeProps {
  variant: "baseline" | "extended" | "full";
  size?: "sm" | "md";
}

const LABELS = {
  baseline: "Суурь",
  extended: "Өргөтгөсөн",
  full:     "Бүрэн",
};

export function AblationBadge({ variant, size = "sm" }: AblationBadgeProps) {
  const colorCls = getVariantColor(variant);
  const sizeCls = size === "sm"
    ? "text-xs px-2 py-0.5"
    : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${colorCls} ${sizeCls}`}
    >
      {LABELS[variant]}
    </span>
  );
}
