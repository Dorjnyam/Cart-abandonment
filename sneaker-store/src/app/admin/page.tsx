import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [ordersCount, productsCount, lowStockCount] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.productSize.count({ where: { stock: { lte: 3, gt: 0 } } }),
  ]);

  return (
    <div className="vault-admin-main px-4 py-8 pb-24 lg:px-10">
      <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-white">Overview</h1>
      <p className="mt-1 text-sm text-[#adaaaa]">Vault operations dashboard</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#494847]/20 bg-[#131313] p-5">
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Orders</p>
          <p className="mt-2 font-mono text-3xl text-[#d4fe42]">{ordersCount}</p>
        </div>
        <div className="rounded-lg border border-[#494847]/20 bg-[#131313] p-5">
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Products</p>
          <p className="mt-2 font-mono text-3xl text-white">{productsCount}</p>
        </div>
        <div className="rounded-lg border border-[#494847]/20 bg-[#131313] p-5">
          <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Low stock sizes</p>
          <p className="mt-2 font-mono text-3xl text-[#ffd16f]">{lowStockCount}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/products"
          className="rounded-lg bg-[#d4fe42] px-5 py-2.5 font-headline text-xs font-black uppercase tracking-widest text-[#4c5f00]"
        >
          Products
        </Link>
        <Link
          href="/admin/products/new"
          className="rounded-lg border border-[#494847]/40 px-5 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-zinc-300"
        >
          Add product
        </Link>
        <Link
          href="/admin/taxonomy"
          className="rounded-lg border border-[#494847]/40 px-5 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-zinc-300"
        >
          Taxonomy
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-lg border border-[#494847]/40 px-5 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-zinc-300"
        >
          Orders
        </Link>
        <Link
          href="/admin/coupons"
          className="rounded-lg border border-[#494847]/40 px-5 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-zinc-300"
        >
          Coupons
        </Link>
      </div>
    </div>
  );
}
