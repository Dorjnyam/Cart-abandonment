import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { totalProductStock } from "@/lib/product-stock";
import AdminProductsTable from "./AdminProductsTable";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      brand: true,
      productSizes: true,
    },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
    sku: p.sku,
    isActive: p.isActive,
    totalStock: totalProductStock(p.productSizes),
  }));

  return (
    <div className="vault-admin-main px-4 py-8 pb-24 lg:px-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-headline text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">Inventory</p>
          <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-white lg:text-4xl">Products</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-[#d4fe42] px-5 py-2.5 font-headline text-xs font-black uppercase tracking-widest text-[#4c5f00]"
          >
            Add product
          </Link>
          <Link
            href="/admin/taxonomy"
            className="rounded-lg border border-[#494847]/40 px-4 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-zinc-300"
          >
            Taxonomy
          </Link>
        </div>
      </div>
      <AdminProductsTable products={rows} />
    </div>
  );
}
