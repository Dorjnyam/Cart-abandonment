"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { commerceAttrs } from "@/lib/commerce-attrs";
import { useCart } from "@/store/cart";

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.total());
  const clearCart = useCart((s) => s.clearCart);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [payment, setPayment] = useState("qpay");
  const [couponCode, setCouponCode] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setCouponCode(sessionStorage.getItem("sneaker_checkout_coupon") || "");
  }, []);

  const discount = couponCode === "SAVE10" ? Math.round(subtotal * 0.1) : 0;
  const deliveryFee = method === "standard" ? 5000 : 10000;
  const deliveryEta = method === "standard" ? "2-4 days" : "next day";
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const cartItemCount = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  const invalidAddress = !name.trim() || !phone.trim() || !street.trim() || !district.trim();

  if (!items.length) {
    return <div className="mx-auto max-w-4xl px-4 py-8 text-sm">Cart is empty.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c8f135] text-black">1</div>
        <div className="flex h-[2px] flex-1 bg-zinc-800" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c8f135] text-black">2</div>
        <div className="flex h-[2px] flex-1 bg-zinc-800" />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-zinc-200">3</div>
      </div>
      <div className="grid gap-8 md:grid-cols-[1.8fr_1fr]">
      <section className="space-y-4 rounded-xl bg-[#131313] p-4 md:p-6">
        <h1 className="font-brand text-2xl font-black uppercase">Checkout</h1>
        {!!error && <p className="rounded bg-red-900/30 p-2 text-sm text-red-300">{error}</p>}
        <input className="surface-high w-full rounded px-3 py-3 text-sm" placeholder="Email / Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="surface-high w-full rounded px-3 py-3 text-sm" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="surface-high w-full rounded px-3 py-3 text-sm" placeholder="Address autocomplete" value={street} onChange={(e) => setStreet(e.target.value)} />
        <input className="surface-high w-full rounded px-3 py-3 text-sm" placeholder="City / District / Zip" value={district} onChange={(e) => setDistrict(e.target.value)} />

        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={`btn-secondary px-3 py-1 ${method === "standard" ? "!border-[#c8f135] !text-[#c8f135]" : ""}`}
            {...commerceAttrs({ ca: "checkout_step", step: "shipping", shipping: "standard" })}
            onClick={() => setMethod("standard")}
          >
            Standard (2-4d)
          </button>
          <button
            type="button"
            className={`btn-secondary px-3 py-1 ${method === "express" ? "!border-[#c8f135] !text-[#c8f135]" : ""}`}
            {...commerceAttrs({ ca: "checkout_step", step: "shipping", shipping: "express" })}
            onClick={() => setMethod("express")}
          >
            Express (next day)
          </button>
        </div>
        <div className="flex gap-2 text-sm">
          {["qpay", "socialpay", "card", "cod"].map((p) => (
            <button
              key={p}
              type="button"
              className={`btn-secondary px-3 py-1 ${payment === p ? "!border-[#c8f135] !text-[#c8f135]" : ""}`}
              {...commerceAttrs({ ca: "checkout_step", step: "payment", payment: p })}
              onClick={() => setPayment(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">Estimated delivery: {deliveryEta}</p>
        {step === 1 ? (
          <button
            type="button"
            disabled={invalidAddress}
            className="btn-secondary w-full px-4 py-3 text-sm disabled:opacity-50"
            {...commerceAttrs({
              ca: "checkout_step",
              step: "review",
              orderTotal: total,
              cartCount: cartItemCount,
              value: total,
              discount: couponCode || undefined,
            })}
            onClick={() => setStep(2)}
          >
            Review order
          </button>
        ) : (
        <button
          type="button"
          disabled={placing}
          className="btn-primary w-full px-4 py-3 text-sm disabled:opacity-60"
          {...commerceAttrs({
            ca: "purchase",
            orderTotal: total,
            payment,
            shipping: method,
            discount: couponCode || undefined,
            cartCount: cartItemCount,
            value: total,
          })}
          onClick={async () => {
            setError("");
            setPlacing(true);
            const res = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items,
                couponCode,
                paymentMethod: payment,
                deliveryOption: method,
                deliveryAddress: { name, phone, street, district },
              }),
            });
            if (!res.ok) {
              const t = await res.text();
              setError(t || "Failed to place order");
              setPlacing(false);
              return;
            }
            const data = await res.json();
            if (typeof window !== "undefined" && window.CartTracker) {
              window.CartTracker.completePurchase(data.orderId, items, total, payment);
            }
            if (typeof window !== "undefined" && typeof window._ca?.sendPurchase === "function") {
              window._ca.sendPurchase({
                orderId: data.orderId,
                orderTotal: total,
                paymentMethod: payment,
                shippingMethod: method,
                cartItemCount,
                discountCode: couponCode || undefined,
              });
              sessionStorage.setItem(`ca_order_purchase_${data.orderId}`, "1");
            }
            clearCart();
            router.push(`/order/${data.orderId}`);
          }}
        >
          {placing ? "Placing..." : "Place order"}
        </button>
        )}
      </section>
      <aside className="sticky top-24 h-fit rounded-xl bg-[#141414] p-4">
        <p className="font-brand text-lg font-bold uppercase">Order summary</p>
        <p className="mt-2 text-sm text-zinc-300">Subtotal: ₮{subtotal.toLocaleString()}</p>
        {discount > 0 && <p className="text-sm text-green-700">SAVE10: -₮{discount.toLocaleString()}</p>}
        <p className="text-sm text-zinc-300">Delivery: ₮{deliveryFee.toLocaleString()}</p>
        <p className="mt-2 border-t border-zinc-700 pt-2 font-mono font-semibold text-[#c8f135]">Total: ₮{total.toLocaleString()}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="surface-high rounded p-2 text-center">SSL Secure</div>
          <div className="surface-high rounded p-2 text-center">Trusted Checkout</div>
        </div>
      </aside>
      </div>
    </div>
  );
}

