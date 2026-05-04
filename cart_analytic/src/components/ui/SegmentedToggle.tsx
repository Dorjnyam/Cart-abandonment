"use client";

type Option<T extends string> = { value: T; label: string };

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[0.6875rem]" : "px-3 py-1.5 text-xs";

  return (
    <div
      className="inline-flex rounded-lg border border-outline-variant/30 bg-surface-container-low p-0.5"
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={[
              pad,
              "font-semibold rounded-md transition-colors",
              active ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
