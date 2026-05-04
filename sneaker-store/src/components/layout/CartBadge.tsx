"use client";

import { useCart } from "@/store/cart";

export default function CartBadge() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  return (
    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c8f135] px-1 text-xs font-bold text-black">
      {count}
    </span>
  );
}

