import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      wishlist: { include: { product: true } },
      addresses: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="surface-low h-fit rounded-xl p-4">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-[#262626]" />
          <p className="font-brand text-lg font-bold uppercase">{user.name ?? "Vault Member"}</p>
          <span className="mt-1 inline-block rounded-full bg-[#c8f135] px-2 py-1 text-[10px] font-bold text-black">Elite Tier</span>
        </div>
        <div className="space-y-2 text-sm">
          {["Overview", "Orders", "Wishlist", "Addresses", "Payment", "Notifications", "Settings", "Logout"].map((n) => (
            <div key={n} className="rounded px-2 py-2 text-zinc-300 hover:bg-[#262626]">{n}</div>
          ))}
        </div>
      </aside>
      <main>
      <h1 className="font-brand text-3xl font-black uppercase">Account Overview</h1>
      <p className="mt-2 text-sm text-zinc-400">{user.email}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="kick-card p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Loyalty Points</p>
          <p className="font-mono text-3xl text-[#c8f135]">3,850</p>
          <div className="mt-2 h-2 rounded-full bg-zinc-800"><div className="h-full w-3/4 rounded-full bg-[#c8f135]" /></div>
        </div>
        <div className="kick-card p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Referral</p>
          <p className="mt-2 text-sm">KICKLAB/REF-{user.id.slice(0, 6)}</p>
          <button className="btn-secondary mt-2 px-3 py-1 text-xs">Copy</button>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-[#141414] p-4">
        <p className="font-brand text-lg font-bold uppercase">Orders</p>
        {user.orders.length === 0 ? <p className="text-sm text-zinc-500">No orders yet.</p> : user.orders.map((o) => (
          <p key={o.id} className="text-sm">{o.orderNumber} · ₮{o.totalPrice.toLocaleString()} · <span className="text-[#c8f135]">{o.status}</span></p>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-[#141414] p-4">
        <p className="font-medium">Saved addresses</p>
        {user.addresses.length === 0 ? (
          <p className="text-sm text-zinc-500">No saved addresses yet.</p>
        ) : (
          user.addresses.map((a) => (
            <p key={a.id} className="text-sm">
              {a.label ?? "Address"} · {a.street}, {a.district}
            </p>
          ))
        )}
      </div>
      <div className="mt-4 rounded-lg bg-[#141414] p-4">
        <p className="font-medium">Wishlist</p>
        {user.wishlist.length === 0 ? (
          <p className="text-sm text-zinc-500">No wishlist items yet.</p>
        ) : (
          user.wishlist.map((w) => (
            <p key={w.id} className="text-sm">
              {w.product.name}
            </p>
          ))
        )}
      </div>
      </main>
      </div>
    </div>
  );
}
