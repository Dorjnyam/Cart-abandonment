import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductSort } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Sneakers | Sneaker Store",
  description: "Browse sneakers with filters, sorting, and pagination.",
};

interface Props {
  searchParams: Promise<{
    brand?: string;
    gender?: string;
    color?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    onSale?: string;
    sort?: ProductSort;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const where: Record<string, unknown> = { isActive: true };

  if (params.brand) {
    where.brand = {
      OR: [
        { slug: params.brand },
        { name: { equals: params.brand, mode: "insensitive" as const } },
      ],
    };
  }
  if (params.gender) {
    where.genders = { some: { gender: { slug: params.gender } } };
  }
  if (params.color) {
    where.productColors = {
      some: {
        color: {
          OR: [
            { slug: params.color },
            { name: { equals: params.color, mode: "insensitive" as const } },
          ],
        },
      },
    };
  }
  if (params.size) {
    const eu = Number(params.size);
    if (Number.isFinite(eu)) {
      where.productSizes = {
        some: { shoeSize: { eu }, stock: { gt: 0 } },
      };
    }
  }
  if (params.inStock === "true") {
    where.productSizes = { some: { stock: { gt: 0 } } };
  }
  if (params.onSale === "true") where.salePrice = { not: null };
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) (where.price as Record<string, number>).gte = Number(params.minPrice);
    if (params.maxPrice) (where.price as Record<string, number>).lte = Number(params.maxPrice);
  }

  const page = Number(params.page ?? "1");
  const limit = 12;

  const orderBy =
    params.sort === "price_asc"
      ? { price: "asc" as const }
      : params.sort === "price_desc"
        ? { price: "desc" as const }
        : params.sort === "best_selling"
          ? { soldCount: "desc" as const }
          : { createdAt: "desc" as const };

  const [products, total, brandList, colorList] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: Math.max(0, page - 1) * limit,
      take: limit,
      include: {
        brand: true,
        productColors: { include: { color: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" }, take: 24 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-brand text-4xl font-black uppercase tracking-tight">Collection</h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400">{total} results</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["newest", "price_asc", "price_desc", "best_selling", "highest_rated"].map((s) => (
            <Link key={s} href={`/products?sort=${s}`} className="btn-secondary px-3 py-1 text-xs">
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="surface-low h-fit rounded-xl p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-300">Filters</p>
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Brand</p>
              {brandList.map((b) => (
                <Link
                  key={b.id}
                  href={`/products?brand=${encodeURIComponent(b.slug)}`}
                  className="block text-sm text-zinc-300 hover:text-[#c8f135]"
                >
                  {b.name}
                </Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Gender</p>
              {["men", "women", "kids", "unisex"].map((g) => (
                <Link key={g} href={`/products?gender=${g}`} className="block text-sm capitalize text-zinc-300 hover:text-[#c8f135]">
                  {g}
                </Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Color</p>
              {colorList.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?color=${encodeURIComponent(c.slug)}`}
                  className="flex items-center gap-2 text-sm text-zinc-300 hover:text-[#c8f135]"
                >
                  <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Price</p>
              <Link href="/products?minPrice=100000&maxPrice=200000" className="block text-sm text-zinc-300 hover:text-[#c8f135]">
                ₮100k - ₮200k
              </Link>
              <Link href="/products?minPrice=200000&maxPrice=400000" className="block text-sm text-zinc-300 hover:text-[#c8f135]">
                ₮200k - ₮400k
              </Link>
            </div>
          </div>
        </aside>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const colorLine = product.productColors.map((pc) => pc.color.name).join(" · ");
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="kick-card overflow-hidden p-3"
                  data-product-id={product.id}
                >
                  <div className="group relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {product.images[1] && (
                      <Image
                        src={product.images[1]}
                        alt={`${product.name} alt`}
                        fill
                        className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                    )}
                    <span className="badge-new absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase">new</span>
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px]">quick add</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">{product.brand.name}</p>
                  <p className="font-brand font-bold">{product.name}</p>
                  <p className="text-xs text-zinc-400">{colorLine}</p>
                  <p className="font-mono text-[#c8f135]">₮{(product.salePrice ?? product.price).toLocaleString()}</p>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <p className="text-zinc-400">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Link href={`/products?page=${Math.max(1, page - 1)}`} className="btn-secondary px-3 py-1 text-xs">
                Prev
              </Link>
              <Link href={`/products?page=${Math.min(totalPages, page + 1)}`} className="btn-secondary px-3 py-1 text-xs">
                Next
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
