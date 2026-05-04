"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useCart } from "@/store/cart";

/** Syncs cart + session into `window._ca_user` for Observer T1/T2 payload enrichment. */
export default function CaCommerceSync() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cartItemCount = items.reduce((n, i) => n + i.qty, 0);
    window._ca_user = {
      ...(window._ca_user ?? {}),
      cart_value: total,
      cart_item_count: cartItemCount,
      is_logged_in: status === "authenticated" && !!session?.user,
    };
  }, [items, total, session?.user, status]);

  return null;
}
