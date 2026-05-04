import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="vault-admin-main mx-auto max-w-6xl px-4 py-8 lg:px-10">
      <h1 className="mb-4 text-2xl font-semibold">Admin orders</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="rounded border p-3 text-sm">
            #{o.orderNumber} · {o.status} · {o.paymentStatus} · ₮{o.totalPrice.toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );
}

