"use client";

import { useEffect, useRef } from "react";

/** Checkout navigation snippet-ийг тасалдуулсан бол confirmation page дээр backup `sendPurchase` илгээнэ (deduped). */
export default function OrderObserverPurchase({
  orderId,
  orderTotal,
  paymentMethod,
  cartItemCount,
  discountCode,
}: {
  orderId: string;
  orderTotal: number;
  paymentMethod: string;
  cartItemCount: number;
  discountCode: string | null;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || typeof window === "undefined") return;
    const key = `ca_order_purchase_${orderId}`;
    if (sessionStorage.getItem(key)) return;
    if (typeof window._ca?.sendPurchase !== "function") return;
    fired.current = true;
    window._ca.sendPurchase({
      orderId,
      orderTotal,
      paymentMethod,
      cartItemCount,
      discountCode: discountCode ?? undefined,
    });
    sessionStorage.setItem(key, "1");
  }, [orderId, orderTotal, paymentMethod, cartItemCount, discountCode]);

  return null;
}
