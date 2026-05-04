"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { commerceAttrs } from "@/lib/commerce-attrs";
import { useCart } from "@/store/cart";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.total());
  const removeItem = useCart((s) => s.removeItem);
  const updateQty = useCart((s) => s.updateQty);
  const router = useRouter();
  const [code, setCode] = useState("");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.CartTracker) {
      window.CartTracker.viewCart(items, subtotal);
    }
  }, [items, subtotal]);

  const discount = couponCode === "SAVE10" ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount + 5000);
  const cartItemCount = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        Cart is empty. <Link href="/products" className="underline">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-20">
      <h1 className="mb-4 font-brand text-3xl font-black uppercase">Cart Drawer</h1>
      <div className="ml-auto max-w-3xl rounded-2xl bg-black/60 p-4 md:p-6">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={`${item.id}-${item.size}-${item.color}`} className="kick-card flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-zinc-500">EU {item.size} · {item.color} · qty {item.qty}</p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  className="rounded border px-2"
                  {...commerceAttrs({
                    ca: "cart_update_qty",
                    id: item.id,
                    size: String(item.size),
                    variant: item.color,
                    qty: Math.max(1, item.qty - 1),
                    value: item.price * Math.max(1, item.qty - 1),
                  })}
                  onClick={() => updateQty(item.id, item.size, item.color, item.qty - 1)}
                >
                  -
                </button>
                <button
                  type="button"
                  className="rounded border px-2"
                  {...commerceAttrs({
                    ca: "cart_update_qty",
                    id: item.id,
                    size: String(item.size),
                    variant: item.color,
                    qty: item.qty + 1,
                    value: item.price * (item.qty + 1),
                  })}
                  onClick={() => updateQty(item.id, item.size, item.color, item.qty + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-red-600"
              {...commerceAttrs({
                ca: "cart_remove",
                id: item.id,
                price: item.price,
                size: String(item.size),
                qty: item.qty,
                variant: item.color,
                value: item.price * item.qty,
              })}
              onClick={() => removeItem(item.id, item.size, item.color)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <aside className="mt-4 space-y-3 rounded-xl bg-[#141414] p-4">
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} className="surface-high flex-1 rounded px-3 py-2 text-sm" placeholder="Promo code" />
          <button
            type="button"
            className="btn-secondary px-3 text-sm"
            {...commerceAttrs({
              ca: "coupon_apply",
              discount: code.trim() || undefined,
            })}
            onClick={() => setCouponCode(code.toUpperCase() === "SAVE10" ? "SAVE10" : "")}
          >
            Apply
          </button>
        </div>
        <div className="text-sm">Subtotal: ₮{subtotal.toLocaleString()}</div>
        {discount > 0 && <div className="text-sm text-green-700">Discount: -₮{discount.toLocaleString()}</div>}
        <div className="text-sm text-zinc-500">Delivery: ₮5,000</div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-2/3 bg-[#c8f135]" />
        </div>
        <p className="text-xs text-zinc-400">₮30,000 more for free shipping</p>
        <div className="border-t pt-2 font-semibold">Total: ₮{total.toLocaleString()}</div>
        <div className="grid gap-2">
        <button
          type="button"
          className="btn-secondary w-full px-4 py-2 text-sm"
          {...commerceAttrs({ ca: "continue_shopping" })}
          onClick={() => router.push("/products")}
        >
          Continue Shopping
        </button>
        <button
          type="button"
          className="btn-primary w-full px-4 py-2 text-sm"
          {...commerceAttrs({
            ca: "checkout_start",
            value: total,
            orderTotal: total,
            cartCount: cartItemCount,
            discount: couponCode || undefined,
          })}
          onClick={() => {
            sessionStorage.setItem("sneaker_checkout_coupon", couponCode);
            if (typeof window !== "undefined" && window.CartTracker) {
              window.CartTracker.startCheckout(items, total);
            }
            router.push("/checkout");
          }}
        >
          Checkout
        </button>
        </div>
        <div className="kick-card p-3 text-xs text-zinc-300">Upsell: Add sneaker care kit +₮15,000</div>
      </aside>
      </div>
    </div>
  );
}

