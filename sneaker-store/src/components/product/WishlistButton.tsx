"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { commerceAttrs } from "@/lib/commerce-attrs";

export default function WishlistButton({
  productId,
  compact = false,
  initialActive = false,
  className = "",
}: {
  productId: string;
  compact?: boolean;
  initialActive?: boolean;
  className?: string;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(next)}`);
      return;
    }
    setBusy(true);
    const next = !active;
    setActive(next);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!res.ok) setActive(!next);
    setBusy(false);
  }

  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      {...commerceAttrs({ ca: "wishlist_add", id: productId })}
      onClick={toggle}
      className={`${compact ? "h-9 w-9 rounded-full text-lg" : "rounded px-4 py-3 text-sm"} ${
        active ? "bg-[#c8f135] text-black" : "border border-zinc-700 bg-black/70 text-white"
      } ${className}`}
    >
      {compact ? (active ? "♥" : "♡") : active ? "Saved to wishlist" : "Add to wishlist"}
    </button>
  );
}
