import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderObserverPurchase from "./OrderObserverPurchase";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  const cartItemCount = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-20">
      <OrderObserverPurchase
        orderId={order.id}
        orderTotal={order.totalPrice}
        paymentMethod={order.paymentMethod}
        cartItemCount={cartItemCount}
        discountCode={order.couponCode}
      />
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#c8f135] text-4xl font-bold text-black">✓</div>
        <h1 className="font-brand text-4xl font-black uppercase">Order Confirmed</h1>
        <p className="mt-2 text-sm text-zinc-400">#{order.orderNumber}</p>
      </div>
      <div className="mt-8 space-y-2 rounded-xl bg-[#141414] p-5">
        {order.items.map((item) => (
          <div key={item.id} className="text-sm">
            {item.product.name} · {item.size} · {item.color} × {item.quantity}
          </div>
        ))}
        <p className="pt-2 font-mono text-lg text-[#c8f135]">Total ₮{order.totalPrice.toLocaleString()}</p>
        <p className="text-sm">Status: <b>{order.status}</b></p>
        <p className="text-sm">Payment: <b>{order.paymentStatus}</b></p>
        <p className="text-sm text-zinc-400">Estimated delivery: in 2-4 days</p>
        <div className="surface-low rounded p-2 text-xs">
          <p className="mb-1 font-medium">Timeline</p>
          {Array.isArray(order.timeline) && order.timeline.length > 0 ? (
            (order.timeline as any[]).map((t, idx) => (
              <p key={idx}>{t.at} - {t.status} ({t.note ?? "update"})</p>
            ))
          ) : (
            <p>No timeline yet.</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="btn-secondary inline-flex px-4 py-2 text-sm">Continue Shopping</Link>
        <Link href="/account" className="btn-primary inline-flex px-4 py-2 text-sm">Track Order</Link>
        <button className="btn-secondary px-4 py-2 text-sm">Share</button>
      </div>
      <div className="mt-4 rounded-xl bg-[#131313] p-4 text-sm text-zinc-300">Guest checkout? Create your account now to save this order history.</div>
    </div>
  );
}

