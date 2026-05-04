import { prisma } from "@/lib/prisma";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="vault-admin-main mx-auto max-w-4xl px-4 py-8 lg:px-10">
      <h1 className="mb-4 text-2xl font-semibold">Admin coupons</h1>
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="rounded border p-3 text-sm">
            {c.code} · {c.type} {c.value} · {c.active ? "active" : "disabled"} · used {c.usedCount}
          </div>
        ))}
      </div>
    </div>
  );
}

