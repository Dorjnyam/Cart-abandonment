import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/format";
import ThesisDemoPanel from "@/components/ThesisDemoPanel";

export const dynamic = "force-dynamic";

type AccountUser = Prisma.UserGetPayload<{
  include: {
    orders: { include: { items: { include: { product: true } } } };
    wishlist: { include: { product: { include: { brand: true } } } };
    addresses: true;
  };
}>;

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const sessionUser = session.user as { id?: string; role?: string };
  const user: AccountUser | null = sessionUser.id
    ? await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            include: { items: { include: { product: true } } },
          },
          wishlist: {
            orderBy: { createdAt: "desc" },
            include: { product: { include: { brand: true } } },
          },
          addresses: { orderBy: { createdAt: "desc" } },
        },
      })
    : null;

  if (!user) {
    if (sessionUser.role === "admin") redirect("/admin");
    redirect("/login");
  }

  const totalSpent = user.orders.reduce((sum: number, order) => sum + order.totalPrice, 0);
  const lastOrder = user.orders[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="surface-low h-fit rounded-xl p-4">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#262626] text-xl font-black text-[#c8f135]">
              {(user.name ?? user.email).slice(0, 1).toUpperCase()}
            </div>
            <p className="font-brand text-lg font-bold uppercase">{user.name ?? "Vault Member"}</p>
            <p className="mt-1 text-xs text-zinc-400">{user.email}</p>
            <span className="mt-3 inline-block rounded-full bg-[#c8f135] px-2 py-1 text-[10px] font-bold text-black">Demo Customer</span>
          </div>
          <nav className="space-y-2 text-sm">
            {["Overview", "Orders", "Wishlist", "Addresses", "Demo Mode", "Settings"].map((n) => (
              <a key={n} href={`#${n.toLowerCase().replace(/\s+/g, "-")}`} className="block rounded px-2 py-2 text-zinc-300 hover:bg-[#262626]">
                {n}
              </a>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">
          <section id="overview">
            <h1 className="font-brand text-3xl font-black uppercase">Account Overview</h1>
            <p className="mt-2 text-sm text-zinc-400">Track orders, saved sneakers, and diploma demo events from one profile.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="kick-card p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-400">Orders</p>
                <p className="font-mono text-3xl text-[#c8f135]">{user.orders.length}</p>
              </div>
              <div className="kick-card p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-400">Wishlist</p>
                <p className="font-mono text-3xl text-[#c8f135]">{user.wishlist.length}</p>
              </div>
              <div className="kick-card p-4">
                <p className="text-xs uppercase tracking-widest text-zinc-400">Total spent</p>
                <p className="font-mono text-2xl text-[#c8f135]">{formatMnt(totalSpent)}</p>
              </div>
            </div>
          </section>

          <section id="demo-mode">
            <ThesisDemoPanel />
          </section>

          <section id="orders" className="rounded-lg bg-[#141414] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-brand text-lg font-bold uppercase">Orders</p>
              {lastOrder && <Link href={`/order/${lastOrder.id}`} className="btn-secondary px-3 py-2 text-xs">Latest order</Link>}
            </div>
            {user.orders.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No orders yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {user.orders.slice(0, 5).map((order) => (
                  <Link key={order.id} href={`/order/${order.id}`} className="surface-high block rounded p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono">{order.orderNumber}</span>
                      <span className="text-[#c8f135]">{formatMnt(order.totalPrice)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {order.status} · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section id="wishlist" className="rounded-lg bg-[#141414] p-4">
            <p className="font-brand text-lg font-bold uppercase">Wishlist</p>
            {user.wishlist.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No wishlist items yet.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {user.wishlist.map((w) => (
                  <Link key={w.id} href={`/products/${w.product.slug}`} className="kick-card p-3">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900">
                      <Image src={w.product.images[0]} alt={w.product.name} fill className="object-cover" />
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">{w.product.brand.name}</p>
                    <p className="font-brand font-bold">{w.product.name}</p>
                    <p className="font-mono text-[#c8f135]">{formatMnt(w.product.salePrice ?? w.product.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section id="addresses" className="rounded-lg bg-[#141414] p-4">
            <p className="font-brand text-lg font-bold uppercase">Saved addresses</p>
            {user.addresses.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No saved addresses yet.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {user.addresses.map((address) => (
                  <p key={address.id} className="surface-high rounded p-3 text-sm">
                    {address.label ?? "Address"} · {address.street}, {address.district}
                  </p>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
