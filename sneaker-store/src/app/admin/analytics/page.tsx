import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [orders, cartAbandonSessions] = await Promise.all([
    prisma.order.findMany(),
    prisma.order.count({ where: { status: "pending" } }),
  ]);

  const purchases = orders.length;
  const revenue = orders.reduce((sum: number, o: { totalPrice: number }) => sum + o.totalPrice, 0);

  return (
    <div className="vault-admin-main mx-auto max-w-5xl space-y-3 px-4 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold">Funnel analytics</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border p-3 text-sm">Purchases: <b>{purchases}</b></div>
        <div className="rounded border p-3 text-sm">Revenue: <b>₮{revenue.toLocaleString()}</b></div>
        <div className="rounded border p-3 text-sm">Pending/Drop-off proxy: <b>{cartAbandonSessions}</b></div>
      </div>
    </div>
  );
}
